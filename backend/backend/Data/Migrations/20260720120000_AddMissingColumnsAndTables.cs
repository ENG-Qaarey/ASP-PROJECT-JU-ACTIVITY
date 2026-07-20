using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingColumnsAndTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "Activities",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Activities",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Activities",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentActivityId",
                table: "Activities",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QrCodeSecret",
                table: "Activities",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Radius",
                table: "Activities",
                type: "double precision",
                nullable: true,
                defaultValue: 100.0);

            migrationBuilder.AddColumn<string>(
                name: "RecurrencePattern",
                table: "Activities",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ActivityQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    QuestionType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Options = table.Column<string>(type: "text", nullable: true),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityQuestions_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActivityRequirements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityRequirements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityRequirements_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Activities_ParentActivityId",
                table: "Activities",
                column: "ParentActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityQuestions_ActivityId",
                table: "ActivityQuestions",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityRequirements_ActivityId",
                table: "ActivityRequirements",
                column: "ActivityId");

            migrationBuilder.AddForeignKey(
                name: "FK_Activities_Activities_ParentActivityId",
                table: "Activities",
                column: "ParentActivityId",
                principalTable: "Activities",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Activities_Activities_ParentActivityId",
                table: "Activities");

            migrationBuilder.DropTable(
                name: "ActivityQuestions");

            migrationBuilder.DropTable(
                name: "ActivityRequirements");

            migrationBuilder.DropIndex(
                name: "IX_Activities_ParentActivityId",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "ParentActivityId",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "QrCodeSecret",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "Radius",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "RecurrencePattern",
                table: "Activities");
        }
    }
}
