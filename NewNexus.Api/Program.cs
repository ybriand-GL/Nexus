using System.Globalization;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using NewNexus.Data.Postgres;
using NewNexus.Domain.Administration;
using NewNexus.Domain.Modules;
using NewNexus.Domain.Security;
using NewNexus.Domain.Transverse;

var builder = WebApplication.CreateBuilder(args);

var basePath = NormalizeBasePath(builder.Configuration["App:BasePath"]);
var dataProtectionKeysPath = ResolveConfiguredPath(
    builder.Environment.ContentRootPath,
    builder.Configuration["DataProtection:KeysPath"]);
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()?
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim().TrimEnd('/'))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray()
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("NewNexusFront", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        policy.WithOrigins(
                "http://192.168.60.158",
                "http://192.168.50.102",
                "http://localhost",
                "https://localhost")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "NewNexus.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.LoginPath = "/newNexus";
        options.AccessDeniedPath = "/newNexus";
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(10);
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
        options.Events.OnValidatePrincipal = async context =>
        {
            var sessionClaim = context.Principal?.FindFirst("session_id")?.Value;
            if (!Guid.TryParse(sessionClaim, out var sessionId))
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return;
            }

            var dbContext = context.HttpContext.RequestServices.GetRequiredService<NewNexusDbContext>();
            var session = await dbContext.UserSessions
                .Include(userSession => userSession.UserAccount)
                .SingleOrDefaultAsync(userSession => userSession.Id == sessionId);

            var now = DateTime.UtcNow;
            if (session?.UserAccount is null ||
                !session.UserAccount.IsActive ||
                session.LogoutAtUtc is not null ||
                session.RevokedAtUtc is not null ||
                session.ExpiresAtUtc <= now)
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return;
            }

            if (session.LastSeenAtUtc < now.AddMinutes(-1))
            {
                session.LastSeenAtUtc = now;
                await dbContext.SaveChangesAsync();
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireInformatique", policy =>
        policy.RequireAuthenticatedUser()
            .RequireClaim("profile_code", "INFORMATIQUE"));
});

builder.Services
    .AddDataProtection()
    .SetApplicationName("NewNexus")
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath));
builder.Services.AddNewNexusPostgres(builder.Configuration);
builder.Services.AddHttpClient("Sirene", client =>
{
    client.BaseAddress = new Uri("https://recherche-entreprises.api.gouv.fr");
    client.Timeout = TimeSpan.FromSeconds(8);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("NewNexus/0.1");
});
builder.Services.AddHttpClient("Lucca", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("NewNexus/0.1");
});
builder.Services.AddHttpClient("Integrations", client =>
{
    client.Timeout = TimeSpan.FromSeconds(20);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("NewNexus/0.1");
});

var app = builder.Build();

if (args.Contains("--import-legacy-credentials", StringComparer.OrdinalIgnoreCase))
{
    using var scope = app.Services.CreateScope();
    var result = await ImportLegacyNexusCredentialsAsync(
        scope.ServiceProvider.GetRequiredService<NewNexusDbContext>(),
        scope.ServiceProvider.GetRequiredService<IConfiguration>(),
        scope.ServiceProvider.GetRequiredService<IDataProtectionProvider>(),
        CancellationToken.None);

    Console.WriteLine($"Legacy credentials import: imported={result.ImportedCount}, skipped={result.SkippedCount}, failed={result.FailedCount}");
    foreach (var message in result.Messages)
    {
        Console.WriteLine(message);
    }

    return;
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

if (!string.IsNullOrWhiteSpace(basePath))
{
    app.UsePathBase(basePath);
}

var databaseErrorLogger = app.Services.GetRequiredService<ILoggerFactory>()
    .CreateLogger("NewNexus.Database");

app.Use(async (httpContext, next) =>
{
    try
    {
        await next();
    }
    catch (Exception exception) when (IsDatabaseUnavailableException(exception))
    {
        databaseErrorLogger.LogError(exception, "PostgreSQL is unavailable for {Path}.", httpContext.Request.Path);

        if (httpContext.Response.HasStarted)
        {
            throw;
        }

        httpContext.Response.Clear();
        httpContext.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
        httpContext.Response.ContentType = "application/problem+json";
        await httpContext.Response.WriteAsJsonAsync(new
        {
            Type = "https://httpstatuses.io/503",
            Title = "Base de données inaccessible.",
            Status = StatusCodes.Status503ServiceUnavailable,
            Detail = "NewNexus ne peut pas joindre PostgreSQL pour le moment. Vérifiez que le service de base de données est démarré puis réessayez.",
            Code = "DATABASE_UNAVAILABLE"
        });
    }
});

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("NewNexusFront");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api", (HttpContext httpContext) =>
{
    var activeBasePath = httpContext.Request.PathBase.HasValue ? httpContext.Request.PathBase.Value : string.Empty;

    return Results.Ok(new
    {
        Product = "NewNexus",
        Status = "ready",
        Version = "0.1.0",
        BasePath = string.IsNullOrWhiteSpace(activeBasePath) ? "/" : activeBasePath,
        TimestampUtc = DateTime.UtcNow
    });
});

app.MapGet("/api/system/info", (HttpContext httpContext) =>
{
    var activeBasePath = httpContext.Request.PathBase.HasValue ? httpContext.Request.PathBase.Value : string.Empty;

    return Results.Ok(new
    {
        Product = "NewNexus",
        Version = "0.1.0",
        Environment = app.Environment.EnvironmentName,
        BasePath = string.IsNullOrWhiteSpace(activeBasePath) ? "/" : activeBasePath,
        ServerTimeUtc = DateTime.UtcNow
    });
});

app.MapGet("/api/health", () => Results.Ok(new
{
    Product = "NewNexus",
    Status = "healthy",
    TimestampUtc = DateTime.UtcNow
}));

app.MapGet("/api/admin/diagnostics", async (NewNexusDbContext dbContext, HttpContext httpContext) =>
{
    var activeBasePath = httpContext.Request.PathBase.HasValue ? httpContext.Request.PathBase.Value : string.Empty;
    var databaseStatus = "unreachable";
    var canConnect = false;

    try
    {
        canConnect = await dbContext.Database.CanConnectAsync();
        databaseStatus = canConnect ? "ready" : "unreachable";
    }
    catch
    {
        databaseStatus = "error";
    }

    var profileCount = canConnect ? await dbContext.SecurityProfiles.CountAsync() : 0;
    var accountCount = canConnect ? await dbContext.UserAccounts.CountAsync() : 0;
    var companyCount = canConnect ? await dbContext.Companies.CountAsync() : 0;
    var analyticCount = canConnect ? await dbContext.Analytics.CountAsync() : 0;
    var exploitationCount = canConnect ? await dbContext.Exploitations.CountAsync() : 0;
    var employeeCount = canConnect ? await dbContext.Employees.CountAsync() : 0;
    var thirdPartyCount = canConnect ? await dbContext.ThirdParties.CountAsync() : 0;
    var materialCount = canConnect ? await dbContext.Materials.CountAsync() : 0;
    var credentialProviderStatus = canConnect
        ? await dbContext.IntegrationCredentials
            .AsNoTracking()
            .GroupBy(credential => credential.ProviderCode)
            .Select(group => new CredentialProviderStatus(
                group.Key,
                group.Count(),
                group.Count(credential => credential.ProtectedValue != string.Empty),
                group.Count(credential => credential.IsActive && credential.ProtectedValue != string.Empty)))
            .ToListAsync()
        : new List<CredentialProviderStatus>();

    bool HasActiveCredential(params string[] providerCodes)
    {
        return credentialProviderStatus.Any(provider =>
            providerCodes.Any(code => string.Equals(provider.ProviderCode, code, StringComparison.OrdinalIgnoreCase)) &&
            provider.ActiveConfiguredCount > 0);
    }

    return Results.Ok(new
    {
        Application = new
        {
            Product = "NewNexus",
            Version = "0.1.0",
            Environment = app.Environment.EnvironmentName,
            BasePath = string.IsNullOrWhiteSpace(activeBasePath) ? "/" : activeBasePath,
            ServerTimeUtc = DateTime.UtcNow
        },
        Database = new
        {
            Status = databaseStatus,
            CanConnect = canConnect,
            Provider = dbContext.Database.ProviderName
        },
        Security = new
        {
            ProfileCount = profileCount,
            AccountCount = accountCount
        },
        Settings = new
        {
            CompanyCount = companyCount,
            AnalyticCount = analyticCount,
            ExploitationCount = exploitationCount,
            EmployeeCount = employeeCount,
            ThirdPartyCount = thirdPartyCount,
            MaterialCount = materialCount
        },
        Integrations = new
        {
            Sirene = new
            {
                Status = "configured",
                Provider = "API Recherche d'Entreprises"
            }
        },
        Readiness = new
        {
            Ux = new[]
            {
                new
                {
                    Label = "Libelles et accents",
                    Status = "A_TESTER",
                    Detail = "Normalisation visible active; nettoyage source complet a poursuivre.",
                    NextStep = "Recette ecrans critiques puis suppression progressive des chaines historiques cassees."
                },
                new
                {
                    Label = "Responsive",
                    Status = "A_TESTER",
                    Detail = "Passe CSS tablette/mobile appliquee.",
                    NextStep = "Verifier les formats desktop, tablette et smartphone sur IIS."
                },
                new
                {
                    Label = "Design system",
                    Status = "SCAFFOLDE",
                    Detail = "Document V1 disponible avec tokens, composants et regles d'usage.",
                    NextStep = "Ajouter captures et composants reutilisables lors des prochains ecrans."
                }
            },
            Security = new[]
            {
                new
                {
                    Label = "Profils",
                    Status = profileCount > 0 ? "A_TESTER" : "A_COMPLETER",
                    Detail = $"{profileCount} profil(s) disponibles; creation, edition et suppression non systeme exposees.",
                    NextStep = "Recetter les droits par module avec les profils metier."
                },
                new
                {
                    Label = "Comptes utilisateurs",
                    Status = accountCount > 0 ? "A_TESTER" : "A_COMPLETER",
                    Detail = $"{accountCount} compte(s) disponible(s); creation, edition, activation et reset temporaire exposes.",
                    NextStep = "Recetter le cycle de vie complet hors SSO et hors mot de passe oublie par mail."
                },
                new
                {
                    Label = "Autorisation backend",
                    Status = "A_TESTER",
                    Detail = "Les endpoints administration sensibles exigent le profil Informatique.",
                    NextStep = "Ajouter des tests automatises 401/403/200."
                }
            },
            Settings = new[]
            {
                new
                {
                    Label = "Societes",
                    Status = "A_TESTER",
                    Detail = $"{companyCount} societe(s); creation, edition et recherche SIRENE par SIREN disponibles.",
                    NextStep = "Completer l'enrichissement SIRENE au-dela des champs de base."
                },
                new
                {
                    Label = "Analytiques",
                    Status = "A_TESTER",
                    Detail = $"{analyticCount} analytique(s); creation et edition rattachees aux societes.",
                    NextStep = "Valider le modele de codification metier."
                },
                new
                {
                    Label = "Exploitations",
                    Status = "A_TESTER",
                    Detail = $"{exploitationCount} exploitation(s); creation et edition rattachees aux societes.",
                    NextStep = "Valider la granularite d'exploitation avec les utilisateurs metier."
                }
            },
            Interfaces = new[]
            {
                new
                {
                    Label = "SIRENE",
                    Status = "A_TESTER",
                    Detail = "Recherche societe active via API Recherche d'Entreprises.",
                    NextStep = "Finaliser l'enrichissement et gerer les cas hors SIRENE."
                },
                new
                {
                    Label = "Lucca",
                    Status = HasActiveCredential("LUCCA") ? "PRET_A_RACCORDER" : "CLE_A_COMPLETER",
                    Detail = $"{employeeCount} salarie(s); cles parametrees dans Outils; import reel non active.",
                    NextStep = "Brancher le client Lucca lorsque le contrat API cible est valide."
                },
                new
                {
                    Label = "TruckOnline",
                    Status = HasActiveCredential("TRUCKONLINE", "TRUCK_ONLINE") ? "PRET_A_RACCORDER" : "CLE_A_COMPLETER",
                    Detail = $"{materialCount} materiel(s); cles parametrees dans Outils; synchronisation parc non activee.",
                    NextStep = "Valider endpoints TruckOnline et mapping materiels."
                },
                new
                {
                    Label = "YellowBox",
                    Status = HasActiveCredential("YELLOWBOX", "YELLOW_BOX") ? "PRET_A_RACCORDER" : "CLE_A_COMPLETER",
                    Detail = $"{materialCount} materiel(s); cles parametrees dans Outils; telematique non activee.",
                    NextStep = "Valider endpoints YellowBox et mapping telematique."
                },
                new
                {
                    Label = "Geocodage",
                    Status = HasActiveCredential("GEOAPIFY", "GOOGLE_MAPS") ? "PRET_A_RACCORDER" : "CLE_A_COMPLETER",
                    Detail = "Geoapify ou Google utilisables selon cle declaree.",
                    NextStep = "Choisir le fournisseur principal pour les points de chargement/dechargement."
                },
                new
                {
                    Label = "Cartographie",
                    Status = "CADRE",
                    Detail = "OpenStreetMap / Nominatim reference; aucune cle requise detectee.",
                    NextStep = "Raccorder la carte lorsque le modele des points est valide."
                }
            }
        }
    });
}).RequireAuthorization("RequireInformatique");

app.MapGet("/api/admin/integrations/credentials", async (
    NewNexusDbContext dbContext,
    IDataProtectionProvider dataProtectionProvider) =>
{
    var credentials = await dbContext.IntegrationCredentials
        .AsNoTracking()
        .OrderBy(credential => credential.ProviderLabel)
        .ThenBy(credential => credential.DisplayName)
        .ToListAsync();

    return Results.Ok(BuildCredentialResponses(credentials, dataProtectionProvider));
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/admin/integrations/credentials", async (
    UpsertIntegrationCredentialRequest request,
    NewNexusDbContext dbContext,
    IDataProtectionProvider dataProtectionProvider,
    ClaimsPrincipal principal,
    HttpContext httpContext) =>
{
    var providerCode = NormalizeTechnicalCode(request.ProviderCode);
    var keyName = NormalizeTechnicalCode(request.KeyName);

    if (string.IsNullOrWhiteSpace(providerCode) || string.IsNullOrWhiteSpace(keyName))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["credential"] = ["Le fournisseur et le nom technique de la clé sont obligatoires."]
        });
    }

    var definition = GetKnownCredentialDefinitions()
        .FirstOrDefault(item =>
            string.Equals(item.ProviderCode, providerCode, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(item.KeyName, keyName, StringComparison.OrdinalIgnoreCase));
    var existing = await dbContext.IntegrationCredentials
        .SingleOrDefaultAsync(item => item.ProviderCode == providerCode && item.KeyName == keyName);
    var incomingValue = NormalizeOptionalText(request.Value);

    if (existing is null && string.IsNullOrWhiteSpace(incomingValue))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["value"] = ["La valeur est obligatoire pour déclarer une nouvelle clé."]
        });
    }

    existing ??= new IntegrationCredential
    {
        Id = Guid.NewGuid(),
        ProviderCode = providerCode,
        KeyName = keyName,
        CreatedAtUtc = DateTime.UtcNow
    };

    existing.ProviderLabel = FirstNonEmpty(request.ProviderLabel, definition?.ProviderLabel, providerCode) ?? providerCode;
    existing.DisplayName = FirstNonEmpty(request.DisplayName, definition?.DisplayName, keyName) ?? keyName;
    existing.IsSecret = definition?.IsSecret ?? request.IsSecret;
    existing.IsActive = request.IsActive;
    existing.Source = FirstNonEmpty(request.Source, existing.Source, "Manuel");
    existing.Notes = NormalizeOptionalText(request.Notes);
    existing.UpdatedAtUtc = DateTime.UtcNow;

    if (!string.IsNullOrWhiteSpace(incomingValue))
    {
        existing.ProtectedValue = ProtectCredentialValue(incomingValue, dataProtectionProvider);
    }

    if (dbContext.Entry(existing).State == EntityState.Detached)
    {
        dbContext.IntegrationCredentials.Add(existing);
    }

    await dbContext.SaveChangesAsync();
    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "ADMIN_ACTIONS",
        "INTEGRATION_CREDENTIAL_UPSERT",
        "Info",
        "Cle API enregistree.",
        $"Fournisseur={existing.ProviderCode}; cle={existing.KeyName}; actif={existing.IsActive}.",
        $"{existing.ProviderCode}/{existing.KeyName}",
        saveImmediately: true);

    return Results.Ok(BuildCredentialResponse(existing, dataProtectionProvider, definition));
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/admin/integrations/credentials/import-nexus", async (
    NewNexusDbContext dbContext,
    IConfiguration configuration,
    IDataProtectionProvider dataProtectionProvider,
    ClaimsPrincipal principal,
    HttpContext httpContext) =>
{
    var importResult = await ImportLegacyNexusCredentialsAsync(
        dbContext,
        configuration,
        dataProtectionProvider,
        httpContext.RequestAborted);

    var credentials = await dbContext.IntegrationCredentials
        .AsNoTracking()
        .OrderBy(credential => credential.ProviderLabel)
        .ThenBy(credential => credential.DisplayName)
        .ToListAsync(httpContext.RequestAborted);

    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "INTEGRATION_RUNS",
        "LEGACY_CREDENTIALS_IMPORT",
        importResult.FailedCount > 0 ? "Warning" : "Info",
        "Import des cles Nexus legacy execute.",
        $"Importees={importResult.ImportedCount}; ignorees={importResult.SkippedCount}; erreurs={importResult.FailedCount}.",
        "LEGACY_NEXUS",
        saveImmediately: true);

    return Results.Ok(new
    {
        importResult.ImportedCount,
        importResult.SkippedCount,
        importResult.FailedCount,
        importResult.Messages,
        Credentials = BuildCredentialResponses(credentials, dataProtectionProvider)
    });
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/auth/login", async (LoginRequest request, NewNexusDbContext dbContext, HttpContext httpContext) =>
{
    var normalizedLogin = request.Login.Trim();
    if (string.IsNullOrWhiteSpace(normalizedLogin) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["login"] = ["Le login est obligatoire."],
            ["password"] = ["Le mot de passe est obligatoire."]
        });
    }

    var account = await dbContext.UserAccounts
        .Include(userAccount => userAccount.SecurityProfile!)
            .ThenInclude(profile => profile.ModuleRights)
                .ThenInclude(right => right.SecurityModule)
        .SingleOrDefaultAsync(userAccount => userAccount.Login == normalizedLogin);

    if (account is null || !account.IsActive || !PasswordHasher.VerifyPassword(request.Password, account.PasswordHash))
    {
        await AddApplicationTraceAsync(
            dbContext,
            httpContext,
            null,
            "AUTH_EVENTS",
            "LOGIN_FAILED",
            "Warning",
            "Tentative de connexion refusee.",
            "Login inconnu, compte inactif ou mot de passe invalide.",
            MaskTraceSubject(normalizedLogin),
            saveImmediately: true);
        return Results.Unauthorized();
    }

    var now = DateTime.UtcNow;
    var sessionTimeoutMinutes = NormalizeSessionTimeoutMinutes(account.SessionTimeoutMinutes);
    var session = new UserSession
    {
        Id = Guid.NewGuid(),
        UserAccountId = account.Id,
        LoginAtUtc = now,
        LastSeenAtUtc = now,
        ExpiresAtUtc = now.AddMinutes(sessionTimeoutMinutes),
        IpAddress = httpContext.Connection.RemoteIpAddress?.ToString(),
        UserAgent = httpContext.Request.Headers.UserAgent.ToString()
    };

    account.LastLoginAtUtc = now;
    dbContext.UserSessions.Add(session);
    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        null,
        "AUTH_EVENTS",
        "LOGIN_SUCCESS",
        "Info",
        "Connexion utilisateur reussie.",
        $"Session expire a {session.ExpiresAtUtc:o}.",
        account.Login,
        actorUserAccountId: account.Id,
        actorLogin: account.Login);
    await dbContext.SaveChangesAsync();

    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, account.Id.ToString()),
        new(ClaimTypes.Name, account.DisplayName),
        new("login", account.Login),
        new("session_id", session.Id.ToString())
    };

    if (account.SecurityProfile is not null)
    {
        claims.Add(new Claim(ClaimTypes.Role, account.SecurityProfile.Code));
        claims.Add(new Claim("profile_code", account.SecurityProfile.Code));
        claims.Add(new Claim("profile_label", account.SecurityProfile.Label));
    }

    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    var principal = new ClaimsPrincipal(identity);
    await httpContext.SignInAsync(
        CookieAuthenticationDefaults.AuthenticationScheme,
        principal,
        new AuthenticationProperties
        {
            IsPersistent = false,
            ExpiresUtc = new DateTimeOffset(session.ExpiresAtUtc)
        });

    return Results.Ok(BuildAuthenticatedUser(account));
});

app.MapPost("/api/auth/logout", async (HttpContext httpContext, NewNexusDbContext dbContext) =>
{
    var userId = GetUserId(httpContext.User);
    var userLogin = httpContext.User.FindFirstValue("login");
    var sessionId = GetSessionId(httpContext.User);
    if (sessionId is not null)
    {
        var session = await dbContext.UserSessions.SingleOrDefaultAsync(userSession => userSession.Id == sessionId.Value);
        if (session is not null && session.LogoutAtUtc is null)
        {
            session.LogoutAtUtc = DateTime.UtcNow;
            session.LastSeenAtUtc = DateTime.UtcNow;
            await AddApplicationTraceAsync(
                dbContext,
                httpContext,
                httpContext.User,
                "AUTH_EVENTS",
                "LOGOUT",
                "Info",
                "Deconnexion utilisateur.",
                $"Session={session.Id}.",
                userLogin,
                actorUserAccountId: userId,
                actorLogin: userLogin);
            await dbContext.SaveChangesAsync();
        }
    }

    await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.NoContent();
});

app.MapPost("/api/auth/forgot-password", async (
    ForgotPasswordRequest request,
    NewNexusDbContext dbContext,
    ILoggerFactory loggerFactory,
    HttpContext httpContext) =>
{
    var identifier = request.LoginOrEmail.Trim();
    if (string.IsNullOrWhiteSpace(identifier))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["loginOrEmail"] = ["Le login ou l'adresse email est obligatoire."]
        });
    }

    var normalizedEmail = identifier.ToLowerInvariant();
    var account = await dbContext.UserAccounts
        .SingleOrDefaultAsync(userAccount =>
            userAccount.IsActive &&
            (userAccount.Login == identifier ||
                userAccount.Email != null && userAccount.Email.ToLower() == normalizedEmail));

    string? resetToken = null;
    if (account is not null)
    {
        resetToken = GeneratePasswordResetToken();
        account.PasswordResetTokenHash = HashPasswordResetToken(resetToken);
        account.PasswordResetRequestedAtUtc = DateTime.UtcNow;
        account.PasswordResetExpiresAtUtc = DateTime.UtcNow.AddMinutes(30);
        account.PasswordResetConsumedAtUtc = null;
        await AddApplicationTraceAsync(
            dbContext,
            httpContext,
            null,
            "AUTH_EVENTS",
            "PASSWORD_RESET_REQUESTED",
            "Info",
            "Demande de reinitialisation de mot de passe.",
            $"Expiration={account.PasswordResetExpiresAtUtc:o}.",
            account.Login,
            actorUserAccountId: account.Id,
            actorLogin: account.Login);
        await dbContext.SaveChangesAsync();

        loggerFactory.CreateLogger("NewNexus.PasswordReset")
            .LogInformation("Password reset requested for account {AccountId}.", account.Id);
    }

    if (account is null)
    {
        await AddApplicationTraceAsync(
            dbContext,
            httpContext,
            null,
            "AUTH_EVENTS",
            "PASSWORD_RESET_REQUESTED_UNKNOWN",
            "Warning",
            "Demande de reinitialisation sans compte actif.",
            "Aucun identifiant sensible conserve.",
            null,
            saveImmediately: true);
    }

    return Results.Ok(new
    {
        Message = "Si un compte actif correspond, une demande de réinitialisation a été enregistrée. Le lien d'envoi sera raccordé au service mail/SSO.",
        ResetToken = app.Environment.IsDevelopment() ? resetToken : null,
        ExpiresAtUtc = app.Environment.IsDevelopment() && account is not null ? account.PasswordResetExpiresAtUtc : null
    });
});

