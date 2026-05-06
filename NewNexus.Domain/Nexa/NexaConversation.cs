using NewNexus.Domain.Security;

namespace NewNexus.Domain.Nexa;

public sealed class NexaConversation
{
    public Guid Id { get; set; }
    public Guid UserAccountId { get; set; }
    public Guid? NexaModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAtUtc { get; set; } = DateTime.UtcNow;

    public UserAccount? UserAccount { get; set; }
    public NexaModule? NexaModule { get; set; }
    public ICollection<NexaMessage> Messages { get; set; } = [];
}
