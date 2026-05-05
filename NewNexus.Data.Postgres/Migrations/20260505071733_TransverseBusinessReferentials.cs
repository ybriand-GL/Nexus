using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class TransverseBusinessReferentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Employee",
                schema: "transverse",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceEmployeeId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    EmployeeNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsDriver = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LastSyncedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employee", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Material",
                schema: "transverse",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FleetNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    MaterialType = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    RegistrationNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    SourceSystem = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LastSyncedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExploitationId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Material", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Material_Exploitation_ExploitationId",
                        column: x => x.ExploitationId,
                        principalSchema: "transverse",
                        principalTable: "Exploitation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ThirdParty",
                schema: "transverse",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TypeCode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Siren = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: true),
                    VatNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ExternalReference = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    IsForeignCompany = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThirdParty", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ThirdPartyAnalytic",
                schema: "transverse",
                columns: table => new
                {
                    ThirdPartyId = table.Column<Guid>(type: "uuid", nullable: false),
                    AnalyticId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThirdPartyAnalytic", x => new { x.ThirdPartyId, x.AnalyticId });
                    table.ForeignKey(
                        name: "FK_ThirdPartyAnalytic_Analytic_AnalyticId",
                        column: x => x.AnalyticId,
                        principalSchema: "transverse",
                        principalTable: "Analytic",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ThirdPartyAnalytic_ThirdParty_ThirdPartyId",
                        column: x => x.ThirdPartyId,
                        principalSchema: "transverse",
                        principalTable: "ThirdParty",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Employee_EmployeeNumber",
                schema: "transverse",
                table: "Employee",
                column: "EmployeeNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employee_SourceEmployeeId",
                schema: "transverse",
                table: "Employee",
                column: "SourceEmployeeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Material_ExploitationId",
                schema: "transverse",
                table: "Material",
                column: "ExploitationId");

            migrationBuilder.CreateIndex(
                name: "IX_Material_FleetNumber",
                schema: "transverse",
                table: "Material",
                column: "FleetNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ThirdParty_Siren",
                schema: "transverse",
                table: "ThirdParty",
                column: "Siren");

            migrationBuilder.CreateIndex(
                name: "IX_ThirdParty_TypeCode_DisplayName",
                schema: "transverse",
                table: "ThirdParty",
                columns: new[] { "TypeCode", "DisplayName" });

            migrationBuilder.CreateIndex(
                name: "IX_ThirdPartyAnalytic_AnalyticId",
                schema: "transverse",
                table: "ThirdPartyAnalytic",
                column: "AnalyticId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Employee",
                schema: "transverse");

            migrationBuilder.DropTable(
                name: "Material",
                schema: "transverse");

            migrationBuilder.DropTable(
                name: "ThirdPartyAnalytic",
                schema: "transverse");

            migrationBuilder.DropTable(
                name: "ThirdParty",
                schema: "transverse");
        }
    }
}
