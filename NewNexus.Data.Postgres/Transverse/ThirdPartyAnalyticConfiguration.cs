using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Transverse;

namespace NewNexus.Data.Postgres.Transverse;

internal sealed class ThirdPartyAnalyticConfiguration : IEntityTypeConfiguration<ThirdPartyAnalytic>
{
    public void Configure(EntityTypeBuilder<ThirdPartyAnalytic> builder)
    {
        builder.ToTable("ThirdPartyAnalytic", "transverse");
        builder.HasKey(entity => new { entity.ThirdPartyId, entity.AnalyticId });

        builder.HasOne(entity => entity.ThirdParty)
            .WithMany(entity => entity.Analytics)
            .HasForeignKey(entity => entity.ThirdPartyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(entity => entity.Analytic)
            .WithMany()
            .HasForeignKey(entity => entity.AnalyticId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
