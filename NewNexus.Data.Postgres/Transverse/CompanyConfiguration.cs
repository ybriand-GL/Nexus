using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Transverse;

namespace NewNexus.Data.Postgres.Transverse;

internal sealed class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Company", "transverse");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.Siren)
            .HasMaxLength(9)
            .IsRequired();

        builder.Property(entity => entity.DisplayName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.LegalName)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(entity => entity.Siren)
            .IsUnique();
    }
}
