using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class NexaTicketingMvp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "nexa");

            migrationBuilder.CreateTable(
                name: "NexaAiLog",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaConversationId = table.Column<Guid>(type: "uuid", nullable: true),
                    NexaTicketId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Question = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Response = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: true),
                    SourcesJson = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    ConfidenceScore = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    Mode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaAiLog", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NexaModule",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Label = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsIndexable = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaModule", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NexaCategory",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaModuleId = table.Column<Guid>(type: "uuid", nullable: true),
                    Code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Label = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaCategory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaCategory_NexaModule_NexaModuleId",
                        column: x => x.NexaModuleId,
                        principalSchema: "nexa",
                        principalTable: "NexaModule",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "NexaConversation",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaModuleId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastMessageAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaConversation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaConversation_NexaModule_NexaModuleId",
                        column: x => x.NexaModuleId,
                        principalSchema: "nexa",
                        principalTable: "NexaModule",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NexaConversation_UserAccount_UserAccountId",
                        column: x => x.UserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NexaReferent",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaModuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaReferent", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaReferent_NexaModule_NexaModuleId",
                        column: x => x.NexaModuleId,
                        principalSchema: "nexa",
                        principalTable: "NexaModule",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NexaReferent_UserAccount_UserAccountId",
                        column: x => x.UserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NexaRoutingRule",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaModuleId = table.Column<Guid>(type: "uuid", nullable: true),
                    NexaCategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    KeywordPattern = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RequesterProfileCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    PriorityCode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ReferentUserAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    SecondaryReferentUserAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaRoutingRule", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaRoutingRule_NexaCategory_NexaCategoryId",
                        column: x => x.NexaCategoryId,
                        principalSchema: "nexa",
                        principalTable: "NexaCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NexaRoutingRule_NexaModule_NexaModuleId",
                        column: x => x.NexaModuleId,
                        principalSchema: "nexa",
                        principalTable: "NexaModule",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NexaRoutingRule_UserAccount_ReferentUserAccountId",
                        column: x => x.ReferentUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NexaRoutingRule_UserAccount_SecondaryReferentUserAccountId",
                        column: x => x.SecondaryReferentUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "NexaTicket",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TicketNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RequesterUserAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    Question = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    NexaModuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaCategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    PriorityCode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    StatusCode = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    AssignedUserAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReferentAnswer = table.Column<string>(type: "character varying(6000)", maxLength: 6000, nullable: true),
                    AnsweredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ValidatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RejectedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RequesterValidationComment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ClosedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaTicket", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaTicket_NexaCategory_NexaCategoryId",
                        column: x => x.NexaCategoryId,
                        principalSchema: "nexa",
                        principalTable: "NexaCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NexaTicket_NexaModule_NexaModuleId",
                        column: x => x.NexaModuleId,
                        principalSchema: "nexa",
                        principalTable: "NexaModule",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NexaTicket_UserAccount_AssignedUserAccountId",
                        column: x => x.AssignedUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NexaTicket_UserAccount_RequesterUserAccountId",
                        column: x => x.RequesterUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NexaKnowledgeBase",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalQuestion = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Reformulations = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Answer = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    NexaModuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaCategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    Keywords = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SourceType = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    SourceTicketId = table.Column<Guid>(type: "uuid", nullable: true),
                    AuthorUserAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    ValidatorUserAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    ValidatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    StatusCode = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    ReliabilityScore = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    LastUsedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UsageCount = table.Column<int>(type: "integer", nullable: false),
                    PositiveFeedbackCount = table.Column<int>(type: "integer", nullable: false),
                    NegativeFeedbackCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaKnowledgeBase", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaKnowledgeBase_NexaCategory_NexaCategoryId",
                        column: x => x.NexaCategoryId,
                        principalSchema: "nexa",
                        principalTable: "NexaCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NexaKnowledgeBase_NexaModule_NexaModuleId",
                        column: x => x.NexaModuleId,
                        principalSchema: "nexa",
                        principalTable: "NexaModule",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NexaKnowledgeBase_NexaTicket_SourceTicketId",
                        column: x => x.SourceTicketId,
                        principalSchema: "nexa",
                        principalTable: "NexaTicket",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NexaKnowledgeBase_UserAccount_AuthorUserAccountId",
                        column: x => x.AuthorUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NexaKnowledgeBase_UserAccount_ValidatorUserAccountId",
                        column: x => x.ValidatorUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "NexaMessage",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaTicketId = table.Column<Guid>(type: "uuid", nullable: true),
                    Role = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Content = table.Column<string>(type: "character varying(6000)", maxLength: 6000, nullable: false),
                    ConfidenceScore = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    SourcesJson = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaMessage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaMessage_NexaConversation_NexaConversationId",
                        column: x => x.NexaConversationId,
                        principalSchema: "nexa",
                        principalTable: "NexaConversation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NexaMessage_NexaTicket_NexaTicketId",
                        column: x => x.NexaTicketId,
                        principalSchema: "nexa",
                        principalTable: "NexaTicket",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "NexaTicketAttachment",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaTicketId = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedByUserAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    StoragePath = table.Column<string>(type: "character varying(800)", maxLength: 800, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaTicketAttachment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaTicketAttachment_NexaTicket_NexaTicketId",
                        column: x => x.NexaTicketId,
                        principalSchema: "nexa",
                        principalTable: "NexaTicket",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NexaTicketAttachment_UserAccount_UploadedByUserAccountId",
                        column: x => x.UploadedByUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NexaTicketComment",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaTicketId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    Comment = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaTicketComment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaTicketComment_NexaTicket_NexaTicketId",
                        column: x => x.NexaTicketId,
                        principalSchema: "nexa",
                        principalTable: "NexaTicket",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NexaTicketComment_UserAccount_AuthorUserAccountId",
                        column: x => x.AuthorUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NexaTicketHistory",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaTicketId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActionCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    FromStatusCode = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    ToStatusCode = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Detail = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ActorUserAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaTicketHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaTicketHistory_NexaTicket_NexaTicketId",
                        column: x => x.NexaTicketId,
                        principalSchema: "nexa",
                        principalTable: "NexaTicket",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NexaTicketHistory_UserAccount_ActorUserAccountId",
                        column: x => x.ActorUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "NexaEmbeddingIndex",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaKnowledgeBaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Model = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    VectorJson = table.Column<string>(type: "character varying(16000)", maxLength: 16000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaEmbeddingIndex", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaEmbeddingIndex_NexaKnowledgeBase_NexaKnowledgeBaseId",
                        column: x => x.NexaKnowledgeBaseId,
                        principalSchema: "nexa",
                        principalTable: "NexaKnowledgeBase",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NexaKnowledgeFeedback",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaKnowledgeBaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsPositive = table.Column<bool>(type: "boolean", nullable: false),
                    Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaKnowledgeFeedback", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaKnowledgeFeedback_NexaKnowledgeBase_NexaKnowledgeBaseId",
                        column: x => x.NexaKnowledgeBaseId,
                        principalSchema: "nexa",
                        principalTable: "NexaKnowledgeBase",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NexaKnowledgeFeedback_UserAccount_UserAccountId",
                        column: x => x.UserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NexaKnowledgeVersion",
                schema: "nexa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NexaKnowledgeBaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    QuestionSnapshot = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    AnswerSnapshot = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    ChangeNote = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: true),
                    CreatedByUserAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NexaKnowledgeVersion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NexaKnowledgeVersion_NexaKnowledgeBase_NexaKnowledgeBaseId",
                        column: x => x.NexaKnowledgeBaseId,
                        principalSchema: "nexa",
                        principalTable: "NexaKnowledgeBase",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NexaKnowledgeVersion_UserAccount_CreatedByUserAccountId",
                        column: x => x.CreatedByUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                schema: "nexa",
                table: "NexaCategory",
                columns: new[] { "Id", "Code", "DisplayOrder", "IsActive", "Label", "NexaModuleId" },
                values: new object[,]
                {
                    { new Guid("05f5bdf6-3081-48eb-a2fe-7fa7d17f1a92"), "LOGICIEL", 2, true, "Logiciel", null },
                    { new Guid("70ad54cb-0221-4858-8b90-f7b8fcd2f728"), "DOCUMENTAIRE", 3, true, "Documentaire", null },
                    { new Guid("a1149792-48a2-4529-8bb6-64c82d8bd7fa"), "INCIDENT", 4, true, "Incident", null },
                    { new Guid("ecf86fa9-5f1d-4102-bd4e-33a245dc195c"), "METIER", 1, true, "Metier", null }
                });

            migrationBuilder.InsertData(
                schema: "nexa",
                table: "NexaModule",
                columns: new[] { "Id", "Code", "DisplayOrder", "IsActive", "IsIndexable", "Label" },
                values: new object[,]
                {
                    { new Guid("40188f75-c370-4694-b118-f0039701d878"), "DOCUMENTATION", 6, true, true, "Documentation" },
                    { new Guid("439c86cf-7957-4df8-a7c7-12842a7fce11"), "CONTRAVENTIONS", 1, true, true, "Contraventions" },
                    { new Guid("5af7436f-3938-4462-a12b-5fd6c42a5d4a"), "CONDUCTEURS", 2, true, true, "Conducteurs" },
                    { new Guid("67c19789-7608-46bb-81ea-76da2b195802"), "TRACTEURS", 3, true, true, "Tracteurs" },
                    { new Guid("7402f99d-57e4-4ae1-a0ef-303e89cd51ab"), "POINTS_CHARGEMENT_DECHARGEMENT", 4, true, true, "Points de chargement / dechargement" },
                    { new Guid("a6fe298a-f9fb-4307-8fcb-a7c59fd7553b"), "ADMINISTRATION", 5, true, true, "Administration" },
                    { new Guid("e63c60cb-fc61-45e0-a4ee-9571d9d59252"), "AUTRE", 99, true, true, "Autre" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_NexaAiLog_CreatedAtUtc",
                schema: "nexa",
                table: "NexaAiLog",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_NexaAiLog_UserAccountId",
                schema: "nexa",
                table: "NexaAiLog",
                column: "UserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaCategory_Code",
                schema: "nexa",
                table: "NexaCategory",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NexaCategory_NexaModuleId",
                schema: "nexa",
                table: "NexaCategory",
                column: "NexaModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaConversation_CreatedAtUtc",
                schema: "nexa",
                table: "NexaConversation",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_NexaConversation_NexaModuleId",
                schema: "nexa",
                table: "NexaConversation",
                column: "NexaModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaConversation_UserAccountId",
                schema: "nexa",
                table: "NexaConversation",
                column: "UserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaEmbeddingIndex_NexaKnowledgeBaseId",
                schema: "nexa",
                table: "NexaEmbeddingIndex",
                column: "NexaKnowledgeBaseId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaKnowledgeBase_AuthorUserAccountId",
                schema: "nexa",
                table: "NexaKnowledgeBase",
                column: "AuthorUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaKnowledgeBase_NexaCategoryId",
                schema: "nexa",
                table: "NexaKnowledgeBase",
                column: "NexaCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaKnowledgeBase_NexaModuleId",
                schema: "nexa",
                table: "NexaKnowledgeBase",
                column: "NexaModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaKnowledgeBase_SourceTicketId",
                schema: "nexa",
                table: "NexaKnowledgeBase",
                column: "SourceTicketId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaKnowledgeBase_StatusCode",
                schema: "nexa",
                table: "NexaKnowledgeBase",
                column: "StatusCode");

            migrationBuilder.CreateIndex(
                name: "IX_NexaKnowledgeBase_ValidatorUserAccountId",
                schema: "nexa",
                table: "NexaKnowledgeBase",
                column: "ValidatorUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaKnowledgeFeedback_NexaKnowledgeBaseId",
                schema: "nexa",
                table: "NexaKnowledgeFeedback",
                column: "NexaKnowledgeBaseId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaKnowledgeFeedback_UserAccountId",
                schema: "nexa",
                table: "NexaKnowledgeFeedback",
                column: "UserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaKnowledgeVersion_CreatedByUserAccountId",
                schema: "nexa",
                table: "NexaKnowledgeVersion",
                column: "CreatedByUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaKnowledgeVersion_NexaKnowledgeBaseId",
                schema: "nexa",
                table: "NexaKnowledgeVersion",
                column: "NexaKnowledgeBaseId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaMessage_CreatedAtUtc",
                schema: "nexa",
                table: "NexaMessage",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_NexaMessage_NexaConversationId",
                schema: "nexa",
                table: "NexaMessage",
                column: "NexaConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaMessage_NexaTicketId",
                schema: "nexa",
                table: "NexaMessage",
                column: "NexaTicketId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaModule_Code",
                schema: "nexa",
                table: "NexaModule",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NexaReferent_NexaModuleId_UserAccountId",
                schema: "nexa",
                table: "NexaReferent",
                columns: new[] { "NexaModuleId", "UserAccountId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NexaReferent_UserAccountId",
                schema: "nexa",
                table: "NexaReferent",
                column: "UserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaRoutingRule_IsActive",
                schema: "nexa",
                table: "NexaRoutingRule",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_NexaRoutingRule_NexaCategoryId",
                schema: "nexa",
                table: "NexaRoutingRule",
                column: "NexaCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaRoutingRule_NexaModuleId",
                schema: "nexa",
                table: "NexaRoutingRule",
                column: "NexaModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaRoutingRule_ReferentUserAccountId",
                schema: "nexa",
                table: "NexaRoutingRule",
                column: "ReferentUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaRoutingRule_SecondaryReferentUserAccountId",
                schema: "nexa",
                table: "NexaRoutingRule",
                column: "SecondaryReferentUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicket_AssignedUserAccountId",
                schema: "nexa",
                table: "NexaTicket",
                column: "AssignedUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicket_CreatedAtUtc",
                schema: "nexa",
                table: "NexaTicket",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicket_NexaCategoryId",
                schema: "nexa",
                table: "NexaTicket",
                column: "NexaCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicket_NexaModuleId",
                schema: "nexa",
                table: "NexaTicket",
                column: "NexaModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicket_RequesterUserAccountId",
                schema: "nexa",
                table: "NexaTicket",
                column: "RequesterUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicket_StatusCode",
                schema: "nexa",
                table: "NexaTicket",
                column: "StatusCode");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicket_TicketNumber",
                schema: "nexa",
                table: "NexaTicket",
                column: "TicketNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicketAttachment_NexaTicketId",
                schema: "nexa",
                table: "NexaTicketAttachment",
                column: "NexaTicketId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicketAttachment_UploadedByUserAccountId",
                schema: "nexa",
                table: "NexaTicketAttachment",
                column: "UploadedByUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicketComment_AuthorUserAccountId",
                schema: "nexa",
                table: "NexaTicketComment",
                column: "AuthorUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicketComment_NexaTicketId",
                schema: "nexa",
                table: "NexaTicketComment",
                column: "NexaTicketId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicketHistory_ActorUserAccountId",
                schema: "nexa",
                table: "NexaTicketHistory",
                column: "ActorUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicketHistory_CreatedAtUtc",
                schema: "nexa",
                table: "NexaTicketHistory",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_NexaTicketHistory_NexaTicketId",
                schema: "nexa",
                table: "NexaTicketHistory",
                column: "NexaTicketId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NexaAiLog",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaEmbeddingIndex",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaKnowledgeFeedback",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaKnowledgeVersion",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaMessage",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaReferent",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaRoutingRule",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaTicketAttachment",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaTicketComment",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaTicketHistory",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaKnowledgeBase",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaConversation",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaTicket",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaCategory",
                schema: "nexa");

            migrationBuilder.DropTable(
                name: "NexaModule",
                schema: "nexa");
        }
    }
}
