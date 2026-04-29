namespace NewNexus.Domain.Security;

public sealed class SecurityProfile
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsSystemProfile { get; set; } = true;
    public bool IsActive { get; set; } = true;

    public ICollection<SecurityProfileModuleRight> ModuleRights { get; set; } = [];
    public ICollection<UserAccount> UserAccounts { get; set; } = [];
}
