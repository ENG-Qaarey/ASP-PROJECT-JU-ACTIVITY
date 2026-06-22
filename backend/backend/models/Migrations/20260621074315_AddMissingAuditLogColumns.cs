using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Models.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingAuditLogColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Metadata",
                table: "AuditLogs",
                newName: "BeforeData");

            migrationBuilder.AddColumn<string>(
                name: "ActorEmail",
                table: "AuditLogs",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActorName",
                table: "AuditLogs",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActorRole",
                table: "AuditLogs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AfterData",
                table: "AuditLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorDetails",
                table: "AuditLogs",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "AuditLogs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "AuditLogs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                table: "AuditLogs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActorEmail",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "ActorName",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "ActorRole",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "AfterData",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "ErrorDetails",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "UserAgent",
                table: "AuditLogs");

            migrationBuilder.RenameColumn(
                name: "BeforeData",
                table: "AuditLogs",
                newName: "Metadata");
        }
    }
}
