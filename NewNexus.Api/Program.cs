using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using NewNexus.Data.Postgres;
using NewNexus.Domain.Security;

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

internal sealed record LoginRequest(string Login, string Password);
internal sealed record UpdateAccountProfileRequest(Guid? SecurityProfileId);
internal sealed record UpdateAccountStatusRequest(bool IsActive);
internal sealed record ProfileModuleRightRequest(Guid SecurityModuleId, string AccessLevel);
internal sealed record CreateSecurityProfileRequest(string Label, bool IsActive, List<ProfileModuleRightRequest> ModuleRights);
internal sealed record UpdateSecurityProfileRequest(string Label, bool IsActive, List<ProfileModuleRightRequest> ModuleRights);
internal sealed record ProfileRightsBuildResult(bool IsValid, Dictionary<string, string[]> Errors, Dictionary<Guid, ModuleAccessLevel> RightsByModuleId);
