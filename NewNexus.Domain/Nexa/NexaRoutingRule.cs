using NewNexus.Domain.Security;

namespace NewNexus.Domain.Nexa;

public sealed class NexaRoutingRule
{
    public Guid Id { get; set; }
    public Guid? NexaModuleId { get; set; }
    public Guid? NexaCategoryId { get; set; }
    public string? KeywordPattern { get; set; }
    public string? RequesterProfileCode { get; set; }
    public string? PriorityCode { get; set; }
    public Guid ReferentUserAccountId { get; set; }
    public Guid? SecondaryReferentUserAccountId { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public NexaModule? NexaModule { get; set; }
    public NexaCategory? NexaCategory { get; set; }
    public UserAccount? ReferentUserAccount { get; set; }
    public UserAccount? SecondaryReferentUserAccount { get; set; }
}
