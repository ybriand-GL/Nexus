using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class ContraventionsModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "administration");

            migrationBuilder.CreateTable(
                name: "Contravention",
                schema: "administration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NoticeNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    OffenseDate = table.Column<DateTime>(type: "date", nullable: false),
                    DueDate = table.Column<DateTime>(type: "date", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    StatusCode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    OffenseLabel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DriverEmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    MaterialId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contravention", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contravention_Employee_DriverEmployeeId",
                        column: x => x.DriverEmployeeId,
                        principalSchema: "transverse",
                        principalTable: "Employee",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Contravention_Material_MaterialId",
                        column: x => x.MaterialId,
                        principalSchema: "transverse",
                        principalTable: "Material",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.UpdateData(
                schema: "security",
                table: "SecurityModule",
                keyColumn: "Id",
                keyValue: new Guid("e97cef7f-67c9-4604-8987-4061536742db"),
                column: "Code",
                value: "CONTRAVENTIONS");

            migrationBuilder.CreateIndex(
                name: "IX_Contravention_DriverEmployeeId",
                schema: "administration",
                table: "Contravention",
                column: "DriverEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Contravention_MaterialId",
                schema: "administration",
                table: "Contravention",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_Contravention_NoticeNumber",
                schema: "administration",
                table: "Contravention",
                column: "NoticeNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Contravention",
                schema: "administration");

            migrationBuilder.UpdateData(
                schema: "security",
                table: "SecurityModule",
                keyColumn: "Id",
                keyValue: new Guid("e97cef7f-67c9-4604-8987-4061536742db"),
                column: "Code",
                value: "GESTION_CONTRAVENTIONS");
        }
    }
}
