using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class CommonDataSecurityModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                schema: "security",
                table: "SecurityModule",
                columns: new[] { "Id", "Code", "DisplayOrder", "IsActive", "Label", "NavigationGroup" },
                values: new object[] { new Guid("6d56c6e5-0e73-4772-9b0c-6a8d0f68a5d4"), "DONNEES_COMMUNES", 1, true, "Données Communes", "Données Communes" });

            migrationBuilder.InsertData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                columns: new[] { "Id", "AccessLevel", "SecurityModuleId", "SecurityProfileId" },
                values: new object[,]
                {
                    { new Guid("6dc2753b-37e1-0ea2-2ee6-d8347514f8a5"), "None", new Guid("6d56c6e5-0e73-4772-9b0c-6a8d0f68a5d4"), new Guid("0094b3de-3992-49d0-b5ea-b2b97a7c5d71") },
                    { new Guid("db5322d5-06b4-0855-3611-cc717f5bc871"), "Read", new Guid("6d56c6e5-0e73-4772-9b0c-6a8d0f68a5d4"), new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5") },
                    { new Guid("e2eadb86-42e1-098c-000f-c8646047dec2"), "Read", new Guid("6d56c6e5-0e73-4772-9b0c-6a8d0f68a5d4"), new Guid("8fbc1d63-4c92-4efe-9b03-a2e96f2f7b16") },
                    { new Guid("eae79ad7-adcd-091e-0bf3-57af813eb294"), "Write", new Guid("6d56c6e5-0e73-4772-9b0c-6a8d0f68a5d4"), new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("6dc2753b-37e1-0ea2-2ee6-d8347514f8a5"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("db5322d5-06b4-0855-3611-cc717f5bc871"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("e2eadb86-42e1-098c-000f-c8646047dec2"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("eae79ad7-adcd-091e-0bf3-57af813eb294"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityModule",
                keyColumn: "Id",
                keyValue: new Guid("6d56c6e5-0e73-4772-9b0c-6a8d0f68a5d4"));
        }
    }
}
