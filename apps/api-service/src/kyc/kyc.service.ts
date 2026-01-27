import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUES, JOB_PRIORITY } from '@sip/constants';

@Injectable()
export class KycService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue(QUEUES.KYC_CHECK) private kycQueue: Queue,
    ) { }

    async submitKYC(userId: string, data: any) {
        const document = await this.prisma.kYCDocument.create({
            data: {
                userId,
                ...data,
                status: 'PENDING',
            },
        });

        // Add to KYC verification queue
        await this.kycQueue.add(
            'verify-kyc',
            {
                documentId: document.id,
                userId,
            },
            {
                priority: JOB_PRIORITY.NORMAL,
                attempts: 3,
            },
        );

        return document;
    }

    async getKYCDocuments(userId: string) {
        return this.prisma.kYCDocument.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async reviewKYC(documentId: string, approved: boolean, reason?: string) {
        return this.prisma.kYCDocument.update({
            where: { id: documentId },
            data: {
                status: approved ? 'APPROVED' : 'REJECTED',
                rejectionReason: reason,
                reviewedAt: new Date(),
            },
        });
    }

    async getPendingKYC() {
        return this.prisma.kYCDocument.findMany({
            where: {
                status: { in: ['PENDING', 'UNDER_REVIEW'] },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        employerProfile: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
}
