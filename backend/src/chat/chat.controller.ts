import { Controller, Get, Post, Delete, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../authz/jwt-auth.guard';

/** Allowed MIME types for chat media (images, videos, documents, audio). */
const ALLOWED_MIMES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
    'video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm', 'video/3gpp',
    'audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/webm', 'audio/ogg',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'application/zip',
]);
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('ghistory/:groupId')
    async getLegacyGroupHistory(@Param('groupId') groupId: string, @Req() req: any) {
        return this.chatService.getGroupMessages(groupId, req.user.id);
    }

    @Get('ping')
    async ping() {
        return { status: 'ok', time: new Date().toISOString() };
    }

    @Get('group-history-data/:groupId')
    async getGroupHistory(@Param('groupId') groupId: string, @Req() req: any) {
        return this.chatService.getGroupMessages(groupId, req.user.id);
    }

    @Get('history/:otherUserId')
    async getHistory(@Param('otherUserId') otherUserId: string, @Req() req: any) {
        return this.chatService.getMessages(req.user.id, otherUserId);
    }

    @Get('recent')
    async getRecent(@Req() req: any) {
        return this.chatService.getRecentChats(req.user.id);
    }

    @Post('read/:senderId')
    async markAsRead(@Param('senderId') senderId: string, @Req() req: any) {
        return this.chatService.markAsRead(senderId, req.user.id);
    }

    @Delete('clear/:otherUserId')
    async clearChat(@Param('otherUserId') otherUserId: string, @Req() req: any) {
        return this.chatService.clearChat(req.user.id, otherUserId);
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: path.join(process.cwd(), 'uploads'),
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = path.extname(file.originalname) || '';
                    cb(null, `chat-media-${uniqueSuffix}${ext}`);
                },
            }),
            limits: { fileSize: MAX_FILE_SIZE },
            fileFilter: (req, file, cb) => {
                const mime = (file.mimetype || '').toLowerCase();
                if (ALLOWED_MIMES.has(mime)) {
                    return cb(null, true);
                }
                cb(new BadRequestException(`File type not allowed: ${file.mimetype}. Allowed: images, videos, audio, PDF, DOC, XLS, PPT, TXT, ZIP.`), false);
            },
        }),
    )
    async uploadFile(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('File is missing');
        }
        return {
            url: `/uploads/${file.filename}`,
            mimetype: file.mimetype,
            size: file.size,
        };
    }
}
