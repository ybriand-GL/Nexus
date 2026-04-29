using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Security;

namespace NewNexus.Data.Postgres.Security;

internal sealed class SecurityProfileConfiguration : IEntityTypeConfiguration<SecurityProfile>
{
    public void Configure(EntityTypeBuilder<SecurityProfile> builder)
    {
        builder.ToTable("SecurityProfile", "security");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.Code)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(entity => entity.Label)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(entity => entity.Code)
            .IsUnique();

        builder.HasData(SecuritySeedData.BuildProfiles());
    }
}
