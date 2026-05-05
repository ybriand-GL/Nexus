using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class EmployeePhoneAndLuccaImport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                schema: "transverse",
                table: "Employee",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                schema: "transverse",
                table: "Employee");
        }
    }
}
