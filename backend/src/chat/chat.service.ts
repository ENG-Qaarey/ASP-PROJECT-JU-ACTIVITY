
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async saveMessage(senderId: string, receiverId: string, content: string, type: string = 'text') {
        return this.prisma.message.create({
            data: {
                senderId,
                receiverId,
                content,
                type: type as any,
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
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 },
                ],
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

    async getRecentChats(userId: string) {
        const messages = await this.prisma.message.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                content: true,
                type: true,
                createdAt: true,
                senderId: true,
                receiverId: true,
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } },
            },
        });

        const uniqueUsers = new Map<string, any>();
        for (const msg of messages) {
            const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
            if (!uniqueUsers.has(otherUser.id)) {
                uniqueUsers.set(otherUser.id, {
                    user: otherUser,
                    lastMessage: msg,
                });
            }
        }

        return Array.from(uniqueUsers.values());
    }
}
