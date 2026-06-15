using backend.models.Enums;

namespace backend.models
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext db)
        {
            if (db.Users.Any())
                return;

            var admin = new User
            {
                Name = "Jamiila Admin",
                Email = "jamiila@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Jamiila@JU2026Secure!"),
                Role = UserRole.Admin,
                Status = "active"
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync();

            db.AdminProfiles.Add(new AdminProfile
            {
                UserId = admin.Id,
                AccessLevel = "full",
                Permissions = "all"
            });

            var coordinator = new User
            {
                Name = "Amiin",
                Email = "amiin@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Amiin@JU2026Secure!"),
                Role = UserRole.Coordinator,
                Status = "active"
            };
            db.Users.Add(coordinator);
            await db.SaveChangesAsync();

            db.CoordinatorProfiles.Add(new CoordinatorProfile
            {
                UserId = coordinator.Id,
                Department = "General",
                Specialization = "Student Affairs",
                MaxActivities = 10,
                ApprovalLevel = "standard"
            });

            await db.SaveChangesAsync();
        }
    }
}
