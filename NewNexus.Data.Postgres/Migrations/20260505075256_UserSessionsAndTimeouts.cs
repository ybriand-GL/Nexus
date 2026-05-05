using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class UserSessionsAndTimeouts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SessionTimeoutMinutes",
                schema: "security",
                table: "UserAccount",
                type: "integer",
                nullable: false,
                defaultValue: 60);

            migrationBuilder.CreateTable(
                name: "UserSession",
                schema: "security",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoginAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSeenAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LogoutAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedByUserAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSession", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSession_UserAccount_RevokedByUserAccountId",
                        column: x => x.RevokedByUserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserSession_UserAccount_UserAccountId",
                        column: x => x.UserAccountId,
                        principalSchema: "security",
                        principalTable: "UserAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                schema: "security",
                table: "UserAccount",
                keyColumn: "Id",
                keyValue: new Guid("5f6f6d4b-a2af-4d74-9ab3-6b033463d6a1"),
                column: "SessionTimeoutMinutes",
                value: 60);

            migrationBuilder.CreateIndex(
                name: "IX_UserSession_ExpiresAtUtc",
                schema: "security",
                table: "UserSession",
                column: "ExpiresAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_UserSession_RevokedAtUtc",
                schema: "security",
                table: "UserSession",
                column: "RevokedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_UserSession_RevokedByUserAccountId",
                schema: "security",
                table: "UserSession",
                column: "RevokedByUserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSession_UserAccountId",
                schema: "security",
                table: "UserSession",
                column: "UserAccountId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserSession",
                schema: "security");

            migrationBuilder.DropColumn(
                name: "SessionTimeoutMinutes",
                schema: "security",
                table: "UserAccount");
        }
    }
}
