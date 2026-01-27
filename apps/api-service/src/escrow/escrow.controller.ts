import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('escrow')
@Controller('escrow')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EscrowController {
    constructor(private escrowService: EscrowService) { }

    @Post('milestones')
    @Roles('EMPLOYER')
    @ApiOperation({ summary: 'Create milestone for application' })
    async createMilestone(@Body() data: any) {
        return this.escrowService.createMilestone(data.applicationId, data);
    }

    @Get('milestones/:applicationId')
    @ApiOperation({ summary: 'Get milestones for application' })
    async getMilestones(@Param('applicationId') applicationId: string) {
        return this.escrowService.getMilestones(applicationId);
    }

    @Post('fund')
    @Roles('EMPLOYER')
    @ApiOperation({ summary: 'Fund milestone escrow' })
    async fundMilestone(@Body() data: any) {
        return this.escrowService.fundMilestone(
            data.milestoneId,
            data.amount,
            data.paymentData,
        );
    }

    @Put('approve/:milestoneId')
    @Roles('EMPLOYER')
    @ApiOperation({ summary: 'Approve milestone and trigger payout' })
    async approveMilestone(@Param('milestoneId') milestoneId: string) {
        return this.escrowService.approveMilestone(milestoneId);
    }
}
