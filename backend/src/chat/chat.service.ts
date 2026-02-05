
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async saveMessage(senderId: string, receiverId?: string, groupId?: string, content: string = '', type: string = 'text', replyTo?: any, metadata?: any) {
        return this.prisma.message.create({
            data: {
                senderId,
                receiverId: receiverId || undefined,
                groupId: groupId || undefined,
                content,
                type: type as any,
                replyTo: replyTo || undefined,
                metadata: metadata || undefined,
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true },
                },
                receiver: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });
    }

    async getMessages(userId1: string, userId2: string) {
        return this.prisma.message.findMany({
            where: {
                groupId: null,
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 },
                ],
                NOT: {
                    hiddenBy: {
                        has: userId1
                    }
                }
            },
            orderBy: {
                createdAt: 'asc',
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true },
                },
                receiver: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });
    }

    async getGroupMessages(groupId: string, userId: string) {
        return this.prisma.message.findMany({
            where: {
                groupId,
                NOT: {
                    hiddenBy: {
                        has: userId
                    }
                }
            },
            orderBy: {
                createdAt: 'asc',
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });
    }

    async getRecentChats(userId: string) {
        // Fetch 1-to-1 chats
        const messages = await this.prisma.message.findMany({
            where: {
                groupId: null,
                OR: [{ senderId: userId }, { receiverId: userId }],
                NOT: {
                    hiddenBy: {
                        has: userId
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                content: true,
                type: true,
                metadata: true,
                read: true,
                createdAt: true,
                senderId: true,
                receiverId: true,
                isDeleted: true,
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } },
            },
        });

        // Fetch groups the user is part of
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                applications: {
                    where: { status: 'approved' },
                    select: { activityId: true }
                },
                activitiesAsCoordinator: {
                    select: { id: true }
                }
            }
        });

        const activityIds = [
            ...(user?.applications?.map(a => a.activityId) || []),
            ...(user?.activitiesAsCoordinator?.map(a => a.id) || [])
        ];

        // If admin, they might see all group chats? For now let's focus on assigned ones.
        // Actually admins should see all group activities if they are in the group view.

        const groupMessages = await this.prisma.message.findMany({
            where: {
                groupId: { in: activityIds },
                NOT: {
                    hiddenBy: {
                        has: userId
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                content: true,
                type: true,
                metadata: true,
                createdAt: true,
                senderId: true,
                groupId: true,
                isDeleted: true,
                sender: { select: { id: true, name: true, avatar: true } },
                activity: { select: { id: true, title: true, image: true } },
            },
        });

        const combinedRecent: any[] = [];
        const uniqueEntries = new Map<string, any>();

        // Process 1-to-1 chats
        for (const msg of (messages as any[])) {
            const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
            if (!otherUser) continue;

            if (!uniqueEntries.has('user_' + otherUser.id)) {
                const unreadCount = messages.filter((m: any) =>
                    m.senderId === otherUser.id &&
                    m.receiverId === userId &&
                    !m.read
                ).length;

                uniqueEntries.set('user_' + otherUser.id, {
                    type: 'individual',
                    user: otherUser,
                    lastMessage: msg,
                    unreadCount
                });
            }
        }

        // Process Group chats
        for (const msg of (groupMessages as any[])) {
            if (!msg.groupId) continue;

            if (!uniqueEntries.has('group_' + msg.groupId)) {
                uniqueEntries.set('group_' + msg.groupId, {
                    type: 'group',
                    group: msg.activity,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }
        }

        return Array.from(uniqueEntries.values()).sort((a, b) =>
            new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
        );
    }

    async markAsRead(senderId: string, receiverId: string) {
        return this.prisma.message.updateMany({
            where: {
                senderId,
                receiverId,
                read: false,
            },
            data: {
                read: true,
            },
        });
    }

    async clearChat(userId1: string, userId2: string) {
        return this.prisma.message.deleteMany({
            where: {
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 },
                ],
            },
        });
    }
    async deleteMessage(messageId: string, userId: string) {
        return this.prisma.message.update({
            where: {
                id: messageId,
                senderId: userId,
            },
            data: {
                isDeleted: true,
                content: 'This message was deleted',
                metadata: undefined,
                type: 'text',
            },
        });
    }

    async hideMessage(messageId: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) return null;

        return this.prisma.message.update({
            where: { id: messageId },
            data: {
                hiddenBy: {
                    push: userId
                }
            }
        });
    }

    async getUserGroups(userId: string): Promise<string[]> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                applications: {
                    where: { status: 'approved' },
                    select: { activityId: true }
                },
                activitiesAsCoordinator: {
                    select: { id: true }
                }
            }
        });

        if (user?.role === 'admin') {
            const allActivities = await this.prisma.activity.findMany({
                select: { id: true }
            });
            return allActivities.map(a => a.id);
        }

        const activityIds = [
            ...(user?.applications?.map(a => a.activityId) || []),
            ...(user?.activitiesAsCoordinator?.map(a => a.id) || [])
        ];

        return Array.from(new Set(activityIds));
    }
}
