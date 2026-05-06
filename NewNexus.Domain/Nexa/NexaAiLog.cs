namespace NewNexus.Domain.Nexa;

public sealed class NexaAiLog
{
    public Guid Id { get; set; }
    public Guid UserAccountId { get; set; }
    public Guid? NexaConversationId { get; set; }
    public Guid? NexaTicketId { get; set; }
    public string EventCode { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string? Response { get; set; }
    public string? SourcesJson { get; set; }
    public decimal? ConfidenceScore { get; set; }
    public string Mode { get; set; } = "knowledge-base";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
