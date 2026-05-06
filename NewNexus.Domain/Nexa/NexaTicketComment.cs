using NewNexus.Domain.Security;

namespace NewNexus.Domain.Nexa;

public sealed class NexaTicketComment
{
    public Guid Id { get; set; }
    public Guid NexaTicketId { get; set; }
    public Guid AuthorUserAccountId { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public NexaTicket? NexaTicket { get; set; }
    public UserAccount? AuthorUserAccount { get; set; }
}
