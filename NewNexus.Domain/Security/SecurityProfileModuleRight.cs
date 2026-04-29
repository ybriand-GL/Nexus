namespace NewNexus.Domain.Security;

public sealed class SecurityProfileModuleRight
{
    public Guid Id { get; set; }
    public Guid SecurityProfileId { get; set; }
    public Guid SecurityModuleId { get; set; }
    public ModuleAccessLevel AccessLevel { get; set; }

    public SecurityProfile? SecurityProfile { get; set; }
    public SecurityModule? SecurityModule { get; set; }
}
