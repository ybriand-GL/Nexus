using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Transverse;

namespace NewNexus.Data.Postgres.Transverse;

internal sealed class ThirdPartyConfiguration : IEntityTypeConfiguration<ThirdParty>
{
    public void Configure(EntityTypeBuilder<ThirdParty> builder)
    {
        builder.ToTable("ThirdParty", "transverse");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.TypeCode)
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(entity => entity.DisplayName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Siren)
            .HasMaxLength(9);

        builder.Property(entity => entity.VatNumber)
            .HasMaxLength(40);

        builder.Property(entity => entity.ExternalReference)
            .HasMaxLength(120);

        builder.HasIndex(entity => new { entity.TypeCode, entity.DisplayName });
        builder.HasIndex(entity => entity.Siren);
    }
}
