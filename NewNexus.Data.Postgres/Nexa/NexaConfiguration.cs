using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NewNexus.Domain.Nexa;

namespace NewNexus.Data.Postgres.Nexa;

internal sealed class NexaModuleConfiguration : IEntityTypeConfiguration<NexaModule>
{
    public void Configure(EntityTypeBuilder<NexaModule> builder)
    {
        builder.ToTable("NexaModule", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.Code).HasMaxLength(80).IsRequired();
        builder.Property(entity => entity.Label).HasMaxLength(180).IsRequired();
        builder.HasIndex(entity => entity.Code).IsUnique();
        builder.HasData(NexaSeedData.BuildModules());
    }
}

internal sealed class NexaCategoryConfiguration : IEntityTypeConfiguration<NexaCategory>
{
    public void Configure(EntityTypeBuilder<NexaCategory> builder)
    {
        builder.ToTable("NexaCategory", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.Code).HasMaxLength(80).IsRequired();
        builder.Property(entity => entity.Label).HasMaxLength(180).IsRequired();
        builder.HasIndex(entity => entity.Code).IsUnique();
        builder.HasOne(entity => entity.NexaModule)
            .WithMany(module => module.Categories)
            .HasForeignKey(entity => entity.NexaModuleId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasData(NexaSeedData.BuildCategories());
    }
}

internal sealed class NexaConversationConfiguration : IEntityTypeConfiguration<NexaConversation>
{
    public void Configure(EntityTypeBuilder<NexaConversation> builder)
    {
        builder.ToTable("NexaConversation", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.Title).HasMaxLength(240).IsRequired();
        builder.HasIndex(entity => entity.UserAccountId);
        builder.HasIndex(entity => entity.CreatedAtUtc);
        builder.HasOne(entity => entity.UserAccount).WithMany().HasForeignKey(entity => entity.UserAccountId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(entity => entity.NexaModule).WithMany().HasForeignKey(entity => entity.NexaModuleId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class NexaMessageConfiguration : IEntityTypeConfiguration<NexaMessage>
{
    public void Configure(EntityTypeBuilder<NexaMessage> builder)
    {
        builder.ToTable("NexaMessage", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.Role).HasMaxLength(30).IsRequired();
        builder.Property(entity => entity.Content).HasMaxLength(6000).IsRequired();
        builder.Property(entity => entity.SourcesJson).HasMaxLength(4000);
        builder.Property(entity => entity.ConfidenceScore).HasPrecision(5, 2);
        builder.HasIndex(entity => entity.CreatedAtUtc);
        builder.HasOne(entity => entity.NexaConversation).WithMany(conversation => conversation.Messages).HasForeignKey(entity => entity.NexaConversationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.NexaTicket).WithMany().HasForeignKey(entity => entity.NexaTicketId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class NexaTicketConfiguration : IEntityTypeConfiguration<NexaTicket>
{
    public void Configure(EntityTypeBuilder<NexaTicket> builder)
    {
        builder.ToTable("NexaTicket", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.TicketNumber).HasMaxLength(40).IsRequired();
        builder.Property(entity => entity.Question).HasMaxLength(4000).IsRequired();
        builder.Property(entity => entity.PriorityCode).HasMaxLength(40).IsRequired();
        builder.Property(entity => entity.StatusCode).HasMaxLength(60).IsRequired();
        builder.Property(entity => entity.ReferentAnswer).HasMaxLength(6000);
        builder.Property(entity => entity.RequesterValidationComment).HasMaxLength(2000);
        builder.HasIndex(entity => entity.TicketNumber).IsUnique();
        builder.HasIndex(entity => entity.StatusCode);
        builder.HasIndex(entity => entity.CreatedAtUtc);
        builder.HasOne(entity => entity.RequesterUserAccount).WithMany().HasForeignKey(entity => entity.RequesterUserAccountId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(entity => entity.AssignedUserAccount).WithMany().HasForeignKey(entity => entity.AssignedUserAccountId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(entity => entity.NexaModule).WithMany(module => module.Tickets).HasForeignKey(entity => entity.NexaModuleId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(entity => entity.NexaCategory).WithMany().HasForeignKey(entity => entity.NexaCategoryId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class NexaTicketHistoryConfiguration : IEntityTypeConfiguration<NexaTicketHistory>
{
    public void Configure(EntityTypeBuilder<NexaTicketHistory> builder)
    {
        builder.ToTable("NexaTicketHistory", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.ActionCode).HasMaxLength(80).IsRequired();
        builder.Property(entity => entity.FromStatusCode).HasMaxLength(60);
        builder.Property(entity => entity.ToStatusCode).HasMaxLength(60).IsRequired();
        builder.Property(entity => entity.Detail).HasMaxLength(2000);
        builder.HasIndex(entity => entity.CreatedAtUtc);
        builder.HasOne(entity => entity.NexaTicket).WithMany(ticket => ticket.History).HasForeignKey(entity => entity.NexaTicketId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.ActorUserAccount).WithMany().HasForeignKey(entity => entity.ActorUserAccountId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class NexaTicketCommentConfiguration : IEntityTypeConfiguration<NexaTicketComment>
{
    public void Configure(EntityTypeBuilder<NexaTicketComment> builder)
    {
        builder.ToTable("NexaTicketComment", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.Comment).HasMaxLength(3000).IsRequired();
        builder.HasOne(entity => entity.NexaTicket).WithMany(ticket => ticket.Comments).HasForeignKey(entity => entity.NexaTicketId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.AuthorUserAccount).WithMany().HasForeignKey(entity => entity.AuthorUserAccountId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class NexaTicketAttachmentConfiguration : IEntityTypeConfiguration<NexaTicketAttachment>
{
    public void Configure(EntityTypeBuilder<NexaTicketAttachment> builder)
    {
        builder.ToTable("NexaTicketAttachment", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.FileName).HasMaxLength(260).IsRequired();
        builder.Property(entity => entity.ContentType).HasMaxLength(120).IsRequired();
        builder.Property(entity => entity.StoragePath).HasMaxLength(800).IsRequired();
        builder.HasOne(entity => entity.NexaTicket).WithMany(ticket => ticket.Attachments).HasForeignKey(entity => entity.NexaTicketId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.UploadedByUserAccount).WithMany().HasForeignKey(entity => entity.UploadedByUserAccountId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class NexaKnowledgeBaseConfiguration : IEntityTypeConfiguration<NexaKnowledgeBase>
{
    public void Configure(EntityTypeBuilder<NexaKnowledgeBase> builder)
    {
        builder.ToTable("NexaKnowledgeBase", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.OriginalQuestion).HasMaxLength(4000).IsRequired();
        builder.Property(entity => entity.Reformulations).HasMaxLength(4000);
        builder.Property(entity => entity.Answer).HasMaxLength(8000).IsRequired();
        builder.Property(entity => entity.Keywords).HasMaxLength(1000);
        builder.Property(entity => entity.SourceType).HasMaxLength(60).IsRequired();
        builder.Property(entity => entity.StatusCode).HasMaxLength(60).IsRequired();
        builder.Property(entity => entity.ReliabilityScore).HasPrecision(5, 2);
        builder.HasIndex(entity => entity.StatusCode);
        builder.HasIndex(entity => entity.NexaModuleId);
        builder.HasOne(entity => entity.NexaModule).WithMany(module => module.KnowledgeItems).HasForeignKey(entity => entity.NexaModuleId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(entity => entity.NexaCategory).WithMany().HasForeignKey(entity => entity.NexaCategoryId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(entity => entity.SourceTicket).WithMany().HasForeignKey(entity => entity.SourceTicketId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(entity => entity.AuthorUserAccount).WithMany().HasForeignKey(entity => entity.AuthorUserAccountId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(entity => entity.ValidatorUserAccount).WithMany().HasForeignKey(entity => entity.ValidatorUserAccountId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class NexaKnowledgeVersionConfiguration : IEntityTypeConfiguration<NexaKnowledgeVersion>
{
    public void Configure(EntityTypeBuilder<NexaKnowledgeVersion> builder)
    {
        builder.ToTable("NexaKnowledgeVersion", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.QuestionSnapshot).HasMaxLength(4000).IsRequired();
        builder.Property(entity => entity.AnswerSnapshot).HasMaxLength(8000).IsRequired();
        builder.Property(entity => entity.ChangeNote).HasMaxLength(1200);
        builder.HasOne(entity => entity.NexaKnowledgeBase).WithMany(knowledge => knowledge.Versions).HasForeignKey(entity => entity.NexaKnowledgeBaseId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.CreatedByUserAccount).WithMany().HasForeignKey(entity => entity.CreatedByUserAccountId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class NexaKnowledgeFeedbackConfiguration : IEntityTypeConfiguration<NexaKnowledgeFeedback>
{
    public void Configure(EntityTypeBuilder<NexaKnowledgeFeedback> builder)
    {
        builder.ToTable("NexaKnowledgeFeedback", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.Comment).HasMaxLength(2000);
        builder.HasOne(entity => entity.NexaKnowledgeBase).WithMany(knowledge => knowledge.FeedbackItems).HasForeignKey(entity => entity.NexaKnowledgeBaseId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.UserAccount).WithMany().HasForeignKey(entity => entity.UserAccountId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class NexaRoutingRuleConfiguration : IEntityTypeConfiguration<NexaRoutingRule>
{
    public void Configure(EntityTypeBuilder<NexaRoutingRule> builder)
    {
        builder.ToTable("NexaRoutingRule", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.KeywordPattern).HasMaxLength(500);
        builder.Property(entity => entity.RequesterProfileCode).HasMaxLength(80);
        builder.Property(entity => entity.PriorityCode).HasMaxLength(40);
        builder.HasIndex(entity => entity.IsActive);
        builder.HasOne(entity => entity.NexaModule).WithMany(module => module.RoutingRules).HasForeignKey(entity => entity.NexaModuleId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(entity => entity.NexaCategory).WithMany().HasForeignKey(entity => entity.NexaCategoryId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(entity => entity.ReferentUserAccount).WithMany().HasForeignKey(entity => entity.ReferentUserAccountId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(entity => entity.SecondaryReferentUserAccount).WithMany().HasForeignKey(entity => entity.SecondaryReferentUserAccountId).OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class NexaReferentConfiguration : IEntityTypeConfiguration<NexaReferent>
{
    public void Configure(EntityTypeBuilder<NexaReferent> builder)
    {
        builder.ToTable("NexaReferent", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.HasIndex(entity => new { entity.NexaModuleId, entity.UserAccountId }).IsUnique();
        builder.HasOne(entity => entity.NexaModule).WithMany(module => module.Referents).HasForeignKey(entity => entity.NexaModuleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(entity => entity.UserAccount).WithMany().HasForeignKey(entity => entity.UserAccountId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class NexaEmbeddingIndexConfiguration : IEntityTypeConfiguration<NexaEmbeddingIndex>
{
    public void Configure(EntityTypeBuilder<NexaEmbeddingIndex> builder)
    {
        builder.ToTable("NexaEmbeddingIndex", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.Provider).HasMaxLength(80).IsRequired();
        builder.Property(entity => entity.Model).HasMaxLength(160).IsRequired();
        builder.Property(entity => entity.VectorJson).HasMaxLength(16000).IsRequired();
        builder.HasOne(entity => entity.NexaKnowledgeBase).WithMany().HasForeignKey(entity => entity.NexaKnowledgeBaseId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class NexaAiLogConfiguration : IEntityTypeConfiguration<NexaAiLog>
{
    public void Configure(EntityTypeBuilder<NexaAiLog> builder)
    {
        builder.ToTable("NexaAiLog", "nexa");
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.EventCode).HasMaxLength(80).IsRequired();
        builder.Property(entity => entity.Question).HasMaxLength(4000).IsRequired();
        builder.Property(entity => entity.Response).HasMaxLength(8000);
        builder.Property(entity => entity.SourcesJson).HasMaxLength(4000);
        builder.Property(entity => entity.Mode).HasMaxLength(80).IsRequired();
        builder.Property(entity => entity.ConfidenceScore).HasPrecision(5, 2);
        builder.HasIndex(entity => entity.CreatedAtUtc);
        builder.HasIndex(entity => entity.UserAccountId);
    }
}
