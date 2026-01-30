import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApplicationsController {
    constructor(private applicationsService: ApplicationsService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('STUDENT')
    @ApiOperation({ summary: 'Apply to internship' })
    async create(@CurrentUser() user: any, @Body() data: any) {
        return this.applicationsService.create(
            data.internshipId,
            user.userId,
            data,
        );
    }

    @Get('my-applications')
    @UseGuards(RolesGuard)
    @Roles('STUDENT')
    @ApiOperation({ summary: 'Get student applications' })
    async getMyApplications(@CurrentUser() user: any) {
        return this.applicationsService.findStudentApplications(user.userId);
    }

    @Get('employer/my-applications')
    @UseGuards(RolesGuard)
    @Roles('EMPLOYER')
    @ApiOperation({ summary: 'Get all applications to employer internships' })
    async getEmployerApplications(@CurrentUser() user: any) {
        return this.applicationsService.findEmployerApplications(user.userId);
    }

    @Get('internship/:internshipId')
    @UseGuards(RolesGuard)
    @Roles('EMPLOYER')
    @ApiOperation({ summary: 'Get internship applications' })
    async getInternshipApplications(@Param('internshipId') internshipId: string) {
        return this.applicationsService.findInternshipApplications(internshipId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get application by ID' })
    async getOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.applicationsService.findOne(id, user.userId);
    }

    @Put(':id/status')
    @UseGuards(RolesGuard)
    @Roles('EMPLOYER')
    @ApiOperation({ summary: 'Update application status' })
    async updateStatus(@Param('id') id: string, @Body() body: { status: any; interviewDate?: string; interviewNotes?: string }) {
        const interviewDate = body.interviewDate ? new Date(body.interviewDate) : undefined;
        return this.applicationsService.updateStatus(id, body.status, interviewDate, body.interviewNotes);
    }

    @Put(':id/withdraw')
    @UseGuards(RolesGuard)
    @Roles('STUDENT')
    @ApiOperation({ summary: 'Withdraw application' })
    async withdraw(@Param('id') id: string, @CurrentUser() user: any) {
        return this.applicationsService.withdraw(id, user.userId);
    }
}
