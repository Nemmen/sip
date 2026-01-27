import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
    constructor(private messagingService: MessagingService) { }

    @Get('conversations')
    @ApiOperation({ summary: 'Get user conversations' })
    async getConversations(@CurrentUser() user: any) {
        return this.messagingService.getConversations(user.userId);
    }

    @Get('conversation/:otherUserId')
    @ApiOperation({ summary: 'Get messages with specific user' })
    async getMessages(@CurrentUser() user: any, @Param('otherUserId') otherUserId: string) {
        return this.messagingService.getMessages(user.userId, otherUserId);
    }

    @Post('send')
    @ApiOperation({ summary: 'Send message' })
    async sendMessage(@CurrentUser() user: any, @Body() data: any) {
        return this.messagingService.sendMessage(
            user.userId,
            data.receiverId,
            data.content,
            data.attachments,
        );
    }

    @Put(':id/read')
    @ApiOperation({ summary: 'Mark message as read' })
    async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
        return this.messagingService.markAsRead(id, user.userId);
    }
}
