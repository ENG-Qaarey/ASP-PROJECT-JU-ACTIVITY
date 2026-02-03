import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityStatus, ApplicationStatus, NotificationType, UserRole } from '../generated/prisma';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ActivitiesService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditLogs: AuditLogsService,
  ) { }

  onModuleInit() {
    // Check and update statuses every minute
    setInterval(() => {
      this.updateActivityStatuses().catch(err => {
        console.error('Error auto-updating activity statuses:', err);
      });
    }, 60000);

    // Also run once on startup
    setTimeout(() => this.updateActivityStatuses().catch(() => { }), 5000);
  }

  private parseActivityDateTime(date: Date, timeStr: string): Date {
    try {
      const dt = new Date(date);
      const parts = timeStr.split(' ');
      if (parts.length !== 2) return dt;

      const [hms, period] = parts;
      const [h, m] = hms.split(':').map(Number);

      let hours = h;
      if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

      dt.setHours(hours, m || 0, 0, 0);
      return dt;
    } catch (e) {
      return new Date(date);
    }
  }

  async updateActivityStatuses() {
    const now = new Date();
    const activities = await this.prisma.activity.findMany({
      where: {
        status: { in: [ActivityStatus.upcoming, ActivityStatus.ongoing] },
      },
    });

    for (const activity of activities) {
      const start = this.parseActivityDateTime(activity.date, activity.time);
      // Default duration: 2 hours
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

      if (activity.status === ActivityStatus.upcoming && now >= start && now < end) {
        await this.prisma.activity.update({
          where: { id: activity.id },
          data: { status: ActivityStatus.ongoing },
        });
        console.log(`[StatusUpdate] Activity "${activity.title}" is now ONGOING`);
      } else if ((activity.status === ActivityStatus.ongoing || activity.status === ActivityStatus.upcoming) && now >= end) {
        await this.prisma.activity.update({
          where: { id: activity.id },
          data: { status: ActivityStatus.completed },
        });
        console.log(`[StatusUpdate] Activity "${activity.title}" is now COMPLETED`);
      }
    }
  }

  async findAll(status?: string, category?: string, coordinatorId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (coordinatorId) where.coordinatorId = coordinatorId;

    return this.prisma.activity.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }

  async create(activityData: {
    title: string;
    description: string;
    category: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    coordinatorId: string;
    coordinatorName: string;
  }, actorId?: string) {
    const parsedDate = new Date(activityData.date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    if (!Number.isFinite(activityData.capacity) || activityData.capacity <= 0) {
      throw new BadRequestException('Capacity must be a positive number');
    }

    const activityDateTime = this.parseActivityDateTime(parsedDate, activityData.time);
    if (activityDateTime < new Date()) {
      throw new BadRequestException('Activity date and time must be in the future');
    }

    const activity = await this.prisma.activity.create({
      data: {
        title: activityData.title,
        description: activityData.description,
        category: activityData.category,
        date: parsedDate,
        time: activityData.time,
        location: activityData.location,
        capacity: activityData.capacity,
        enrolled: 0,
        coordinatorId: activityData.coordinatorId,
        coordinatorName: activityData.coordinatorName,
        status: ActivityStatus.upcoming,
      },
    });

    // Use the request actor (admin/coordinator) as the notification sender.
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId ?? activityData.coordinatorId },
      select: { role: true },
    });
    const senderRole = (actor?.role ?? 'coordinator') as UserRole;

    // Get all students and notify them about the new activity
    const students = await this.prisma.user.findMany({
      where: { role: 'student', status: 'active' },
      select: { id: true },
    });

    if (students.length > 0) {
      const notifications = students.map(student => ({
        title: 'New Activity Available',
        message: `A new activity "${activityData.title}" has been created by ${activityData.coordinatorName}. Check it out and apply if interested!`,
        type: NotificationType.announcement,
        recipientId: student.id,
        senderRole,
      }));

      try {
        await this.notificationsService.createBatch(notifications);
      } catch (error) {
        // Do not fail activity creation just because notifications failed.
        // (e.g., transient DB errors, createMany constraints, etc.)
      }
    }

    await this.auditLogs.create({
      action: 'ACTIVITY_CREATE',
      actorId: actorId ?? activityData.coordinatorId,
      targetId: activityData.coordinatorId,
      entity: 'activity',
      entityId: activity.id,
      message: `Created activity: ${activity.title}`,
      metadata: { activityId: activity.id, title: activity.title },
    });

    return activity;
  }

  async update(id: string, updateData: {
    title?: string;
    description?: string;
    category?: string;
    date?: string;
    time?: string;
    location?: string;
    capacity?: number;
    enrolled?: number;
    status?: string;
  }, actorId?: string) {
    const data: any = { ...updateData };
    if (updateData.date) {
      data.date = new Date(updateData.date);
    }
    const updated = await this.prisma.activity.update({
      where: { id },
      data,
    });

    await this.auditLogs.create({
      action: 'ACTIVITY_UPDATE',
      actorId: actorId ?? null,
      targetId: updated.coordinatorId,
      entity: 'activity',
      entityId: updated.id,
      message: `Updated activity: ${updated.title}`,
      metadata: { activityId: updated.id },
    });

    return updated;
  }

  async delete(id: string, actorId?: string) {
    const existing = await this.prisma.activity.findUnique({
      where: { id },
      select: { id: true, title: true, coordinatorId: true },
    });
    if (!existing) {
      throw new NotFoundException('Activity not found');
    }

    const actor = actorId
      ? await this.prisma.user.findUnique({ where: { id: actorId }, select: { role: true } })
      : null;
    const isAdmin = actor?.role === 'admin';

    if (!isAdmin) {
      const pendingCount = await this.prisma.application.count({
        where: { activityId: id, status: ApplicationStatus.pending },
      });

      if (pendingCount > 0) {
        throw new BadRequestException(
          'Please resolve pending applications before deleting this activity.',
        );
      }
    }

    // Remove dependents first to avoid FK constraint failures.
    // Order matters: Attendance references Application, so delete attendance before applications.
    await this.prisma.$transaction([
      this.prisma.attendance.deleteMany({ where: { activityId: id } }),
      this.prisma.application.deleteMany({ where: { activityId: id } }),
      this.prisma.activity.delete({ where: { id } }),
    ]);

    await this.auditLogs.create({
      action: 'ACTIVITY_DELETE',
      actorId: actorId ?? null,
      targetId: existing?.coordinatorId ?? null,
      entity: 'activity',
      entityId: id,
      message: `Deleted activity: ${existing?.title ?? id}`,
      metadata: { activityId: id },
    });
    return { success: true };
  }

  async incrementEnrolled(id: string) {
    const activity = await this.findOne(id);
    if (activity.enrolled >= activity.capacity) {
      throw new Error('Activity is at full capacity');
    }
    return this.prisma.activity.update({
      where: { id },
      data: {
        enrolled: {
          increment: 1,
        },
      },
    });
  }

  async decrementEnrolled(id: string) {
    return this.prisma.activity.update({
      where: { id },
      data: {
        enrolled: {
          decrement: 1,
        },
      },
    });
  }
}

