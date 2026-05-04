namespace NewNexus.Domain.Transverse;

public sealed class IntegrationCredential
{
    public Guid Id { get; set; }
    public string ProviderCode { get; set; } = string.Empty;
    public string ProviderLabel { get; set; } = string.Empty;
    public string KeyName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ProtectedValue { get; set; } = string.Empty;
    public bool IsSecret { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public string? Source { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastImportedAtUtc { get; set; }
}
