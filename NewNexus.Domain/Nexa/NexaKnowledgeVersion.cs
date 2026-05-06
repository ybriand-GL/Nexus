using NewNexus.Domain.Security;

namespace NewNexus.Domain.Nexa;

public sealed class NexaKnowledgeVersion
{
    public Guid Id { get; set; }
    public Guid NexaKnowledgeBaseId { get; set; }
    public int Version { get; set; }
    public string QuestionSnapshot { get; set; } = string.Empty;
    public string AnswerSnapshot { get; set; } = string.Empty;
    public string? ChangeNote { get; set; }
    public Guid? CreatedByUserAccountId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public NexaKnowledgeBase? NexaKnowledgeBase { get; set; }
    public UserAccount? CreatedByUserAccount { get; set; }
}
