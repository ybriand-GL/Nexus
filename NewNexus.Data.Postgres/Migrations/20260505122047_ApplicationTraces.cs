using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class ApplicationTraces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "admin");

            migrationBuilder.CreateTable(
                name: "ApplicationTrace",
                schema: "admin",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StreamCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    StreamLabel = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    EventCode = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Level = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Detail = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Subject = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    ActorUserAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActorLogin = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationTrace", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationTrace_CreatedAtUtc",
                schema: "admin",
                table: "ApplicationTrace",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationTrace_EventCode",
                schema: "admin",
                table: "ApplicationTrace",
                column: "EventCode");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationTrace_StreamCode",
                schema: "admin",
                table: "ApplicationTrace",
                column: "StreamCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApplicationTrace",
                schema: "admin");
        }
    }
}
