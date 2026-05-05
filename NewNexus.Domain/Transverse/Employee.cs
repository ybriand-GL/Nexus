namespace NewNexus.Domain.Transverse;

public sealed class Employee
{
    public Guid Id { get; set; }
    public string SourceEmployeeId { get; set; } = string.Empty;
    public string EmployeeNumber { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsDriver { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastSyncedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
