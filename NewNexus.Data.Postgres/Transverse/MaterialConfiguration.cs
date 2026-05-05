using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Transverse;

namespace NewNexus.Data.Postgres.Transverse;

internal sealed class MaterialConfiguration : IEntityTypeConfiguration<Material>
{
    public void Configure(EntityTypeBuilder<Material> builder)
    {
        builder.ToTable("Material", "transverse");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.FleetNumber)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(entity => entity.Label)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.MaterialType)
            .HasMaxLength(60)
            .IsRequired();

        builder.Property(entity => entity.RegistrationNumber)
            .HasMaxLength(40);

        builder.Property(entity => entity.SourceSystem)
            .HasMaxLength(80);

        builder.HasIndex(entity => entity.FleetNumber)
            .IsUnique();

        builder.HasOne(entity => entity.Exploitation)
            .WithMany()
            .HasForeignKey(entity => entity.ExploitationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
