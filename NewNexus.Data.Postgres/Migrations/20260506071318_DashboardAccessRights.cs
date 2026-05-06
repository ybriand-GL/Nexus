using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewNexus.Data.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class DashboardAccessRights : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                schema: "security",
                table: "SecurityModule",
                columns: new[] { "Id", "Code", "DisplayOrder", "IsActive", "Label", "NavigationGroup" },
                values: new object[,]
                {
                    { new Guid("2d0832df-7431-46f7-9935-2c8d27c1d8a4"), "DASHBOARD_EXPLOITATION", 3, true, "Dashboard Exploitation", "Tableaux de bord" },
                    { new Guid("a1701377-bdd4-4f0f-9159-76c12d4f9fb6"), "DASHBOARD_DIRECTION", 2, true, "Dashboard Direction", "Tableaux de bord" },
                    { new Guid("bcf37d38-6e8a-4b9e-82f9-66ec0e2d0451"), "DASHBOARD_INFORMATIQUE", 1, true, "Dashboard Informatique", "Tableaux de bord" },
                    { new Guid("c3a46e30-7392-4107-b56f-a1bb4f775522"), "DASHBOARD_ADMINISTRATIF", 4, true, "Dashboard Administratif", "Tableaux de bord" }
                });

            migrationBuilder.InsertData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                columns: new[] { "Id", "AccessLevel", "SecurityModuleId", "SecurityProfileId" },
                values: new object[,]
                {
                    { new Guid("0af69908-664d-04b9-2fe4-c0107e1e69f4"), "None", new Guid("bcf37d38-6e8a-4b9e-82f9-66ec0e2d0451"), new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5") },
                    { new Guid("1775f747-b513-0028-3c44-d03d5d7cf213"), "Read", new Guid("a1701377-bdd4-4f0f-9159-76c12d4f9fb6"), new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5") },
                    { new Guid("26c14f45-1e6a-0163-01a6-4be3a31988f6"), "Write", new Guid("a1701377-bdd4-4f0f-9159-76c12d4f9fb6"), new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") },
                    { new Guid("2d9c8101-4da3-0f27-2cdf-9e345dbd85d5"), "None", new Guid("2d0832df-7431-46f7-9935-2c8d27c1d8a4"), new Guid("0094b3de-3992-49d0-b5ea-b2b97a7c5d71") },
                    { new Guid("2ecc0e14-f146-01f1-0a5a-d4284260e4a0"), "None", new Guid("a1701377-bdd4-4f0f-9159-76c12d4f9fb6"), new Guid("8fbc1d63-4c92-4efe-9b03-a2e96f2f7b16") },
                    { new Guid("334f605b-2218-0560-19fa-c40561027f47"), "None", new Guid("bcf37d38-6e8a-4b9e-82f9-66ec0e2d0451"), new Guid("8fbc1d63-4c92-4efe-9b03-a2e96f2f7b16") },
                    { new Guid("3b42210a-cd34-05f2-1206-5bce807b1311"), "Write", new Guid("bcf37d38-6e8a-4b9e-82f9-66ec0e2d0451"), new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") },
                    { new Guid("44153202-d02c-0f6b-2590-9c99c1214262"), "Write", new Guid("c3a46e30-7392-4107-b56f-a1bb4f775522"), new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") },
                    { new Guid("4c187353-3f00-0ff9-2e6c-035220582e34"), "None", new Guid("c3a46e30-7392-4107-b56f-a1bb4f775522"), new Guid("8fbc1d63-4c92-4efe-9b03-a2e96f2f7b16") },
                    { new Guid("75a18a00-7b55-0e20-1872-07473f443887"), "None", new Guid("c3a46e30-7392-4107-b56f-a1bb4f775522"), new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5") },
                    { new Guid("9b0dd6ef-7cf6-09d0-3428-8a7157f2b501"), "None", new Guid("2d0832df-7431-46f7-9935-2c8d27c1d8a4"), new Guid("b605e430-08c7-4f27-ad1d-a6fc70336da5") },
                    { new Guid("a1e4a0a9-8446-06df-24b3-c4785733c2c7"), "None", new Guid("a1701377-bdd4-4f0f-9159-76c12d4f9fb6"), new Guid("0094b3de-3992-49d0-b5ea-b2b97a7c5d71") },
                    { new Guid("a2b42fbc-38a3-0809-0236-8e6448eea3b2"), "Read", new Guid("2d0832df-7431-46f7-9935-2c8d27c1d8a4"), new Guid("8fbc1d63-4c92-4efe-9b03-a2e96f2f7b16") },
                    { new Guid("aab96eed-d78f-089b-09ca-11afa997cfe4"), "Write", new Guid("2d0832df-7431-46f7-9935-2c8d27c1d8a4"), new Guid("87b15c32-a3be-4e6c-90ff-3d228e561740") },
                    { new Guid("bc67cee6-5718-024e-3713-d45574515920"), "None", new Guid("bcf37d38-6e8a-4b9e-82f9-66ec0e2d0451"), new Guid("0094b3de-3992-49d0-b5ea-b2b97a7c5d71") },
                    { new Guid("c330ddee-4a00-08d7-0085-1302350b0853"), "Read", new Guid("c3a46e30-7392-4107-b56f-a1bb4f775522"), new Guid("0094b3de-3992-49d0-b5ea-b2b97a7c5d71") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("0af69908-664d-04b9-2fe4-c0107e1e69f4"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("1775f747-b513-0028-3c44-d03d5d7cf213"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("26c14f45-1e6a-0163-01a6-4be3a31988f6"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("2d9c8101-4da3-0f27-2cdf-9e345dbd85d5"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("2ecc0e14-f146-01f1-0a5a-d4284260e4a0"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("334f605b-2218-0560-19fa-c40561027f47"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("3b42210a-cd34-05f2-1206-5bce807b1311"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("44153202-d02c-0f6b-2590-9c99c1214262"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("4c187353-3f00-0ff9-2e6c-035220582e34"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("75a18a00-7b55-0e20-1872-07473f443887"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("9b0dd6ef-7cf6-09d0-3428-8a7157f2b501"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("a1e4a0a9-8446-06df-24b3-c4785733c2c7"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("a2b42fbc-38a3-0809-0236-8e6448eea3b2"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("aab96eed-d78f-089b-09ca-11afa997cfe4"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("bc67cee6-5718-024e-3713-d45574515920"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityProfileModuleRight",
                keyColumn: "Id",
                keyValue: new Guid("c330ddee-4a00-08d7-0085-1302350b0853"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityModule",
                keyColumn: "Id",
                keyValue: new Guid("2d0832df-7431-46f7-9935-2c8d27c1d8a4"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityModule",
                keyColumn: "Id",
                keyValue: new Guid("a1701377-bdd4-4f0f-9159-76c12d4f9fb6"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityModule",
                keyColumn: "Id",
                keyValue: new Guid("bcf37d38-6e8a-4b9e-82f9-66ec0e2d0451"));

            migrationBuilder.DeleteData(
                schema: "security",
                table: "SecurityModule",
                keyColumn: "Id",
                keyValue: new Guid("c3a46e30-7392-4107-b56f-a1bb4f775522"));
        }
    }
}
