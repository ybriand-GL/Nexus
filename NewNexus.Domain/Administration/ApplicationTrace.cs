namespace NewNexus.Domain.Administration;

public sealed class ApplicationTrace
{
    public Guid Id { get; set; }
    public string StreamCode { get; set; } = string.Empty;
    public string StreamLabel { get; set; } = string.Empty;
    public string EventCode { get; set; } = string.Empty;
    public string Level { get; set; } = "Info";
    public string Message { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public string? Subject { get; set; }
    public Guid? ActorUserAccountId { get; set; }
    public string? ActorLogin { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
