using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class UserSidebarPreference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSidebarCollapsed",
                schema: "security",
                table: "UserAccount",
                type: "boolean",
                nullable: false,
                defaultValue: false);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSidebarCollapsed",
                schema: "security",
                table: "UserAccount");
        }
    }
}
