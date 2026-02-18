import { Injectable, NotFoundException, ConflictException, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

type ActorContext = { id: string; role: UserRole };

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ActivitiesService))
    private activitiesService: ActivitiesService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) { }

  async findAll(
    status?: string,
    studentId?: string,
    activityId?: string,
    coordinatorId?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (activityId) where.activityId = activityId;
    if (coordinatorId) {
      where.activity = { coordinatorId };
    }

    return this.prisma.application.findMany({
      where,
      orderBy: {
        appliedAt: 'desc',
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            avatar: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            location: true,
            status: true,
          },
        },
      },
    });
  }

  // Optimized for attendance screen: return only the fields needed to render the roster.
  // This avoids heavy joins (student/activity include) and is much faster for large datasets.
  async findApprovedForAttendance(activityId: string, requester?: { id: string; role: string }) {
    if (!activityId) {
      throw new NotFoundException('Activity not found');
    }

    if (requester?.role === 'coordinator') {
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: { coordinatorId: true },
      });
      if (!activity) {
        throw new NotFoundException('Activity not found');
      }
      if (activity.coordinatorId !== requester.id) {
        throw new ForbiddenException('You can only view attendance for your own activities');
      }
    }

    return this.prisma.application.findMany({
      where: {
        activityId,
        status: 'approved',
      },
      orderBy: {
        studentName: 'asc',
      },
      select: {
        id: true,
        studentId: true,
        studentName: true,
        appliedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            avatar: true,
          },
        },
        activity: true,
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async create(applicationData: {
    studentId: string;
    studentName: string;
    activityId: string;
    activityTitle: string;
  }) {
    // Check if already applied
    const existing = await this.prisma.application.findUnique({
      where: {
        studentId_activityId: {
          studentId: applicationData.studentId,
          activityId: applicationData.activityId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Already applied for this activity');
    }

    // Check activity capacity
    const activity = await this.activitiesService.findOne(applicationData.activityId);
    if (activity.status === 'completed') {
      throw new ConflictException('Activity is completed. You can no longer apply.');
    }

    // Determine status: if full, go to waitlist
    const isFull = activity.enrolled >= activity.capacity;
    const initialStatus = isFull ? 'waitlisted' : 'pending';

    const application = await this.prisma.application.create({
      data: {
        studentId: applicationData.studentId,
        studentName: applicationData.studentName,
        activityId: applicationData.activityId,
        activityTitle: applicationData.activityTitle,
        appliedAt: new Date(),
        status: initialStatus as any,
      },
    });

    try {
      const adminIds = await this.getAdminIds();
      const coordinatorId = (activity as any)?.coordinatorId as string | undefined;
      const recipients = this.uniqueIds([
        applicationData.studentId,
        ...(coordinatorId ? [coordinatorId] : []),
        ...adminIds,
      ]);

      const notifications = recipients.map((recipientId) => {
        const isStudentRecipient = recipientId === applicationData.studentId;
        let title = 'Application Submitted';
        let message = `Your application for "${applicationData.activityTitle}" has been submitted and is pending review.`;
        let type: NotificationType = NotificationType.announcement;

        if (initialStatus === 'waitlisted') {
          if (isStudentRecipient) {
            title = 'Joined Waitlist';
            message = `The activity "${applicationData.activityTitle}" is currently full. You've been added to the waitlist.`;
            type = NotificationType.waitlist as any;
          } else {
            title = 'New Waitlist Participant';
            message = `${applicationData.studentName} joined the waitlist for "${applicationData.activityTitle}".`;
            type = NotificationType.waitlist as any;
          }
        } else if (!isStudentRecipient) {
          title = 'New application pending';
          message = `${applicationData.studentName} applied for "${applicationData.activityTitle}". Review is required.`;
          type = NotificationType.reminder;
        }

        return {
          recipientId,
          senderRole: UserRole.student,
          type,
          title,
          message,
        };
      });

      await this.notificationsService.createBatch(notifications);
    } catch (notificationError) {
      console.warn('Failed to create application notifications:', notificationError);
    }

    return application;
  }

  async updateStatus(id: string, status: string, notes?: string, actor?: ActorContext) {
    const application = await this.findOne(id);
    const updateData: any = { status: status as any };
    if (notes !== undefined) updateData.notes = notes;

    const updated = await this.prisma.application.update({
      where: { id },
      data: updateData,
    });

    // Update enrolled count if approved/rejected
    if (status === 'approved' && application.status !== 'approved') {
      await this.activitiesService.incrementEnrolled(application.activityId);
    } else if (status !== 'approved' && application.status === 'approved') {
      await this.activitiesService.decrementEnrolled(application.activityId);
    }

    // Get the coordinator/admin who manages this activity to determine sender role
    // The activity is already included in the application from findOne() with all fields
    const senderRole = actor?.role ?? UserRole.coordinator;

    // Create notification for the student
    const notificationType = status === 'approved' ? NotificationType.approval : NotificationType.rejection;
    const notificationTitle = status === 'approved'
      ? 'Application Approved'
      : 'Application Rejected';
    const notificationMessage = status === 'approved'
      ? `Your application for "${application.activity.title}" has been approved!`
      : `Your application for "${application.activity.title}" has been rejected.${notes ? ` Notes: ${notes}` : ''}`;

    const activityCoordinatorId = (application.activity as any)?.coordinatorId as string | undefined;
    const adminIds = await this.getAdminIds();
    const staffRecipients = this.uniqueIds([
      ...(activityCoordinatorId ? [activityCoordinatorId] : []),
      ...adminIds,
    ]);

    // Student notification
    const batch = [
      {
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        recipientId: application.studentId,
        senderRole,
      },
      // Staff/admin inbox notification about the decision
      ...staffRecipients.map((recipientId) => ({
        title: `${notificationTitle} • ${application.activity.title}`,
        message:
          status === 'approved'
            ? `${application.studentName} was approved for "${application.activity.title}".`
            : `${application.studentName} was rejected for "${application.activity.title}".${notes ? ` Notes: ${notes}` : ''}`,
        type: notificationType,
        recipientId,
        senderRole,
      })),
    ];

    await this.notificationsService.createBatch(batch);

    // Send email notification to student
    try {
      if (application.student?.email) {
        await this.mailService.sendApplicationStatusUpdate(
          application.student.email,
          application.student.name,
          application.activity.title,
          status as 'approved' | 'rejected',
          notes
        );
      }
    } catch (error) {
      console.warn('Failed to send application status email:', error);
    }

    // If a spot opened up, process waitlist
    if (application.status === 'approved' && status !== 'approved') {
      await this.processWaitlist(application.activityId);
    }

    return updated;
  }

  async processWaitlist(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, title: true, capacity: true, enrolled: true },
    });

    if (!activity || activity.enrolled >= activity.capacity) {
      return;
    }

    // Find the next student in the waitlist (FIFO)
    const nextApplication = await this.prisma.application.findFirst({
      where: {
        activityId,
        status: 'waitlisted' as any,
      },
      orderBy: {
        appliedAt: 'asc',
      },
      include: {
        student: true,
      },
    });

    if (nextApplication) {
      await this.prisma.application.update({
        where: { id: nextApplication.id },
        data: { status: 'pending' as any },
      });

      // Notify the student
      await this.notificationsService.create({
        recipientId: nextApplication.studentId,
        title: 'Spot Available! 📢',
        message: `A spot has opened up for "${activity.title}". Your application has been moved from the waitlist to pending.`,
        type: NotificationType.announcement,
      });

      // Notify staff? (Optional)
    }
  }

  private async getAdminIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.admin },
      select: { id: true },
    });
    return admins.map((admin) => admin.id);
  }

  private uniqueIds(ids: Array<string | undefined | null>): string[] {
    const set = new Set<string>();
    for (const id of ids) {
      if (id) set.add(id);
    }
    return Array.from(set);
  }

  async delete(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (application?.status === 'approved') {
      await this.activitiesService.decrementEnrolled(application.activityId);
      await this.prisma.application.delete({ where: { id } });
      await this.processWaitlist(application.activityId);
    } else {
      await this.prisma.application.delete({ where: { id } });
    }

    return { success: true };
  }

  async getStatsByActivity(activityId: string) {
    const stats = await this.prisma.application.groupBy({
      by: ['status'],
      where: { activityId },
      _count: true,
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getActivity(activityId: string) {
    return this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { id: true, coordinatorId: true },
    });
  }
}

