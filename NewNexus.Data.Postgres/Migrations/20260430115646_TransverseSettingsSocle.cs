using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class TransverseSettingsSocle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "transverse");

            migrationBuilder.CreateTable(
                name: "Company",
                schema: "transverse",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Siren = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LegalName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Company", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Analytic",
                schema: "transverse",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Analytic", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Analytic_Company_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "transverse",
                        principalTable: "Company",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Exploitation",
                schema: "transverse",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exploitation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Exploitation_Company_CompanyId",
                        column: x => x.CompanyId,
                        principalSchema: "transverse",
                        principalTable: "Company",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Analytic_Code",
                schema: "transverse",
                table: "Analytic",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Analytic_CompanyId",
                schema: "transverse",
                table: "Analytic",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Company_Siren",
                schema: "transverse",
                table: "Company",
                column: "Siren",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Exploitation_Code",
                schema: "transverse",
                table: "Exploitation",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Exploitation_CompanyId",
                schema: "transverse",
                table: "Exploitation",
                column: "CompanyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Analytic",
                schema: "transverse");

            migrationBuilder.DropTable(
                name: "Exploitation",
                schema: "transverse");

            migrationBuilder.DropTable(
                name: "Company",
                schema: "transverse");
        }
    }
}