app.MapPost("/api/auth/reset-password", async (ResetPasswordRequest request, NewNexusDbContext dbContext, HttpContext httpContext) =>
{
    var errors = ValidateResetPasswordRequest(request);
    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors);
    }

    var tokenHash = HashPasswordResetToken(request.Token.Trim());
    var account = await dbContext.UserAccounts
        .Include(userAccount => userAccount.SecurityProfile!)
            .ThenInclude(profile => profile.ModuleRights)
                .ThenInclude(right => right.SecurityModule)
        .SingleOrDefaultAsync(userAccount =>
            userAccount.IsActive &&
            userAccount.PasswordResetTokenHash == tokenHash &&
            userAccount.PasswordResetConsumedAtUtc == null &&
            userAccount.PasswordResetExpiresAtUtc > DateTime.UtcNow);

    if (account is null)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["token"] = ["Le lien de réinitialisation est invalide ou expiré."]
        });
    }

    account.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);
    account.MustChangePassword = false;
    account.PasswordResetTokenHash = null;
    account.PasswordResetConsumedAtUtc = DateTime.UtcNow;
    account.PasswordResetExpiresAtUtc = null;
    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        null,
        "AUTH_EVENTS",
        "PASSWORD_RESET_CONSUMED",
        "Info",
        "Mot de passe reinitialise depuis un jeton.",
        null,
        account.Login,
        actorUserAccountId: account.Id,
        actorLogin: account.Login);

    await dbContext.SaveChangesAsync();

    return Results.Ok(new
    {
        Message = "Le mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter."
    });
});

app.MapGet("/api/auth/me", async (NewNexusDbContext dbContext, ClaimsPrincipal principal) =>
{
    var userId = GetUserId(principal);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var account = await dbContext.UserAccounts
        .AsNoTracking()
        .Include(userAccount => userAccount.SecurityProfile!)
            .ThenInclude(profile => profile.ModuleRights)
                .ThenInclude(right => right.SecurityModule)
        .SingleOrDefaultAsync(userAccount => userAccount.Id == userId.Value && userAccount.IsActive);

    return account is null ? Results.Unauthorized() : Results.Ok(BuildAuthenticatedUser(account));
});

app.MapGet("/api/nexa/session-insight", async (NewNexusDbContext dbContext, ClaimsPrincipal principal) =>
{
    var userId = GetUserId(principal);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var account = await dbContext.UserAccounts
        .AsNoTracking()
        .Include(userAccount => userAccount.SecurityProfile!)
            .ThenInclude(profile => profile.ModuleRights)
                .ThenInclude(right => right.SecurityModule)
        .SingleOrDefaultAsync(userAccount => userAccount.Id == userId.Value && userAccount.IsActive);

    if (account is null)
    {
        return Results.Unauthorized();
    }

    var now = DateTime.UtcNow;
    var since = now.AddDays(-30);
    var sessions = await dbContext.UserSessions
        .AsNoTracking()
        .Where(session => session.UserAccountId == account.Id)
        .OrderByDescending(session => session.LoginAtUtc)
        .Take(12)
        .Select(session => new NexaSessionSignal(
            session.LoginAtUtc,
            session.LastSeenAtUtc,
            session.LogoutAtUtc,
            session.RevokedAtUtc))
        .ToListAsync();
    var traces = await dbContext.ApplicationTraces
        .AsNoTracking()
        .Where(trace => trace.CreatedAtUtc >= since &&
            (trace.ActorUserAccountId == account.Id || trace.ActorLogin == account.Login))
        .OrderByDescending(trace => trace.CreatedAtUtc)
        .Take(60)
        .Select(trace => new NexaTraceSignal(
            trace.StreamCode,
            trace.EventCode,
            trace.Level,
            trace.CreatedAtUtc))
        .ToListAsync();

    return Results.Ok(BuildNexaSessionInsight(account, sessions, traces, now));
}).RequireAuthorization();

app.MapPut("/api/auth/preferences", async (
    UpdateUserPreferencesRequest request,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    var userId = GetUserId(principal);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var account = await dbContext.UserAccounts
        .Include(userAccount => userAccount.SecurityProfile!)
            .ThenInclude(profile => profile.ModuleRights)
                .ThenInclude(right => right.SecurityModule)
        .SingleOrDefaultAsync(userAccount => userAccount.Id == userId.Value && userAccount.IsActive);

    if (account is null)
    {
        return Results.Unauthorized();
    }

    account.IsSidebarCollapsed = request.IsSidebarCollapsed;
    await dbContext.SaveChangesAsync();

    return Results.Ok(BuildAuthenticatedUser(account));
}).RequireAuthorization();

app.MapPost("/api/auth/change-password", async (
    ChangePasswordRequest request,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    var userId = GetUserId(principal);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var account = await dbContext.UserAccounts
        .Include(userAccount => userAccount.SecurityProfile!)
            .ThenInclude(profile => profile.ModuleRights)
                .ThenInclude(right => right.SecurityModule)
        .SingleOrDefaultAsync(userAccount => userAccount.Id == userId.Value && userAccount.IsActive);

    if (account is null)
    {
        return Results.Unauthorized();
    }

    var errors = ValidateChangePasswordRequest(request, account.PasswordHash);
    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors);
    }

    account.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);
    account.MustChangePassword = false;
    await dbContext.SaveChangesAsync();

    return Results.Ok(BuildAuthenticatedUser(account));
}).RequireAuthorization();

app.MapGet("/api/security/modules", async (NewNexusDbContext dbContext) =>
{
    var modules = await dbContext.SecurityModules
        .AsNoTracking()
        .OrderBy(module => module.NavigationGroup)
        .ThenBy(module => module.DisplayOrder)
        .ThenBy(module => module.Label)
        .Select(module => new
        {
            module.Id,
            module.Code,
            module.Label,
            module.NavigationGroup,
            module.DisplayOrder,
            module.IsActive
        })
        .ToListAsync();

    return Results.Ok(modules);
}).RequireAuthorization("RequireInformatique");

app.MapGet("/api/security/profiles", async (NewNexusDbContext dbContext) =>
{
    var profiles = await dbContext.SecurityProfiles
        .AsNoTracking()
        .Include(profile => profile.ModuleRights)
            .ThenInclude(right => right.SecurityModule)
        .OrderBy(profile => profile.Label)
        .ToListAsync();

    return Results.Ok(profiles.Select(BuildProfileResponse));
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/security/profiles", async (CreateSecurityProfileRequest request, NewNexusDbContext dbContext) =>
{
    var label = request.Label.Trim();
    if (string.IsNullOrWhiteSpace(label))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["label"] = ["Le libellé profil est obligatoire."]
        });
    }

    var existingCodes = await dbContext.SecurityProfiles
        .AsNoTracking()
        .Select(profile => profile.Code)
        .ToListAsync();
    var code = GenerateUniqueProfileCode(label, existingCodes);

    var modules = await dbContext.SecurityModules
        .AsNoTracking()
        .OrderBy(module => module.NavigationGroup)
        .ThenBy(module => module.DisplayOrder)
        .ThenBy(module => module.Label)
        .ToListAsync();

    if (modules.Count == 0)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["modules"] = ["Aucun module n'est disponible pour le paramétrage."]
        });
    }

    var rightsResult = TryBuildDesiredRights(request.ModuleRights, modules);
    if (!rightsResult.IsValid)
    {
        return Results.ValidationProblem(rightsResult.Errors);
    }

    var profile = new SecurityProfile
    {
        Id = Guid.NewGuid(),
        Code = code,
        Label = label,
        IsSystemProfile = false,
        IsActive = request.IsActive
    };

    foreach (var module in modules)
    {
        profile.ModuleRights.Add(new SecurityProfileModuleRight
        {
            Id = Guid.NewGuid(),
            SecurityProfileId = profile.Id,
            SecurityModuleId = module.Id,
            AccessLevel = rightsResult.RightsByModuleId[module.Id]
        });
    }

    dbContext.SecurityProfiles.Add(profile);
    await dbContext.SaveChangesAsync();

    await dbContext.Entry(profile)
        .Collection(item => item.ModuleRights)
        .Query()
        .Include(right => right.SecurityModule)
        .LoadAsync();

    return Results.Created($"/api/security/profiles/{profile.Id}", BuildProfileResponse(profile));
}).RequireAuthorization("RequireInformatique");

app.MapPut("/api/security/profiles/{profileId:guid}", async (
    Guid profileId,
    UpdateSecurityProfileRequest request,
    NewNexusDbContext dbContext) =>
{
    var profile = await dbContext.SecurityProfiles
        .Include(item => item.ModuleRights)
        .SingleOrDefaultAsync(item => item.Id == profileId);

    if (profile is null)
    {
        return Results.NotFound();
    }

    var label = request.Label.Trim();
    if (string.IsNullOrWhiteSpace(label))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["label"] = ["Le libellé profil est obligatoire."]
        });
    }

    var modules = await dbContext.SecurityModules
        .AsNoTracking()
        .OrderBy(module => module.NavigationGroup)
        .ThenBy(module => module.DisplayOrder)
        .ThenBy(module => module.Label)
        .ToListAsync();

    var rightsResult = TryBuildDesiredRights(request.ModuleRights, modules);
    if (!rightsResult.IsValid)
    {
        return Results.ValidationProblem(rightsResult.Errors);
    }

    if (string.Equals(profile.Code, "INFORMATIQUE", StringComparison.OrdinalIgnoreCase))
    {
        if (!request.IsActive)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["isActive"] = ["Le profil Informatique doit rester actif."]
            });
        }

        var adminModuleId = modules
            .Where(module => string.Equals(module.Code, "ADMINISTRATION", StringComparison.OrdinalIgnoreCase))
            .Select(module => module.Id)
            .Single();

        if (rightsResult.RightsByModuleId.GetValueOrDefault(adminModuleId) != ModuleAccessLevel.Write)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["moduleRights"] = ["Le profil Informatique doit conserver le droit Écriture sur Administration."]
            });
        }
    }

    profile.Label = label;
    profile.IsActive = request.IsActive;

    foreach (var module in modules)
    {
        var existingRight = profile.ModuleRights.SingleOrDefault(right => right.SecurityModuleId == module.Id);
        var accessLevel = rightsResult.RightsByModuleId[module.Id];

        if (existingRight is null)
        {
            profile.ModuleRights.Add(new SecurityProfileModuleRight
            {
                Id = Guid.NewGuid(),
                SecurityProfileId = profile.Id,
                SecurityModuleId = module.Id,
                AccessLevel = accessLevel
            });
            continue;
        }

        existingRight.AccessLevel = accessLevel;
    }

    await dbContext.SaveChangesAsync();

    await dbContext.Entry(profile)
        .Collection(item => item.ModuleRights)
        .Query()
        .Include(right => right.SecurityModule)
        .LoadAsync();

    return Results.Ok(BuildProfileResponse(profile));
}).RequireAuthorization("RequireInformatique");

app.MapDelete("/api/security/profiles/{profileId:guid}", async (Guid profileId, NewNexusDbContext dbContext) =>
{
    var profile = await dbContext.SecurityProfiles
        .Include(item => item.ModuleRights)
        .SingleOrDefaultAsync(item => item.Id == profileId);

    if (profile is null)
    {
        return Results.NotFound();
    }

    if (profile.IsSystemProfile)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["profile"] = ["Un profil système ne peut pas être supprimé."]
        });
    }

    var isAssigned = await dbContext.UserAccounts.AnyAsync(account => account.SecurityProfileId == profile.Id);
    if (isAssigned)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["profile"] = ["Ce profil est encore affecté à au moins un compte."]
        });
    }

    dbContext.SecurityProfileModuleRights.RemoveRange(profile.ModuleRights);
    dbContext.SecurityProfiles.Remove(profile);
    await dbContext.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization("RequireInformatique");

app.MapGet("/api/security/accounts", async (NewNexusDbContext dbContext) =>
{
    var accounts = await dbContext.UserAccounts
        .AsNoTracking()
        .OrderBy(account => account.DisplayName)
        .ThenBy(account => account.Login)
        .Select(account => new
        {
            account.Id,
            account.Login,
            account.DisplayName,
            account.Email,
            account.EmployeeNumber,
            account.IsActive,
            account.MustChangePassword,
            account.SessionTimeoutMinutes,
            account.CreatedAtUtc,
            account.LastLoginAtUtc,
            account.LastSyncedAtUtc,
            Profile = account.SecurityProfile == null
                ? null
                : new
                {
                    account.SecurityProfile.Id,
                    account.SecurityProfile.Code,
                    account.SecurityProfile.Label
                }
        })
        .ToListAsync();

    return Results.Ok(accounts);
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/security/accounts", async (CreateUserAccountRequest request, NewNexusDbContext dbContext) =>
{
    var validationErrors = await ValidateCreateUserAccountRequestAsync(request, dbContext);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var account = new UserAccount
    {
        Id = Guid.NewGuid(),
        Login = request.Login.Trim(),
        DisplayName = request.DisplayName.Trim(),
        Email = NormalizeOptionalText(request.Email),
        EmployeeNumber = NormalizeOptionalText(request.EmployeeNumber),
        PasswordHash = PasswordHasher.HashPassword(request.Password),
        MustChangePassword = request.MustChangePassword,
        SessionTimeoutMinutes = NormalizeSessionTimeoutMinutes(request.SessionTimeoutMinutes),
        SecurityProfileId = request.SecurityProfileId,
        IsActive = request.IsActive,
        CreatedAtUtc = DateTime.UtcNow
    };

    dbContext.UserAccounts.Add(account);
    await dbContext.SaveChangesAsync();

    return Results.Created($"/api/security/accounts/{account.Id}", new { account.Id });
}).RequireAuthorization("RequireInformatique");

app.MapPut("/api/security/accounts/{accountId:guid}", async (
    Guid accountId,
    UpdateUserAccountRequest request,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    var currentUserId = GetUserId(principal);
    var account = await dbContext.UserAccounts.SingleOrDefaultAsync(userAccount => userAccount.Id == accountId);
    if (account is null)
    {
        return Results.NotFound();
    }

    var validationErrors = await ValidateUpdateUserAccountRequestAsync(request, dbContext, accountId);
    if (currentUserId == account.Id && request.SecurityProfileId is null)
    {
        validationErrors["securityProfileId"] = ["Vous ne pouvez pas retirer votre propre profil d'administration."];
    }

    if (currentUserId == account.Id && !request.IsActive)
    {
        validationErrors["isActive"] = ["Vous ne pouvez pas desactiver votre propre compte."];
    }

    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    account.Login = request.Login.Trim();
    account.DisplayName = request.DisplayName.Trim();
    account.Email = NormalizeOptionalText(request.Email);
    account.EmployeeNumber = NormalizeOptionalText(request.EmployeeNumber);
    account.MustChangePassword = request.MustChangePassword;
    account.SessionTimeoutMinutes = NormalizeSessionTimeoutMinutes(request.SessionTimeoutMinutes);
    account.SecurityProfileId = request.SecurityProfileId;
    account.IsActive = request.IsActive;

    if (!string.IsNullOrWhiteSpace(request.NewPassword))
    {
        account.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);
        account.MustChangePassword = true;
    }

    await dbContext.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/security/accounts/{accountId:guid}/reset-password", async (
    Guid accountId,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    var currentUserId = GetUserId(principal);
    var account = await dbContext.UserAccounts.SingleOrDefaultAsync(userAccount => userAccount.Id == accountId);
    if (account is null)
    {
        return Results.NotFound();
    }

    if (currentUserId == account.Id)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["account"] = ["Utilisez le changement de mot de passe personnel pour votre propre compte."]
        });
    }

    if (!account.IsActive)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["account"] = ["Le compte doit etre actif avant de reinitialiser son mot de passe."]
        });
    }

    var temporaryPassword = GenerateTemporaryPassword();
    account.PasswordHash = PasswordHasher.HashPassword(temporaryPassword);
    account.MustChangePassword = true;
    account.PasswordResetTokenHash = null;
    account.PasswordResetRequestedAtUtc = null;
    account.PasswordResetExpiresAtUtc = null;
    account.PasswordResetConsumedAtUtc = null;

    await dbContext.SaveChangesAsync();

    return Results.Ok(new
    {
        account.Id,
        TemporaryPassword = temporaryPassword,
        Message = "Mot de passe temporaire genere. L'utilisateur devra le changer a la prochaine connexion."
    });
}).RequireAuthorization("RequireInformatique");

app.MapGet("/api/admin/sessions", async (NewNexusDbContext dbContext) =>
{
    var now = DateTime.UtcNow;
    var activeSessions = await dbContext.UserSessions
        .AsNoTracking()
        .Include(session => session.UserAccount!)
            .ThenInclude(account => account.SecurityProfile)
        .Where(session => session.LogoutAtUtc == null && session.RevokedAtUtc == null && session.ExpiresAtUtc > now)
        .OrderByDescending(session => session.LastSeenAtUtc)
        .ToListAsync();

    var historySessions = await dbContext.UserSessions
        .AsNoTracking()
        .Include(session => session.UserAccount!)
            .ThenInclude(account => account.SecurityProfile)
        .OrderByDescending(session => session.LoginAtUtc)
        .Take(100)
        .ToListAsync();

    return Results.Ok(new
    {
        Active = activeSessions
            .Select(session => BuildUserSessionResponse(session, now))
            .ToList(),
        History = historySessions
            .Select(session => BuildUserSessionResponse(session, now))
            .ToList()
    });
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/admin/sessions/{sessionId:guid}/disconnect", async (
    Guid sessionId,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    var session = await dbContext.UserSessions.SingleOrDefaultAsync(userSession => userSession.Id == sessionId);
    if (session is null)
    {
        return Results.NotFound();
    }

    if (session.LogoutAtUtc is not null || session.RevokedAtUtc is not null)
    {
        return Results.NoContent();
    }

    var now = DateTime.UtcNow;
    session.RevokedAtUtc = now;
    session.LastSeenAtUtc = now;
    session.RevokedByUserAccountId = GetUserId(principal);
    await dbContext.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization("RequireInformatique");

app.MapGet("/api/admin/sql-queries", () => Results.Ok(GetControlledSqlQueryCatalog()))
    .RequireAuthorization("RequireInformatique");

app.MapPost("/api/admin/sql-queries/{queryCode}/run", async (
    string queryCode,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal,
    ILoggerFactory loggerFactory,
    HttpContext httpContext) =>
{
    var query = GetControlledSqlQueryCatalog()
        .SingleOrDefault(item => string.Equals(item.Code, queryCode, StringComparison.OrdinalIgnoreCase));
    if (query is null)
    {
        return Results.NotFound();
    }

    var rows = await ExecuteControlledSqlQueryAsync(query.Code, dbContext, httpContext.RequestAborted);
    loggerFactory.CreateLogger("NewNexus.ControlledSql")
        .LogInformation(
            "Controlled SQL query {QueryCode} executed by {UserId} with {RowCount} row(s).",
            query.Code,
            GetUserId(principal),
            rows.Count);
    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "ADMIN_ACTIONS",
        "CONTROLLED_SQL_RUN",
        "Info",
        "Requete SQL controlee executee.",
        $"Code={query.Code}; lignes={rows.Count}.",
        query.Code,
        saveImmediately: true);

    return Results.Ok(new
    {
        Query = query,
        Rows = rows,
        RowCount = rows.Count,
        ExecutedAtUtc = DateTime.UtcNow
    });
}).RequireAuthorization("RequireInformatique");

app.MapGet("/api/admin/traces", async (
    string? streamCode,
    int? limit,
    NewNexusDbContext dbContext) =>
{
    var normalizedStreamCode = NormalizeOptionalText(streamCode)?.ToUpperInvariant();
    var safeLimit = Math.Clamp(limit.GetValueOrDefault(100), 20, 300);
    var query = dbContext.ApplicationTraces
        .AsNoTracking()
        .AsQueryable();

    if (!string.IsNullOrWhiteSpace(normalizedStreamCode))
    {
        query = query.Where(trace => trace.StreamCode == normalizedStreamCode);
    }

    var traces = await query
        .OrderByDescending(trace => trace.CreatedAtUtc)
        .Take(safeLimit)
        .Select(trace => new
        {
            trace.Id,
            trace.StreamCode,
            trace.StreamLabel,
            trace.EventCode,
            trace.Level,
            trace.Message,
            trace.Detail,
            trace.Subject,
            trace.ActorUserAccountId,
            trace.ActorLogin,
            trace.IpAddress,
            trace.CreatedAtUtc
        })
        .ToListAsync();

    return Results.Ok(new
    {
        Streams = GetTraceStreams(),
        Traces = traces,
        Limit = safeLimit
    });
}).RequireAuthorization("RequireInformatique");

app.MapGet("/api/admin/scheduled-tasks", async (NewNexusDbContext dbContext) =>
{
    var definitions = GetScheduledTaskDefinitions();
    var taskCodes = definitions.Select(task => task.Code).ToArray();
    var lastRunTraces = await dbContext.ApplicationTraces
        .AsNoTracking()
        .Where(trace => trace.EventCode == "SCHEDULED_TASK_RUN" && trace.Subject != null && taskCodes.Contains(trace.Subject))
        .OrderByDescending(trace => trace.CreatedAtUtc)
        .Select(trace => new
        {
            trace.Subject,
            trace.Level,
            trace.Message,
            trace.Detail,
            trace.CreatedAtUtc
        })
        .ToListAsync();
    var lastRunsByTaskCode = lastRunTraces
        .GroupBy(item => item.Subject!, StringComparer.OrdinalIgnoreCase)
        .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

    return Results.Ok(definitions.Select(task =>
    {
        lastRunsByTaskCode.TryGetValue(task.Code, out var lastRun);
        return new
        {
            task.Code,
            task.Label,
            task.Scope,
            task.Cadence,
            task.Status,
            task.Description,
            task.IsRunnable,
            LastRun = lastRun
        };
    }));
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/admin/scheduled-tasks/{taskCode}/run", async (
    string taskCode,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal,
    HttpContext httpContext) =>
{
    var normalizedTaskCode = NormalizeTechnicalCode(taskCode);
    var task = GetScheduledTaskDefinitions().SingleOrDefault(item => item.Code == normalizedTaskCode);
    if (task is null)
    {
        return Results.NotFound();
    }

    if (!task.IsRunnable)
    {
        await AddApplicationTraceAsync(
            dbContext,
            httpContext,
            principal,
            "INTEGRATION_RUNS",
            "SCHEDULED_TASK_REFUSED",
            "Warning",
            "Tache planifiee non executable.",
            "Le connecteur ou l'arbitrage metier requis n'est pas encore disponible.",
            task.Code,
            saveImmediately: true);
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["task"] = ["Cette tache reste a raccorder avant execution."]
        });
    }

    object result;
    if (task.Code == "LUCCA_ACCOUNT_PROVISIONING")
    {
        result = await ProvisionEmployeeAccountsAsync(dbContext, httpContext.RequestAborted);
    }
    else if (task.Code == "TRUCKONLINE_FLEET_SYNC")
    {
        result = await BuildMaterialIntegrationSnapshotAsync(dbContext, "TRUCKONLINE", httpContext.RequestAborted);
    }
    else if (task.Code == "YELLOWBOX_TELEMATICS_SYNC")
    {
        result = await BuildMaterialIntegrationSnapshotAsync(dbContext, "YELLOWBOX", httpContext.RequestAborted);
    }
    else if (task.Code == "GEOCODING_LOADING_POINTS")
    {
        result = await BuildLoadingPointGeocodingSnapshotAsync(dbContext, httpContext.RequestAborted);
    }
    else
    {
        result = new { Message = "Aucun executeur local n'est defini pour cette tache." };
    }

    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "INTEGRATION_RUNS",
        "SCHEDULED_TASK_RUN",
        "Info",
        "Tache planifiee executee manuellement.",
        task.Label,
        task.Code,
        saveImmediately: true);

    return Results.Ok(new
    {
        Task = task,
        Result = result,
        ExecutedAtUtc = DateTime.UtcNow
    });
}).RequireAuthorization("RequireInformatique");

app.MapGet("/api/modules/contraventions", async (
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "CONTRAVENTIONS", ModuleAccessLevel.Read))
    {
        return Results.Forbid();
    }

    var contraventions = await dbContext.Contraventions
        .AsNoTracking()
        .Include(item => item.DriverEmployee)
        .Include(item => item.Material)
        .OrderByDescending(item => item.OffenseDate)
        .ThenBy(item => item.NoticeNumber)
        .ToListAsync();

    return Results.Ok(contraventions.Select(BuildContraventionResponse));
}).RequireAuthorization();

app.MapGet("/api/modules/contraventions/referentials", async (
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "CONTRAVENTIONS", ModuleAccessLevel.Read))
    {
        return Results.Forbid();
    }

    var drivers = await dbContext.Employees
        .AsNoTracking()
        .Where(item => item.IsActive && item.IsDriver)
        .OrderBy(item => item.DisplayName)
        .ThenBy(item => item.EmployeeNumber)
        .Select(item => new
        {
            item.Id,
            item.SourceEmployeeId,
            item.EmployeeNumber,
            item.DisplayName,
            item.Email,
            item.PhoneNumber,
            item.IsDriver,
            item.IsActive,
            item.LastSyncedAtUtc,
            item.CreatedAtUtc
        })
        .ToListAsync();

    var materials = await dbContext.Materials
        .AsNoTracking()
        .Include(item => item.Exploitation)
        .Where(item => item.IsActive)
        .OrderBy(item => item.FleetNumber)
        .Select(item => new
        {
            item.Id,
            item.FleetNumber,
            item.Label,
            item.MaterialType,
            item.RegistrationNumber,
            item.SourceSystem,
            item.IsActive,
            item.LastSyncedAtUtc,
            item.CreatedAtUtc,
            Exploitation = item.Exploitation == null
                ? null
                : new
                {
                    item.Exploitation.Id,
                    item.Exploitation.Code,
                    item.Exploitation.Label
                }
        })
        .ToListAsync();

    return Results.Ok(new
    {
        Drivers = drivers,
        Materials = materials
    });
}).RequireAuthorization();

