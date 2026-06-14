using Microsoft.EntityFrameworkCore;
using backend.models.Enums;

namespace backend.models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<AdminProfile> AdminProfiles => Set<AdminProfile>();
        public DbSet<CoordinatorProfile> CoordinatorProfiles => Set<CoordinatorProfile>();
        public DbSet<Activity> Activities => Set<Activity>();
        public DbSet<Application> Applications => Set<Application>();
        public DbSet<Attendance> Attendances => Set<Attendance>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<PushToken> PushTokens => Set<PushToken>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<PendingUser> PendingUsers => Set<PendingUser>();

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
            });

            modelBuilder.Entity<PushToken>(entity =>
            {
                entity.HasIndex(p => p.Token).IsUnique();
                entity.HasOne(p => p.User).WithMany(u => u.PushTokens).HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
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
        }
    }
}
