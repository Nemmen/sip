import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InternshipsService } from './internships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { KYCGuard } from '../auth/guards/kyc.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('internships')
@Controller('internships')
export class InternshipsController {
    constructor(private internshipsService: InternshipsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all published internships' })
    async findAll(@Query() query: any) {
        return this.internshipsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get internship by ID' })
    async findOne(@Param('id') id: string) {
        return this.internshipsService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard, KYCGuard)
    @Roles('EMPLOYER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new internship (Employer only)' })
    async create(@CurrentUser() user: any, @Body() data: any) {
        return this.internshipsService.create(user.userId, data);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('EMPLOYER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update internship' })
    async update(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.internshipsService.update(id, user.userId, data);
    }

    @Put(':id/publish')
    @UseGuards(JwtAuthGuard, RolesGuard, KYCGuard)
    @Roles('EMPLOYER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Publish internship' })
    async publish(@Param('id') id: string, @CurrentUser() user: any) {
        return this.internshipsService.publish(id, user.userId);
    }

    @Put(':id/close')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('EMPLOYER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Close internship applications' })
    async close(@Param('id') id: string, @CurrentUser() user: any) {
        return this.internshipsService.close(id, user.userId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('EMPLOYER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete internship' })
    async delete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.internshipsService.delete(id, user.userId);
    }

    @Get('employer/my-internships')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('EMPLOYER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get employer\'s internships' })
    async getMyInternships(@CurrentUser() user: any) {
        return this.internshipsService.getEmployerInternships(user.userId);
    }
}
