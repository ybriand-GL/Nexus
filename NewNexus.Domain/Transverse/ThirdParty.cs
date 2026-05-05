namespace NewNexus.Domain.Transverse;

public sealed class ThirdParty
{
    public Guid Id { get; set; }
    public string TypeCode { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Siren { get; set; }
    public string? VatNumber { get; set; }
    public string? ExternalReference { get; set; }
    public bool IsForeignCompany { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<ThirdPartyAnalytic> Analytics { get; set; } = [];
}
