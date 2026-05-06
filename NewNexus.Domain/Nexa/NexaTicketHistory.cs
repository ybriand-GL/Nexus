using NewNexus.Domain.Security;

namespace NewNexus.Domain.Nexa;

public sealed class NexaTicketHistory
{
    public Guid Id { get; set; }
    public Guid NexaTicketId { get; set; }
    public string ActionCode { get; set; } = string.Empty;
    public string? FromStatusCode { get; set; }
    public string ToStatusCode { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public Guid? ActorUserAccountId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public NexaTicket? NexaTicket { get; set; }
    public UserAccount? ActorUserAccount { get; set; }
}
