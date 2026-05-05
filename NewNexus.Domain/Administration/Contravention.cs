using NewNexus.Domain.Transverse;

namespace NewNexus.Domain.Administration;

public sealed class Contravention
{
    public Guid Id { get; set; }
    public string NoticeNumber { get; set; } = string.Empty;
    public DateTime OffenseDate { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal Amount { get; set; }
    public string StatusCode { get; set; } = "A_TRAITER";
    public string OffenseLabel { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid? DriverEmployeeId { get; set; }
    public Employee? DriverEmployee { get; set; }

    public Guid? MaterialId { get; set; }
    public Material? Material { get; set; }
}