app.MapPost("/api/modules/contraventions", async (
    UpsertContraventionRequest request,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal,
    HttpContext httpContext) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "CONTRAVENTIONS", ModuleAccessLevel.Write))
    {
        return Results.Forbid();
    }

    var validationErrors = await ValidateContraventionRequestAsync(request, dbContext);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var now = DateTime.UtcNow;
    var contravention = new Contravention
    {
        Id = Guid.NewGuid(),
        NoticeNumber = request.NoticeNumber.Trim().ToUpperInvariant(),
        OffenseDate = request.OffenseDate,
        DueDate = request.DueDate,
        Amount = request.Amount,
        StatusCode = NormalizeContraventionStatus(request.StatusCode),
        OffenseLabel = request.OffenseLabel.Trim(),
        Location = NormalizeOptionalText(request.Location),
        Notes = NormalizeOptionalText(request.Notes),
        DriverEmployeeId = request.DriverEmployeeId,
        MaterialId = request.MaterialId,
        CreatedAtUtc = now,
        UpdatedAtUtc = now
    };

    dbContext.Contraventions.Add(contravention);
    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "MODULE_EVENTS",
        "CONTRAVENTION_CREATED",
        "Info",
        "Contravention creee.",
        $"Avis={contravention.NoticeNumber}; statut={contravention.StatusCode}; montant={contravention.Amount}.",
        contravention.NoticeNumber);
    await dbContext.SaveChangesAsync(httpContext.RequestAborted);

    return Results.Created($"/api/modules/contraventions/{contravention.Id}", new { contravention.Id });
}).RequireAuthorization();

app.MapPut("/api/modules/contraventions/{contraventionId:guid}", async (
    Guid contraventionId,
    UpsertContraventionRequest request,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal,
    HttpContext httpContext) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "CONTRAVENTIONS", ModuleAccessLevel.Write))
    {
        return Results.Forbid();
    }

    var contravention = await dbContext.Contraventions.SingleOrDefaultAsync(item => item.Id == contraventionId);
    if (contravention is null)
    {
        return Results.NotFound();
    }

    var validationErrors = await ValidateContraventionRequestAsync(request, dbContext, contraventionId);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    contravention.NoticeNumber = request.NoticeNumber.Trim().ToUpperInvariant();
    contravention.OffenseDate = request.OffenseDate;
    contravention.DueDate = request.DueDate;
    contravention.Amount = request.Amount;
    contravention.StatusCode = NormalizeContraventionStatus(request.StatusCode);
    contravention.OffenseLabel = request.OffenseLabel.Trim();
    contravention.Location = NormalizeOptionalText(request.Location);
    contravention.Notes = NormalizeOptionalText(request.Notes);
    contravention.DriverEmployeeId = request.DriverEmployeeId;
    contravention.MaterialId = request.MaterialId;
    contravention.UpdatedAtUtc = DateTime.UtcNow;

    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "MODULE_EVENTS",
        "CONTRAVENTION_UPDATED",
        "Info",
        "Contravention mise a jour.",
        $"Avis={contravention.NoticeNumber}; statut={contravention.StatusCode}; montant={contravention.Amount}.",
        contravention.NoticeNumber);
    await dbContext.SaveChangesAsync(httpContext.RequestAborted);

    return Results.NoContent();
}).RequireAuthorization();

app.MapGet("/api/modules/loading-points", async (
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "CARTE_POINTS_CHARGEMENT_DECHARGEMENT", ModuleAccessLevel.Read))
    {
        return Results.Forbid();
    }

    var points = await dbContext.LoadingPoints
        .AsNoTracking()
        .Include(item => item.ThirdParty)
        .Include(item => item.Exploitation)
        .OrderBy(item => item.City)
        .ThenBy(item => item.Label)
        .ToListAsync();

    return Results.Ok(points.Select(BuildLoadingPointResponse));
}).RequireAuthorization();

app.MapGet("/api/modules/loading-points/map", async (
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "CARTE_POINTS_CHARGEMENT_DECHARGEMENT", ModuleAccessLevel.Read))
    {
        return Results.Forbid();
    }

    var points = await dbContext.LoadingPoints
        .AsNoTracking()
        .Include(item => item.ThirdParty)
        .Include(item => item.Exploitation)
        .Where(item => item.IsActive)
        .OrderBy(item => item.City)
        .ThenBy(item => item.Label)
        .ToListAsync();

    return Results.Ok(BuildLoadingPointMapResponse(points));
}).RequireAuthorization();

app.MapGet("/api/modules/loading-points/referentials", async (
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "CARTE_POINTS_CHARGEMENT_DECHARGEMENT", ModuleAccessLevel.Read))
    {
        return Results.Forbid();
    }

    var thirdParties = await dbContext.ThirdParties
        .AsNoTracking()
        .Where(item => item.IsActive)
        .OrderBy(item => item.DisplayName)
        .Select(item => new
        {
            item.Id,
            item.TypeCode,
            item.DisplayName,
            item.Siren,
            item.VatNumber,
            item.ExternalReference,
            item.IsForeignCompany,
            item.IsActive,
            item.CreatedAtUtc,
            Analytics = Array.Empty<object>()
        })
        .ToListAsync();

    var exploitations = await dbContext.Exploitations
        .AsNoTracking()
        .Include(item => item.Company)
        .Where(item => item.IsActive)
        .OrderBy(item => item.Code)
        .Select(item => new
        {
            item.Id,
            item.Code,
            item.Label,
            item.IsActive,
            Company = new
            {
                item.Company!.Id,
                item.Company.Siren,
                item.Company.DisplayName
            }
        })
        .ToListAsync();

    return Results.Ok(new
    {
        ThirdParties = thirdParties,
        Exploitations = exploitations
    });
}).RequireAuthorization();

app.MapPost("/api/modules/loading-points", async (
    UpsertLoadingPointRequest request,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal,
    HttpContext httpContext) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "CARTE_POINTS_CHARGEMENT_DECHARGEMENT", ModuleAccessLevel.Write))
    {
        return Results.Forbid();
    }

    var validationErrors = await ValidateLoadingPointRequestAsync(request, dbContext);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var now = DateTime.UtcNow;
    var loadingPoint = new LoadingPoint
    {
        Id = Guid.NewGuid(),
        Code = request.Code.Trim().ToUpperInvariant(),
        Label = request.Label.Trim(),
        PointTypeCode = NormalizeLoadingPointType(request.PointTypeCode),
        AddressLine = request.AddressLine.Trim(),
        PostalCode = request.PostalCode.Trim(),
        City = request.City.Trim(),
        CountryCode = NormalizeCountryCode(request.CountryCode),
        Latitude = request.Latitude,
        Longitude = request.Longitude,
        ThirdPartyId = request.ThirdPartyId,
        ExploitationId = request.ExploitationId,
        IsActive = request.IsActive,
        Notes = NormalizeOptionalText(request.Notes),
        CreatedAtUtc = now,
        UpdatedAtUtc = now
    };

    dbContext.LoadingPoints.Add(loadingPoint);
    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "MODULE_EVENTS",
        "LOADING_POINT_CREATED",
        "Info",
        "Point de chargement/dechargement cree.",
        $"Code={loadingPoint.Code}; type={loadingPoint.PointTypeCode}; ville={loadingPoint.City}.",
        loadingPoint.Code);
    await dbContext.SaveChangesAsync(httpContext.RequestAborted);

    return Results.Created($"/api/modules/loading-points/{loadingPoint.Id}", new { loadingPoint.Id });
}).RequireAuthorization();

app.MapPut("/api/modules/loading-points/{loadingPointId:guid}", async (
    Guid loadingPointId,
    UpsertLoadingPointRequest request,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal,
    HttpContext httpContext) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "CARTE_POINTS_CHARGEMENT_DECHARGEMENT", ModuleAccessLevel.Write))
    {
        return Results.Forbid();
    }

    var loadingPoint = await dbContext.LoadingPoints.SingleOrDefaultAsync(item => item.Id == loadingPointId);
    if (loadingPoint is null)
    {
        return Results.NotFound();
    }

    var validationErrors = await ValidateLoadingPointRequestAsync(request, dbContext, loadingPointId);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    loadingPoint.Code = request.Code.Trim().ToUpperInvariant();
    loadingPoint.Label = request.Label.Trim();
    loadingPoint.PointTypeCode = NormalizeLoadingPointType(request.PointTypeCode);
    loadingPoint.AddressLine = request.AddressLine.Trim();
    loadingPoint.PostalCode = request.PostalCode.Trim();
    loadingPoint.City = request.City.Trim();
    loadingPoint.CountryCode = NormalizeCountryCode(request.CountryCode);
    loadingPoint.Latitude = request.Latitude;
    loadingPoint.Longitude = request.Longitude;
    loadingPoint.ThirdPartyId = request.ThirdPartyId;
    loadingPoint.ExploitationId = request.ExploitationId;
    loadingPoint.IsActive = request.IsActive;
    loadingPoint.Notes = NormalizeOptionalText(request.Notes);
    loadingPoint.UpdatedAtUtc = DateTime.UtcNow;

    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "MODULE_EVENTS",
        "LOADING_POINT_UPDATED",
        "Info",
        "Point de chargement/dechargement mis a jour.",
        $"Code={loadingPoint.Code}; type={loadingPoint.PointTypeCode}; actif={loadingPoint.IsActive}.",
        loadingPoint.Code);
    await dbContext.SaveChangesAsync(httpContext.RequestAborted);

    return Results.NoContent();
}).RequireAuthorization();

app.MapPost("/api/modules/loading-points/{loadingPointId:guid}/geocode", async (
    Guid loadingPointId,
    NewNexusDbContext dbContext,
    IDataProtectionProvider dataProtectionProvider,
    IHttpClientFactory httpClientFactory,
    ClaimsPrincipal principal,
    HttpContext httpContext) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "CARTE_POINTS_CHARGEMENT_DECHARGEMENT", ModuleAccessLevel.Write))
    {
        return Results.Forbid();
    }

    var loadingPoint = await dbContext.LoadingPoints
        .Include(item => item.ThirdParty)
        .Include(item => item.Exploitation)
        .SingleOrDefaultAsync(item => item.Id == loadingPointId);
    if (loadingPoint is null)
    {
        return Results.NotFound();
    }

    var geocodeResult = await GeocodeLoadingPointAsync(
        loadingPoint,
        dbContext,
        dataProtectionProvider,
        httpClientFactory,
        httpContext.RequestAborted);

    if (!geocodeResult.IsSuccess)
    {
        await AddApplicationTraceAsync(
            dbContext,
            httpContext,
            principal,
            "INTEGRATION_RUNS",
            "LOADING_POINT_GEOCODE_FAILED",
            "Warning",
            "Geocodage du point impossible.",
            geocodeResult.ErrorDetail,
            loadingPoint.Code);
        await dbContext.SaveChangesAsync(httpContext.RequestAborted);

        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["geocoding"] = [geocodeResult.ErrorDetail ?? "Le geocodage n'a retourne aucune coordonnee."]
        });
    }

    loadingPoint.Latitude = geocodeResult.Latitude;
    loadingPoint.Longitude = geocodeResult.Longitude;
    loadingPoint.UpdatedAtUtc = DateTime.UtcNow;

    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "INTEGRATION_RUNS",
        "LOADING_POINT_GEOCODED",
        "Info",
        "Point geocode.",
        $"Fournisseur={geocodeResult.Provider}; latitude={geocodeResult.Latitude}; longitude={geocodeResult.Longitude}.",
        loadingPoint.Code);
    await dbContext.SaveChangesAsync(httpContext.RequestAborted);

    return Results.Ok(new
    {
        Point = BuildLoadingPointResponse(loadingPoint),
        Geocoding = geocodeResult
    });
}).RequireAuthorization();

app.MapGet("/api/modules/driver-indicators", async (
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "INDICATEURS_CONDUCTEURS", ModuleAccessLevel.Read))
    {
        return Results.Forbid();
    }

    return Results.Ok(await BuildDriverIndicatorsAsync(dbContext));
}).RequireAuthorization();

app.MapGet("/api/modules/tractor-indicators", async (
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    if (!await HasModuleAccessAsync(dbContext, principal, "INDICATEURS_TRACTEURS", ModuleAccessLevel.Read))
    {
        return Results.Forbid();
    }

    return Results.Ok(await BuildTractorIndicatorsAsync(dbContext));
}).RequireAuthorization();

app.MapGet("/api/settings/bootstrap", async (NewNexusDbContext dbContext) =>
{
    var companies = await dbContext.Companies
        .AsNoTracking()
        .OrderBy(company => company.DisplayName)
        .Select(company => new
        {
            company.Id,
            company.Siren,
            company.DisplayName,
            company.LegalName,
            company.IsActive,
            company.CreatedAtUtc
        })
        .ToListAsync();

    var analytics = await dbContext.Analytics
        .AsNoTracking()
        .Include(item => item.Company)
        .OrderBy(item => item.Code)
        .ThenBy(item => item.Label)
        .Select(item => new
        {
            item.Id,
            item.Code,
            item.Label,
            item.IsActive,
            Company = new
            {
                item.Company!.Id,
                item.Company.Siren,
                item.Company.DisplayName
            }
        })
        .ToListAsync();

    var exploitations = await dbContext.Exploitations
        .AsNoTracking()
        .Include(item => item.Company)
        .OrderBy(item => item.Code)
        .ThenBy(item => item.Label)
        .Select(item => new
        {
            item.Id,
            item.Code,
            item.Label,
            item.IsActive,
            Company = new
            {
                item.Company!.Id,
                item.Company.Siren,
                item.Company.DisplayName
            }
        })
        .ToListAsync();

    var employees = await dbContext.Employees
        .AsNoTracking()
        .OrderBy(item => item.DisplayName)
        .ThenBy(item => item.EmployeeNumber)
        .Select(item => new
        {
            item.Id,
            item.SourceEmployeeId,
            item.EmployeeNumber,
            item.DisplayName,
            item.Email,
            item.PhoneNumber,
            item.IsDriver,
            item.IsActive,
            item.LastSyncedAtUtc,
            item.CreatedAtUtc
        })
        .ToListAsync();

    var thirdParties = await dbContext.ThirdParties
        .AsNoTracking()
        .Include(item => item.Analytics)
            .ThenInclude(link => link.Analytic!)
                .ThenInclude(analytic => analytic.Company)
        .OrderBy(item => item.DisplayName)
        .Select(item => new
        {
            item.Id,
            item.TypeCode,
            item.DisplayName,
            item.Siren,
            item.VatNumber,
            item.ExternalReference,
            item.IsForeignCompany,
            item.IsActive,
            item.CreatedAtUtc,
            Analytics = item.Analytics
                .OrderBy(link => link.Analytic!.Code)
                .Select(link => new
                {
                    link.AnalyticId,
                    link.Analytic!.Code,
                    link.Analytic.Label,
                    Company = new
                    {
                        link.Analytic.Company!.Id,
                        link.Analytic.Company.DisplayName
                    }
                })
        })
        .ToListAsync();

    var materials = await dbContext.Materials
        .AsNoTracking()
        .Include(item => item.Exploitation)
        .OrderBy(item => item.FleetNumber)
        .Select(item => new
        {
            item.Id,
            item.FleetNumber,
            item.Label,
            item.MaterialType,
            item.RegistrationNumber,
            item.SourceSystem,
            item.IsActive,
            item.LastSyncedAtUtc,
            item.CreatedAtUtc,
            Exploitation = item.Exploitation == null
                ? null
                : new
                {
                    item.Exploitation.Id,
                    item.Exploitation.Code,
                    item.Exploitation.Label
                }
        })
        .ToListAsync();

    return Results.Ok(new
    {
        Companies = companies,
        Analytics = analytics,
        Exploitations = exploitations,
        Employees = employees,
        ThirdParties = thirdParties,
        Materials = materials
    });
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Read));

app.MapGet("/api/settings/companies/sirene/{siren}", async (string siren, IHttpClientFactory httpClientFactory) =>
{
    var normalizedSiren = new string(siren.Where(char.IsDigit).ToArray());
    if (normalizedSiren.Length != 9)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["siren"] = ["Le SIREN doit contenir 9 chiffres."]
        });
    }

    var lookup = await LookupSireneCompanyAsync(httpClientFactory, normalizedSiren);
    if (!lookup.IsAvailable)
    {
        return Results.Problem(
            title: "La recherche SIRENE est indisponible.",
            detail: lookup.ErrorDetail,
            statusCode: StatusCodes.Status502BadGateway);
    }

    if (lookup.Company is null)
    {
        return Results.NotFound();
    }

    return Results.Ok(new
    {
        Siren = normalizedSiren,
        lookup.Company.Siret,
        lookup.Company.DisplayName,
        lookup.Company.LegalName,
        lookup.Company.Naf,
        Source = "API Recherche d'Entreprises"
    });
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Read));

app.MapGet("/api/settings/companies/sirene-search", async (
    string? name,
    string? city,
    string? postalCode,
    IHttpClientFactory httpClientFactory) =>
{
    var normalizedName = NormalizeOptionalText(name);
    var normalizedCity = NormalizeOptionalText(city);
    var normalizedPostalCode = NormalizeOptionalText(postalCode);

    if (string.IsNullOrWhiteSpace(normalizedName) &&
        string.IsNullOrWhiteSpace(normalizedCity) &&
        string.IsNullOrWhiteSpace(normalizedPostalCode))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["sireneSearch"] = ["Saisissez au moins un nom, une ville ou un code postal."]
        });
    }

    var lookup = await SearchSireneCompaniesAsync(httpClientFactory, normalizedName, normalizedCity, normalizedPostalCode);
    if (!lookup.IsAvailable)
    {
        return Results.Problem(
            title: "La recherche SIRENE est indisponible.",
            detail: lookup.ErrorDetail,
            statusCode: StatusCodes.Status502BadGateway);
    }

    return Results.Ok(lookup.Companies.Select(company => new
    {
        company.Siren,
        company.Siret,
        company.DisplayName,
        company.LegalName,
        company.Naf,
        company.PostalCode,
        company.City,
        Source = "API Recherche d'Entreprises"
    }));
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Read));

