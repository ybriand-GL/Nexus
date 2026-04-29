using Microsoft.EntityFrameworkCore;
using NewNexus.Data.Postgres.Security;
using NewNexus.Domain.Security;

namespace NewNexus.Data.Postgres;

public sealed class NewNexusDbContext(DbContextOptions<NewNexusDbContext> options) : DbContext(options)
{
    public DbSet<SecurityModule> SecurityModules => Set<SecurityModule>();
    public DbSet<SecurityProfile> SecurityProfiles => Set<SecurityProfile>();
    public DbSet<SecurityProfileModuleRight> SecurityProfileModuleRights => Set<SecurityProfileModuleRight>();
    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new SecurityModuleConfiguration());
        modelBuilder.ApplyConfiguration(new SecurityProfileConfiguration());
        modelBuilder.ApplyConfiguration(new SecurityProfileModuleRightConfiguration());
        modelBuilder.ApplyConfiguration(new UserAccountConfiguration());
    }
}
