using NewNexus.Domain.Security;

namespace NewNexus.Domain.Nexa;

public sealed class NexaTicketAttachment
{
    public Guid Id { get; set; }
    public Guid NexaTicketId { get; set; }
    public Guid UploadedByUserAccountId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long SizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public NexaTicket? NexaTicket { get; set; }
    public UserAccount? UploadedByUserAccount { get; set; }
}
