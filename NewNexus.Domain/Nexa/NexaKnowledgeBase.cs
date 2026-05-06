using NewNexus.Domain.Security;

namespace NewNexus.Domain.Nexa;

public sealed class NexaKnowledgeBase
{
    public Guid Id { get; set; }
    public string OriginalQuestion { get; set; } = string.Empty;
    public string? Reformulations { get; set; }
    public string Answer { get; set; } = string.Empty;
    public Guid NexaModuleId { get; set; }
    public Guid? NexaCategoryId { get; set; }
    public string? Keywords { get; set; }
    public string SourceType { get; set; } = "MANUAL";
    public Guid? SourceTicketId { get; set; }
    public Guid? AuthorUserAccountId { get; set; }
    public Guid? ValidatorUserAccountId { get; set; }
    public DateTime? ValidatedAtUtc { get; set; }
    public int Version { get; set; } = 1;
    public string StatusCode { get; set; } = "BROUILLON";
    public decimal ReliabilityScore { get; set; } = 0.8m;
    public DateTime? LastUsedAtUtc { get; set; }
    public int UsageCount { get; set; }
    public int PositiveFeedbackCount { get; set; }
    public int NegativeFeedbackCount { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public NexaModule? NexaModule { get; set; }
    public NexaCategory? NexaCategory { get; set; }
    public NexaTicket? SourceTicket { get; set; }
    public UserAccount? AuthorUserAccount { get; set; }
    public UserAccount? ValidatorUserAccount { get; set; }
    public ICollection<NexaKnowledgeVersion> Versions { get; set; } = [];
    public ICollection<NexaKnowledgeFeedback> FeedbackItems { get; set; } = [];
}
