namespace NewNexus.Domain.Transverse;

public sealed class Analytic
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
}
