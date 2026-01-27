import { Controller, Get, Put, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get user notifications' })
    async getNotifications(
        @CurrentUser() user: any,
        @Query('unreadOnly') unreadOnly?: boolean,
    ) {
        return this.notificationsService.getNotifications(
            user.userId,
            unreadOnly === true,
        );
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notifications count' })
    async getUnreadCount(@CurrentUser() user: any) {
        const count = await this.notificationsService.getUnreadCount(user.userId);
        return { count };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
        return this.notificationsService.markAsRead(id, user.userId);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    async markAllAsRead(@CurrentUser() user: any) {
        return this.notificationsService.markAllAsRead(user.userId);
    }
}
