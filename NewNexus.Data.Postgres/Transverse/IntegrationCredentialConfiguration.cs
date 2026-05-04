using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Transverse;

namespace NewNexus.Data.Postgres.Transverse;

internal sealed class IntegrationCredentialConfiguration : IEntityTypeConfiguration<IntegrationCredential>
{
    public void Configure(EntityTypeBuilder<IntegrationCredential> builder)
    {
        builder.ToTable("IntegrationCredential", "transverse");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.ProviderCode)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(entity => entity.ProviderLabel)
            .HasMaxLength(160)
            .IsRequired();

        builder.Property(entity => entity.KeyName)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(entity => entity.DisplayName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.ProtectedValue)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(entity => entity.Source)
            .HasMaxLength(160);

        builder.Property(entity => entity.Notes)
            .HasMaxLength(500);

        builder.HasIndex(entity => new { entity.ProviderCode, entity.KeyName })
            .IsUnique();
    }
}
