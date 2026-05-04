using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class PasswordResetRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordResetConsumedAtUtc",
                schema: "security",
                table: "UserAccount",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordResetExpiresAtUtc",
                schema: "security",
                table: "UserAccount",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordResetRequestedAtUtc",
                schema: "security",
                table: "UserAccount",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetTokenHash",
                schema: "security",
                table: "UserAccount",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.UpdateData(
                schema: "security",
                table: "UserAccount",
                keyColumn: "Id",
                keyValue: new Guid("5f6f6d4b-a2af-4d74-9ab3-6b033463d6a1"),
                columns: new[] { "PasswordResetConsumedAtUtc", "PasswordResetExpiresAtUtc", "PasswordResetRequestedAtUtc", "PasswordResetTokenHash" },
                values: new object[] { null, null, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_UserAccount_PasswordResetTokenHash",
                schema: "security",
                table: "UserAccount",
                column: "PasswordResetTokenHash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserAccount_PasswordResetTokenHash",
                schema: "security",
                table: "UserAccount");

            migrationBuilder.DropColumn(
                name: "PasswordResetConsumedAtUtc",
                schema: "security",
                table: "UserAccount");

            migrationBuilder.DropColumn(
                name: "PasswordResetExpiresAtUtc",
                schema: "security",
                table: "UserAccount");

            migrationBuilder.DropColumn(
                name: "PasswordResetRequestedAtUtc",
                schema: "security",
                table: "UserAccount");

            migrationBuilder.DropColumn(
                name: "PasswordResetTokenHash",
                schema: "security",
                table: "UserAccount");
        }
    }
}
