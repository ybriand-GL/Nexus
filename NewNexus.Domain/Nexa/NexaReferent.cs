using NewNexus.Domain.Security;

namespace NewNexus.Domain.Nexa;

public sealed class NexaReferent
{
    public Guid Id { get; set; }
    public Guid NexaModuleId { get; set; }
    public Guid UserAccountId { get; set; }
    public bool IsPrimary { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public NexaModule? NexaModule { get; set; }
    public UserAccount? UserAccount { get; set; }
}
