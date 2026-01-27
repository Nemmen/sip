import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KYCGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || user.role !== 'EMPLOYER') {
            return true; // KYC only required for employers
        }

        const employerProfile = await this.prisma.employerProfile.findUnique({
            where: { userId: user.userId },
        });

        if (!employerProfile || employerProfile.kycStatus !== 'APPROVED') {
            throw new ForbiddenException('KYC verification required. Please complete your KYC.');
        }

        return true;
    }
}
