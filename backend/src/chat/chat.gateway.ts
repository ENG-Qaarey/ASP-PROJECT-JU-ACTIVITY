
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
        @MessageBody() payload: { receiverId: string; content: string; type?: string },
    ) {
        const senderId = this.activeConnections.get(client.id);
        if (!senderId) return;

        this.logger.log(`Message from ${senderId} to ${payload.receiverId}: [${payload.type || 'text'}] ${payload.content}`);

        // Save to DB
        const message = await this.chatService.saveMessage(senderId, payload.receiverId, payload.content, payload.type);

        // Emit to receiver if online
        const receiverSocketId = this.connectedUsers.get(payload.receiverId);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('newMessage', message);
        }

        // Emit back to sender (to confirm sent and update UI with ID and timestamp from DB)
        client.emit('messageSent', message);
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { receiverId: string },
    ) {
        const senderId = this.activeConnections.get(client.id);
        if (!senderId) return;

        const receiverSocketId = this.connectedUsers.get(payload.receiverId);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('userTyping', { userId: senderId });
        }
    }

    @SubscribeMessage('stopTyping')
    handleStopTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { receiverId: string },
    ) {
        const senderId = this.activeConnections.get(client.id);
        if (!senderId) return;

        const receiverSocketId = this.connectedUsers.get(payload.receiverId);
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('userStopTyping', { userId: senderId });
        }
    }
}
