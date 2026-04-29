using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Security;

namespace NewNexus.Data.Postgres.Security;

internal sealed class SecurityProfileModuleRightConfiguration : IEntityTypeConfiguration<SecurityProfileModuleRight>
{
    public void Configure(EntityTypeBuilder<SecurityProfileModuleRight> builder)
    {
        builder.ToTable("SecurityProfileModuleRight", "security");
        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.AccessLevel)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(entity => new { entity.SecurityProfileId, entity.SecurityModuleId })
            .IsUnique();

        builder.HasOne(entity => entity.SecurityProfile)
            .WithMany(profile => profile.ModuleRights)
            .HasForeignKey(entity => entity.SecurityProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(entity => entity.SecurityModule)
            .WithMany(module => module.ProfileRights)
            .HasForeignKey(entity => entity.SecurityModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasData(SecuritySeedData.BuildProfileRights());
    }
}
