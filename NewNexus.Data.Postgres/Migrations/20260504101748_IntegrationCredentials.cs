using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class IntegrationCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IntegrationCredential",
                schema: "transverse",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProviderCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ProviderLabel = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    KeyName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ProtectedValue = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    IsSecret = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Source = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastImportedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IntegrationCredential", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IntegrationCredential_ProviderCode_KeyName",
                schema: "transverse",
                table: "IntegrationCredential",
                columns: new[] { "ProviderCode", "KeyName" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IntegrationCredential",
                schema: "transverse");
        }
    }
}
