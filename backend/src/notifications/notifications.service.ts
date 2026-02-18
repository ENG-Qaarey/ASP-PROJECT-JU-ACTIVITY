import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { NotificationType, UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

interface NotificationFilters {
  recipientId?: string;
  read?: boolean;
  type?: NotificationType;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo = new Expo();

  constructor(private readonly prisma: PrismaService) { }

  async findAll(filters: NotificationFilters = {}) {
    const where: Prisma.NotificationWhereInput = {};

    if (filters.recipientId) {
      where.recipientId = filters.recipientId;
    }
    if (filters.read !== undefined) {
      where.read = filters.read;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async countUnread(recipientId?: string) {
    const where: Prisma.NotificationWhereInput = { read: false };
    if (recipientId) {
      where.recipientId = recipientId;
    }
    return this.prisma.notification.count({ where });
  }

  async create(data: {
    title: string;
    message: string;
    type: NotificationType;
    recipientId: string;
    senderRole?: UserRole | null;
    meta?: any;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        recipientId: data.recipientId,
        senderRole: data.senderRole ?? null,
        read: false,
        createdAt: new Date(),
      },
    });

    // Also send actual Push Notification
    await this.sendPush(data.recipientId, data.title, data.message, data.meta);

    return notification;
  }

  async registerPushToken(userId: string, token: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      update: { userId },
      create: { userId, token },
    });
  }

  async sendPush(recipientId: string, title: string, body: string, data?: any) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: recipientId },
    });

    if (tokens.length === 0) {
      this.logger.debug(`No push tokens found for user ${recipientId}`);
      return;
    }

    const messages: ExpoPushMessage[] = [];
    for (const pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken.token)) {
        this.logger.warn(`Push token ${pushToken.token} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: pushToken.token,
        sound: 'default',
        title,
        body,
        data: data || {},
      });
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: any[] = [];
    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        this.logger.error('Error sending push notification chunk', error);
      }
    }
  }

  async createBatch(
    notifications: Array<{
      title: string;
      message: string;
      type: NotificationType;
      recipientId: string;
      senderRole?: UserRole | null;
      meta?: any;
    }>,
  ) {
    if (notifications.length === 0) {
      return [];
    }
    const payload = notifications.map(item => ({
      title: item.title,
      message: item.message,
      type: item.type,
      recipientId: item.recipientId,
      senderRole: item.senderRole ?? null,
      read: false,
      createdAt: new Date(),
    }));

    await this.prisma.notification.createMany({
      data: payload,
    });

    // Send pushes in background
    for (const n of notifications) {
      this.sendPush(n.recipientId, n.title, n.message, n.meta).catch(e =>
        this.logger.error(`Failed to send batch push for ${n.recipientId}`, e)
      );
    }

    return notifications;
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(recipientId?: string) {
    const where: Prisma.NotificationWhereInput = { read: false };
    if (recipientId) {
      where.recipientId = recipientId;
    }
    return this.prisma.notification.updateMany({
      where,
      data: { read: true },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.notification.delete({ where: { id } });
  }
}
