using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class LoadingPointsModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "exploitation");

            migrationBuilder.CreateTable(
                name: "LoadingPoint",
                schema: "exploitation",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PointTypeCode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    AddressLine = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    City = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CountryCode = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    Latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    Longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ThirdPartyId = table.Column<Guid>(type: "uuid", nullable: true),
                    ExploitationId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoadingPoint", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoadingPoint_Exploitation_ExploitationId",
                        column: x => x.ExploitationId,
                        principalSchema: "transverse",
                        principalTable: "Exploitation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LoadingPoint_ThirdParty_ThirdPartyId",
                        column: x => x.ThirdPartyId,
                        principalSchema: "transverse",
                        principalTable: "ThirdParty",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoadingPoint_Code",
                schema: "exploitation",
                table: "LoadingPoint",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LoadingPoint_ExploitationId",
                schema: "exploitation",
                table: "LoadingPoint",
                column: "ExploitationId");

            migrationBuilder.CreateIndex(
                name: "IX_LoadingPoint_PointTypeCode_City",
                schema: "exploitation",
                table: "LoadingPoint",
                columns: new[] { "PointTypeCode", "City" });

            migrationBuilder.CreateIndex(
                name: "IX_LoadingPoint_ThirdPartyId",
                schema: "exploitation",
                table: "LoadingPoint",
                column: "ThirdPartyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoadingPoint",
                schema: "exploitation");
        }
    }
}
