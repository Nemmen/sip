import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('kyc')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KycController {
    constructor(private kycService: KycService) { }

    @Post('submit')
    @ApiOperation({ summary: 'Submit KYC documents' })
    async submitKYC(@CurrentUser() user: any, @Body() data: any) {
        return this.kycService.submitKYC(user.userId, data);
    }

    @Get('my-documents')
    @ApiOperation({ summary: 'Get user KYC documents' })
    async getMyDocuments(@CurrentUser() user: any) {
        return this.kycService.getKYCDocuments(user.userId);
    }

    @Get('my-kyc')
    @ApiOperation({ summary: 'Get user latest KYC' })
    async getMyKYC(@CurrentUser() user: any) {
        const docs = await this.kycService.getKYCDocuments(user.userId);
        return docs[0] || null;
    }

    @Get('pending')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get pending KYC submissions' })
    async getPending() {
        return this.kycService.getPendingKYC();
    }

    @Put('review/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Review KYC document' })
    async reviewKYC(@Param('id') id: string, @Body() data: any) {
        return this.kycService.reviewKYC(id, data.approved, data.reason);
    }
}
