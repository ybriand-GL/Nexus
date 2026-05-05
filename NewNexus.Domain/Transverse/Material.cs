namespace NewNexus.Domain.Transverse;

public sealed class Material
{
    public Guid Id { get; set; }
    public string FleetNumber { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string MaterialType { get; set; } = string.Empty;
    public string? RegistrationNumber { get; set; }
    public string? SourceSystem { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastSyncedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid? ExploitationId { get; set; }
    public Exploitation? Exploitation { get; set; }
}
