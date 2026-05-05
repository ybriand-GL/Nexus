using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Security;

namespace NewNexus.Data.Postgres.Security;

internal sealed class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("UserSession", "security");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.IpAddress)
            .HasMaxLength(80);

        builder.Property(entity => entity.UserAgent)
            .HasMaxLength(500);

        builder.HasIndex(entity => entity.UserAccountId);
        builder.HasIndex(entity => entity.ExpiresAtUtc);
        builder.HasIndex(entity => entity.RevokedAtUtc);

        builder.HasOne(entity => entity.UserAccount)
            .WithMany(account => account.Sessions)
            .HasForeignKey(entity => entity.UserAccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(entity => entity.RevokedByUserAccount)
            .WithMany()
            .HasForeignKey(entity => entity.RevokedByUserAccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
