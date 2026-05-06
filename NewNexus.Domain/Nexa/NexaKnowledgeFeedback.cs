using NewNexus.Domain.Security;

namespace NewNexus.Domain.Nexa;

public sealed class NexaKnowledgeFeedback
{
    public Guid Id { get; set; }
    public Guid NexaKnowledgeBaseId { get; set; }
    public Guid UserAccountId { get; set; }
    public bool IsPositive { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public NexaKnowledgeBase? NexaKnowledgeBase { get; set; }
    public UserAccount? UserAccount { get; set; }
}
