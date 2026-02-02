import { Controller, Get, Put, Delete, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService, PaginatedResponse } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('users')
    @ApiOperation({ summary: 'Get all users (Admin only)' })
    async getAllUsers(
        @Query('role') role?: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResponse<any>> {
        return this.adminService.getAllUsers({
            role,
            status,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }

    @Get('internships')
    @ApiOperation({ summary: 'Get all internships (Admin only)' })
    async getAllInternships(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResponse<any>> {
        return this.adminService.getAllInternships({
            status,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }

    @Get('applications')
    @ApiOperation({ summary: 'Get all applications (Admin only)' })
    async getAllApplications(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResponse<any>> {
        return this.adminService.getAllApplications({
            status,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }

    @Get('kyc')
    @ApiOperation({ summary: 'Get all KYC submissions (Admin only)' })
    async getAllKYC(
        @Query('status') status?: string,
    ) {
        return this.adminService.getAllKYC(status);
    }

    @Put('users/:id/suspend')
    @ApiOperation({ summary: 'Suspend user account' })
    async suspendUser(@Param('id') id: string) {
        return this.adminService.suspendUser(id);
    }

    @Put('users/:id/activate')
    @ApiOperation({ summary: 'Activate user account' })
    async activateUser(@Param('id') id: string) {
        return this.adminService.activateUser(id);
    }

    @Delete('users/:id')
    @ApiOperation({ summary: 'Delete user account' })
    async deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }
}
