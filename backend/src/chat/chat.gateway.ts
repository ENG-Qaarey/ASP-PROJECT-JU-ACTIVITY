
import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    path: '/socket.io',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
    private activeConnections: Map<string, string> = new Map(); // socketId -> userId (reverse lookup)
    private logger: Logger = new Logger('ChatGateway');

    constructor(
        private readonly chatService: ChatService,
        private readonly configService: ConfigService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            // Extract token from handshake query
            const token = client.handshake.query.token as string;
            if (!token) {
                client.disconnect();
                return;
            }

            const secret = this.configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'secret';
            // Basic verification
            let decoded: any;
            try {
                decoded = jwt.verify(token, secret);
            } catch (err) {
                this.logger.error(`Token verification failed: ${err.message}`);
                client.disconnect();
                return;
            }

            if (!decoded || !decoded.sub) {
                client.disconnect();
                return;
            }

            const userId = decoded.sub; // typically 'sub' is the userId in JWT
            this.connectedUsers.set(userId, client.id);
            this.activeConnections.set(client.id, userId);

            this.logger.log(`Client connected: ${userId} (${client.id})`);

            // Join rooms for each activity/group they are part of
            const userGroups = await this.chatService.getUserGroups(userId);
            userGroups.forEach(groupId => {
                client.join(`group_${groupId}`);
                this.logger.log(`User ${userId} joined room group_${groupId}`);
            });

            // Broadcast online status to all
            this.server.emit('userOnline', { userId });

            // Send current online list to the connected user
            // Convert Map keys to array
            const onlineList = Array.from(this.connectedUsers.keys());
            client.emit('onlineUsers', onlineList);
        } catch (e) {
            this.logger.error(`Connection error: ${e.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = this.activeConnections.get(client.id);
        if (userId) {
            this.connectedUsers.delete(userId);
            this.activeConnections.delete(client.id);
            this.logger.log(`Client disconnected: ${userId}`);
            this.server.emit('userOffline', { userId });
        }
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { receiverId?: string; groupId?: string; content: string; type?: string; replyTo?: any; metadata?: any },
    ) {
        const senderId = this.activeConnections.get(client.id);
        if (!senderId) return;

        this.logger.log(`Message from ${senderId} to ${payload.receiverId || payload.groupId}: [${payload.type || 'text'}] ${payload.content}`);

        // Save to DB
        const message = await this.chatService.saveMessage(
            senderId,
            payload.receiverId,
            payload.groupId,
            payload.content,
            payload.type,
            payload.replyTo,
            payload.metadata
        );

        if (payload.groupId) {
            // Group message - broadcast to room
            this.server.to(`group_${payload.groupId}`).emit('newMessage', message);
        } else if (payload.receiverId) {
            // 1-to-1 message
            const receiverSocketId = this.connectedUsers.get(payload.receiverId);
            if (receiverSocketId) {
                this.server.to(receiverSocketId).emit('newMessage', message);
            }

            // Send push notification as well (cinematic experience)
            this.notificationsService.sendPush(
                payload.receiverId,
                `New message from ${message.sender?.name || 'Someone'}`,
                payload.type === 'text' ? payload.content : `[${payload.type}]`,
                { type: 'chat', senderId, messageId: message.id }
            ).catch(err => this.logger.error(`Push notify error: ${err.message}`));
        }

        // Emit back to sender (confirm sent)
        client.emit('messageSent', message);
    }

    @SubscribeMessage('joinGroup')
    handleJoinGroup(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { groupId: string },
    ) {
        client.join(`group_${payload.groupId}`);
        this.logger.log(`Socket ${client.id} joined group_${payload.groupId} manually`);
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { receiverId?: string; groupId?: string },
    ) {
        const senderId = this.activeConnections.get(client.id);
        if (!senderId) return;

        if (payload.groupId) {
            this.server.to(`group_${payload.groupId}`).emit('userTyping', { userId: senderId, groupId: payload.groupId });
        } else if (payload.receiverId) {
            const receiverSocketId = this.connectedUsers.get(payload.receiverId);
            if (receiverSocketId) {
                this.server.to(receiverSocketId).emit('userTyping', { userId: senderId });
            }
        }
    }

    @SubscribeMessage('stopTyping')
    handleStopTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { receiverId?: string; groupId?: string },
    ) {
        const senderId = this.activeConnections.get(client.id);
        if (!senderId) return;

        if (payload.groupId) {
            this.server.to(`group_${payload.groupId}`).emit('userStopTyping', { userId: senderId, groupId: payload.groupId });
        } else if (payload.receiverId) {
            const receiverSocketId = this.connectedUsers.get(payload.receiverId);
            if (receiverSocketId) {
                this.server.to(receiverSocketId).emit('userStopTyping', { userId: senderId });
            }
        }
    }

    @SubscribeMessage('recording')
    handleRecording(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { receiverId?: string; groupId?: string },
    ) {
        const senderId = this.activeConnections.get(client.id);
        if (!senderId) return;

        if (payload.groupId) {
            this.server.to(`group_${payload.groupId}`).emit('userRecording', { userId: senderId, groupId: payload.groupId });
        } else if (payload.receiverId) {
            const receiverSocketId = this.connectedUsers.get(payload.receiverId);
            if (receiverSocketId) {
                this.server.to(receiverSocketId).emit('userRecording', { userId: senderId });
            }
        }
    }

    @SubscribeMessage('stopRecording')
    handleStopRecording(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { receiverId?: string; groupId?: string },
    ) {
        const senderId = this.activeConnections.get(client.id);
        if (!senderId) return;

        if (payload.groupId) {
            this.server.to(`group_${payload.groupId}`).emit('userStopRecording', { userId: senderId, groupId: payload.groupId });
        } else if (payload.receiverId) {
            const receiverSocketId = this.connectedUsers.get(payload.receiverId);
            if (receiverSocketId) {
                this.server.to(receiverSocketId).emit('userStopRecording', { userId: senderId });
            }
        }
    }

    @SubscribeMessage('deleteMessage')
    async handleDeleteMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { messageId: string; receiverId?: string; groupId?: string; deleteType?: 'me' | 'everyone' },
    ) {
        const userId = this.activeConnections.get(client.id);
        if (!userId) return;

        try {
            if (payload.deleteType === 'me') {
                await this.chatService.hideMessage(payload.messageId, userId);
                client.emit('messageDeleted', { messageId: payload.messageId, deleteType: 'me' });
            } else {
                const updatedMessage = await this.chatService.deleteMessage(payload.messageId, userId);

                if (payload.groupId) {
                    this.server.to(`group_${payload.groupId}`).emit('messageDeleted', {
                        messageId: payload.messageId,
                        deleteType: 'everyone',
                        groupId: payload.groupId,
                        updatedMessage
                    });
                } else if (payload.receiverId) {
                    const receiverSocketId = this.connectedUsers.get(payload.receiverId);
                    if (receiverSocketId) {
                        this.server.to(receiverSocketId).emit('messageDeleted', {
                            messageId: payload.messageId,
                            deleteType: 'everyone',
                            updatedMessage
                        });
                    }
                }

                client.emit('messageDeleted', {
                    messageId: payload.messageId,
                    deleteType: 'everyone',
                    updatedMessage
                });
            }
        } catch (e) {
            this.logger.error(`Delete message error: ${e.message}`);
        }
    }
}
