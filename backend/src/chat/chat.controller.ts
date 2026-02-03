
import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
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
}
