namespace NewNexus.Domain.Nexa;

public sealed class NexaCategory
{
    public Guid Id { get; set; }
    public Guid? NexaModuleId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }

    public NexaModule? NexaModule { get; set; }
}
