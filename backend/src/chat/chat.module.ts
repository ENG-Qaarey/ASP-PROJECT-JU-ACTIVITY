
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, ConfigModule, NotificationsModule],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
})
export class ChatModule { }
