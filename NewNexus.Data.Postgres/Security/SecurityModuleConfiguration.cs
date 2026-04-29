using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Security;

namespace NewNexus.Data.Postgres.Security;

internal sealed class SecurityModuleConfiguration : IEntityTypeConfiguration<SecurityModule>
{
    public void Configure(EntityTypeBuilder<SecurityModule> builder)
    {
        builder.ToTable("SecurityModule", "security");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.Code)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(entity => entity.Label)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.NavigationGroup)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(entity => entity.Code)
            .IsUnique();

        builder.HasData(SecuritySeedData.BuildModules());
    }
}
