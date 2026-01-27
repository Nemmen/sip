import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@CurrentUser() user: any) {
        return this.usersService.findById(user.userId);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update user profile' })
    async updateProfile(@CurrentUser() user: any, @Body() data: any) {
        // Handle both studentProfile and companyProfile in the same endpoint
        if (data.studentProfile) {
            return this.usersService.updateStudentProfile(user.userId, data.studentProfile);
        }
        if (data.companyProfile) {
            return this.usersService.updateEmployerProfile(user.userId, data.companyProfile);
        }
        return this.usersService.findById(user.userId);
    }
}
