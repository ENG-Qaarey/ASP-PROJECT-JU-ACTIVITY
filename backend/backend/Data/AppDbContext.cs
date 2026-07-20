using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using backend.Models.Enums;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<AdminProfile> AdminProfiles => Set<AdminProfile>();
        public DbSet<CoordinatorProfile> CoordinatorProfiles => Set<CoordinatorProfile>();
        public DbSet<Activity> Activities => Set<Activity>();
        public DbSet<Application> Applications => Set<Application>();
        public DbSet<Attendance> Attendances => Set<Attendance>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<PendingUser> PendingUsers => Set<PendingUser>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<ActivityRequirement> ActivityRequirements => Set<ActivityRequirement>();
        public DbSet<ActivityQuestion> ActivityQuestions => Set<ActivityQuestion>();
        public DbSet<ApplicationAnswer> ApplicationAnswers => Set<ApplicationAnswer>();
        public DbSet<Department> Departments => Set<Department>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(u => u.AdminProfile).WithOne(a => a.User).HasForeignKey<AdminProfile>(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(u => u.CoordinatorProfile).WithOne(c => c.User).HasForeignKey<CoordinatorProfile>(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Activity>(entity =>
            {
                entity.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(a => a.Coordinator).WithMany(u => u.CoordinatedActivities).HasForeignKey(a => a.CoordinatorId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Application>(entity =>
            {
                entity.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(a => a.Student).WithMany(u => u.Applications).HasForeignKey(a => a.StudentId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(a => a.Activity).WithMany(act => act.Applications).HasForeignKey(a => a.ActivityId).OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(a => new { a.StudentId, a.ActivityId }).IsUnique();
            });

            modelBuilder.Entity<Attendance>(entity =>
            {
                entity.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(a => a.Activity).WithMany(act => act.Attendances).HasForeignKey(a => a.ActivityId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(a => a.Student).WithMany(u => u.AttendanceRecords).HasForeignKey(a => a.StudentId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(a => a.Application).WithMany().HasForeignKey(a => a.ApplicationId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(a => a.MarkedBy).WithMany(u => u.MarkedAttendances).HasForeignKey(a => a.MarkedById).OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(a => new { a.ActivityId, a.StudentId }).IsUnique();
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.Property(n => n.Type).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(n => n.Recipient).WithMany(u => u.Notifications).HasForeignKey(n => n.RecipientId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Message>(entity =>
            {
                entity.Property(m => m.Type).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(m => m.Sender).WithMany(u => u.SentMessages).HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(m => m.Receiver).WithMany(u => u.ReceivedMessages).HasForeignKey(m => m.ReceiverId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(m => m.Activity).WithMany(a => a.Messages).HasForeignKey(m => m.ActivityId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(m => m.Parent).WithMany().HasForeignKey(m => m.ParentId).OnDelete(DeleteBehavior.SetNull);
                entity.HasIndex(m => m.ActivityId);
            });

            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasOne(al => al.Actor).WithMany(u => u.AuditLogsAsActor).HasForeignKey(al => al.ActorId).OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasIndex(c => c.Name).IsUnique();
            });

            modelBuilder.Entity<PendingUser>(entity =>
            {
                entity.HasIndex(p => p.Email).IsUnique();
            });

            modelBuilder.Entity<AdminProfile>(entity =>
            {
                entity.HasIndex(a => a.UserId).IsUnique();
            });

            modelBuilder.Entity<CoordinatorProfile>(entity =>
            {
                entity.HasIndex(c => c.UserId).IsUnique();
            });

            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasIndex(r => r.Token).IsUnique();
                entity.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ActivityRequirement>(entity =>
            {
                entity.Property(r => r.Type).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(r => r.Activity).WithMany(a => a.Requirements).HasForeignKey(r => r.ActivityId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ActivityQuestion>(entity =>
            {
                entity.Property(q => q.QuestionType).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(q => q.Activity).WithMany(a => a.Questions).HasForeignKey(q => q.ActivityId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ApplicationAnswer>(entity =>
            {
                entity.HasOne(a => a.Application).WithMany(app => app.Answers).HasForeignKey(a => a.ApplicationId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(a => a.ActivityQuestion).WithMany().HasForeignKey(a => a.ActivityQuestionId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Department>(entity =>
            {
                entity.HasIndex(d => d.Name).IsUnique();
            });

            modelBuilder.Entity<Activity>(entity =>
            {
                entity.HasOne(a => a.ParentActivity).WithMany(a => a.ChildActivities).HasForeignKey(a => a.ParentActivityId).OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Department>().HasData(
                new Department { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "Computer Science" },
                new Department { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "Engineering" },
                new Department { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "Business Administration" },
                new Department { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Name = "Medicine" },
                new Department { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Name = "Law" },
                new Department { Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), Name = "Education" },
                new Department { Id = Guid.Parse("77777777-7777-7777-7777-777777777777"), Name = "Arts and Sciences" },
                new Department { Id = Guid.Parse("88888888-8888-8888-8888-888888888888"), Name = "Architecture" },
                new Department { Id = Guid.Parse("99999999-9999-9999-9999-999999999999"), Name = "Pharmacy" },
                new Department { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), Name = "Nursing" }
            );
        }
    }
}
