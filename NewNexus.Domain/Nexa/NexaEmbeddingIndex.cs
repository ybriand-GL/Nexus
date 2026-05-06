namespace NewNexus.Domain.Nexa;

public sealed class NexaEmbeddingIndex
{
    public Guid Id { get; set; }
    public Guid NexaKnowledgeBaseId { get; set; }
    public string Provider { get; set; } = "LOCAL";
    public string Model { get; set; } = string.Empty;
    public string VectorJson { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public NexaKnowledgeBase? NexaKnowledgeBase { get; set; }
}
