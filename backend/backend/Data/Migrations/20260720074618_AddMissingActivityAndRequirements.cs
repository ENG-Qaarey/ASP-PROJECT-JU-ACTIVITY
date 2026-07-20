using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingActivityAndRequirements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "Activities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentActivityId",
                table: "Activities",
                type: "uuid",
                nullable: true);

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
                    QuestionText = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    QuestionType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Options = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
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
                    Value = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ApplicationAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityQuestionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Answer = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApplicationAnswers_ActivityQuestions_ActivityQuestionId",
                        column: x => x.ActivityQuestionId,
                        principalTable: "ActivityQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApplicationAnswers_Applications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "Applications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Departments",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "Computer Science" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "Engineering" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "Business Administration" },
                    { new Guid("44444444-4444-4444-4444-444444444444"), "Medicine" },
                    { new Guid("55555555-5555-5555-5555-555555555555"), "Law" },
                    { new Guid("66666666-6666-6666-6666-666666666666"), "Education" },
                    { new Guid("77777777-7777-7777-7777-777777777777"), "Arts and Sciences" },
                    { new Guid("88888888-8888-8888-8888-888888888888"), "Architecture" },
                    { new Guid("99999999-9999-9999-9999-999999999999"), "Pharmacy" },
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), "Nursing" }
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

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationAnswers_ActivityQuestionId",
                table: "ApplicationAnswers",
                column: "ActivityQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationAnswers_ApplicationId",
                table: "ApplicationAnswers",
                column: "ApplicationId");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_Name",
                table: "Departments",
                column: "Name",
                unique: true);

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
                name: "ActivityRequirements");

            migrationBuilder.DropTable(
                name: "ApplicationAnswers");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "ActivityQuestions");

            migrationBuilder.DropIndex(
                name: "IX_Activities_ParentActivityId",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "ParentActivityId",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "RecurrencePattern",
                table: "Activities");
        }
    }
}
