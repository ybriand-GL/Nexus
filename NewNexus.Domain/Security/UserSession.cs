namespace NewNexus.Domain.Security;

public sealed class UserSession
{
    public Guid Id { get; set; }
    public Guid UserAccountId { get; set; }
    public DateTime LoginAtUtc { get; set; }
    public DateTime LastSeenAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? LogoutAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public Guid? RevokedByUserAccountId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public UserAccount? UserAccount { get; set; }
    public UserAccount? RevokedByUserAccount { get; set; }
}
