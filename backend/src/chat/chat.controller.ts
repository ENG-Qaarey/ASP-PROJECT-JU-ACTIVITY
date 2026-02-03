
import { Controller, Get, Post, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../authz/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('history/:otherUserId')
    async getHistory(@Param('otherUserId') otherUserId: string, @Req() req: any) {
        return this.chatService.getMessages(req.user.id, otherUserId);
    }

    @Get('recent')
    async getRecent(@Req() req: any) {
        return this.chatService.getRecentChats(req.user.id);
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: 'uploads',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = path.extname(file.originalname);
                    cb(null, `chat-media-${uniqueSuffix}${ext}`);
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
