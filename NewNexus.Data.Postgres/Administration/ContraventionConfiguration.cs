using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Administration;

namespace NewNexus.Data.Postgres.Administration;

internal sealed class ContraventionConfiguration : IEntityTypeConfiguration<Contravention>
{
    public void Configure(EntityTypeBuilder<Contravention> builder)
    {
        builder.ToTable("Contravention", "administration");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.NoticeNumber)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(entity => entity.StatusCode)
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(entity => entity.OffenseLabel)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Location)
            .HasMaxLength(200);

        builder.Property(entity => entity.Notes)
            .HasMaxLength(2000);

        builder.Property(entity => entity.Amount)
            .HasPrecision(12, 2);

        builder.Property(entity => entity.OffenseDate)
            .HasColumnType("date");

        builder.Property(entity => entity.DueDate)
            .HasColumnType("date");

        builder.HasIndex(entity => entity.NoticeNumber)
            .IsUnique();

        builder.HasOne(entity => entity.DriverEmployee)
            .WithMany()
            .HasForeignKey(entity => entity.DriverEmployeeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(entity => entity.Material)
            .WithMany()
            .HasForeignKey(entity => entity.MaterialId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
