using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Security;

namespace NewNexus.Data.Postgres.Security;

internal sealed class UserAccountConfiguration : IEntityTypeConfiguration<UserAccount>
{
    public void Configure(EntityTypeBuilder<UserAccount> builder)
    {
        builder.ToTable("UserAccount", "security");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.Login)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(entity => entity.DisplayName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Email)
            .HasMaxLength(200);

        builder.Property(entity => entity.EmployeeNumber)
            .HasMaxLength(50);

        builder.Property(entity => entity.PasswordHash)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(entity => entity.PasswordResetTokenHash)
            .HasMaxLength(128);

        builder.Property(entity => entity.SessionTimeoutMinutes)
            .HasDefaultValue(60);

        builder.Property(entity => entity.IsSidebarCollapsed)
            .HasDefaultValue(false);

        builder.HasIndex(entity => entity.Login)
            .IsUnique();

        builder.HasIndex(entity => entity.PasswordResetTokenHash);

        builder.HasOne(entity => entity.SecurityProfile)
            .WithMany(profile => profile.UserAccounts)
            .HasForeignKey(entity => entity.SecurityProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasData(SecuritySeedData.BuildUserAccounts());
    }
}
