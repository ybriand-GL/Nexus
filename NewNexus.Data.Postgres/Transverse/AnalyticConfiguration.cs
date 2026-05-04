using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Transverse;

namespace NewNexus.Data.Postgres.Transverse;

internal sealed class AnalyticConfiguration : IEntityTypeConfiguration<Analytic>
{
    public void Configure(EntityTypeBuilder<Analytic> builder)
    {
        builder.ToTable("Analytic", "transverse");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.Code)
            .HasMaxLength(4)
            .IsRequired();

        builder.Property(entity => entity.Label)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(entity => entity.Code)
            .IsUnique();

        builder.HasOne(entity => entity.Company)
            .WithMany(company => company.Analytics)
            .HasForeignKey(entity => entity.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
