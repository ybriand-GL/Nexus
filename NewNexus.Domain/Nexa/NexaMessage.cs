namespace NewNexus.Domain.Nexa;

public sealed class NexaMessage
{
    public Guid Id { get; set; }
    public Guid NexaConversationId { get; set; }
    public Guid? NexaTicketId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public decimal? ConfidenceScore { get; set; }
    public string? SourcesJson { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public NexaConversation? NexaConversation { get; set; }
    public NexaTicket? NexaTicket { get; set; }
}
