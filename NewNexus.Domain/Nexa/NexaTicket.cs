using NewNexus.Domain.Security;

namespace NewNexus.Domain.Nexa;

public sealed class NexaTicket
{
    public Guid Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public Guid RequesterUserAccountId { get; set; }
    public string Question { get; set; } = string.Empty;
    public Guid NexaModuleId { get; set; }
    public Guid? NexaCategoryId { get; set; }
    public string PriorityCode { get; set; } = "NORMAL";
    public string StatusCode { get; set; } = "NOUVEAU";
    public Guid? AssignedUserAccountId { get; set; }
    public string? ReferentAnswer { get; set; }
    public DateTime? AnsweredAtUtc { get; set; }
    public DateTime? ValidatedAtUtc { get; set; }
    public DateTime? RejectedAtUtc { get; set; }
    public string? RequesterValidationComment { get; set; }
    public DateTime? ClosedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public UserAccount? RequesterUserAccount { get; set; }
    public UserAccount? AssignedUserAccount { get; set; }
    public NexaModule? NexaModule { get; set; }
    public NexaCategory? NexaCategory { get; set; }
    public ICollection<NexaTicketHistory> History { get; set; } = [];
    public ICollection<NexaTicketComment> Comments { get; set; } = [];
    public ICollection<NexaTicketAttachment> Attachments { get; set; } = [];
}
