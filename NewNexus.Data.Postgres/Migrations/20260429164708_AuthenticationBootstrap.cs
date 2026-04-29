using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class AuthenticationBootstrap : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginAtUtc",
                schema: "security",
                table: "UserAccount",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                schema: "security",
                table: "UserAccount",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                schema: "security",
                table: "UserAccount",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.InsertData(
                schema: "security",
                table: "UserAccount",
                columns: new[] { "Id", "CreatedAtUtc", "DisplayName", "Email", "EmployeeNumber", "IsActive", "LastLoginAtUtc", "LastSyncedAtUtc", "Login", "MustChangePassword", "PasswordHash", "SecurityProfileId" },
                values: new object[] { new Guid("5f6f6d4b-a2af-4d74-9ab3-6b033463d6a1"), new DateTime(2026, 4, 29, 0, 0, 0, 0, DateTimeKind.Utc), "Administrateur système", null, null, true, null, null, "admin", true, "100000.T4PL0v0v1mGm2O8x2M8vMw==.xdyoWj/llsa9F5KoRoeZc8mUL29qNlCKh8LzHxzd8MM=", new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "security",
                table: "UserAccount",
                keyColumn: "Id",
                keyValue: new Guid("5f6f6d4b-a2af-4d74-9ab3-6b033463d6a1"));

            migrationBuilder.DropColumn(
                name: "LastLoginAtUtc",
                schema: "security",
                table: "UserAccount");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                schema: "security",
                table: "UserAccount");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                schema: "security",
                table: "UserAccount");
        }
    }
}
