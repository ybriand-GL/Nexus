using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Transverse;

namespace NewNexus.Data.Postgres.Transverse;

internal sealed class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employee", "transverse");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.SourceEmployeeId)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(entity => entity.EmployeeNumber)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(entity => entity.DisplayName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Email)
            .HasMaxLength(200);

        builder.Property(entity => entity.PhoneNumber)
            .HasMaxLength(80);

        builder.HasIndex(entity => entity.SourceEmployeeId)
            .IsUnique();

        builder.HasIndex(entity => entity.EmployeeNumber)
            .IsUnique();
    }
}
