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
    IDataProtectionProvider dataProtectionProvider) =>
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

    return Results.Ok(BuildCredentialResponse(existing, dataProtectionProvider, definition));
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/admin/integrations/credentials/import-nexus", async (
    NewNexusDbContext dbContext,
    IConfiguration configuration,
    IDataProtectionProvider dataProtectionProvider,
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
    var sessionId = GetSessionId(httpContext.User);
    if (sessionId is not null)
    {
        var session = await dbContext.UserSessions.SingleOrDefaultAsync(userSession => userSession.Id == sessionId.Value);
        if (session is not null && session.LogoutAtUtc is null)
        {
            session.LogoutAtUtc = DateTime.UtcNow;
            session.LastSeenAtUtc = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
        }
    }

    await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.NoContent();
});

app.MapPost("/api/auth/forgot-password", async (
    ForgotPasswordRequest request,
    NewNexusDbContext dbContext,
    ILoggerFactory loggerFactory) =>
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
        await dbContext.SaveChangesAsync();

        loggerFactory.CreateLogger("NewNexus.PasswordReset")
            .LogInformation("Password reset requested for account {AccountId}.", account.Id);
    }

    return Results.Ok(new
    {
        Message = "Si un compte actif correspond, une demande de réinitialisation a été enregistrée. Le lien d'envoi sera raccordé au service mail/SSO.",
        ResetToken = app.Environment.IsDevelopment() ? resetToken : null,
        ExpiresAtUtc = app.Environment.IsDevelopment() && account is not null ? account.PasswordResetExpiresAtUtc : null
    });
});

app.MapPost("/api/auth/reset-password", async (ResetPasswordRequest request, NewNexusDbContext dbContext) =>
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
}).RequireAuthorization("RequireInformatique");

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

    var client = httpClientFactory.CreateClient("Sirene");
    using var response = await client.GetAsync($"/search?q={Uri.EscapeDataString(normalizedSiren)}&per_page=1");
    if (!response.IsSuccessStatusCode)
    {
        return Results.Problem("La recherche SIRENE est indisponible.", statusCode: StatusCodes.Status502BadGateway);
    }

    await using var stream = await response.Content.ReadAsStreamAsync();
    using var document = await JsonDocument.ParseAsync(stream);

    if (!document.RootElement.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array)
    {
        return Results.NotFound();
    }

    var company = results.EnumerateArray()
        .FirstOrDefault(result => string.Equals(GetJsonString(result, "siren"), normalizedSiren, StringComparison.OrdinalIgnoreCase));
    if (company.ValueKind == JsonValueKind.Undefined)
    {
        return Results.NotFound();
    }

    var legalName = FirstNonEmpty(
        GetJsonString(company, "nom_complet"),
        GetJsonString(company, "nom_raison_sociale"),
        GetJsonString(company, "denomination"));
    var displayName = FirstNonEmpty(
        GetJsonString(company, "nom_raison_sociale"),
        GetJsonString(company, "nom_complet"),
        GetJsonString(company, "denomination"));

    return Results.Ok(new
    {
        Siren = normalizedSiren,
        Siret = GetJsonString(company, "siret"),
        DisplayName = displayName,
        LegalName = legalName,
        Naf = GetJsonString(company, "activite_principale"),
        Source = "API Recherche d'Entreprises"
    });
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/settings/companies", async (UpsertCompanyRequest request, NewNexusDbContext dbContext) =>
{
    var validationErrors = await ValidateCompanyRequestAsync(request, dbContext);
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var company = new Company
    {
        Id = Guid.NewGuid(),
        Siren = request.Siren.Trim(),
        DisplayName = request.DisplayName.Trim(),
        LegalName = request.LegalName.Trim(),
        IsActive = request.IsActive,
        CreatedAtUtc = DateTime.UtcNow
    };

    dbContext.Companies.Add(company);
    await dbContext.SaveChangesAsync();

    return Results.Created($"/api/settings/companies/{company.Id}", new { company.Id });
}).RequireAuthorization("RequireInformatique");

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
}).RequireAuthorization("RequireInformatique");

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
}).RequireAuthorization("RequireInformatique");

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
}).RequireAuthorization("RequireInformatique");

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
}).RequireAuthorization("RequireInformatique");

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
}).RequireAuthorization("RequireInformatique");

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
        IsDriver = request.IsDriver,
        IsActive = request.IsActive,
        LastSyncedAtUtc = request.LastSyncedAtUtc,
        CreatedAtUtc = DateTime.UtcNow
    };

    dbContext.Employees.Add(employee);
    await dbContext.SaveChangesAsync();

    return Results.Created($"/api/settings/employees/{employee.Id}", new { employee.Id });
}).RequireAuthorization("RequireInformatique");

app.MapPost("/api/settings/employees/provision-accounts", async (NewNexusDbContext dbContext) =>
{
    var employees = await dbContext.Employees
        .AsNoTracking()
        .Where(employee => employee.IsActive)
        .OrderBy(employee => employee.DisplayName)
        .ToListAsync();

    var existingAccounts = await dbContext.UserAccounts
        .AsNoTracking()
        .Select(account => new
        {
            account.Login,
            account.EmployeeNumber
        })
        .ToListAsync();

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

    await dbContext.SaveChangesAsync();

    return Results.Ok(new
    {
        CreatedCount = createdAccounts.Count,
        SkippedCount = skippedEmployees.Count,
        CreatedAccounts = createdAccounts,
        SkippedEmployees = skippedEmployees
    });
}).RequireAuthorization("RequireInformatique");

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
    employee.IsDriver = request.IsDriver;
    employee.IsActive = request.IsActive;
    employee.LastSyncedAtUtc = request.LastSyncedAtUtc;

    await dbContext.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("RequireInformatique");

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
}).RequireAuthorization("RequireInformatique");

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
}).RequireAuthorization("RequireInformatique");

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
}).RequireAuthorization("RequireInformatique");

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

internal sealed record LoginRequest(string Login, string Password);
internal sealed record ForgotPasswordRequest(string LoginOrEmail);
internal sealed record ResetPasswordRequest(string Token, string NewPassword, string ConfirmPassword);
internal sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmPassword);
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
internal sealed record UpsertAnalyticRequest(string Code, string Label, Guid CompanyId, bool IsActive);
internal sealed record UpsertExploitationRequest(string Code, string Label, Guid CompanyId, bool IsActive);
internal sealed record UpsertEmployeeRequest(
    string SourceEmployeeId,
    string EmployeeNumber,
    string DisplayName,
    string? Email,
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
internal sealed record LegacyAdminApiKeyRow(int ApiKeyId, string KeyValue, string ProviderName, string CreatedOn);
internal sealed record LegacyImportResult(int ImportedCount, int SkippedCount, int FailedCount, List<string> Messages);
