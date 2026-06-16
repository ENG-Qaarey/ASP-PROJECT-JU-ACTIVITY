using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.models.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityIdToMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Activities_ActivityId",
                table: "Messages");

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Activities_ActivityId",
                table: "Messages",
                column: "ActivityId",
                principalTable: "Activities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Activities_ActivityId",
                table: "Messages");

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Activities_ActivityId",
                table: "Messages",
                column: "ActivityId",
                principalTable: "Activities",
                principalColumn: "Id");
        }
    }
}
