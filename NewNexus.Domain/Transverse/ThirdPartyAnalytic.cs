namespace NewNexus.Domain.Transverse;

public sealed class ThirdPartyAnalytic
{
    public Guid ThirdPartyId { get; set; }
    public ThirdParty? ThirdParty { get; set; }

    public Guid AnalyticId { get; set; }
    public Analytic? Analytic { get; set; }
}
