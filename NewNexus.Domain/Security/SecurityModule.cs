namespace NewNexus.Domain.Security;

public sealed class SecurityModule
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string NavigationGroup { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<SecurityProfileModuleRight> ProfileRights { get; set; } = [];
}
