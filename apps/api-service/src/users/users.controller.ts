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

    @Put('profile/student')
    @ApiOperation({ summary: 'Update student profile' })
    async updateStudentProfile(@CurrentUser() user: any, @Body() data: any) {
        return this.usersService.updateStudentProfile(user.userId, data);
    }

    @Put('profile/employer')
    @ApiOperation({ summary: 'Update employer profile' })
    async updateEmployerProfile(@CurrentUser() user: any, @Body() data: any) {
        return this.usersService.updateEmployerProfile(user.userId, data);
    }
}
