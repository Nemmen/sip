import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUES } from '@sip/constants';

@Injectable()
@Processor(QUEUES.KYC_CHECK)
export class KycProcessor extends WorkerHost {
    private readonly logger = new Logger(KycProcessor.name);

    constructor(private prisma: PrismaService) {
        super();
    }

    async process(job: Job<any>): Promise<any> {
        this.logger.log(`Processing KYC verification: ${job.id}`);

        const { documentId, userId } = job.data;

        try {
            // Call external KYC verification API
            const verificationResult = await this.verifyDocument(documentId);

            // Update KYC document status
            await this.prisma.kYCDocument.update({
                where: { id: documentId },
                data: {
                    status: verificationResult.isValid ? 'UNDER_REVIEW' : 'REJECTED',
                    rejectionReason: verificationResult.isValid
                        ? null
                        : verificationResult.reason,
                },
            });

            // Calculate trust score if approved
            if (verificationResult.isValid) {
                await this.updateTrustScore(userId);
            }

            this.logger.log(`KYC verification completed for: ${documentId}`);

            return { success: true, documentId, result: verificationResult };
        } catch (error) {
            this.logger.error(`KYC verification failed for: ${documentId}`, error);
            throw error;
        }
    }

    private async verifyDocument(documentId: string) {
        // Mock KYC verification
        // In production, integrate with KYC providers like Onfido, Jumio, etc.
        this.logger.log(`Verifying document: ${documentId}`);

        await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate API call

        return {
            isValid: true,
            confidence: 0.95,
            reason: null,
        };
    }

    private async updateTrustScore(userId: string) {
        const profile = await this.prisma.employerProfile.findUnique({
            where: { userId },
        });

        if (profile) {
            await this.prisma.employerProfile.update({
                where: { userId },
                data: {
                    trustScore: profile.trustScore + 30, // KYC adds 30 points
                    kycStatus: 'UNDER_REVIEW',
                },
            });
        }
    }
}
