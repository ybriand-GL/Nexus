using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using NewNexus.Data.Postgres;
using NewNexus.Domain.Security;
using NewNexus.Domain.Transverse;

var builder = WebApplication.CreateBuilder(args);

var basePath = NormalizeBasePath(builder.Configuration["App:BasePath"]);
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
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireInformatique", policy =>
        policy.RequireAuthenticatedUser()
            .RequireClaim("profile_code", "INFORMATIQUE"));
});

builder.Services.AddNewNexusPostgres(builder.Configuration);
builder.Services.AddHttpClient("Sirene", client =>
{
    client.BaseAddress = new Uri("https://recherche-entreprises.api.gouv.fr");
    client.Timeout = TimeSpan.FromSeconds(8);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("NewNexus/0.1");
});

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

if (!string.IsNullOrWhiteSpace(basePath))
{
    app.UsePathBase(basePath);
}

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
            ExploitationCount = exploitationCount
        },
        Integrations = new
        {
            Sirene = new
            {
                Status = "configured",
                Provider = "API Recherche d'Entreprises"
            }
        }
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

    account.LastLoginAtUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync();

    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, account.Id.ToString()),
        new(ClaimTypes.Name, account.DisplayName),
        new("login", account.Login)
    };

    if (account.SecurityProfile is not null)
    {
        claims.Add(new Claim(ClaimTypes.Role, account.SecurityProfile.Code));
        claims.Add(new Claim("profile_code", account.SecurityProfile.Code));
        claims.Add(new Claim("profile_label", account.SecurityProfile.Label));
    }

    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    var principal = new ClaimsPrincipal(identity);
    await httpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);

    return Results.Ok(BuildAuthenticatedUser(account));
});

app.MapPost("/api/auth/logout", async (HttpContext httpContext) =>
{
    await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.NoContent();
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

    return Results.Ok(new
    {
        Companies = companies,
        Analytics = analytics,
        Exploitations = exploitations
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

static Guid? GetUserId(ClaimsPrincipal principal)
{
    var rawValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    return Guid.TryParse(rawValue, out var userId) ? userId : null;
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

static string? GetJsonString(JsonElement element, string propertyName)
{
    return element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
        ? value.GetString()
        : null;
}

static string? FirstNonEmpty(params string?[] values)
{
    return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();
}

static async Task<Dictionary<string, string[]>> ValidateUserAccountCoreAsync(
    string login,
    string displayName,
    string? email,
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

internal sealed record LoginRequest(string Login, string Password);
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
    bool MustChangePassword);
internal sealed record UpdateUserAccountRequest(
    string Login,
    string DisplayName,
    string? Email,
    string? EmployeeNumber,
    string? NewPassword,
    Guid? SecurityProfileId,
    bool IsActive,
    bool MustChangePassword);
internal sealed record ProfileModuleRightRequest(Guid SecurityModuleId, string AccessLevel);
internal sealed record CreateSecurityProfileRequest(string Label, bool IsActive, List<ProfileModuleRightRequest> ModuleRights);
internal sealed record UpdateSecurityProfileRequest(string Label, bool IsActive, List<ProfileModuleRightRequest> ModuleRights);
internal sealed record UpsertCompanyRequest(string Siren, string DisplayName, string LegalName, bool IsActive);
internal sealed record UpsertAnalyticRequest(string Code, string Label, Guid CompanyId, bool IsActive);
internal sealed record UpsertExploitationRequest(string Code, string Label, Guid CompanyId, bool IsActive);
internal sealed record ProfileRightsBuildResult(bool IsValid, Dictionary<string, string[]> Errors, Dictionary<Guid, ModuleAccessLevel> RightsByModuleId);
