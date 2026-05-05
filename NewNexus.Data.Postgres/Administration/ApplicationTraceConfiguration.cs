using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Administration;

namespace NewNexus.Data.Postgres.Administration;

internal sealed class ApplicationTraceConfiguration : IEntityTypeConfiguration<ApplicationTrace>
{
    public void Configure(EntityTypeBuilder<ApplicationTrace> builder)
    {
        builder.ToTable("ApplicationTrace", "admin");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.StreamCode)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(entity => entity.StreamLabel)
            .HasMaxLength(160)
            .IsRequired();

        builder.Property(entity => entity.EventCode)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(entity => entity.Level)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(entity => entity.Message)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(entity => entity.Detail)
            .HasMaxLength(2000);

        builder.Property(entity => entity.Subject)
            .HasMaxLength(240);

        builder.Property(entity => entity.ActorLogin)
            .HasMaxLength(160);

        builder.Property(entity => entity.IpAddress)
            .HasMaxLength(80);

        builder.HasIndex(entity => entity.CreatedAtUtc);
        builder.HasIndex(entity => entity.StreamCode);
        builder.HasIndex(entity => entity.EventCode);
    }
}
