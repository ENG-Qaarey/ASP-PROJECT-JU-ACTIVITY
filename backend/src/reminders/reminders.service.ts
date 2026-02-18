import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        private notificationsService: NotificationsService,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async handleActivityReminders() {
        this.logger.log('Running activity reminders job...');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Look for activities starting between 23 and 24 hours from now
        const startTime = new Date(tomorrow);
        startTime.setHours(tomorrow.getHours(), 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1);

        const upcomingActivities = await this.prisma.activity.findMany({
            where: {
                date: {
                    gte: startTime.toISOString().split('T')[0],
                    lte: endTime.toISOString().split('T')[0],
                },
                status: 'upcoming',
            },
            include: {
                applications: {
                    where: { status: 'approved' },
                    include: {
                        student: true,
                    },
                },
            },
        });

        this.logger.log(`Found ${upcomingActivities.length} activities for reminders.`);

        for (const activity of upcomingActivities) {
            for (const application of activity.applications) {
                if (!application.student) continue;

                // 1. Send Push Notification
                await this.notificationsService.create({
                    recipientId: application.studentId,
                    title: `Reminder: ${activity.title} tomorrow!`,
                    message: `Join us tomorrow at ${activity.time} in ${activity.location}.`,
                    type: NotificationType.reminder,
                    meta: { activityId: activity.id },
                }).catch(err => this.logger.error(`Failed to send reminder push to ${application.studentId}`, err));

                // 2. Send Email
                if (application.student.email) {
                    await this.mailService.sendActivityReminder(
                        application.student.email,
                        application.student.name,
                        activity.title,
                        activity.date instanceof Date ? activity.date.toDateString() : String(activity.date),
                        activity.time,
                        activity.location,
                    ).catch(err => this.logger.error(`Failed to send reminder email to ${application.student.email}`, err));
                }
            }
        }

        this.logger.log('Activity reminders job completed.');
    }
}
