namespace NewNexus.Domain.Transverse;

public sealed class Company
{
    public Guid Id { get; set; }
    public string Siren { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<Analytic> Analytics { get; set; } = [];
    public ICollection<Exploitation> Exploitations { get; set; } = [];
}
