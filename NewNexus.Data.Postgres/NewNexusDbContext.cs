using Microsoft.EntityFrameworkCore;
using NewNexus.Data.Postgres.Administration;
using NewNexus.Data.Postgres.Security;
using NewNexus.Data.Postgres.Transverse;
using NewNexus.Domain.Administration;
using NewNexus.Domain.Security;
using NewNexus.Domain.Transverse;

namespace NewNexus.Data.Postgres;

public sealed class NewNexusDbContext(DbContextOptions<NewNexusDbContext> options) : DbContext(options)
{
    public DbSet<SecurityModule> SecurityModules => Set<SecurityModule>();
    public DbSet<SecurityProfile> SecurityProfiles => Set<SecurityProfile>();
    public DbSet<SecurityProfileModuleRight> SecurityProfileModuleRights => Set<SecurityProfileModuleRight>();
    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Analytic> Analytics => Set<Analytic>();
    public DbSet<Exploitation> Exploitations => Set<Exploitation>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<ThirdParty> ThirdParties => Set<ThirdParty>();
    public DbSet<ThirdPartyAnalytic> ThirdPartyAnalytics => Set<ThirdPartyAnalytic>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<IntegrationCredential> IntegrationCredentials => Set<IntegrationCredential>();
    public DbSet<ApplicationTrace> ApplicationTraces => Set<ApplicationTrace>();
    public DbSet<Contravention> Contraventions => Set<Contravention>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new SecurityModuleConfiguration());
        modelBuilder.ApplyConfiguration(new SecurityProfileConfiguration());
        modelBuilder.ApplyConfiguration(new SecurityProfileModuleRightConfiguration());
        modelBuilder.ApplyConfiguration(new UserAccountConfiguration());
        modelBuilder.ApplyConfiguration(new UserSessionConfiguration());
        modelBuilder.ApplyConfiguration(new CompanyConfiguration());
        modelBuilder.ApplyConfiguration(new AnalyticConfiguration());
        modelBuilder.ApplyConfiguration(new ExploitationConfiguration());
        modelBuilder.ApplyConfiguration(new EmployeeConfiguration());
        modelBuilder.ApplyConfiguration(new ThirdPartyConfiguration());
        modelBuilder.ApplyConfiguration(new ThirdPartyAnalyticConfiguration());
        modelBuilder.ApplyConfiguration(new MaterialConfiguration());
        modelBuilder.ApplyConfiguration(new IntegrationCredentialConfiguration());
        modelBuilder.ApplyConfiguration(new ApplicationTraceConfiguration());
        modelBuilder.ApplyConfiguration(new ContraventionConfiguration());
    }
}
