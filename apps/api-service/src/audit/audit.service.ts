import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async log(
        userId: string,
        action: AuditAction,
        resource: string,
        resourceId?: string,
        metadata?: any,
        ipAddress?: string,
        userAgent?: string,
    ) {
        return this.prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                resourceId,
                metadata,
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
            },
        });
    }

    async getUserLogs(userId: string, limit = 50) {
        return this.prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async getResourceLogs(resource: string, resourceId: string) {
        return this.prisma.auditLog.findMany({
            where: { resource, resourceId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
