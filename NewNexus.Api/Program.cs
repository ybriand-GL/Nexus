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
builder.Services.AddAuthorization();
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
}).RequireAuthorization();

app.MapGet("/api/security/profiles", async (NewNexusDbContext dbContext) =>
{
    var profiles = await dbContext.SecurityProfiles
        .AsNoTracking()
        .OrderBy(profile => profile.Label)
        .Select(profile => new
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
        })
        .ToListAsync();

    return Results.Ok(profiles);
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapGet("/api/security/bootstrap", async (NewNexusDbContext dbContext) =>
{
    var modules = await dbContext.SecurityModules
        .AsNoTracking()
        .OrderBy(module => module.NavigationGroup)
        .ThenBy(module => module.DisplayOrder)
        .ThenBy(module => module.Label)
        .Select(module => new
        {
            module.Code,
            module.Label,
            module.NavigationGroup
        })
        .ToListAsync();

    var profiles = await dbContext.SecurityProfiles
        .AsNoTracking()
        .OrderBy(profile => profile.Label)
        .Select(profile => new
        {
            profile.Code,
            profile.Label,
            profile.IsSystemProfile,
            Rights = profile.ModuleRights
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
                .ToList()
        })
        .ToListAsync();

    var rightsByLevel = profiles
        .SelectMany(profile => profile.Rights)
        .GroupBy(right => right.AccessLevel, StringComparer.OrdinalIgnoreCase)
        .OrderBy(group => group.Key)
        .ToDictionary(group => group.Key, group => group.Count(), StringComparer.OrdinalIgnoreCase);

    return Results.Ok(new
    {
        Version = "0.1.0",
        Users = new
        {
            Total = await dbContext.UserAccounts.AsNoTracking().CountAsync(),
            Active = await dbContext.UserAccounts.AsNoTracking().CountAsync(account => account.IsActive)
        },
        Modules = modules,
        Profiles = profiles,
        Summary = new
        {
            ModuleCount = modules.Count,
            ProfileCount = profiles.Count,
            RightsByLevel = rightsByLevel
        }
    });
}).RequireAuthorization();

app.MapFallbackToFile("index.html");

app.Run();

static string NormalizeBasePath(string? value)
{
    if (string.IsNullOrWhiteSpace(value))
        return string.Empty;

    var trimmed = value.Trim();
    if (!trimmed.StartsWith('/'))
        trimmed = "/" + trimmed;

    return trimmed.TrimEnd('/');
}

static Guid? GetUserId(ClaimsPrincipal principal)
{
    var rawValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);
    return Guid.TryParse(rawValue, out var userId) ? userId : null;
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

internal sealed record LoginRequest(string Login, string Password);
