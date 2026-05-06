namespace NewNexus.Domain.Nexa;

public sealed class NexaModule
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsIndexable { get; set; } = true;
    public int DisplayOrder { get; set; }

    public ICollection<NexaCategory> Categories { get; set; } = [];
    public ICollection<NexaTicket> Tickets { get; set; } = [];
    public ICollection<NexaKnowledgeBase> KnowledgeItems { get; set; } = [];
    public ICollection<NexaRoutingRule> RoutingRules { get; set; } = [];
    public ICollection<NexaReferent> Referents { get; set; } = [];
}