app.MapPost("/api/settings/companies", async (UpsertCompanyRequest request, NewNexusDbContext dbContext, IHttpClientFactory httpClientFactory) =>
{
    var validationErrors = await ValidateCompanyRequestAsync(request, dbContext);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var sireneLookup = await LookupSireneCompanyAsync(httpClientFactory, request.Siren.Trim());
    if (!sireneLookup.IsAvailable)
    {
        return Results.Problem(
            title: "Creation societe impossible",
            detail: $"La verification SIRENE est obligatoire avant creation. {sireneLookup.ErrorDetail}",
            statusCode: StatusCodes.Status502BadGateway);
    }

    if (sireneLookup.Company is null)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["siren"] = ["La societe doit etre retrouvee dans SIRENE avant creation."]
        });
    }

    var company = new Company
    {
        Id = Guid.NewGuid(),
        Siren = request.Siren.Trim(),
        DisplayName = FirstNonEmpty(request.DisplayName.Trim(), sireneLookup.Company.DisplayName, sireneLookup.Company.LegalName)!,
        LegalName = FirstNonEmpty(request.LegalName.Trim(), sireneLookup.Company.LegalName, sireneLookup.Company.DisplayName)!,
        IsActive = request.IsActive,
        CreatedAtUtc = DateTime.UtcNow
    };

    dbContext.Companies.Add(company);
    await dbContext.SaveChangesAsync();

    return Results.Created($"/api/settings/companies/{company.Id}", new { company.Id });
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPut("/api/settings/companies/{companyId:guid}", async (
    Guid companyId,
    UpsertCompanyRequest request,
    NewNexusDbContext dbContext) =>
{
    var company = await dbContext.Companies.SingleOrDefaultAsync(item => item.Id == companyId);
    if (company is null)
    {
        return Results.NotFound();
    }

    var validationErrors = await ValidateCompanyRequestAsync(request, dbContext, companyId);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    company.Siren = request.Siren.Trim();
    company.DisplayName = request.DisplayName.Trim();
    company.LegalName = request.LegalName.Trim();
    company.IsActive = request.IsActive;

    await dbContext.SaveChangesAsync();
    return Results.NoContent();
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPost("/api/settings/analytics", async (UpsertAnalyticRequest request, NewNexusDbContext dbContext) =>
{
    var validationErrors = await ValidateAnalyticRequestAsync(request, dbContext);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var analytic = new Analytic
    {
        Id = Guid.NewGuid(),
        Code = request.Code.Trim().ToUpperInvariant(),
        Label = request.Label.Trim(),
        CompanyId = request.CompanyId,
        IsActive = request.IsActive
    };

    dbContext.Analytics.Add(analytic);
    await dbContext.SaveChangesAsync();

    return Results.Created($"/api/settings/analytics/{analytic.Id}", new { analytic.Id });
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPut("/api/settings/analytics/{analyticId:guid}", async (
    Guid analyticId,
    UpsertAnalyticRequest request,
    NewNexusDbContext dbContext) =>
{
    var analytic = await dbContext.Analytics.SingleOrDefaultAsync(item => item.Id == analyticId);
    if (analytic is null)
    {
        return Results.NotFound();
    }

    var validationErrors = await ValidateAnalyticRequestAsync(request, dbContext, analyticId);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    analytic.Code = request.Code.Trim().ToUpperInvariant();
    analytic.Label = request.Label.Trim();
    analytic.CompanyId = request.CompanyId;
    analytic.IsActive = request.IsActive;

    await dbContext.SaveChangesAsync();
    return Results.NoContent();
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPost("/api/settings/exploitations", async (UpsertExploitationRequest request, NewNexusDbContext dbContext) =>
{
    var validationErrors = await ValidateExploitationRequestAsync(request, dbContext);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var exploitation = new Exploitation
    {
        Id = Guid.NewGuid(),
        Code = request.Code.Trim().ToUpperInvariant(),
        Label = request.Label.Trim(),
        CompanyId = request.CompanyId,
        IsActive = request.IsActive
    };

    dbContext.Exploitations.Add(exploitation);
    await dbContext.SaveChangesAsync();

    return Results.Created($"/api/settings/exploitations/{exploitation.Id}", new { exploitation.Id });
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPut("/api/settings/exploitations/{exploitationId:guid}", async (
    Guid exploitationId,
    UpsertExploitationRequest request,
    NewNexusDbContext dbContext) =>
{
    var exploitation = await dbContext.Exploitations.SingleOrDefaultAsync(item => item.Id == exploitationId);
    if (exploitation is null)
    {
        return Results.NotFound();
    }

    var validationErrors = await ValidateExploitationRequestAsync(request, dbContext, exploitationId);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    exploitation.Code = request.Code.Trim().ToUpperInvariant();
    exploitation.Label = request.Label.Trim();
    exploitation.CompanyId = request.CompanyId;
    exploitation.IsActive = request.IsActive;

    await dbContext.SaveChangesAsync();
    return Results.NoContent();
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPost("/api/settings/employees", async (UpsertEmployeeRequest request, NewNexusDbContext dbContext) =>
{
    var validationErrors = await ValidateEmployeeRequestAsync(request, dbContext);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var employee = new Employee
    {
        Id = Guid.NewGuid(),
        SourceEmployeeId = request.SourceEmployeeId.Trim(),
        EmployeeNumber = request.EmployeeNumber.Trim(),
        DisplayName = request.DisplayName.Trim(),
        Email = NormalizeOptionalText(request.Email),
        PhoneNumber = NormalizeOptionalText(request.PhoneNumber),
        IsDriver = request.IsDriver,
        IsActive = request.IsActive,
        LastSyncedAtUtc = request.LastSyncedAtUtc,
        CreatedAtUtc = DateTime.UtcNow
    };

    dbContext.Employees.Add(employee);
    await dbContext.SaveChangesAsync();

    return Results.Created($"/api/settings/employees/{employee.Id}", new { employee.Id });
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPost("/api/settings/employees/provision-accounts", async (
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal,
    HttpContext httpContext) =>
{
    var result = await ProvisionEmployeeAccountsAsync(dbContext, httpContext.RequestAborted);
    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "ADMIN_ACTIONS",
        "EMPLOYEE_ACCOUNT_PROVISIONING",
        "Info",
        "Creation automatique des comptes depuis salaries.",
        $"Crees={result.CreatedCount}; ignores={result.SkippedCount}.",
        "LUCCA_ACCOUNT_PROVISIONING",
        saveImmediately: true);

    return Results.Ok(result);
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPost("/api/settings/employees/import-lucca", async (
    NewNexusDbContext dbContext,
    IHttpClientFactory httpClientFactory,
    IDataProtectionProvider dataProtectionProvider,
    HttpContext httpContext) =>
{
    var baseUrl = await GetActiveCredentialValueAsync(dbContext, dataProtectionProvider, "LUCCA", "LUCCA_BASE_URL", httpContext.RequestAborted);
    var apiKey = await GetActiveCredentialValueAsync(dbContext, dataProtectionProvider, "LUCCA", "LUCCA_API_KEY", httpContext.RequestAborted);
    var configuredPath = await GetActiveCredentialValueAsync(dbContext, dataProtectionProvider, "LUCCA", "LUCCA_USERS_PATH", httpContext.RequestAborted);

    if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(apiKey))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["lucca"] = ["Les cles LUCCA_BASE_URL et LUCCA_API_KEY doivent etre renseignees dans Outils > Cles API."]
        });
    }

    if (!Uri.TryCreate(baseUrl.TrimEnd('/'), UriKind.Absolute, out var baseUri))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["luccaBaseUrl"] = ["L'URL de base Lucca est invalide."]
        });
    }

    var path = string.IsNullOrWhiteSpace(configuredPath)
        ? "/api/v3/users?fields=id,firstName,lastName,displayName,mail,employeeNumber,dtContractEnd,login,modifiedAt&paging=0,1000"
        : configuredPath.Trim();
    var requestUri = BuildLuccaEmployeesUri(baseUri, path);
    var client = httpClientFactory.CreateClient("Lucca");
    var imported = 0;
    var created = 0;
    var updated = 0;
    var skipped = 0;
    var messages = new List<string>();
    var now = DateTime.UtcNow;

    while (requestUri is not null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        var isLegacyApi = IsLuccaLegacyApi(requestUri);
        if (isLegacyApi)
        {
            request.Headers.TryAddWithoutValidation("Authorization", $"lucca application={apiKey}");
        }
        else
        {
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            request.Headers.TryAddWithoutValidation("Api-Version", "2025-01-01");
        }

        using var response = await client.SendAsync(request, httpContext.RequestAborted);
        if (!response.IsSuccessStatusCode)
        {
            var detail = await response.Content.ReadAsStringAsync(httpContext.RequestAborted);
            return Results.Problem(
                title: "Import Lucca impossible",
                detail: $"Lucca retourne {(int)response.StatusCode} {response.ReasonPhrase}. {detail}",
                statusCode: StatusCodes.Status502BadGateway);
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(httpContext.RequestAborted));
        var items = EnumerateLuccaEmployeeItems(document.RootElement).ToList();
        if (items.Count == 0)
        {
            return Results.Problem(
                title: "Import Lucca impossible",
                detail: "La reponse Lucca ne contient aucun salarie exploitable. Verifiez le chemin Lucca et les droits de la cle.",
                statusCode: StatusCodes.Status502BadGateway);
        }

        foreach (var item in items)
        {
            var mapped = MapLuccaEmployee(item);
            if (mapped is null)
            {
                skipped++;
                continue;
            }

            var employee = await dbContext.Employees
                .SingleOrDefaultAsync(candidate =>
                        candidate.SourceEmployeeId == mapped.SourceEmployeeId ||
                        candidate.EmployeeNumber == mapped.EmployeeNumber,
                    httpContext.RequestAborted);

            if (employee is null)
            {
                employee = new Employee
                {
                    Id = Guid.NewGuid(),
                    CreatedAtUtc = now,
                    IsDriver = false
                };
                dbContext.Employees.Add(employee);
                created++;
            }
            else
            {
                updated++;
            }

            employee.SourceEmployeeId = mapped.SourceEmployeeId;
            employee.EmployeeNumber = mapped.EmployeeNumber;
            employee.DisplayName = mapped.DisplayName;
            employee.Email = mapped.Email;
            employee.PhoneNumber = mapped.PhoneNumber;
            employee.IsActive = mapped.IsActive;
            employee.LastSyncedAtUtc = now;
            imported++;
        }

        requestUri = isLegacyApi ? null : GetLuccaNextPageUri(baseUri, document.RootElement);
    }

    await dbContext.SaveChangesAsync(httpContext.RequestAborted);

    return Results.Ok(new
    {
        ImportedCount = imported,
        CreatedCount = created,
        UpdatedCount = updated,
        SkippedCount = skipped,
        Messages = messages
    });
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPut("/api/settings/employees/{employeeId:guid}", async (
    Guid employeeId,
    UpsertEmployeeRequest request,
    NewNexusDbContext dbContext) =>
{
    var employee = await dbContext.Employees.SingleOrDefaultAsync(item => item.Id == employeeId);
    if (employee is null)
    {
        return Results.NotFound();
    }

    var validationErrors = await ValidateEmployeeRequestAsync(request, dbContext, employeeId);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    employee.SourceEmployeeId = request.SourceEmployeeId.Trim();
    employee.EmployeeNumber = request.EmployeeNumber.Trim();
    employee.DisplayName = request.DisplayName.Trim();
    employee.Email = NormalizeOptionalText(request.Email);
    employee.PhoneNumber = NormalizeOptionalText(request.PhoneNumber);
    employee.IsDriver = request.IsDriver;
    employee.IsActive = request.IsActive;
    employee.LastSyncedAtUtc = request.LastSyncedAtUtc;

    await dbContext.SaveChangesAsync();
    return Results.NoContent();
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPost("/api/settings/third-parties", async (UpsertThirdPartyRequest request, NewNexusDbContext dbContext) =>
{
    var validationErrors = await ValidateThirdPartyRequestAsync(request, dbContext);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var thirdParty = new ThirdParty
    {
        Id = Guid.NewGuid(),
        TypeCode = request.TypeCode.Trim().ToUpperInvariant(),
        DisplayName = request.DisplayName.Trim(),
        Siren = NormalizeOptionalText(request.Siren),
        VatNumber = NormalizeOptionalText(request.VatNumber),
        ExternalReference = NormalizeOptionalText(request.ExternalReference),
        IsForeignCompany = request.IsForeignCompany,
        IsActive = request.IsActive,
        CreatedAtUtc = DateTime.UtcNow,
        Analytics = request.AnalyticIds.Distinct().Select(analyticId => new ThirdPartyAnalytic
        {
            AnalyticId = analyticId
        }).ToList()
    };

    dbContext.ThirdParties.Add(thirdParty);
    await dbContext.SaveChangesAsync();

    return Results.Created($"/api/settings/third-parties/{thirdParty.Id}", new { thirdParty.Id });
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPut("/api/settings/third-parties/{thirdPartyId:guid}", async (
    Guid thirdPartyId,
    UpsertThirdPartyRequest request,
    NewNexusDbContext dbContext) =>
{
    var thirdParty = await dbContext.ThirdParties
        .Include(item => item.Analytics)
        .SingleOrDefaultAsync(item => item.Id == thirdPartyId);
    if (thirdParty is null)
    {
        return Results.NotFound();
    }

    var validationErrors = await ValidateThirdPartyRequestAsync(request, dbContext, thirdPartyId);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    thirdParty.TypeCode = request.TypeCode.Trim().ToUpperInvariant();
    thirdParty.DisplayName = request.DisplayName.Trim();
    thirdParty.Siren = NormalizeOptionalText(request.Siren);
    thirdParty.VatNumber = NormalizeOptionalText(request.VatNumber);
    thirdParty.ExternalReference = NormalizeOptionalText(request.ExternalReference);
    thirdParty.IsForeignCompany = request.IsForeignCompany;
    thirdParty.IsActive = request.IsActive;

    var desiredAnalyticIds = request.AnalyticIds.Distinct().ToHashSet();
    dbContext.ThirdPartyAnalytics.RemoveRange(thirdParty.Analytics.Where(link => !desiredAnalyticIds.Contains(link.AnalyticId)));
    foreach (var analyticId in desiredAnalyticIds.Except(thirdParty.Analytics.Select(link => link.AnalyticId)))
    {
        thirdParty.Analytics.Add(new ThirdPartyAnalytic { ThirdPartyId = thirdParty.Id, AnalyticId = analyticId });
    }

    await dbContext.SaveChangesAsync();
    return Results.NoContent();
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPost("/api/settings/materials", async (UpsertMaterialRequest request, NewNexusDbContext dbContext) =>
{
    var validationErrors = await ValidateMaterialRequestAsync(request, dbContext);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var material = new Material
    {
        Id = Guid.NewGuid(),
        FleetNumber = request.FleetNumber.Trim().ToUpperInvariant(),
        Label = request.Label.Trim(),
        MaterialType = request.MaterialType.Trim().ToUpperInvariant(),
        RegistrationNumber = NormalizeOptionalText(request.RegistrationNumber),
        SourceSystem = NormalizeOptionalText(request.SourceSystem),
        ExploitationId = request.ExploitationId,
        IsActive = request.IsActive,
        LastSyncedAtUtc = request.LastSyncedAtUtc,
        CreatedAtUtc = DateTime.UtcNow
    };

    dbContext.Materials.Add(material);
    await dbContext.SaveChangesAsync();

    return Results.Created($"/api/settings/materials/{material.Id}", new { material.Id });
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapPut("/api/settings/materials/{materialId:guid}", async (
    Guid materialId,
    UpsertMaterialRequest request,
    NewNexusDbContext dbContext) =>
{
    var material = await dbContext.Materials.SingleOrDefaultAsync(item => item.Id == materialId);
    if (material is null)
    {
        return Results.NotFound();
    }

    var validationErrors = await ValidateMaterialRequestAsync(request, dbContext, materialId);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    material.FleetNumber = request.FleetNumber.Trim().ToUpperInvariant();
    material.Label = request.Label.Trim();
    material.MaterialType = request.MaterialType.Trim().ToUpperInvariant();
    material.RegistrationNumber = NormalizeOptionalText(request.RegistrationNumber);
    material.SourceSystem = NormalizeOptionalText(request.SourceSystem);
    material.ExploitationId = request.ExploitationId;
    material.IsActive = request.IsActive;
    material.LastSyncedAtUtc = request.LastSyncedAtUtc;

    await dbContext.SaveChangesAsync();
    return Results.NoContent();
})
    .RequireAuthorization()
    .AddEndpointFilter(RequireModuleAccessFilter("DONNEES_COMMUNES", ModuleAccessLevel.Write));

app.MapGet("/api/admin/integrations/readiness", async (
    NewNexusDbContext dbContext,
    IDataProtectionProvider dataProtectionProvider) =>
{
    return Results.Ok(await BuildIntegrationReadinessAsync(dbContext, dataProtectionProvider));
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/admin/integrations/{providerCode}/materials/import", async (
    string providerCode,
    ImportMaterialsRequest request,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal,
    HttpContext httpContext) =>
{
    var normalizedProviderCode = NormalizeTechnicalCode(providerCode);
    if (normalizedProviderCode is not ("TRUCKONLINE" or "YELLOWBOX"))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["providerCode"] = ["Seuls TruckOnline et YellowBox alimentent le referentiel materiels dans cette passe."]
        });
    }

    var result = await ImportMaterialsFromProviderAsync(
        dbContext,
        normalizedProviderCode,
        request.Materials,
        httpContext.RequestAborted);

    await AddApplicationTraceAsync(
        dbContext,
        httpContext,
        principal,
        "INTEGRATION_RUNS",
        "MATERIALS_PROVIDER_IMPORT",
        "Info",
        "Import materiels execute.",
        $"Fournisseur={normalizedProviderCode}; crees={result.CreatedCount}; mis a jour={result.UpdatedCount}; ignores={result.SkippedCount}.",
        normalizedProviderCode,
        saveImmediately: true);

    return Results.Ok(result);
}).RequireAuthorization("RequireInformatique");

app.MapPut("/api/security/accounts/{accountId:guid}/profile", async (
    Guid accountId,
    UpdateAccountProfileRequest request,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    var currentUserId = GetUserId(principal);
    var account = await dbContext.UserAccounts.SingleOrDefaultAsync(userAccount => userAccount.Id == accountId);
    if (account is null)
    {
        return Results.NotFound();
    }

    if (request.SecurityProfileId is not null)
    {
        var profileExists = await dbContext.SecurityProfiles.AnyAsync(profile => profile.Id == request.SecurityProfileId.Value && profile.IsActive);
        if (!profileExists)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["securityProfileId"] = ["Le profil sélectionné est introuvable ou inactif."]
            });
        }
    }

    if (currentUserId == account.Id && request.SecurityProfileId is null)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["securityProfileId"] = ["Vous ne pouvez pas retirer votre propre profil d'administration."]
        });
    }

    account.SecurityProfileId = request.SecurityProfileId;
    await dbContext.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization("RequireInformatique");

app.MapPut("/api/security/accounts/{accountId:guid}/status", async (
    Guid accountId,
    UpdateAccountStatusRequest request,
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal) =>
{
    var currentUserId = GetUserId(principal);
    var account = await dbContext.UserAccounts.SingleOrDefaultAsync(userAccount => userAccount.Id == accountId);
    if (account is null)
    {
        return Results.NotFound();
    }

    if (currentUserId == account.Id && !request.IsActive)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["isActive"] = ["Vous ne pouvez pas désactiver votre propre compte."]
        });
    }

    account.IsActive = request.IsActive;
    await dbContext.SaveChangesAsync();

    return Results.NoContent();
}).RequireAuthorization("RequireInformatique");

app.MapFallbackToFile("index.html");

app.Run();

static string ResolveConfiguredPath(string contentRootPath, string? configuredPath)
{
    var path = string.IsNullOrWhiteSpace(configuredPath)
        ? Path.Combine(contentRootPath, "App_Data", "DataProtection-Keys")
        : configuredPath.Trim();

    return Path.IsPathRooted(path) ? path : Path.GetFullPath(Path.Combine(contentRootPath, path));
}

static string NormalizeBasePath(string? value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return string.Empty;
    }

    var trimmed = value.Trim();
    if (!trimmed.StartsWith('/'))
    {
        trimmed = "/" + trimmed;
    }

    return trimmed.TrimEnd('/');
}

static IReadOnlyList<object> BuildCredentialResponses(
    IReadOnlyCollection<IntegrationCredential> credentials,
    IDataProtectionProvider dataProtectionProvider)
{
    var definitions = GetKnownCredentialDefinitions()
        .Where(definition => !IsHiddenIntegrationProvider(definition.ProviderCode))
        .ToList();
    var definitionsByKey = definitions.ToDictionary(
        item => BuildCredentialKey(item.ProviderCode, item.KeyName),
        StringComparer.OrdinalIgnoreCase);
    var credentialsByKey = credentials.ToDictionary(
        item => BuildCredentialKey(item.ProviderCode, item.KeyName),
        StringComparer.OrdinalIgnoreCase);
    var responses = new List<object>();

    foreach (var definition in definitions)
    {
        credentialsByKey.TryGetValue(BuildCredentialKey(definition.ProviderCode, definition.KeyName), out var credential);
        responses.Add(BuildCredentialResponse(credential, dataProtectionProvider, definition));
    }

    foreach (var credential in credentials)
    {
        if (!IsHiddenIntegrationProvider(credential.ProviderCode) &&
            !definitionsByKey.ContainsKey(BuildCredentialKey(credential.ProviderCode, credential.KeyName)))
        {
            responses.Add(BuildCredentialResponse(credential, dataProtectionProvider, null));
        }
    }

    return responses;
}

static object BuildCredentialResponse(
    IntegrationCredential? credential,
    IDataProtectionProvider dataProtectionProvider,
    IntegrationCredentialDefinition? definition)
{
    var clearValue = credential is null ? null : UnprotectCredentialValue(credential.ProtectedValue, dataProtectionProvider);
    var providerCode = credential?.ProviderCode ?? definition?.ProviderCode ?? string.Empty;
    var keyName = credential?.KeyName ?? definition?.KeyName ?? string.Empty;
    var isSecret = credential?.IsSecret ?? definition?.IsSecret ?? true;

    return new
    {
        Id = credential?.Id,
        ProviderCode = providerCode,
        ProviderLabel = credential?.ProviderLabel ?? definition?.ProviderLabel ?? providerCode,
        KeyName = keyName,
        DisplayName = credential?.DisplayName ?? definition?.DisplayName ?? keyName,
        IsSecret = isSecret,
        HasValue = !string.IsNullOrWhiteSpace(credential?.ProtectedValue),
        MaskedValue = isSecret ? MaskSecret(clearValue) : null,
        Value = isSecret ? null : clearValue,
        IsActive = credential?.IsActive ?? false,
        Source = credential?.Source,
        Notes = credential?.Notes ?? definition?.Notes,
        CreatedAtUtc = credential?.CreatedAtUtc,
        UpdatedAtUtc = credential?.UpdatedAtUtc,
        LastImportedAtUtc = credential?.LastImportedAtUtc,
        IsConfigured = credential is not null
    };
}

static async Task<LegacyImportResult> ImportLegacyNexusCredentialsAsync(
    NewNexusDbContext dbContext,
    IConfiguration configuration,
    IDataProtectionProvider dataProtectionProvider,
    CancellationToken cancellationToken)
{
    var connectionString = configuration["LegacyNexus:ConnectionString"];
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return new LegacyImportResult(0, 0, 1, ["La chaine de connexion LegacyNexus est absente."]);
    }

    var legacyKeysPath = configuration["LegacyNexus:DataProtectionKeysPath"];
    if (string.IsNullOrWhiteSpace(legacyKeysPath) || !Directory.Exists(legacyKeysPath))
    {
        return new LegacyImportResult(0, 0, 1, ["Le trousseau DataProtection legacy est introuvable."]);
    }

    using var legacyProvider = BuildLegacyDataProtectionProvider(legacyKeysPath);
    var legacyIntegrationProtector = legacyProvider
        .GetRequiredService<IDataProtectionProvider>()
        .CreateProtector("Locatif.Api.SireneSecret.v1");
    var legacyAdminProtector = legacyProvider
        .GetRequiredService<IDataProtectionProvider>()
        .CreateProtector("Locatif.Api.AdminApiKeys.v1");
    var definitions = GetKnownCredentialDefinitions()
        .Where(item => !string.IsNullOrWhiteSpace(item.LegacyParameterKey))
        .ToList();
    var legacyRows = await ReadLegacyParameterRowsAsync(
        connectionString,
        definitions.Select(item => item.LegacyParameterKey!).Append("admin.api-keys.v1").Distinct().ToList(),
        cancellationToken);

    var imported = 0;
    var skipped = 0;
    var failed = 0;
    var messages = new List<string>();

    foreach (var definition in definitions)
    {
        if (!legacyRows.TryGetValue(definition.LegacyParameterKey!, out var storedValue) || string.IsNullOrWhiteSpace(storedValue))
        {
            skipped++;
            continue;
        }

        var clearValue = TryUnprotectLegacyValue(storedValue, legacyIntegrationProtector);
        if (string.IsNullOrWhiteSpace(clearValue))
        {
            failed++;
            messages.Add($"{definition.ProviderLabel} / {definition.DisplayName}: valeur legacy non dechiffrable.");
            continue;
        }

        await UpsertImportedCredentialAsync(dbContext, dataProtectionProvider, definition, clearValue, cancellationToken);
        imported++;
    }

    var appSettingsImports = ReadLegacyAppSettingsCredentials(configuration);
    foreach (var import in appSettingsImports)
    {
        if (string.IsNullOrWhiteSpace(import.Value))
        {
            skipped++;
            continue;
        }

        await UpsertImportedCredentialAsync(dbContext, dataProtectionProvider, import.Definition, import.Value, cancellationToken);
        imported++;
    }

    if (legacyRows.TryGetValue("admin.api-keys.v1", out var adminApiKeysRaw) && !string.IsNullOrWhiteSpace(adminApiKeysRaw))
    {
        var adminImport = await ImportLegacyAdminApiKeysAsync(
            dbContext,
            dataProtectionProvider,
            legacyAdminProtector,
            adminApiKeysRaw,
            cancellationToken);
        imported += adminImport.ImportedCount;
        skipped += adminImport.SkippedCount;
        failed += adminImport.FailedCount;
        messages.AddRange(adminImport.Messages);
    }

    if (imported > 0)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    return new LegacyImportResult(imported, skipped, failed, messages);
}

static ServiceProvider BuildLegacyDataProtectionProvider(string legacyKeysPath)
{
    var services = new ServiceCollection();
    services
        .AddDataProtection()
        .SetApplicationName("Locatif")
        .PersistKeysToFileSystem(new DirectoryInfo(legacyKeysPath));
#pragma warning disable ASP0000
    return services.BuildServiceProvider();
#pragma warning restore ASP0000
}

static async Task<Dictionary<string, string?>> ReadLegacyParameterRowsAsync(
    string connectionString,
    IReadOnlyCollection<string> keys,
    CancellationToken cancellationToken)
{
    if (keys.Count == 0)
    {
        return new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
    }

    var parameterNames = keys.Select((_, index) => $"@p{index}").ToArray();
    await using var connection = new SqlConnection(connectionString);
    await using var command = connection.CreateCommand();
    command.CommandText = $"SELECT Cle, Valeur FROM app.ParametreSysteme WHERE Cle IN ({string.Join(", ", parameterNames)})";

    var index = 0;
    foreach (var key in keys)
    {
        command.Parameters.AddWithValue(parameterNames[index], key);
        index++;
    }

    await connection.OpenAsync(cancellationToken);
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    var rows = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
    while (await reader.ReadAsync(cancellationToken))
    {
        rows[reader.GetString(0)] = reader.IsDBNull(1) ? null : reader.GetString(1);
    }

    return rows;
}

static async Task<LegacyImportResult> ImportLegacyAdminApiKeysAsync(
    NewNexusDbContext dbContext,
    IDataProtectionProvider dataProtectionProvider,
    IDataProtector legacyAdminProtector,
    string rawJson,
    CancellationToken cancellationToken)
{
    var imported = 0;
    var skipped = 0;
    var failed = 0;
    var messages = new List<string>();

    try
    {
        var rows = JsonSerializer.Deserialize<List<LegacyAdminApiKeyRow>>(rawJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? [];

        foreach (var row in rows)
        {
            var providerName = NormalizeOptionalText(row.ProviderName);
            if (string.IsNullOrWhiteSpace(providerName))
            {
                skipped++;
                continue;
            }

            skipped++;
        }
    }
    catch
    {
        failed++;
        messages.Add("admin.api-keys.v1: JSON legacy illisible.");
    }

    return new LegacyImportResult(imported, skipped, failed, messages);
}

static IReadOnlyList<(IntegrationCredentialDefinition Definition, string? Value)> ReadLegacyAppSettingsCredentials(IConfiguration configuration)
{
    var files = new[]
    {
        configuration["LegacyNexus:AppSettingsPath"],
        configuration["LegacyNexus:AppSettingsDevelopmentPath"]
    }.Where(path => !string.IsNullOrWhiteSpace(path) && File.Exists(path)).Distinct().ToList();

    var imports = new List<(IntegrationCredentialDefinition Definition, string? Value)>();
    foreach (var file in files)
    {
        imports.Add((FindCredentialDefinition("GEOAPIFY", "GEOAPIFY_API_KEY"), ReadJsonConfigurationValue(file!, "Geocoding:GeoapifyApiKey")));
        imports.Add((FindCredentialDefinition("GOOGLE_MAPS", "GOOGLE_GEOCODING_API_KEY"), ReadJsonConfigurationValue(file!, "Geocoding:GoogleApiKey")));
    }

    return imports;
}

static string? ReadJsonConfigurationValue(string filePath, string path)
{
    using var document = JsonDocument.Parse(File.ReadAllText(filePath));
    var current = document.RootElement;
    foreach (var segment in path.Split(':', StringSplitOptions.RemoveEmptyEntries))
    {
        if (current.ValueKind != JsonValueKind.Object || !current.TryGetProperty(segment, out current))
        {
            return null;
        }
    }

    return current.ValueKind == JsonValueKind.String ? NormalizeOptionalText(current.GetString()) : null;
}

static async Task UpsertImportedCredentialAsync(
    NewNexusDbContext dbContext,
    IDataProtectionProvider dataProtectionProvider,
    IntegrationCredentialDefinition definition,
    string value,
    CancellationToken cancellationToken)
{
    var providerCode = NormalizeTechnicalCode(definition.ProviderCode);
    var keyName = NormalizeTechnicalCode(definition.KeyName);
    var credential = await dbContext.IntegrationCredentials
        .SingleOrDefaultAsync(item => item.ProviderCode == providerCode && item.KeyName == keyName, cancellationToken);
    var now = DateTime.UtcNow;

    if (credential is null)
    {
        credential = new IntegrationCredential
        {
            Id = Guid.NewGuid(),
            ProviderCode = providerCode,
            KeyName = keyName,
            CreatedAtUtc = now
        };
        dbContext.IntegrationCredentials.Add(credential);
    }

    credential.ProviderLabel = definition.ProviderLabel;
    credential.DisplayName = definition.DisplayName;
    credential.ProtectedValue = ProtectCredentialValue(value, dataProtectionProvider);
    credential.IsSecret = definition.IsSecret;
    credential.IsActive = true;
    credential.Source = "Import automatique";
    credential.Notes = definition.Notes;
    credential.UpdatedAtUtc = now;
    credential.LastImportedAtUtc = now;
}

static IntegrationCredentialDefinition FindCredentialDefinition(string providerCode, string keyName)
{
    return GetKnownCredentialDefinitions().Single(item =>
        string.Equals(item.ProviderCode, providerCode, StringComparison.OrdinalIgnoreCase) &&
        string.Equals(item.KeyName, keyName, StringComparison.OrdinalIgnoreCase));
}

static string? TryUnprotectLegacyValue(string? storedValue, IDataProtector protector)
{
    var raw = NormalizeOptionalText(storedValue);
    if (string.IsNullOrWhiteSpace(raw))
    {
        return null;
    }

    if (!raw.StartsWith("enc:", StringComparison.Ordinal))
    {
        return raw;
    }

    try
    {
        return protector.Unprotect(raw[4..]);
    }
    catch
    {
        return null;
    }
}

static string ProtectCredentialValue(string value, IDataProtectionProvider dataProtectionProvider)
{
    return dataProtectionProvider
        .CreateProtector("NewNexus.Api.IntegrationCredentials.v1")
        .Protect(value.Trim());
}

static string? UnprotectCredentialValue(string protectedValue, IDataProtectionProvider dataProtectionProvider)
{
    if (string.IsNullOrWhiteSpace(protectedValue))
    {
        return null;
    }

    try
    {
        return dataProtectionProvider
            .CreateProtector("NewNexus.Api.IntegrationCredentials.v1")
            .Unprotect(protectedValue);
    }
    catch
    {
        return null;
    }
}

static async Task<string?> GetActiveCredentialValueAsync(
    NewNexusDbContext dbContext,
    IDataProtectionProvider dataProtectionProvider,
    string providerCode,
    string keyName,
    CancellationToken cancellationToken)
{
    var normalizedProviderCode = NormalizeTechnicalCode(providerCode);
    var normalizedKeyName = NormalizeTechnicalCode(keyName);
    var credential = await dbContext.IntegrationCredentials
        .AsNoTracking()
        .SingleOrDefaultAsync(item =>
                item.ProviderCode == normalizedProviderCode &&
                item.KeyName == normalizedKeyName &&
                item.IsActive,
            cancellationToken);

    return credential is null ? null : UnprotectCredentialValue(credential.ProtectedValue, dataProtectionProvider);
}

static Uri BuildLuccaEmployeesUri(Uri baseUri, string path)
{
    if (Uri.TryCreate(path, UriKind.Absolute, out var absoluteUri))
    {
        return absoluteUri;
    }

    var relativePath = path.StartsWith('/') ? path[1..] : path;
    var builder = new UriBuilder(new Uri(baseUri, relativePath));
    if (string.IsNullOrWhiteSpace(builder.Query))
    {
        builder.Query = IsLuccaLegacyApi(builder.Uri)
            ? "paging=0,1000"
            : "limit=100&include=totalCount";
    }

    return builder.Uri;
}

static async Task<SireneLookupResult> LookupSireneCompanyAsync(IHttpClientFactory httpClientFactory, string siren)
{
    var normalizedSiren = new string((siren ?? string.Empty).Where(char.IsDigit).ToArray());
    if (normalizedSiren.Length != 9)
    {
        return new SireneLookupResult(true, null, "Le SIREN doit contenir 9 chiffres.");
    }

    var client = httpClientFactory.CreateClient("Sirene");
    using var response = await client.GetAsync($"/search?q={Uri.EscapeDataString(normalizedSiren)}&per_page=10");
    if (!response.IsSuccessStatusCode)
    {
        var detail = await response.Content.ReadAsStringAsync();
        return new SireneLookupResult(false, null, $"SIRENE retourne {(int)response.StatusCode} {response.ReasonPhrase}. {detail}");
    }

    await using var stream = await response.Content.ReadAsStreamAsync();
    using var document = await JsonDocument.ParseAsync(stream);

    if (!document.RootElement.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array)
    {
        return new SireneLookupResult(true, null, "La reponse SIRENE ne contient pas de resultats.");
    }

    var company = results.EnumerateArray()
        .FirstOrDefault(result => string.Equals(GetJsonString(result, "siren"), normalizedSiren, StringComparison.OrdinalIgnoreCase));
    if (company.ValueKind == JsonValueKind.Undefined)
    {
        return new SireneLookupResult(true, null, "Aucune societe trouvee pour ce SIREN.");
    }

    return new SireneLookupResult(
        true,
        BuildSireneCompanyLookup(company, normalizedSiren),
        null);
}

static async Task<SireneSearchResult> SearchSireneCompaniesAsync(
    IHttpClientFactory httpClientFactory,
    string? name,
    string? city,
    string? postalCode)
{
    var searchTerms = new[] { name, city, postalCode }
        .Where(value => !string.IsNullOrWhiteSpace(value))
        .Select(value => value!.Trim());
    var query = string.Join(' ', searchTerms);
    var normalizedPostalCode = NormalizeOptionalText(postalCode);
    var normalizedCity = NormalizeOptionalText(city);

    var client = httpClientFactory.CreateClient("Sirene");
    using var response = await client.GetAsync($"/search?q={Uri.EscapeDataString(query)}&per_page=12");
    if (!response.IsSuccessStatusCode)
    {
        var detail = await response.Content.ReadAsStringAsync();
        return new SireneSearchResult(false, [], $"SIRENE retourne {(int)response.StatusCode} {response.ReasonPhrase}. {detail}");
    }

    await using var stream = await response.Content.ReadAsStreamAsync();
    using var document = await JsonDocument.ParseAsync(stream);

    if (!document.RootElement.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array)
    {
        return new SireneSearchResult(true, [], "La reponse SIRENE ne contient pas de resultats.");
    }

    var companies = results.EnumerateArray()
        .Select(result => BuildSireneCompanyLookup(result))
        .Where(company => string.IsNullOrWhiteSpace(normalizedPostalCode) || string.Equals(company.PostalCode, normalizedPostalCode, StringComparison.OrdinalIgnoreCase))
        .Where(company => string.IsNullOrWhiteSpace(normalizedCity) || (company.City?.Contains(normalizedCity, StringComparison.OrdinalIgnoreCase) ?? false))
        .GroupBy(company => company.Siren)
        .Select(group => group.First())
        .Take(8)
        .ToList();

    return new SireneSearchResult(true, companies, null);
}

static SireneCompanyLookup BuildSireneCompanyLookup(JsonElement company, string? fallbackSiren = null)
{
    var legalName = FirstNonEmpty(
        GetJsonString(company, "nom_complet"),
        GetJsonString(company, "nom_raison_sociale"),
        GetJsonString(company, "denomination"));
    var displayName = FirstNonEmpty(
        GetJsonString(company, "nom_raison_sociale"),
        GetJsonString(company, "nom_complet"),
        GetJsonString(company, "denomination"));

    company.TryGetProperty("siege", out var headquarters);
    var hasHeadquarters = headquarters.ValueKind == JsonValueKind.Object;

    return new SireneCompanyLookup(
        FirstNonEmpty(GetJsonString(company, "siren"), fallbackSiren) ?? string.Empty,
        FirstNonEmpty(GetJsonString(company, "siret"), hasHeadquarters ? GetJsonString(headquarters, "siret") : null),
        displayName,
        legalName,
        FirstNonEmpty(GetJsonString(company, "activite_principale"), hasHeadquarters ? GetJsonString(headquarters, "activite_principale") : null),
        hasHeadquarters ? GetJsonString(headquarters, "code_postal") : null,
        hasHeadquarters ? GetJsonString(headquarters, "libelle_commune") : null);
}

static bool IsLuccaLegacyApi(Uri requestUri)
{
    return requestUri.AbsolutePath.Contains("/api/v3/", StringComparison.OrdinalIgnoreCase) ||
           requestUri.AbsolutePath.Contains("/api/v4/", StringComparison.OrdinalIgnoreCase);
}

static Uri? GetLuccaNextPageUri(Uri baseUri, JsonElement root)
{
    if (root.TryGetProperty("links", out var links) &&
        links.ValueKind == JsonValueKind.Object &&
        links.TryGetProperty("next", out var next) &&
        next.ValueKind == JsonValueKind.Object &&
        next.TryGetProperty("href", out var href) &&
        href.ValueKind == JsonValueKind.String &&
        !string.IsNullOrWhiteSpace(href.GetString()))
    {
        var rawHref = href.GetString()!;
        return Uri.TryCreate(rawHref, UriKind.Absolute, out var absoluteUri)
            ? absoluteUri
            : new Uri(baseUri, rawHref);
    }

    return null;
}

static IEnumerable<JsonElement> EnumerateLuccaEmployeeItems(JsonElement root)
{
    if (root.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
    {
        foreach (var item in items.EnumerateArray())
        {
            yield return item;
        }
    }

    if (!root.TryGetProperty("data", out var data))
    {
        yield break;
    }

    if (data.ValueKind == JsonValueKind.Array)
    {
        foreach (var item in data.EnumerateArray())
        {
            yield return item;
        }

        yield break;
    }

    if (data.ValueKind == JsonValueKind.Object &&
        data.TryGetProperty("items", out var dataItems) &&
        dataItems.ValueKind == JsonValueKind.Array)
    {
        foreach (var item in dataItems.EnumerateArray())
        {
            yield return item;
        }
    }
}

static LuccaMappedEmployee? MapLuccaEmployee(JsonElement item)
{
    var luccaId = GetJsonScalarString(item, "id");
    var remoteId = GetJsonScalarString(item, "remoteId");
    var employeeNumber = FirstNonEmpty(
        GetJsonScalarString(item, "employeeNumber"),
        GetJsonScalarString(item, "login"),
        remoteId,
        luccaId);
    var sourceEmployeeId = FirstNonEmpty(remoteId, luccaId, employeeNumber);
    var givenName = FirstNonEmpty(GetJsonScalarString(item, "givenName"), GetJsonScalarString(item, "firstName"));
    var familyName = FirstNonEmpty(GetJsonScalarString(item, "familyName"), GetJsonScalarString(item, "lastName"));
    var fullName = string.Join(' ', new[] { givenName, familyName }.Where(value => !string.IsNullOrWhiteSpace(value)));
    var displayName = FirstNonEmpty(
        fullName,
        GetJsonScalarString(item, "displayName"),
        GetJsonScalarString(item, "name"),
        GetJsonScalarString(item, "mail"),
        GetJsonScalarString(item, "email"),
        employeeNumber);

    if (string.IsNullOrWhiteSpace(sourceEmployeeId) ||
        string.IsNullOrWhiteSpace(employeeNumber) ||
        string.IsNullOrWhiteSpace(displayName))
    {
        return null;
    }

    var status = GetJsonScalarString(item, "status");
    var contractEnd = GetJsonScalarString(item, "dtContractEnd");
    return new LuccaMappedEmployee(
        sourceEmployeeId,
        employeeNumber,
        displayName,
        NormalizeOptionalText(FirstNonEmpty(GetJsonScalarString(item, "email"), GetJsonScalarString(item, "mail"))),
        NormalizeOptionalText(FirstNonEmpty(
            GetJsonScalarString(item, "phoneNumber"),
            GetJsonScalarString(item, "mobilePhone"),
            GetJsonScalarString(item, "directLine"))),
        !string.Equals(status, "deactivated", StringComparison.OrdinalIgnoreCase) && !IsPastDate(contractEnd));
}

static string MaskSecret(string? value)
{
    var clean = NormalizeOptionalText(value);
    if (string.IsNullOrWhiteSpace(clean))
    {
        return string.Empty;
    }

    if (clean.Length <= 4)
    {
        return new string('*', clean.Length);
    }

    return $"{new string('*', Math.Min(12, clean.Length - 4))}{clean[^4..]}";
}

static string NormalizeTechnicalCode(string? value)
{
    var normalized = string.Concat((value ?? string.Empty)
        .Trim()
        .ToUpperInvariant()
        .Select(character => char.IsLetterOrDigit(character) ? character : '_'))
        .Trim('_');

    return string.IsNullOrWhiteSpace(normalized) ? string.Empty : normalized;
}

static string BuildCredentialKey(string providerCode, string keyName)
{
    return $"{NormalizeTechnicalCode(providerCode)}|{NormalizeTechnicalCode(keyName)}";
}

static bool IsHiddenIntegrationProvider(string providerCode)
{
    return string.Equals(providerCode, "LEGACY_NEXUS", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(providerCode, "TRACTOR_TRACKING", StringComparison.OrdinalIgnoreCase);
}

static IReadOnlyList<IntegrationCredentialDefinition> GetKnownCredentialDefinitions()
{
    return
    [
        new("SIRENE", "SIRENE", "SIRENE_CLIENT_ID", "Client ID", false, "SIRENE_CLIENT_ID", "Identifiant INSEE/API SIRENE."),
        new("SIRENE", "SIRENE", "SIRENE_CLIENT_SECRET", "Client secret", true, "SIRENE_CLIENT_SECRET", "Secret INSEE/API SIRENE si utilisé."),
        new("LUCCA", "Lucca", "LUCCA_BASE_URL", "URL de base", false, "LUCCA_BASE_URL", null),
        new("LUCCA", "Lucca", "LUCCA_API_KEY", "Clé API", true, "LUCCA_API_KEY", null),
        new("LUCCA", "Lucca", "LUCCA_USERS_PATH", "Chemin utilisateurs", false, "LUCCA_USERS_PATH", null),
        new("TRUCKONLINE", "TruckOnline", "TRUCKONLINE_BASE_URL", "URL de base", false, "TRUCKONLINE_BASE_URL", null),
        new("TRUCKONLINE", "TruckOnline", "TRUCKONLINE_API_KEY", "Clé API", true, "TRUCKONLINE_API_KEY", null),
        new("TRUCKONLINE", "TruckOnline", "TRUCKONLINE_PRIVATE_KEY", "Clé privée", true, "TRUCKONLINE_PRIVATE_KEY", null),
        new("TRUCKONLINE", "TruckOnline", "TRUCKONLINE_DRIVER_STATUS_PATH_TEMPLATE", "Chemin statut conducteur", false, "TRUCKONLINE_DRIVER_STATUS_PATH_TEMPLATE", null),
        new("TRUCKONLINE", "TruckOnline", "TRUCKONLINE_GPS_WINDOW_BEFORE_MINUTES", "Fenêtre GPS avant", false, "TRUCKONLINE_GPS_WINDOW_BEFORE_MINUTES", null),
        new("TRUCKONLINE", "TruckOnline", "TRUCKONLINE_GPS_WINDOW_AFTER_MINUTES", "Fenêtre GPS après", false, "TRUCKONLINE_GPS_WINDOW_AFTER_MINUTES", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_BASE_URL", "URL de base", false, "YELLOWBOX_BASE_URL", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_API_KEY", "Clé API", true, "YELLOWBOX_API_KEY", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_BASIC_LOGIN", "Login basic", false, "YELLOWBOX_BASIC_LOGIN", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_BASIC_PASSWORD", "Mot de passe basic", true, "YELLOWBOX_BASIC_PASSWORD", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_AUTH_MODE", "Mode authentification", false, "YELLOWBOX_AUTH_MODE", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_AUTHORIZE_URL", "URL autorisation", false, "YELLOWBOX_AUTHORIZE_URL", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_CALLBACK_MODE", "Mode callback", false, "YELLOWBOX_CALLBACK_MODE", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_CLIENT_ID", "Client ID OAuth", false, "YELLOWBOX_CLIENT_ID", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_REDIRECT_URI", "URI de redirection", false, "YELLOWBOX_REDIRECT_URI", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_SCOPE", "Scope OAuth", false, "YELLOWBOX_SCOPE", null),
        new("YELLOWBOX", "YellowBox", "YELLOWBOX_TOKEN_URL", "URL token", false, "YELLOWBOX_TOKEN_URL", null),
        new("GEOAPIFY", "Geoapify", "GEOAPIFY_API_KEY", "Clé API", true, null, null),
        new("GOOGLE_MAPS", "Google Maps", "GOOGLE_GEOCODING_API_KEY", "Clé géocodage", true, null, null),
        new("OPENSTREETMAP", "OpenStreetMap", "OPENSTREETMAP_NOMINATIM_BASE_URL", "URL Nominatim", false, null, "OpenStreetMap/Nominatim ne nécessite pas de clé API.")
    ];
}


static Guid? GetUserId(ClaimsPrincipal principal)
{
    var rawValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    return Guid.TryParse(rawValue, out var userId) ? userId : null;
}

static Guid? GetSessionId(ClaimsPrincipal principal)
{
    var rawValue = principal.FindFirstValue("session_id");
    return Guid.TryParse(rawValue, out var sessionId) ? sessionId : null;
}

static int NormalizeSessionTimeoutMinutes(int value)
{
    return Math.Clamp(value <= 0 ? 60 : value, 5, 1440);
}

static string NormalizeProfileCode(string rawValue)
{
    return string.Concat(
            rawValue.Trim()
                .ToUpperInvariant()
                .Select(character => char.IsLetterOrDigit(character) ? character : '_'))
        .Trim('_');
}

static string GenerateUniqueProfileCode(string label, IReadOnlyCollection<string> existingCodes)
{
    var baseCode = NormalizeProfileCode(label);
    if (string.IsNullOrWhiteSpace(baseCode))
    {
        baseCode = "PROFIL";
    }

    if (!existingCodes.Contains(baseCode, StringComparer.OrdinalIgnoreCase))
    {
        return baseCode;
    }

    var index = 2;
    while (true)
    {
        var candidate = $"{baseCode}_{index}";
        if (!existingCodes.Contains(candidate, StringComparer.OrdinalIgnoreCase))
        {
            return candidate;
        }

        index++;
    }
}

static object BuildAuthenticatedUser(UserAccount account)
{
    var profile = account.SecurityProfile;
    var rights = profile?.ModuleRights
        .OrderBy(right => right.SecurityModule!.NavigationGroup)
        .ThenBy(right => right.SecurityModule!.DisplayOrder)
        .ThenBy(right => right.SecurityModule!.Label)
        .Select(right => new
        {
            ModuleCode = right.SecurityModule!.Code,
            ModuleLabel = right.SecurityModule.Label,
            right.SecurityModule.NavigationGroup,
            AccessLevel = right.AccessLevel.ToString()
        })
        .ToList() ?? [];

    return new
    {
        account.Id,
        account.Login,
        account.DisplayName,
        account.Email,
        account.EmployeeNumber,
        account.MustChangePassword,
        account.SessionTimeoutMinutes,
        account.IsSidebarCollapsed,
        account.LastLoginAtUtc,
        Profile = profile == null
            ? null
            : new
            {
                profile.Id,
                profile.Code,
                profile.Label
            },
        Rights = rights
    };
}

static object BuildNexaSessionInsight(
    UserAccount account,
    IReadOnlyCollection<NexaSessionSignal> sessions,
    IReadOnlyCollection<NexaTraceSignal> traces,
    DateTime now)
{
    var profile = account.SecurityProfile;
    var profileCode = profile?.Code ?? "SANS_PROFIL";
    var readableModules = profile?.ModuleRights
        .Count(right => right.AccessLevel != ModuleAccessLevel.None && !IsNexaDashboardModule(right.SecurityModule?.Code)) ?? 0;
    var writableModules = profile?.ModuleRights
        .Count(right => right.AccessLevel == ModuleAccessLevel.Write && !IsNexaDashboardModule(right.SecurityModule?.Code)) ?? 0;
    var dashboardCount = profile?.ModuleRights
        .Count(right => right.AccessLevel != ModuleAccessLevel.None && IsNexaDashboardModule(right.SecurityModule?.Code)) ?? 0;
    var dominantStream = traces
        .GroupBy(trace => trace.StreamCode)
        .OrderByDescending(group => group.Count())
        .Select(group => group.Key)
        .FirstOrDefault();
    var warningCount = traces.Count(trace =>
        string.Equals(trace.Level, "Warning", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(trace.Level, "Error", StringComparison.OrdinalIgnoreCase));
    var lastCompletedSession = sessions
        .Where(session => session.LogoutAtUtc is not null || session.RevokedAtUtc is not null)
        .OrderByDescending(session => session.LoginAtUtc)
        .FirstOrDefault();
    var averageSessionMinutes = sessions.Count == 0
        ? 0
        : (int)Math.Round(sessions.Average(session =>
            Math.Max(1, ((session.LogoutAtUtc ?? session.RevokedAtUtc ?? session.LastSeenAtUtc) - session.LoginAtUtc).TotalMinutes)));

    var opening = PickNexaPart(GetNexaOpenings(profileCode));
    var focus = PickNexaPart(GetNexaFocuses(profileCode, dominantStream));
    var rhythm = PickNexaPart([
        FormatNexaDayMoment(now),
        lastCompletedSession is null
            ? "pour consolider cette première session suivie"
            : $"depuis votre dernière session du {lastCompletedSession.LoginAtUtc.ToLocalTime():dd/MM/yyyy}",
        $"avec {readableModules} module(s) accessible(s)",
        dashboardCount > 1 ? $"avec {dashboardCount} tableaux de bord consultables" : "avec votre tableau de bord principal"
    ]);
    var ending = PickNexaPart([
        writableModules > 0 ? $"{writableModules} zone(s) modifiable(s) sont prêtes." : "les vues restent ouvertes en consultation.",
        warningCount > 0 ? $"{warningCount} signalement(s) technique(s) récent(s) méritent un contrôle." : "aucun signal critique récent ne domine votre activité.",
        averageSessionMinutes > 0 ? $"votre rythme moyen observé est de {averageSessionMinutes} minute(s) par session." : "Nexa initialise son historique local.",
        "les recommandations resteront explicables et locales au serveur."
    ]);

    return new
    {
        Companion = "Nexa",
        Mode = "local-personalization",
        ProfileCode = profileCode,
        GeneratedAtUtc = now,
        Message = $"{opening} pour {focus}, {rhythm}: {ending}",
        Signals = new[]
        {
            $"{sessions.Count} session(s) récentes analysées",
            $"{traces.Count} trace(s) utilisateur sur 30 jours",
            dominantStream is null ? "aucun flux dominant détecté" : $"flux dominant: {dominantStream}",
            $"{warningCount} alerte(s) ou erreur(s) récente(s)"
        },
        Suggestions = BuildNexaSuggestions(profileCode, dominantStream, warningCount, writableModules)
    };
}

static bool IsNexaDashboardModule(string? moduleCode)
{
    return moduleCode is not null && moduleCode.StartsWith("DASHBOARD_", StringComparison.OrdinalIgnoreCase);
}

static IReadOnlyList<string> GetNexaOpenings(string profileCode)
{
    return profileCode switch
    {
        "INFORMATIQUE" => [
            "Nexa affine votre poste de pilotage technique",
            "Nexa prépare votre supervision du socle",
            "Nexa met en avant les contrôles utiles"
        ],
        "DIRECTION" => [
            "Nexa assemble votre lecture de pilotage",
            "Nexa prépare une synthèse orientée décision",
            "Nexa met en relief les signaux de direction"
        ],
        "EXPLOITATION" => [
            "Nexa organise votre cockpit opérationnel",
            "Nexa recentre les priorités terrain",
            "Nexa prépare les vues exploitation utiles"
        ],
        "ADMINISTRATIF" => [
            "Nexa prépare votre suivi administratif",
            "Nexa priorise les traitements à contrôler",
            "Nexa structure les dossiers à reprendre"
        ],
        _ => [
            "Nexa personnalise votre session",
            "Nexa prépare votre environnement",
            "Nexa initialise votre accompagnement"
        ]
    };
}

static IReadOnlyList<string> GetNexaFocuses(string profileCode, string? dominantStream)
{
    var streamFocus = dominantStream is null ? "vos usages récents" : $"le flux {dominantStream}";

    return profileCode switch
    {
        "INFORMATIQUE" => [
            "droits, interfaces et qualité applicative",
            "readiness, traces et raccords sensibles",
            $"sécurité du socle et {streamFocus}"
        ],
        "DIRECTION" => [
            "arbitrages, tendances et points de vigilance",
            "vision globale et trajectoire",
            $"indicateurs consolidés et {streamFocus}"
        ],
        "EXPLOITATION" => [
            "points, conducteurs, tracteurs et opérations",
            "parc, terrain et actions à suivre",
            $"flux exploitation et {streamFocus}"
        ],
        "ADMINISTRATIF" => [
            "contraventions, rattachements et traitements",
            "dossiers ouverts et contrôles administratifs",
            $"suivi documentaire et {streamFocus}"
        ],
        _ => [
            "vos espaces accessibles",
            "les informations disponibles",
            streamFocus
        ]
    };
}

static string FormatNexaDayMoment(DateTime now)
{
    var localHour = now.ToLocalTime().Hour;
    return localHour < 11 ? "ce matin" : localHour < 18 ? "cet après-midi" : "ce soir";
}

static string PickNexaPart(IReadOnlyList<string> values)
{
    if (values.Count == 0)
    {
        return string.Empty;
    }

    return values[RandomNumberGenerator.GetInt32(values.Count)];
}

static IReadOnlyList<string> BuildNexaSuggestions(string profileCode, string? dominantStream, int warningCount, int writableModules)
{
    var suggestions = new List<string>();
    if (warningCount > 0)
    {
        suggestions.Add("Contrôler les traces récentes avant d'élargir les raccordements.");
    }

    if (writableModules > 0)
    {
        suggestions.Add("Reprendre les zones modifiables les plus fréquentes pour accélérer les prochains parcours.");
    }

    if (!string.IsNullOrWhiteSpace(dominantStream))
    {
        suggestions.Add($"Conserver {dominantStream} comme signal prioritaire de personnalisation.");
    }

    suggestions.Add(profileCode switch
    {
        "INFORMATIQUE" => "Prioriser les droits, la readiness et les interfaces critiques.",
        "DIRECTION" => "Remonter les indicateurs consolidés en premier niveau.",
        "EXPLOITATION" => "Mettre en avant points, conducteurs et tracteurs.",
        "ADMINISTRATIF" => "Surveiller les dossiers ouverts et les échéances.",
        _ => "Stabiliser les droits du profil pour enrichir les recommandations."
    });

    return suggestions;
}

static object BuildUserSessionResponse(UserSession session, DateTime now)
{
    var endAtUtc = session.LogoutAtUtc ?? session.RevokedAtUtc ?? (session.ExpiresAtUtc <= now ? session.ExpiresAtUtc : null);
    var duration = (endAtUtc ?? now) - session.LoginAtUtc;

    return new
    {
        session.Id,
        session.UserAccountId,
        Login = session.UserAccount?.Login,
        DisplayName = session.UserAccount?.DisplayName,
        ProfileLabel = session.UserAccount?.SecurityProfile?.Label,
        session.LoginAtUtc,
        session.LastSeenAtUtc,
        session.ExpiresAtUtc,
        session.LogoutAtUtc,
        session.RevokedAtUtc,
        session.IpAddress,
        session.UserAgent,
        IsActive = session.LogoutAtUtc is null && session.RevokedAtUtc is null && session.ExpiresAtUtc > now,
        DurationMinutes = Math.Max(0, (int)Math.Round(duration.TotalMinutes))
    };
}

static IReadOnlyList<ControlledSqlQueryDefinition> GetControlledSqlQueryCatalog()
{
    return
    [
        new(
            "SECURITY_ACCOUNTS_OVERVIEW",
            "Securite",
            "Synthese des comptes utilisateurs",
            "Comptes actifs, inactifs, profils rattaches et derniere connexion.",
            ["login", "displayName", "profile", "status", "mustChangePassword", "sessionTimeoutMinutes", "lastLoginAtUtc"]),
        new(
            "MODULE_RIGHTS_MATRIX",
            "Droits",
            "Matrice profils et modules",
            "Lecture des droits par profil, module et niveau d'acces.",
            ["profile", "profileStatus", "module", "navigationGroup", "accessLevel"]),
        new(
            "COMMON_DATA_REFERENTIALS",
            "Donnees Communes",
            "Referentiels transverses",
            "Societes, analytiques, exploitations, salaries, tiers et materiels avec etat actif.",
            ["referential", "code", "label", "status", "parent", "lastSyncedAtUtc"]),
        new(
            "INTEGRATION_CREDENTIALS_AUDIT",
            "Outils",
            "Audit des acces externes",
            "Fournisseurs, cles renseignees, secrets masques et activation.",
            ["provider", "keyName", "displayName", "hasValue", "isSecret", "status", "updatedAtUtc"])
    ];
}

static async Task<List<Dictionary<string, object?>>> ExecuteControlledSqlQueryAsync(
    string queryCode,
    NewNexusDbContext dbContext,
    CancellationToken cancellationToken)
{
    return queryCode.ToUpperInvariant() switch
    {
        "SECURITY_ACCOUNTS_OVERVIEW" => await BuildSecurityAccountsOverviewRowsAsync(dbContext, cancellationToken),
        "MODULE_RIGHTS_MATRIX" => await BuildModuleRightsMatrixRowsAsync(dbContext, cancellationToken),
        "COMMON_DATA_REFERENTIALS" => await BuildCommonDataReferentialRowsAsync(dbContext, cancellationToken),
        "INTEGRATION_CREDENTIALS_AUDIT" => await BuildIntegrationCredentialsAuditRowsAsync(dbContext, cancellationToken),
        _ => []
    };
}

static async Task<List<Dictionary<string, object?>>> BuildSecurityAccountsOverviewRowsAsync(
    NewNexusDbContext dbContext,
    CancellationToken cancellationToken)
{
    var accounts = await dbContext.UserAccounts
        .AsNoTracking()
        .Include(account => account.SecurityProfile)
        .OrderBy(account => account.Login)
        .Take(250)
        .ToListAsync(cancellationToken);

    return accounts
        .Select(account => Row(
            ("login", account.Login),
            ("displayName", account.DisplayName),
            ("profile", account.SecurityProfile?.Label ?? "Aucun"),
            ("status", account.IsActive ? "Actif" : "Inactif"),
            ("mustChangePassword", account.MustChangePassword ? "Oui" : "Non"),
            ("sessionTimeoutMinutes", account.SessionTimeoutMinutes),
            ("lastLoginAtUtc", account.LastLoginAtUtc)))
        .ToList();
}

static async Task<List<Dictionary<string, object?>>> BuildModuleRightsMatrixRowsAsync(
    NewNexusDbContext dbContext,
    CancellationToken cancellationToken)
{
    var rights = await dbContext.SecurityProfileModuleRights
        .AsNoTracking()
        .Include(right => right.SecurityProfile)
        .Include(right => right.SecurityModule)
        .OrderBy(right => right.SecurityProfile!.Label)
        .ThenBy(right => right.SecurityModule!.NavigationGroup)
        .ThenBy(right => right.SecurityModule!.DisplayOrder)
        .ToListAsync(cancellationToken);

    return rights
        .Select(right => Row(
            ("profile", right.SecurityProfile?.Label),
            ("profileStatus", right.SecurityProfile?.IsActive == true ? "Actif" : "Inactif"),
            ("module", right.SecurityModule?.Label),
            ("navigationGroup", right.SecurityModule?.NavigationGroup),
            ("accessLevel", right.AccessLevel.ToString())))
        .ToList();
}

static async Task<List<Dictionary<string, object?>>> BuildCommonDataReferentialRowsAsync(
    NewNexusDbContext dbContext,
    CancellationToken cancellationToken)
{
    var rows = new List<Dictionary<string, object?>>();

    rows.AddRange((await dbContext.Companies
            .AsNoTracking()
            .OrderBy(item => item.DisplayName)
            .Take(250)
            .ToListAsync(cancellationToken))
        .Select(item => Row(
            ("referential", "Societes"),
            ("code", item.Siren),
            ("label", item.DisplayName),
            ("status", item.IsActive ? "Actif" : "Inactif"),
            ("parent", item.LegalName),
            ("lastSyncedAtUtc", null))));

    rows.AddRange((await dbContext.Analytics
            .AsNoTracking()
            .Include(item => item.Company)
            .OrderBy(item => item.Code)
            .Take(250)
            .ToListAsync(cancellationToken))
        .Select(item => Row(
            ("referential", "Analytiques"),
            ("code", item.Code),
            ("label", item.Label),
            ("status", item.IsActive ? "Actif" : "Inactif"),
            ("parent", item.Company?.DisplayName),
            ("lastSyncedAtUtc", null))));

    rows.AddRange((await dbContext.Exploitations
            .AsNoTracking()
            .Include(item => item.Company)
            .OrderBy(item => item.Code)
            .Take(250)
            .ToListAsync(cancellationToken))
        .Select(item => Row(
            ("referential", "Exploitations"),
            ("code", item.Code),
            ("label", item.Label),
            ("status", item.IsActive ? "Actif" : "Inactif"),
            ("parent", item.Company?.DisplayName),
            ("lastSyncedAtUtc", null))));

    rows.AddRange((await dbContext.Employees
            .AsNoTracking()
            .OrderBy(item => item.DisplayName)
            .Take(250)
            .ToListAsync(cancellationToken))
        .Select(item => Row(
            ("referential", "Salaries"),
            ("code", item.EmployeeNumber),
            ("label", item.DisplayName),
            ("status", item.IsActive ? "Actif" : "Inactif"),
            ("parent", item.Email),
            ("lastSyncedAtUtc", item.LastSyncedAtUtc))));

    rows.AddRange((await dbContext.ThirdParties
            .AsNoTracking()
            .OrderBy(item => item.DisplayName)
            .Take(250)
            .ToListAsync(cancellationToken))
        .Select(item => Row(
            ("referential", "Tiers"),
            ("code", item.Siren ?? item.ExternalReference ?? item.TypeCode),
            ("label", item.DisplayName),
            ("status", item.IsActive ? "Actif" : "Inactif"),
            ("parent", item.TypeCode),
            ("lastSyncedAtUtc", null))));

    rows.AddRange((await dbContext.Materials
            .AsNoTracking()
            .Include(item => item.Exploitation)
            .OrderBy(item => item.FleetNumber)
            .Take(250)
            .ToListAsync(cancellationToken))
        .Select(item => Row(
            ("referential", "Materiels"),
            ("code", item.FleetNumber),
            ("label", item.Label),
            ("status", item.IsActive ? "Actif" : "Inactif"),
            ("parent", item.Exploitation?.Label),
            ("lastSyncedAtUtc", item.LastSyncedAtUtc))));

    return rows;
}

static async Task<List<Dictionary<string, object?>>> BuildIntegrationCredentialsAuditRowsAsync(
    NewNexusDbContext dbContext,
    CancellationToken cancellationToken)
{
    var credentials = await dbContext.IntegrationCredentials
        .AsNoTracking()
        .OrderBy(item => item.ProviderLabel)
        .ThenBy(item => item.KeyName)
        .Take(250)
        .ToListAsync(cancellationToken);

    return credentials
        .Select(item => Row(
            ("provider", item.ProviderLabel),
            ("keyName", item.KeyName),
            ("displayName", item.DisplayName),
            ("hasValue", string.IsNullOrWhiteSpace(item.ProtectedValue) ? "Non" : "Oui"),
            ("isSecret", item.IsSecret ? "Oui" : "Non"),
            ("status", item.IsActive ? "Actif" : "Inactif"),
            ("updatedAtUtc", item.UpdatedAtUtc)))
        .ToList();
}

static Dictionary<string, object?> Row(params (string Key, object? Value)[] values)
{
    return values.ToDictionary(item => item.Key, item => item.Value);
}

static IReadOnlyList<TraceStreamDefinition> GetTraceStreams()
{
    return
    [
        new("AUTH_EVENTS", "Authentification", "Connexions, deconnexions, echecs et resets de mot de passe.", "90 jours cible"),
        new("ADMIN_ACTIONS", "Actions administrateur", "Actions sensibles realisees depuis les outils d'administration.", "180 jours cible"),
        new("MODULE_EVENTS", "Modules metier", "Creations et modifications realisees dans les modules fonctionnels.", "180 jours cible"),
        new("INTEGRATION_RUNS", "Traitements d'integration", "Imports et traitements raccordes aux logiciels externes.", "180 jours cible"),
        new("SYSTEM_ERRORS", "Erreurs applicatives", "Indisponibilites et erreurs critiques journalisees cote serveur.", "365 jours cible")
    ];
}

static IReadOnlyList<ScheduledTaskDefinition> GetScheduledTaskDefinitions()
{
    return
    [
        new("SIRENE_COMPANY_SYNC", "Synchronisation SIRENE", "Societes", "A planifier", "A raccorder", "Mise a jour periodique des informations societes depuis SIRENE.", false),
        new("LUCCA_EMPLOYEES_IMPORT", "Import salaries Lucca", "Ressources humaines", "Quotidienne cible", "A raccorder", "Import des salaries depuis Lucca apres validation du contrat API cible.", false),
        new("LUCCA_ACCOUNT_PROVISIONING", "Provisioning comptes Lucca", "Ressources humaines", "Apres import salaries", "Disponible", "Creation automatique de comptes actifs sans profil depuis les salaries actifs.", true),
        new("TRUCKONLINE_FLEET_SYNC", "Synchronisation TruckOnline", "Exploitation", "Horaire cible", "Raccord local", "Controle du parc tracteurs rattache a TruckOnline et pret pour import API.", true),
        new("YELLOWBOX_TELEMATICS_SYNC", "Synchronisation YellowBox", "Exploitation", "Horaire cible", "Raccord local", "Controle du parc tracteurs rattache a YellowBox et pret pour import telematique.", true),
        new("GEOCODING_LOADING_POINTS", "Geocodage des points", "Exploitation", "A la demande", "Raccord local", "Controle des points charge/decharge restant sans coordonnees.", true),
        new("MATERIALS_IMPORT", "Import materiels", "Exploitation", "Apres cadrage parc", "A cadrer", "Preparation du referentiel materiels avec numero de parc unique.", false),
        new("AUDIT_LOG_RETENTION", "Purge controlee des traces", "Technique", "Mensuelle cible", "A cadrer", "Politique de conservation des journaux applicatifs et techniques.", false)
    ];
}

static async Task<EmployeeAccountProvisioningResult> ProvisionEmployeeAccountsAsync(
    NewNexusDbContext dbContext,
    CancellationToken cancellationToken)
{
    var employees = await dbContext.Employees
        .AsNoTracking()
        .Where(employee => employee.IsActive)
        .OrderBy(employee => employee.DisplayName)
        .ToListAsync(cancellationToken);

    var existingAccounts = await dbContext.UserAccounts
        .AsNoTracking()
        .Select(account => new
        {
            account.Login,
            account.EmployeeNumber
        })
        .ToListAsync(cancellationToken);

    var existingEmployeeNumbers = existingAccounts
        .Where(account => !string.IsNullOrWhiteSpace(account.EmployeeNumber))
        .Select(account => account.EmployeeNumber!)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);
    var usedLogins = existingAccounts
        .Select(account => account.Login)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    var createdAccounts = new List<EmployeeAccountProvisioningItem>();
    var skippedEmployees = new List<EmployeeAccountProvisioningItem>();
    var now = DateTime.UtcNow;

    foreach (var employee in employees)
    {
        if (existingEmployeeNumbers.Contains(employee.EmployeeNumber))
        {
            skippedEmployees.Add(new EmployeeAccountProvisioningItem(
                employee.Id,
                employee.EmployeeNumber,
                employee.DisplayName,
                null,
                null,
                "Compte deja existant pour ce matricule."));
            continue;
        }

        var login = GenerateUniqueLoginForEmployee(employee, usedLogins);
        var temporaryPassword = GenerateTemporaryPassword();
        var account = new UserAccount
        {
            Id = Guid.NewGuid(),
            Login = login,
            DisplayName = employee.DisplayName,
            Email = NormalizeOptionalText(employee.Email),
            EmployeeNumber = employee.EmployeeNumber,
            PasswordHash = PasswordHasher.HashPassword(temporaryPassword),
            MustChangePassword = true,
            SessionTimeoutMinutes = 60,
            SecurityProfileId = null,
            IsActive = true,
            CreatedAtUtc = now
        };

        usedLogins.Add(login);
        existingEmployeeNumbers.Add(employee.EmployeeNumber);
        dbContext.UserAccounts.Add(account);
        createdAccounts.Add(new EmployeeAccountProvisioningItem(
            employee.Id,
            employee.EmployeeNumber,
            employee.DisplayName,
            login,
            temporaryPassword,
            "Compte cree sans profil."));
    }

    await dbContext.SaveChangesAsync(cancellationToken);

    return new EmployeeAccountProvisioningResult(
        createdAccounts.Count,
        skippedEmployees.Count,
        createdAccounts,
        skippedEmployees);
}

static async Task<object> BuildMaterialIntegrationSnapshotAsync(
    NewNexusDbContext dbContext,
    string providerCode,
    CancellationToken cancellationToken)
{
    var normalizedProviderCode = NormalizeTechnicalCode(providerCode);
    var materials = await dbContext.Materials
        .AsNoTracking()
        .Include(material => material.Exploitation)
        .Where(material => material.MaterialType == "TRACTEUR")
        .OrderBy(material => material.FleetNumber)
        .ToListAsync(cancellationToken);
    var providerMaterials = materials
        .Where(material => string.Equals(material.SourceSystem, normalizedProviderCode, StringComparison.OrdinalIgnoreCase))
        .ToList();

    return new
    {
        ProviderCode = normalizedProviderCode,
        TotalTractors = materials.Count,
        LinkedTractors = providerMaterials.Count,
        ActiveLinkedTractors = providerMaterials.Count(material => material.IsActive),
        MissingProviderLink = materials.Count - providerMaterials.Count,
        MissingExploitation = providerMaterials.Count(material => material.ExploitationId is null),
        LastSyncedAtUtc = providerMaterials
            .Where(material => material.LastSyncedAtUtc is not null)
            .OrderByDescending(material => material.LastSyncedAtUtc)
            .Select(material => material.LastSyncedAtUtc)
            .FirstOrDefault(),
        Materials = providerMaterials.Select(material => new
        {
            material.Id,
            material.FleetNumber,
            material.Label,
            material.RegistrationNumber,
            material.SourceSystem,
            material.IsActive,
            material.LastSyncedAtUtc,
            Exploitation = material.Exploitation is null
                ? null
                : new
                {
                    material.Exploitation.Id,
                    material.Exploitation.Code,
                    material.Exploitation.Label
                }
        })
    };
}

static async Task<object> BuildLoadingPointGeocodingSnapshotAsync(
    NewNexusDbContext dbContext,
    CancellationToken cancellationToken)
{
    var points = await dbContext.LoadingPoints
        .AsNoTracking()
        .OrderBy(point => point.City)
        .ThenBy(point => point.Label)
        .ToListAsync(cancellationToken);

    return new
    {
        TotalPoints = points.Count,
        ActivePoints = points.Count(point => point.IsActive),
        GeocodedPoints = points.Count(point => point.Latitude is not null && point.Longitude is not null),
        MissingCoordinates = points.Count(point => point.IsActive && (point.Latitude is null || point.Longitude is null)),
        PointsToGeocode = points
            .Where(point => point.IsActive && (point.Latitude is null || point.Longitude is null))
            .Select(point => new
            {
                point.Id,
                point.Code,
                point.Label,
                point.AddressLine,
                point.PostalCode,
                point.City,
                point.CountryCode
            })
            .ToList()
    };
}

static async Task<object> BuildDriverIndicatorsAsync(NewNexusDbContext dbContext)
{
    var drivers = await dbContext.Employees
        .AsNoTracking()
        .Where(employee => employee.IsDriver)
        .OrderBy(employee => employee.DisplayName)
        .ToListAsync();
    var accounts = await dbContext.UserAccounts
        .AsNoTracking()
        .Include(account => account.SecurityProfile)
        .Where(account => account.EmployeeNumber != null)
        .ToListAsync();
    var contraventions = await dbContext.Contraventions
        .AsNoTracking()
        .Where(item => item.DriverEmployeeId != null)
        .ToListAsync();
    var accountsByEmployeeNumber = accounts
        .Where(account => !string.IsNullOrWhiteSpace(account.EmployeeNumber))
        .GroupBy(account => account.EmployeeNumber!, StringComparer.OrdinalIgnoreCase)
        .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);
    var contraventionsByDriverId = contraventions
        .GroupBy(item => item.DriverEmployeeId!.Value)
        .ToDictionary(group => group.Key, group => group.ToList());

    var rows = drivers.Select(driver =>
    {
        accountsByEmployeeNumber.TryGetValue(driver.EmployeeNumber, out var account);
        contraventionsByDriverId.TryGetValue(driver.Id, out var driverContraventions);
        driverContraventions ??= [];
        var openContraventions = driverContraventions.Count(item => !IsClosedContraventionStatus(item.StatusCode));

        return new
        {
            driver.Id,
            driver.EmployeeNumber,
            driver.DisplayName,
            driver.Email,
            driver.PhoneNumber,
            driver.IsActive,
            driver.LastSyncedAtUtc,
            AccountLogin = account?.Login,
            AccountProfile = account?.SecurityProfile?.Label,
            AccountIsActive = account?.IsActive,
            OpenContraventions = openContraventions,
            TotalContraventions = driverContraventions.Count,
            DataQuality = BuildDriverDataQuality(driver, account)
        };
    }).ToList();

    return new
    {
        Summary = new
        {
            TotalDrivers = rows.Count,
            ActiveDrivers = rows.Count(row => row.IsActive),
            DriversWithAccounts = rows.Count(row => row.AccountLogin is not null),
            DriversWithoutAccount = rows.Count(row => row.AccountLogin is null),
            DriversWithOpenContraventions = rows.Count(row => row.OpenContraventions > 0),
            IncompleteContactData = rows.Count(row => string.IsNullOrWhiteSpace(row.Email) || string.IsNullOrWhiteSpace(row.PhoneNumber))
        },
        Drivers = rows
    };
}

static async Task<object> BuildTractorIndicatorsAsync(NewNexusDbContext dbContext)
{
    var tractors = await dbContext.Materials
        .AsNoTracking()
        .Include(material => material.Exploitation)
        .Where(material => material.MaterialType == "TRACTEUR")
        .OrderBy(material => material.FleetNumber)
        .ToListAsync();
    var contraventions = await dbContext.Contraventions
        .AsNoTracking()
        .Where(item => item.MaterialId != null)
        .ToListAsync();
    var contraventionsByMaterialId = contraventions
        .GroupBy(item => item.MaterialId!.Value)
        .ToDictionary(group => group.Key, group => group.ToList());

    var rows = tractors.Select(tractor =>
    {
        contraventionsByMaterialId.TryGetValue(tractor.Id, out var tractorContraventions);
        tractorContraventions ??= [];

        return new
        {
            tractor.Id,
            tractor.FleetNumber,
            tractor.Label,
            tractor.RegistrationNumber,
            tractor.SourceSystem,
            tractor.IsActive,
            tractor.LastSyncedAtUtc,
            Exploitation = tractor.Exploitation is null
                ? null
                : new
                {
                    tractor.Exploitation.Id,
                    tractor.Exploitation.Code,
                    tractor.Exploitation.Label
                },
            OpenContraventions = tractorContraventions.Count(item => !IsClosedContraventionStatus(item.StatusCode)),
            TotalContraventions = tractorContraventions.Count,
            DataQuality = BuildTractorDataQuality(tractor)
        };
    }).ToList();

    return new
    {
        Summary = new
        {
            TotalTractors = rows.Count,
            ActiveTractors = rows.Count(row => row.IsActive),
            TruckOnlineLinked = rows.Count(row => string.Equals(row.SourceSystem, "TRUCKONLINE", StringComparison.OrdinalIgnoreCase)),
            YellowBoxLinked = rows.Count(row => string.Equals(row.SourceSystem, "YELLOWBOX", StringComparison.OrdinalIgnoreCase)),
            WithExploitation = rows.Count(row => row.Exploitation is not null),
            WithOpenContraventions = rows.Count(row => row.OpenContraventions > 0)
        },
        Tractors = rows
    };
}

static bool IsClosedContraventionStatus(string statusCode)
{
    var normalizedStatus = NormalizeContraventionStatus(statusCode);
    return normalizedStatus is "PAYEE" or "CLASSEE";
}

static string BuildDriverDataQuality(Employee driver, UserAccount? account)
{
    var missing = new List<string>();
    if (string.IsNullOrWhiteSpace(driver.Email))
    {
        missing.Add("email");
    }
    if (string.IsNullOrWhiteSpace(driver.PhoneNumber))
    {
        missing.Add("telephone");
    }
    if (account is null)
    {
        missing.Add("compte");
    }

    return missing.Count == 0 ? "Complet" : $"A completer: {string.Join(", ", missing)}";
}

static string BuildTractorDataQuality(Material tractor)
{
    var missing = new List<string>();
    if (string.IsNullOrWhiteSpace(tractor.RegistrationNumber))
    {
        missing.Add("immatriculation");
    }
    if (string.IsNullOrWhiteSpace(tractor.SourceSystem))
    {
        missing.Add("source");
    }
    if (tractor.ExploitationId is null)
    {
        missing.Add("exploitation");
    }

    return missing.Count == 0 ? "Complet" : $"A completer: {string.Join(", ", missing)}";
}

static async Task AddApplicationTraceAsync(
    NewNexusDbContext dbContext,
    HttpContext httpContext,
    ClaimsPrincipal? principal,
    string streamCode,
    string eventCode,
    string level,
    string message,
    string? detail = null,
    string? subject = null,
    bool saveImmediately = false,
    Guid? actorUserAccountId = null,
    string? actorLogin = null)
{
    var normalizedStreamCode = NormalizeTechnicalCode(streamCode);
    var stream = GetTraceStreams().SingleOrDefault(item => item.Code == normalizedStreamCode);
    var userId = actorUserAccountId ?? (principal is null ? null : GetUserId(principal));
    var login = actorLogin ?? principal?.FindFirstValue("login");

    dbContext.ApplicationTraces.Add(new ApplicationTrace
    {
        Id = Guid.NewGuid(),
        StreamCode = normalizedStreamCode,
        StreamLabel = stream?.Label ?? normalizedStreamCode,
        EventCode = NormalizeTechnicalCode(eventCode),
        Level = FirstNonEmpty(level, "Info")!,
        Message = message.Trim(),
        Detail = NormalizeTraceText(detail, 2000),
        Subject = NormalizeTraceText(subject, 240),
        ActorUserAccountId = userId,
        ActorLogin = NormalizeTraceText(login, 160),
        IpAddress = NormalizeTraceText(httpContext.Connection.RemoteIpAddress?.ToString(), 80),
        CreatedAtUtc = DateTime.UtcNow
    });

    if (saveImmediately)
    {
        await dbContext.SaveChangesAsync(httpContext.RequestAborted);
    }
}

static string? NormalizeTraceText(string? value, int maxLength)
{
    var normalized = NormalizeOptionalText(value);
    if (normalized is null)
    {
        return null;
    }

    return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
}

static string MaskTraceSubject(string value)
{
    var normalized = value.Trim();
    if (normalized.Length <= 2)
    {
        return "**";
    }

    return $"{normalized[0]}***{normalized[^1]}";
}

static object BuildProfileResponse(SecurityProfile profile)
{
    return new
    {
        profile.Id,
        profile.Code,
        profile.Label,
        profile.IsSystemProfile,
        profile.IsActive,
        ModuleRights = profile.ModuleRights
            .OrderBy(right => right.SecurityModule!.NavigationGroup)
            .ThenBy(right => right.SecurityModule!.DisplayOrder)
            .ThenBy(right => right.SecurityModule!.Label)
            .Select(right => new
            {
                right.SecurityModuleId,
                ModuleCode = right.SecurityModule!.Code,
                ModuleLabel = right.SecurityModule.Label,
                right.SecurityModule.NavigationGroup,
                AccessLevel = right.AccessLevel.ToString()
            })
            .ToList()
    };
}

static object BuildContraventionResponse(Contravention contravention)
{
    return new
    {
        contravention.Id,
        contravention.NoticeNumber,
        contravention.OffenseDate,
        contravention.DueDate,
        contravention.Amount,
        contravention.StatusCode,
        StatusLabel = FormatContraventionStatus(contravention.StatusCode),
        contravention.OffenseLabel,
        contravention.Location,
        contravention.Notes,
        contravention.CreatedAtUtc,
        contravention.UpdatedAtUtc,
        DriverEmployee = contravention.DriverEmployee is null
            ? null
            : new
            {
                contravention.DriverEmployee.Id,
                contravention.DriverEmployee.EmployeeNumber,
                contravention.DriverEmployee.DisplayName
            },
        Material = contravention.Material is null
            ? null
            : new
            {
                contravention.Material.Id,
                contravention.Material.FleetNumber,
                contravention.Material.Label,
                contravention.Material.RegistrationNumber
            }
    };
}

static object BuildLoadingPointResponse(LoadingPoint loadingPoint)
{
    return new
    {
        loadingPoint.Id,
        loadingPoint.Code,
        loadingPoint.Label,
        loadingPoint.PointTypeCode,
        PointTypeLabel = FormatLoadingPointType(loadingPoint.PointTypeCode),
        loadingPoint.AddressLine,
        loadingPoint.PostalCode,
        loadingPoint.City,
        loadingPoint.CountryCode,
        loadingPoint.Latitude,
        loadingPoint.Longitude,
        loadingPoint.IsActive,
        loadingPoint.Notes,
        loadingPoint.CreatedAtUtc,
        loadingPoint.UpdatedAtUtc,
        ThirdParty = loadingPoint.ThirdParty is null
            ? null
            : new
            {
                loadingPoint.ThirdParty.Id,
                loadingPoint.ThirdParty.TypeCode,
                loadingPoint.ThirdParty.DisplayName
            },
        Exploitation = loadingPoint.Exploitation is null
            ? null
            : new
            {
                loadingPoint.Exploitation.Id,
                loadingPoint.Exploitation.Code,
                loadingPoint.Exploitation.Label
            }
    };
}

static object BuildLoadingPointMapResponse(IReadOnlyCollection<LoadingPoint> points)
{
    var geocodedPoints = points
        .Where(point => point.Latitude is not null && point.Longitude is not null)
        .ToList();
    var centerLatitude = geocodedPoints.Count == 0 ? 46.603354m : geocodedPoints.Average(point => point.Latitude!.Value);
    var centerLongitude = geocodedPoints.Count == 0 ? 1.888334m : geocodedPoints.Average(point => point.Longitude!.Value);

    return new
    {
        Provider = "OpenStreetMap",
        TileUrlTemplate = "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        Attribution = "© OpenStreetMap contributors",
        Center = new
        {
            Latitude = Math.Round(centerLatitude, 6),
            Longitude = Math.Round(centerLongitude, 6)
        },
        Bounds = geocodedPoints.Count == 0
            ? null
            : new
            {
                MinLatitude = geocodedPoints.Min(point => point.Latitude),
                MaxLatitude = geocodedPoints.Max(point => point.Latitude),
                MinLongitude = geocodedPoints.Min(point => point.Longitude),
                MaxLongitude = geocodedPoints.Max(point => point.Longitude)
            },
        Points = points.Select(BuildLoadingPointResponse)
    };
}

static async Task<GeocodingResult> GeocodeLoadingPointAsync(
    LoadingPoint loadingPoint,
    NewNexusDbContext dbContext,
    IDataProtectionProvider dataProtectionProvider,
    IHttpClientFactory httpClientFactory,
    CancellationToken cancellationToken)
{
    var address = string.Join(", ", new[]
    {
        loadingPoint.AddressLine,
        loadingPoint.PostalCode,
        loadingPoint.City,
        loadingPoint.CountryCode
    }.Where(value => !string.IsNullOrWhiteSpace(value)));

    if (string.IsNullOrWhiteSpace(address))
    {
        return GeocodingResult.Failed("Adresse vide.");
    }

    var geoapifyKey = await GetActiveCredentialValueAsync(dbContext, dataProtectionProvider, "GEOAPIFY", "GEOAPIFY_API_KEY", cancellationToken);
    if (!string.IsNullOrWhiteSpace(geoapifyKey))
    {
        var geoapify = await TryGeocodeGeoapifyAsync(httpClientFactory, address, geoapifyKey, cancellationToken);
        if (geoapify.IsSuccess)
        {
            return geoapify;
        }
    }

    var googleKey = await GetActiveCredentialValueAsync(dbContext, dataProtectionProvider, "GOOGLE_MAPS", "GOOGLE_GEOCODING_API_KEY", cancellationToken);
    if (!string.IsNullOrWhiteSpace(googleKey))
    {
        var google = await TryGeocodeGoogleAsync(httpClientFactory, address, googleKey, cancellationToken);
        if (google.IsSuccess)
        {
            return google;
        }
    }

    var nominatimBaseUrl = await GetActiveCredentialValueAsync(
            dbContext,
            dataProtectionProvider,
            "OPENSTREETMAP",
            "OPENSTREETMAP_NOMINATIM_BASE_URL",
            cancellationToken) ??
        "https://nominatim.openstreetmap.org";
    var nominatim = await TryGeocodeNominatimAsync(httpClientFactory, address, nominatimBaseUrl, cancellationToken);
    return nominatim.IsSuccess
        ? nominatim
        : GeocodingResult.Failed("Aucun fournisseur de geocodage n'a retourne de coordonnees.");
}

static async Task<GeocodingResult> TryGeocodeGeoapifyAsync(
    IHttpClientFactory httpClientFactory,
    string address,
    string apiKey,
    CancellationToken cancellationToken)
{
    try
    {
        var client = httpClientFactory.CreateClient("Integrations");
        using var response = await client.GetAsync(
            $"https://api.geoapify.com/v1/geocode/search?limit=1&text={Uri.EscapeDataString(address)}&apiKey={Uri.EscapeDataString(apiKey)}",
            cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return GeocodingResult.Failed($"Geoapify retourne {(int)response.StatusCode} {response.ReasonPhrase}.");
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var feature = document.RootElement.GetProperty("features").EnumerateArray().FirstOrDefault();
        if (feature.ValueKind == JsonValueKind.Undefined ||
            !feature.TryGetProperty("properties", out var properties) ||
            !TryGetJsonDecimal(properties, "lat", out var latitude) ||
            !TryGetJsonDecimal(properties, "lon", out var longitude))
        {
            return GeocodingResult.Failed("Geoapify ne retourne aucune coordonnee.");
        }

        return GeocodingResult.Success("Geoapify", latitude, longitude);
    }
    catch (Exception exception)
    {
        return GeocodingResult.Failed($"Geoapify indisponible: {exception.Message}");
    }
}

static async Task<GeocodingResult> TryGeocodeGoogleAsync(
    IHttpClientFactory httpClientFactory,
    string address,
    string apiKey,
    CancellationToken cancellationToken)
{
    try
    {
        var client = httpClientFactory.CreateClient("Integrations");
        using var response = await client.GetAsync(
            $"https://maps.googleapis.com/maps/api/geocode/json?address={Uri.EscapeDataString(address)}&key={Uri.EscapeDataString(apiKey)}",
            cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return GeocodingResult.Failed($"Google Geocoding retourne {(int)response.StatusCode} {response.ReasonPhrase}.");
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var result = document.RootElement.GetProperty("results").EnumerateArray().FirstOrDefault();
        if (result.ValueKind == JsonValueKind.Undefined ||
            !result.TryGetProperty("geometry", out var geometry) ||
            !geometry.TryGetProperty("location", out var location) ||
            !TryGetJsonDecimal(location, "lat", out var latitude) ||
            !TryGetJsonDecimal(location, "lng", out var longitude))
        {
            return GeocodingResult.Failed("Google Geocoding ne retourne aucune coordonnee.");
        }

        return GeocodingResult.Success("Google Maps", latitude, longitude);
    }
    catch (Exception exception)
    {
        return GeocodingResult.Failed($"Google Geocoding indisponible: {exception.Message}");
    }
}

static async Task<GeocodingResult> TryGeocodeNominatimAsync(
    IHttpClientFactory httpClientFactory,
    string address,
    string baseUrl,
    CancellationToken cancellationToken)
{
    try
    {
        var client = httpClientFactory.CreateClient("Integrations");
        var trimmedBaseUrl = baseUrl.TrimEnd('/');
        using var response = await client.GetAsync(
            $"{trimmedBaseUrl}/search?format=json&limit=1&q={Uri.EscapeDataString(address)}",
            cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return GeocodingResult.Failed($"Nominatim retourne {(int)response.StatusCode} {response.ReasonPhrase}.");
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var item = document.RootElement.EnumerateArray().FirstOrDefault();
        if (item.ValueKind == JsonValueKind.Undefined ||
            !TryGetJsonDecimal(item, "lat", out var latitude) ||
            !TryGetJsonDecimal(item, "lon", out var longitude))
        {
            return GeocodingResult.Failed("Nominatim ne retourne aucune coordonnee.");
        }

        return GeocodingResult.Success("OpenStreetMap / Nominatim", latitude, longitude);
    }
    catch (Exception exception)
    {
        return GeocodingResult.Failed($"Nominatim indisponible: {exception.Message}");
    }
}

static bool TryGetJsonDecimal(JsonElement element, string propertyName, out decimal value)
{
    value = 0;
    if (!element.TryGetProperty(propertyName, out var property))
    {
        return false;
    }

    return property.ValueKind switch
    {
        JsonValueKind.Number => property.TryGetDecimal(out value),
        JsonValueKind.String => decimal.TryParse(property.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out value),
        _ => false
    };
}

static async Task<object> BuildIntegrationReadinessAsync(
    NewNexusDbContext dbContext,
    IDataProtectionProvider dataProtectionProvider)
{
    var credentials = await dbContext.IntegrationCredentials
        .AsNoTracking()
        .ToListAsync();
    var materials = await dbContext.Materials
        .AsNoTracking()
        .ToListAsync();
    var loadingPoints = await dbContext.LoadingPoints
        .AsNoTracking()
        .ToListAsync();

    bool HasActiveValue(string providerCode, string keyName)
    {
        var credential = credentials.SingleOrDefault(item =>
            string.Equals(item.ProviderCode, providerCode, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(item.KeyName, keyName, StringComparison.OrdinalIgnoreCase) &&
            item.IsActive);

        return !string.IsNullOrWhiteSpace(credential?.ProtectedValue) &&
            !string.IsNullOrWhiteSpace(UnprotectCredentialValue(credential.ProtectedValue, dataProtectionProvider));
    }

    object Provider(string code, string label, string status, string detail, string nextStep, object metrics)
    {
        return new
        {
            Code = code,
            Label = label,
            Status = status,
            Detail = detail,
            NextStep = nextStep,
            Metrics = metrics
        };
    }

    var truckOnlineReady = HasActiveValue("TRUCKONLINE", "TRUCKONLINE_BASE_URL") && HasActiveValue("TRUCKONLINE", "TRUCKONLINE_API_KEY");
    var yellowBoxReady = HasActiveValue("YELLOWBOX", "YELLOWBOX_BASE_URL") &&
        (HasActiveValue("YELLOWBOX", "YELLOWBOX_API_KEY") ||
            (HasActiveValue("YELLOWBOX", "YELLOWBOX_BASIC_LOGIN") && HasActiveValue("YELLOWBOX", "YELLOWBOX_BASIC_PASSWORD")));
    var geocodingReady = HasActiveValue("GEOAPIFY", "GEOAPIFY_API_KEY") ||
        HasActiveValue("GOOGLE_MAPS", "GOOGLE_GEOCODING_API_KEY") ||
        HasActiveValue("OPENSTREETMAP", "OPENSTREETMAP_NOMINATIM_BASE_URL");

    return new[]
    {
        Provider(
            "TRUCKONLINE",
            "TruckOnline",
            truckOnlineReady ? "PRET" : "CLE_A_COMPLETER",
            "Import materiels et controle parc raccordes cote NewNexus; appel API externe a valider avec le contrat TruckOnline.",
            "Renseigner URL + cle API puis executer la tache TruckOnline.",
            new
            {
                Tractors = materials.Count(item => item.MaterialType == "TRACTEUR"),
                Linked = materials.Count(item => string.Equals(item.SourceSystem, "TRUCKONLINE", StringComparison.OrdinalIgnoreCase))
            }),
        Provider(
            "YELLOWBOX",
            "YellowBox",
            yellowBoxReady ? "PRET" : "CLE_A_COMPLETER",
            "Import materiels et controle telematique raccordes cote NewNexus; appel API externe a valider avec le contrat YellowBox.",
            "Renseigner URL + mode d'authentification puis executer la tache YellowBox.",
            new
            {
                Tractors = materials.Count(item => item.MaterialType == "TRACTEUR"),
                Linked = materials.Count(item => string.Equals(item.SourceSystem, "YELLOWBOX", StringComparison.OrdinalIgnoreCase))
            }),
        Provider(
            "GEOCODING",
            "Geocodage",
            geocodingReady ? "PRET" : "NOMINATIM_FALLBACK",
            "Geocodage des points raccorde avec priorite Geoapify, puis Google Maps, puis Nominatim.",
            "Geocoder les points sans coordonnees depuis le module carte.",
            new
            {
                Points = loadingPoints.Count,
                MissingCoordinates = loadingPoints.Count(item => item.IsActive && (item.Latitude is null || item.Longitude is null))
            }),
        Provider(
            "OPENSTREETMAP",
            "Cartographie",
            "PRET",
            "Flux cartographique expose via OpenStreetMap avec centre, bornes et points actifs.",
            "Recetter la carte sur les points geocodes.",
            new
            {
                Points = loadingPoints.Count(item => item.IsActive),
                Geocoded = loadingPoints.Count(item => item.IsActive && item.Latitude is not null && item.Longitude is not null)
            })
    };
}

static async Task<MaterialImportResult> ImportMaterialsFromProviderAsync(
    NewNexusDbContext dbContext,
    string providerCode,
    IReadOnlyCollection<ImportMaterialItemRequest> requestedMaterials,
    CancellationToken cancellationToken)
{
    var normalizedProviderCode = NormalizeTechnicalCode(providerCode);
    var existingMaterials = await dbContext.Materials
        .ToDictionaryAsync(material => material.FleetNumber, StringComparer.OrdinalIgnoreCase, cancellationToken);
    var created = 0;
    var updated = 0;
    var skipped = 0;
    var now = DateTime.UtcNow;
    var importedRows = new List<object>();

    foreach (var requestedMaterial in requestedMaterials)
    {
        var fleetNumber = NormalizeOptionalText(requestedMaterial.FleetNumber)?.ToUpperInvariant();
        var label = NormalizeOptionalText(requestedMaterial.Label);
        if (string.IsNullOrWhiteSpace(fleetNumber) || string.IsNullOrWhiteSpace(label))
        {
            skipped++;
            continue;
        }

        if (!existingMaterials.TryGetValue(fleetNumber, out var material))
        {
            material = new Material
            {
                Id = Guid.NewGuid(),
                FleetNumber = fleetNumber,
                CreatedAtUtc = now
            };
            dbContext.Materials.Add(material);
            existingMaterials[fleetNumber] = material;
            created++;
        }
        else
        {
            updated++;
        }

        material.Label = label;
        material.MaterialType = NormalizeOptionalText(requestedMaterial.MaterialType)?.ToUpperInvariant() ?? "TRACTEUR";
        material.RegistrationNumber = NormalizeOptionalText(requestedMaterial.RegistrationNumber);
        material.SourceSystem = normalizedProviderCode;
        material.IsActive = requestedMaterial.IsActive;
        material.LastSyncedAtUtc = now;
        importedRows.Add(new
        {
            material.Id,
            material.FleetNumber,
            material.Label,
            material.MaterialType,
            material.SourceSystem
        });
    }

    await dbContext.SaveChangesAsync(cancellationToken);

    return new MaterialImportResult(normalizedProviderCode, created, updated, skipped, importedRows);
}

static ProfileRightsBuildResult TryBuildDesiredRights(
    IReadOnlyCollection<ProfileModuleRightRequest> requestedRights,
    IReadOnlyCollection<SecurityModule> modules)
{
    var errors = new Dictionary<string, string[]>();
    var moduleIds = modules.Select(module => module.Id).ToHashSet();
    var rightsByModuleId = modules.ToDictionary(module => module.Id, _ => ModuleAccessLevel.None);

    foreach (var right in requestedRights)
    {
        if (!moduleIds.Contains(right.SecurityModuleId))
        {
            errors["moduleRights"] = ["Un droit cible un module inconnu."];
            continue;
        }

        if (!Enum.TryParse<ModuleAccessLevel>(right.AccessLevel, true, out var accessLevel))
        {
            errors["moduleRights"] = ["Le niveau de droit doit être None, Read ou Write."];
            continue;
        }

        rightsByModuleId[right.SecurityModuleId] = accessLevel;
    }

    return errors.Count > 0
        ? new ProfileRightsBuildResult(false, errors, rightsByModuleId)
        : new ProfileRightsBuildResult(true, new Dictionary<string, string[]>(), rightsByModuleId);
}

static string? NormalizeOptionalText(string? value)
{
    return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

static async Task<bool> HasModuleAccessAsync(
    NewNexusDbContext dbContext,
    ClaimsPrincipal principal,
    string moduleCode,
    ModuleAccessLevel requiredAccess)
{
    var userId = GetUserId(principal);
    if (userId is null)
    {
        return false;
    }

    var accessLevel = await dbContext.UserAccounts
        .AsNoTracking()
        .Where(account => account.Id == userId.Value && account.IsActive && account.SecurityProfileId != null)
        .SelectMany(account => account.SecurityProfile!.ModuleRights)
        .Where(right => right.SecurityModule!.Code == moduleCode && right.SecurityModule.IsActive)
        .Select(right => (ModuleAccessLevel?)right.AccessLevel)
        .SingleOrDefaultAsync();

    return requiredAccess switch
    {
        ModuleAccessLevel.Read => accessLevel is ModuleAccessLevel.Read or ModuleAccessLevel.Write,
        ModuleAccessLevel.Write => accessLevel is ModuleAccessLevel.Write,
        _ => accessLevel is not null
    };
}

static Func<EndpointFilterInvocationContext, EndpointFilterDelegate, ValueTask<object?>> RequireModuleAccessFilter(
    string moduleCode,
    ModuleAccessLevel requiredAccess)
{
    return async (context, next) =>
    {
        var dbContext = context.HttpContext.RequestServices.GetRequiredService<NewNexusDbContext>();
        if (!await HasModuleAccessAsync(dbContext, context.HttpContext.User, moduleCode, requiredAccess))
        {
            return Results.Forbid();
        }

        return await next(context);
    };
}

static async Task<Dictionary<string, string[]>> ValidateCreateUserAccountRequestAsync(
    CreateUserAccountRequest request,
    NewNexusDbContext dbContext)
{
    var errors = await ValidateUserAccountCoreAsync(
        request.Login,
        request.DisplayName,
        request.Email,
        request.SessionTimeoutMinutes,
        request.SecurityProfileId,
        dbContext);

    if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 10)
    {
        errors["password"] = ["Le mot de passe initial doit contenir au moins 10 caracteres."];
    }

    return errors;
}

static async Task<Dictionary<string, string[]>> ValidateUpdateUserAccountRequestAsync(
    UpdateUserAccountRequest request,
    NewNexusDbContext dbContext,
    Guid currentAccountId)
{
    var errors = await ValidateUserAccountCoreAsync(
        request.Login,
        request.DisplayName,
        request.Email,
        request.SessionTimeoutMinutes,
        request.SecurityProfileId,
        dbContext,
        currentAccountId);

    if (!string.IsNullOrWhiteSpace(request.NewPassword) && request.NewPassword.Length < 10)
    {
        errors["newPassword"] = ["Le nouveau mot de passe doit contenir au moins 10 caracteres."];
    }

    return errors;
}

static Dictionary<string, string[]> ValidateChangePasswordRequest(ChangePasswordRequest request, string passwordHash)
{
    var errors = new Dictionary<string, string[]>();

    if (string.IsNullOrWhiteSpace(request.CurrentPassword))
    {
        errors["currentPassword"] = ["Le mot de passe actuel est obligatoire."];
    }
    else if (!PasswordHasher.VerifyPassword(request.CurrentPassword, passwordHash))
    {
        errors["currentPassword"] = ["Le mot de passe actuel est incorrect."];
    }

    if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 10)
    {
        errors["newPassword"] = ["Le nouveau mot de passe doit contenir au moins 10 caracteres."];
    }
    else if (request.NewPassword == request.CurrentPassword)
    {
        errors["newPassword"] = ["Le nouveau mot de passe doit etre different du mot de passe actuel."];
    }

    if (request.ConfirmPassword != request.NewPassword)
    {
        errors["confirmPassword"] = ["La confirmation ne correspond pas au nouveau mot de passe."];
    }

    return errors;
}

static Dictionary<string, string[]> ValidateResetPasswordRequest(ResetPasswordRequest request)
{
    var errors = new Dictionary<string, string[]>();

    if (string.IsNullOrWhiteSpace(request.Token))
    {
        errors["token"] = ["Le jeton de réinitialisation est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 10)
    {
        errors["newPassword"] = ["Le nouveau mot de passe doit contenir au moins 10 caracteres."];
    }

    if (request.ConfirmPassword != request.NewPassword)
    {
        errors["confirmPassword"] = ["La confirmation ne correspond pas au nouveau mot de passe."];
    }

    return errors;
}

static string GeneratePasswordResetToken()
{
    return Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
}

static string GenerateTemporaryPassword()
{
    const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%";
    var bytes = RandomNumberGenerator.GetBytes(18);
    var password = new StringBuilder("Nx-");

    foreach (var item in bytes)
    {
        password.Append(alphabet[item % alphabet.Length]);
    }

    return password.ToString();
}

static string GenerateUniqueLoginForEmployee(Employee employee, ISet<string> usedLogins)
{
    var preferredLogin = FirstNonEmpty(
        employee.Email?.Split('@', 2, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).FirstOrDefault(),
        employee.EmployeeNumber,
        employee.SourceEmployeeId,
        employee.DisplayName);
    var baseLogin = NormalizeLoginCandidate(preferredLogin ?? "salarie");
    var candidate = baseLogin;
    var index = 2;

    while (usedLogins.Contains(candidate))
    {
        candidate = $"{baseLogin}{index}";
        index++;
    }

    return candidate;
}

static string NormalizeLoginCandidate(string value)
{
    var builder = new StringBuilder();
    foreach (var character in value.Trim().ToLowerInvariant())
    {
        if (char.IsLetterOrDigit(character) || character is '.' or '_' or '-')
        {
            builder.Append(character);
        }
    }

    return builder.Length == 0 ? "salarie" : builder.ToString();
}

static string HashPasswordResetToken(string token)
{
    return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token.Trim())));
}

static string? GetJsonString(JsonElement element, string propertyName)
{
    return element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
        ? value.GetString()
        : null;
}

static string? GetJsonScalarString(JsonElement element, string propertyName)
{
    if (!element.TryGetProperty(propertyName, out var value))
    {
        return null;
    }

    return value.ValueKind switch
    {
        JsonValueKind.String => NormalizeOptionalText(value.GetString()),
        JsonValueKind.Number => value.GetRawText(),
        JsonValueKind.True => "true",
        JsonValueKind.False => "false",
        _ => null
    };
}

static bool IsPastDate(string? value)
{
    return DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed) &&
           parsed.Date < DateTime.UtcNow.Date;
}

static bool IsDatabaseUnavailableException(Exception exception)
{
    IEnumerable<Exception> exceptions = exception is AggregateException aggregateException
        ? aggregateException.Flatten().InnerExceptions
        : new[] { exception };

    foreach (var item in exceptions)
    {
        if (IsDatabaseUnavailableExceptionCore(item))
        {
            return true;
        }

        if (item.InnerException is not null && IsDatabaseUnavailableException(item.InnerException))
        {
            return true;
        }
    }

    return false;
}

static bool IsDatabaseUnavailableExceptionCore(Exception exception)
{
    var typeName = exception.GetType().FullName ?? string.Empty;

    return typeName == "Npgsql.NpgsqlException" ||
        exception is InvalidOperationException &&
        exception.Message.Contains("transient failure", StringComparison.OrdinalIgnoreCase);
}

static string? FirstNonEmpty(params string?[] values)
{
    return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();
}

static async Task<Dictionary<string, string[]>> ValidateUserAccountCoreAsync(
    string login,
    string displayName,
    string? email,
    int sessionTimeoutMinutes,
    Guid? securityProfileId,
    NewNexusDbContext dbContext,
    Guid? currentAccountId = null)
{
    var errors = new Dictionary<string, string[]>();
    var normalizedLogin = login.Trim();
    var normalizedDisplayName = displayName.Trim();
    var normalizedEmail = NormalizeOptionalText(email);

    if (string.IsNullOrWhiteSpace(normalizedLogin))
    {
        errors["login"] = ["Le login est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(normalizedDisplayName))
    {
        errors["displayName"] = ["Le nom affiche est obligatoire."];
    }

    if (!string.IsNullOrWhiteSpace(normalizedEmail) && !normalizedEmail.Contains('@'))
    {
        errors["email"] = ["L'adresse email est invalide."];
    }

    if (sessionTimeoutMinutes < 5 || sessionTimeoutMinutes > 1440)
    {
        errors["sessionTimeoutMinutes"] = ["Le delai de deconnexion doit etre compris entre 5 et 1440 minutes."];
    }

    var loginExists = await dbContext.UserAccounts.AnyAsync(account =>
        account.Login == normalizedLogin &&
        account.Id != currentAccountId);
    if (loginExists)
    {
        errors["login"] = ["Ce login existe deja."];
    }

    if (securityProfileId is not null)
    {
        var profileExists = await dbContext.SecurityProfiles.AnyAsync(profile =>
            profile.Id == securityProfileId.Value &&
            profile.IsActive);
        if (!profileExists)
        {
            errors["securityProfileId"] = ["Le profil selectionne est introuvable ou inactif."];
        }
    }

    return errors;
}

static async Task<Dictionary<string, string[]>> ValidateCompanyRequestAsync(
    UpsertCompanyRequest request,
    NewNexusDbContext dbContext,
    Guid? currentCompanyId = null)
{
    var errors = new Dictionary<string, string[]>();
    var siren = request.Siren.Trim();
    var displayName = request.DisplayName.Trim();
    var legalName = request.LegalName.Trim();

    if (siren.Length != 9 || siren.Any(character => !char.IsDigit(character)))
    {
        errors["siren"] = ["Le SIREN doit contenir exactement 9 chiffres."];
    }

    if (string.IsNullOrWhiteSpace(displayName))
    {
        errors["displayName"] = ["Le nom d'affichage est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(legalName))
    {
        errors["legalName"] = ["La raison sociale est obligatoire."];
    }

    var sirenExists = await dbContext.Companies.AnyAsync(item =>
        item.Siren == siren &&
        item.Id != currentCompanyId);
    if (sirenExists)
    {
        errors["siren"] = ["Ce SIREN existe deja."];
    }

    return errors;
}

static async Task<Dictionary<string, string[]>> ValidateAnalyticRequestAsync(
    UpsertAnalyticRequest request,
    NewNexusDbContext dbContext,
    Guid? currentAnalyticId = null)
{
    var errors = new Dictionary<string, string[]>();
    var code = request.Code.Trim().ToUpperInvariant();
    var label = request.Label.Trim();

    if (code.Length != 4)
    {
        errors["code"] = ["Le code analytique doit contenir exactement 4 caractères."];
    }

    if (string.IsNullOrWhiteSpace(label))
    {
        errors["label"] = ["Le libellé analytique est obligatoire."];
    }

    var companyExists = await dbContext.Companies.AnyAsync(company => company.Id == request.CompanyId);
    if (!companyExists)
    {
        errors["companyId"] = ["La société sélectionnée est introuvable."];
    }

    var codeExists = await dbContext.Analytics.AnyAsync(item =>
        item.Code == code &&
        item.Id != currentAnalyticId);
    if (codeExists)
    {
        errors["code"] = ["Ce code analytique existe déjà."];
    }

    return errors;
}

static async Task<Dictionary<string, string[]>> ValidateExploitationRequestAsync(
    UpsertExploitationRequest request,
    NewNexusDbContext dbContext,
    Guid? currentExploitationId = null)
{
    var errors = new Dictionary<string, string[]>();
    var code = request.Code.Trim().ToUpperInvariant();
    var label = request.Label.Trim();

    if (string.IsNullOrWhiteSpace(code))
    {
        errors["code"] = ["Le code exploitation est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(label))
    {
        errors["label"] = ["Le libellé exploitation est obligatoire."];
    }

    var companyExists = await dbContext.Companies.AnyAsync(company => company.Id == request.CompanyId);
    if (!companyExists)
    {
        errors["companyId"] = ["La société sélectionnée est introuvable."];
    }

    var codeExists = await dbContext.Exploitations.AnyAsync(item =>
        item.Code == code &&
        item.Id != currentExploitationId);
    if (codeExists)
    {
        errors["code"] = ["Ce code exploitation existe déjà."];
    }

    return errors;
}

static async Task<Dictionary<string, string[]>> ValidateEmployeeRequestAsync(
    UpsertEmployeeRequest request,
    NewNexusDbContext dbContext,
    Guid? currentEmployeeId = null)
{
    var errors = new Dictionary<string, string[]>();
    var sourceEmployeeId = request.SourceEmployeeId.Trim();
    var employeeNumber = request.EmployeeNumber.Trim();
    var displayName = request.DisplayName.Trim();
    var email = NormalizeOptionalText(request.Email);
    var phoneNumber = NormalizeOptionalText(request.PhoneNumber);

    if (string.IsNullOrWhiteSpace(sourceEmployeeId))
    {
        errors["sourceEmployeeId"] = ["L'identifiant source Lucca est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(employeeNumber))
    {
        errors["employeeNumber"] = ["Le matricule est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(displayName))
    {
        errors["displayName"] = ["Le nom du salarie est obligatoire."];
    }

    if (!string.IsNullOrWhiteSpace(email) && !email.Contains('@'))
    {
        errors["email"] = ["L'adresse email est invalide."];
    }

    if (!string.IsNullOrWhiteSpace(phoneNumber) && phoneNumber.Length > 80)
    {
        errors["phoneNumber"] = ["Le telephone ne doit pas depasser 80 caracteres."];
    }

    if (await dbContext.Employees.AnyAsync(item => item.SourceEmployeeId == sourceEmployeeId && item.Id != currentEmployeeId))
    {
        errors["sourceEmployeeId"] = ["Cet identifiant source existe deja."];
    }

    if (await dbContext.Employees.AnyAsync(item => item.EmployeeNumber == employeeNumber && item.Id != currentEmployeeId))
    {
        errors["employeeNumber"] = ["Ce matricule existe deja."];
    }

    return errors;
}

static async Task<Dictionary<string, string[]>> ValidateThirdPartyRequestAsync(
    UpsertThirdPartyRequest request,
    NewNexusDbContext dbContext,
    Guid? currentThirdPartyId = null)
{
    var errors = new Dictionary<string, string[]>();
    var typeCode = request.TypeCode.Trim().ToUpperInvariant();
    var displayName = request.DisplayName.Trim();
    var siren = NormalizeOptionalText(request.Siren);

    if (string.IsNullOrWhiteSpace(typeCode))
    {
        errors["typeCode"] = ["Le type de tiers est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(displayName))
    {
        errors["displayName"] = ["Le nom du tiers est obligatoire."];
    }

    if (!string.IsNullOrWhiteSpace(siren) && (siren.Length != 9 || siren.Any(character => !char.IsDigit(character))))
    {
        errors["siren"] = ["Le SIREN doit contenir 9 chiffres."];
    }

    if (!string.IsNullOrWhiteSpace(siren) &&
        await dbContext.ThirdParties.AnyAsync(item => item.Siren == siren && item.Id != currentThirdPartyId))
    {
        errors["siren"] = ["Ce SIREN est deja rattache a un tiers."];
    }

    var requestedAnalyticIds = request.AnalyticIds.Distinct().ToArray();
    var existingAnalyticCount = await dbContext.Analytics.CountAsync(item => requestedAnalyticIds.Contains(item.Id));
    if (existingAnalyticCount != requestedAnalyticIds.Length)
    {
        errors["analyticIds"] = ["Un analytique selectionne est introuvable."];
    }

    return errors;
}

static async Task<Dictionary<string, string[]>> ValidateMaterialRequestAsync(
    UpsertMaterialRequest request,
    NewNexusDbContext dbContext,
    Guid? currentMaterialId = null)
{
    var errors = new Dictionary<string, string[]>();
    var fleetNumber = request.FleetNumber.Trim().ToUpperInvariant();
    var label = request.Label.Trim();
    var materialType = request.MaterialType.Trim().ToUpperInvariant();

    if (string.IsNullOrWhiteSpace(fleetNumber))
    {
        errors["fleetNumber"] = ["Le numero de parc est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(label))
    {
        errors["label"] = ["Le libelle materiel est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(materialType))
    {
        errors["materialType"] = ["Le type de materiel est obligatoire."];
    }

    if (await dbContext.Materials.AnyAsync(item => item.FleetNumber == fleetNumber && item.Id != currentMaterialId))
    {
        errors["fleetNumber"] = ["Ce numero de parc existe deja."];
    }

    if (request.ExploitationId is not null &&
        !await dbContext.Exploitations.AnyAsync(item => item.Id == request.ExploitationId.Value))
    {
        errors["exploitationId"] = ["L'exploitation selectionnee est introuvable."];
    }

    return errors;
}

static async Task<Dictionary<string, string[]>> ValidateContraventionRequestAsync(
    UpsertContraventionRequest request,
    NewNexusDbContext dbContext,
    Guid? currentContraventionId = null)
{
    var errors = new Dictionary<string, string[]>();
    var noticeNumber = request.NoticeNumber.Trim().ToUpperInvariant();
    var offenseLabel = request.OffenseLabel.Trim();
    var statusCode = NormalizeContraventionStatus(request.StatusCode);

    if (string.IsNullOrWhiteSpace(noticeNumber))
    {
        errors["noticeNumber"] = ["Le numero d'avis est obligatoire."];
    }

    if (noticeNumber.Length > 80)
    {
        errors["noticeNumber"] = ["Le numero d'avis ne doit pas depasser 80 caracteres."];
    }

    if (request.OffenseDate == default)
    {
        errors["offenseDate"] = ["La date d'infraction est obligatoire."];
    }

    if (request.DueDate is not null && request.DueDate.Value.Date < request.OffenseDate.Date)
    {
        errors["dueDate"] = ["L'echeance ne peut pas preceder la date d'infraction."];
    }

    if (request.Amount < 0)
    {
        errors["amount"] = ["Le montant ne peut pas etre negatif."];
    }

    if (string.IsNullOrWhiteSpace(offenseLabel))
    {
        errors["offenseLabel"] = ["Le libelle d'infraction est obligatoire."];
    }

    if (!GetContraventionStatuses().Contains(statusCode))
    {
        errors["statusCode"] = ["Le statut de contravention est inconnu."];
    }

    if (await dbContext.Contraventions.AnyAsync(item =>
            item.NoticeNumber == noticeNumber &&
            item.Id != currentContraventionId))
    {
        errors["noticeNumber"] = ["Ce numero d'avis existe deja."];
    }

    if (request.DriverEmployeeId is not null &&
        !await dbContext.Employees.AnyAsync(item => item.Id == request.DriverEmployeeId.Value && item.IsActive))
    {
        errors["driverEmployeeId"] = ["Le conducteur selectionne est introuvable ou inactif."];
    }

    if (request.MaterialId is not null &&
        !await dbContext.Materials.AnyAsync(item => item.Id == request.MaterialId.Value && item.IsActive))
    {
        errors["materialId"] = ["Le materiel selectionne est introuvable ou inactif."];
    }

    return errors;
}

static string[] GetContraventionStatuses()
{
    return ["A_TRAITER", "EN_CONTESTATION", "A_PAYER", "PAYEE", "CLASSEE"];
}

static string NormalizeContraventionStatus(string? statusCode)
{
    var normalized = NormalizeTechnicalCode(statusCode);
    return string.IsNullOrWhiteSpace(normalized) ? "A_TRAITER" : normalized;
}

static string FormatContraventionStatus(string statusCode)
{
    return NormalizeContraventionStatus(statusCode) switch
    {
        "EN_CONTESTATION" => "En contestation",
        "A_PAYER" => "A payer",
        "PAYEE" => "Payee",
        "CLASSEE" => "Classee",
        _ => "A traiter"
    };
}

static async Task<Dictionary<string, string[]>> ValidateLoadingPointRequestAsync(
    UpsertLoadingPointRequest request,
    NewNexusDbContext dbContext,
    Guid? currentLoadingPointId = null)
{
    var errors = new Dictionary<string, string[]>();
    var code = request.Code.Trim().ToUpperInvariant();
    var label = request.Label.Trim();
    var pointTypeCode = NormalizeLoadingPointType(request.PointTypeCode);
    var countryCode = NormalizeCountryCode(request.CountryCode);

    if (string.IsNullOrWhiteSpace(code))
    {
        errors["code"] = ["Le code du point est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(label))
    {
        errors["label"] = ["Le libelle du point est obligatoire."];
    }

    if (!GetLoadingPointTypes().Contains(pointTypeCode))
    {
        errors["pointTypeCode"] = ["Le type du point doit etre CHARGEMENT, DECHARGEMENT ou MIXTE."];
    }

    if (string.IsNullOrWhiteSpace(request.AddressLine))
    {
        errors["addressLine"] = ["L'adresse est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(request.PostalCode))
    {
        errors["postalCode"] = ["Le code postal est obligatoire."];
    }

    if (string.IsNullOrWhiteSpace(request.City))
    {
        errors["city"] = ["La ville est obligatoire."];
    }

    if (countryCode.Length != 2)
    {
        errors["countryCode"] = ["Le pays doit etre un code ISO sur 2 caracteres."];
    }

    if (request.Latitude is not null && (request.Latitude < -90 || request.Latitude > 90))
    {
        errors["latitude"] = ["La latitude doit etre comprise entre -90 et 90."];
    }

    if (request.Longitude is not null && (request.Longitude < -180 || request.Longitude > 180))
    {
        errors["longitude"] = ["La longitude doit etre comprise entre -180 et 180."];
    }

    if (await dbContext.LoadingPoints.AnyAsync(item =>
            item.Code == code &&
            item.Id != currentLoadingPointId))
    {
        errors["code"] = ["Ce code point existe deja."];
    }

    if (request.ThirdPartyId is not null &&
        !await dbContext.ThirdParties.AnyAsync(item => item.Id == request.ThirdPartyId.Value && item.IsActive))
    {
        errors["thirdPartyId"] = ["Le tiers selectionne est introuvable ou inactif."];
    }

    if (request.ExploitationId is not null &&
        !await dbContext.Exploitations.AnyAsync(item => item.Id == request.ExploitationId.Value && item.IsActive))
    {
        errors["exploitationId"] = ["L'exploitation selectionnee est introuvable ou inactive."];
    }

    return errors;
}

static string[] GetLoadingPointTypes()
{
    return ["CHARGEMENT", "DECHARGEMENT", "MIXTE"];
}

static string NormalizeLoadingPointType(string? pointTypeCode)
{
    var normalized = NormalizeTechnicalCode(pointTypeCode);
    return string.IsNullOrWhiteSpace(normalized) ? "MIXTE" : normalized;
}

static string NormalizeCountryCode(string? countryCode)
{
    var normalized = NormalizeOptionalText(countryCode)?.ToUpperInvariant() ?? "FR";
    return normalized.Length <= 2 ? normalized : normalized[..2];
}

static string FormatLoadingPointType(string pointTypeCode)
{
    return NormalizeLoadingPointType(pointTypeCode) switch
    {
        "CHARGEMENT" => "Chargement",
        "DECHARGEMENT" => "Dechargement",
        _ => "Mixte"
    };
}

internal sealed record LoginRequest(string Login, string Password);
internal sealed record ForgotPasswordRequest(string LoginOrEmail);
internal sealed record ResetPasswordRequest(string Token, string NewPassword, string ConfirmPassword);
internal sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmPassword);
internal sealed record UpdateUserPreferencesRequest(bool IsSidebarCollapsed);
internal sealed record NexaSessionSignal(DateTime LoginAtUtc, DateTime LastSeenAtUtc, DateTime? LogoutAtUtc, DateTime? RevokedAtUtc);
internal sealed record NexaTraceSignal(string StreamCode, string EventCode, string Level, DateTime CreatedAtUtc);
internal sealed record UpdateAccountProfileRequest(Guid? SecurityProfileId);
internal sealed record UpdateAccountStatusRequest(bool IsActive);
internal sealed record CreateUserAccountRequest(
    string Login,
    string DisplayName,
    string? Email,
    string? EmployeeNumber,
    string Password,
    Guid? SecurityProfileId,
    bool IsActive,
    bool MustChangePassword,
    int SessionTimeoutMinutes);
internal sealed record UpdateUserAccountRequest(
    string Login,
    string DisplayName,
    string? Email,
    string? EmployeeNumber,
    string? NewPassword,
    Guid? SecurityProfileId,
    bool IsActive,
    bool MustChangePassword,
    int SessionTimeoutMinutes);
internal sealed record ProfileModuleRightRequest(Guid SecurityModuleId, string AccessLevel);
internal sealed record CreateSecurityProfileRequest(string Label, bool IsActive, List<ProfileModuleRightRequest> ModuleRights);
internal sealed record UpdateSecurityProfileRequest(string Label, bool IsActive, List<ProfileModuleRightRequest> ModuleRights);
internal sealed record UpsertCompanyRequest(string Siren, string DisplayName, string LegalName, bool IsActive);
internal sealed record SireneCompanyLookup(string Siren, string? Siret, string? DisplayName, string? LegalName, string? Naf, string? PostalCode, string? City);
internal sealed record SireneLookupResult(bool IsAvailable, SireneCompanyLookup? Company, string? ErrorDetail);
internal sealed record SireneSearchResult(bool IsAvailable, IReadOnlyList<SireneCompanyLookup> Companies, string? ErrorDetail);
internal sealed record UpsertAnalyticRequest(string Code, string Label, Guid CompanyId, bool IsActive);
internal sealed record UpsertExploitationRequest(string Code, string Label, Guid CompanyId, bool IsActive);
internal sealed record UpsertEmployeeRequest(
    string SourceEmployeeId,
    string EmployeeNumber,
    string DisplayName,
    string? Email,
    string? PhoneNumber,
    bool IsDriver,
    bool IsActive,
    DateTime? LastSyncedAtUtc);
internal sealed record EmployeeAccountProvisioningItem(
    Guid EmployeeId,
    string EmployeeNumber,
    string DisplayName,
    string? Login,
    string? TemporaryPassword,
    string Status);
internal sealed record EmployeeAccountProvisioningResult(
    int CreatedCount,
    int SkippedCount,
    List<EmployeeAccountProvisioningItem> CreatedAccounts,
    List<EmployeeAccountProvisioningItem> SkippedEmployees);
internal sealed record LuccaMappedEmployee(
    string SourceEmployeeId,
    string EmployeeNumber,
    string DisplayName,
    string? Email,
    string? PhoneNumber,
    bool IsActive);
internal sealed record UpsertThirdPartyRequest(
    string TypeCode,
    string DisplayName,
    string? Siren,
    string? VatNumber,
    string? ExternalReference,
    bool IsForeignCompany,
    bool IsActive,
    List<Guid> AnalyticIds);
internal sealed record UpsertMaterialRequest(
    string FleetNumber,
    string Label,
    string MaterialType,
    string? RegistrationNumber,
    string? SourceSystem,
    Guid? ExploitationId,
    bool IsActive,
    DateTime? LastSyncedAtUtc);
internal sealed record UpsertContraventionRequest(
    string NoticeNumber,
    DateTime OffenseDate,
    DateTime? DueDate,
    decimal Amount,
    string StatusCode,
    string OffenseLabel,
    string? Location,
    string? Notes,
    Guid? DriverEmployeeId,
    Guid? MaterialId);
internal sealed record UpsertLoadingPointRequest(
    string Code,
    string Label,
    string PointTypeCode,
    string AddressLine,
    string PostalCode,
    string City,
    string? CountryCode,
    decimal? Latitude,
    decimal? Longitude,
    Guid? ThirdPartyId,
    Guid? ExploitationId,
    bool IsActive,
    string? Notes);
internal sealed record ImportMaterialsRequest(List<ImportMaterialItemRequest> Materials);
internal sealed record ImportMaterialItemRequest(
    string FleetNumber,
    string Label,
    string? MaterialType,
    string? RegistrationNumber,
    bool IsActive);
internal sealed record MaterialImportResult(
    string ProviderCode,
    int CreatedCount,
    int UpdatedCount,
    int SkippedCount,
    List<object> ImportedMaterials);
internal sealed record GeocodingResult(
    bool IsSuccess,
    string? Provider,
    decimal? Latitude,
    decimal? Longitude,
    string? ErrorDetail)
{
    public static GeocodingResult Success(string provider, decimal latitude, decimal longitude) =>
        new(true, provider, latitude, longitude, null);

    public static GeocodingResult Failed(string errorDetail) =>
        new(false, null, null, null, errorDetail);
}
internal sealed record ProfileRightsBuildResult(bool IsValid, Dictionary<string, string[]> Errors, Dictionary<Guid, ModuleAccessLevel> RightsByModuleId);
internal sealed record UpsertIntegrationCredentialRequest(
    string ProviderCode,
    string? ProviderLabel,
    string KeyName,
    string? DisplayName,
    string? Value,
    bool IsSecret,
    bool IsActive,
    string? Source,
    string? Notes);
internal sealed record IntegrationCredentialDefinition(
    string ProviderCode,
    string ProviderLabel,
    string KeyName,
    string DisplayName,
    bool IsSecret,
    string? LegacyParameterKey,
    string? Notes);
internal sealed record CredentialProviderStatus(
    string ProviderCode,
    int TotalCount,
    int ConfiguredCount,
    int ActiveConfiguredCount);
internal sealed record ControlledSqlQueryDefinition(
    string Code,
    string Scope,
    string Label,
    string Description,
    string[] Columns);
internal sealed record TraceStreamDefinition(
    string Code,
    string Label,
    string Description,
    string Retention);
internal sealed record ScheduledTaskDefinition(
    string Code,
    string Label,
    string Scope,
    string Cadence,
    string Status,
    string Description,
    bool IsRunnable);
internal sealed record LegacyAdminApiKeyRow(int ApiKeyId, string KeyValue, string ProviderName, string CreatedOn);
internal sealed record LegacyImportResult(int ImportedCount, int SkippedCount, int FailedCount, List<string> Messages);
