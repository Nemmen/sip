import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
    constructor(private auditService: AuditService) { }

    @Get('user/:userId')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get audit logs for a user (Admin only)' })
    async getUserLogs(
        @Param('userId') userId: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit) : 50;
        return this.auditService.getUserLogs(userId, limitNum);
    }

    @Get('resource/:resource/:resourceId')
    @Roles('ADMIN', 'EMPLOYER')
    @ApiOperation({ summary: 'Get audit logs for a resource' })
    async getResourceLogs(
        @Param('resource') resource: string,
        @Param('resourceId') resourceId: string,
        @CurrentUser() user: any,
    ) {
        // Employers can only view logs for their own resources
        // This should be validated in the service layer
        return this.auditService.getResourceLogs(resource, resourceId);
    }

    @Get('my-activity')
    @ApiOperation({ summary: 'Get current user\'s audit logs' })
    async getMyActivity(
        @CurrentUser() user: any,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit) : 50;
        return this.auditService.getUserLogs(user.userId, limitNum);
    }

    @Get('application/:applicationId')
    @Roles('ADMIN', 'EMPLOYER', 'STUDENT')
    @ApiOperation({ summary: 'Get audit logs for an application' })
    async getApplicationLogs(
        @Param('applicationId') applicationId: string,
        @CurrentUser() user: any,
    ) {
        // Authorization should be checked in service layer
        return this.auditService.getResourceLogs('Application', applicationId);
    }
}
