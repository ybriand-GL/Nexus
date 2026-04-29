using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class InitialSecuritySocle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "security");

            migrationBuilder.CreateTable(
                name: "SecurityModule",
                schema: "security",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NavigationGroup = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityModule", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SecurityProfile",
                schema: "security",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsSystemProfile = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityProfile", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SecurityProfileModuleRight",
                schema: "security",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SecurityProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    SecurityModuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    AccessLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityProfileModuleRight", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SecurityProfileModuleRight_SecurityModule_SecurityModuleId",
                        column: x => x.SecurityModuleId,
                        principalSchema: "security",
                        principalTable: "SecurityModule",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SecurityProfileModuleRight_SecurityProfile_SecurityProfileId",
                        column: x => x.SecurityProfileId,
                        principalSchema: "security",
                        principalTable: "SecurityProfile",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserAccount",
                schema: "security",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Login = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EmployeeNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SecurityProfileId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSyncedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAccount", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAccount_SecurityProfile_SecurityProfileId",
                        column: x => x.SecurityProfileId,
                        principalSchema: "security",
                        principalTable: "SecurityProfile",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                schema: "security",
                table: "SecurityModule",
                columns: new[] { "Id", "Code", "DisplayOrder", "IsActive", "Label", "NavigationGroup" },
                values: new object[,]
                {
                    { new Guid("2b098a1c-f365-4061-af8a-d6607a1324dd"), "INDICATEURS_CONDUCTEURS", 2, true, "Les indicateurs conducteurs", "Exploitation" },
                    { new Guid("3cbcc9c0-20e1-4a71-a6d9-84cbcb4d18d9"), "ADMINISTRATION", 1, true, "Administration", "Administration" },
                    { new Guid("98f300bb-99f5-4980-a4f8-ee75f9588ca2"), "INDICATEURS_TRACTEURS", 3, true, "Les indicateurs des tracteurs", "Exploitation" },
                    { new Guid("e97cef7f-67c9-4604-8987-4061536742db"), "GESTION_CONTRAVENTIONS", 1, true, "Gestion des contraventions", "Gestion administrative" },
                    { new Guid("f0ecf806-db04-4ca0-a28a-a4c6064d5ea4"), "CARTE_POINTS_CHARGEMENT_DECHARGEMENT", 1, true, "Carte des points chargements/déchargements", "Exploitation" }
                });

            migrationBuilder.InsertData(
                schema: "security",
                table: "SecurityProfile",
                columns: new[] { "Id", "Code", "IsActive", "IsSystemProfile", "Label" },
                values: new object[,]
                {
                    { new Guid("0094b3de-3992-49d0-b5ea-b2b97a7c5d71"), "ADMINISTRATIF", true, true, "Administratif" },
                    { new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740"), "INFORMATIQUE", true, true, "Informatique" },
                    { new Guid("8fbc1d63-4c92-4efe-9b03-a2e96f2f7b16"), "EXPLOITATION", true, true, "Exploitation" },
                    { new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5"), "DIRECTION", true, true, "Direction" }
                });

            migrationBuilder.InsertData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                columns: new[] { "Id", "AccessLevel", "SecurityModuleId", "SecurityProfileId" },
                values: new object[,]
                {
                    { new Guid("174f1dd8-d567-077e-3ffb-4c9c9677f7b4"), "Read", new Guid("98f300bb-99f5-4980-a4f8-ee75f9588ca2"), new Guid("8fbc1d63-4c92-4efe-9b03-a2e96f2f7b16") },
                    { new Guid("1f425c89-3a4b-07ec-3407-d357770e9be2"), "Write", new Guid("98f300bb-99f5-4980-a4f8-ee75f9588ca2"), new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") },
                    { new Guid("2ef6e48b-9132-06a7-09e5-4889896be107"), "Read", new Guid("98f300bb-99f5-4980-a4f8-ee75f9588ca2"), new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5") },
                    { new Guid("46e91c36-d3c3-0387-0f97-023a767e3301"), "Read", new Guid("f0ecf806-db04-4ca0-a28a-a4c6064d5ea4"), new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5") },
                    { new Guid("5f790b4f-6f0e-0923-249a-e69d23542f7e"), "Read", new Guid("e97cef7f-67c9-4604-8987-4061536742db"), new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5") },
                    { new Guid("6ecdb34d-c477-0868-1978-7d43dd31559b"), "Write", new Guid("e97cef7f-67c9-4604-8987-4061536742db"), new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") },
                    { new Guid("775da434-78ba-02cc-3275-99e4881b49e4"), "Write", new Guid("f0ecf806-db04-4ca0-a28a-a4c6064d5ea4"), new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") },
                    { new Guid("7f50e565-9796-025e-3989-062f696225b2"), "Read", new Guid("f0ecf806-db04-4ca0-a28a-a4c6064d5ea4"), new Guid("8fbc1d63-4c92-4efe-9b03-a2e96f2f7b16") },
                    { new Guid("8ab92df0-2826-0556-0bc4-2237bb7e757c"), "None", new Guid("3cbcc9c0-20e1-4a71-a6d9-84cbcb4d18d9"), new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5") },
                    { new Guid("9d0c6e2c-fba2-0f46-0297-709c0a204978"), "Read", new Guid("2b098a1c-f365-4061-af8a-d6607a1324dd"), new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5") },
                    { new Guid("a4b5977f-bff7-0e9f-3489-7489153c5fcb"), "Read", new Guid("2b098a1c-f365-4061-af8a-d6607a1324dd"), new Guid("8fbc1d63-4c92-4efe-9b03-a2e96f2f7b16") },
                    { new Guid("acb8d62e-50db-0e0d-3f75-eb42f445339d"), "Write", new Guid("2b098a1c-f365-4061-af8a-d6607a1324dd"), new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") },
                    { new Guid("bb0d95f2-835f-041d-3626-b9e9451b0f99"), "Write", new Guid("3cbcc9c0-20e1-4a71-a6d9-84cbcb4d18d9"), new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") },
                    { new Guid("e9e85ca1-5e5b-0fd4-3c6d-f2d8291b1faa"), "Write", new Guid("e97cef7f-67c9-4604-8987-4061536742db"), new Guid("0094b3de-3992-49d0-b5ea-b2b97a7c5d71") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_SecurityModule_Code",
                schema: "security",
                table: "SecurityModule",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SecurityProfile_Code",
                schema: "security",
                table: "SecurityProfile",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SecurityProfileModuleRight_SecurityModuleId",
                schema: "security",
                table: "SecurityProfileModuleRight",
                column: "SecurityModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityProfileModuleRight_SecurityProfileId_SecurityModule~",
                schema: "security",
                table: "SecurityProfileModuleRight",
                columns: new[] { "SecurityProfileId", "SecurityModuleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserAccount_Login",
                schema: "security",
                table: "UserAccount",
                column: "Login",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserAccount_SecurityProfileId",
                schema: "security",
                table: "UserAccount",
                column: "SecurityProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SecurityProfileModuleRight",
                schema: "security");

            migrationBuilder.DropTable(
                name: "UserAccount",
                schema: "security");

            migrationBuilder.DropTable(
                name: "SecurityModule",
                schema: "security");

            migrationBuilder.DropTable(
                name: "SecurityProfile",
                schema: "security");
        }
    }
}
