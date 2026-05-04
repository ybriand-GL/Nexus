namespace NewNexus.Domain.Security;

public sealed class UserAccount
{
    public Guid Id { get; set; }
    public string Login { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? EmployeeNumber { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public bool MustChangePassword { get; set; } = true;
    public Guid? SecurityProfileId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
    public DateTime? LastSyncedAtUtc { get; set; }
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetRequestedAtUtc { get; set; }
    public DateTime? PasswordResetExpiresAtUtc { get; set; }
    public DateTime? PasswordResetConsumedAtUtc { get; set; }

    public SecurityProfile? SecurityProfile { get; set; }
}
