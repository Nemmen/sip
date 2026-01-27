import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUES } from '@sip/constants';

@Injectable()
@Processor(QUEUES.ESCROW_PAYOUT)
export class EscrowProcessor extends WorkerHost {
    private readonly logger = new Logger(EscrowProcessor.name);

    constructor(private prisma: PrismaService) {
        super();
    }

    async process(job: Job<any>): Promise<any> {
        this.logger.log(`Processing escrow payout: ${job.id}`);

        const { milestoneId, transactionId, studentId, amount } = job.data;

        try {
            // Call payment gateway API to process payout
            // This is where you'd integrate with Stripe, Razorpay, etc.
            const payoutResult = await this.processPayment(studentId, amount);

            // Update escrow transaction
            await this.prisma.escrowTransaction.update({
                where: { id: transactionId },
                data: {
                    status: 'RELEASED',
                    completedAt: new Date(),
                    metadata: { payoutResult },
                },
            });

            // Update milestone
            await this.prisma.milestone.update({
                where: { id: milestoneId },
                data: {
                    status: 'PAID',
                    paidAt: new Date(),
                },
            });

            this.logger.log(`Payout processed successfully for milestone: ${milestoneId}`);

            return { success: true, milestoneId, payoutResult };
        } catch (error) {
            this.logger.error(`Payout failed for milestone: ${milestoneId}`, error);
            throw error; // Will trigger retry
        }
    }

    private async processPayment(studentId: string, amount: number) {
        // Mock payment processing
        // In production, integrate with actual payment gateway
        this.logger.log(`Processing payment: ${amount} to student: ${studentId}`);

        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

        return {
            transactionId: `txn_${Date.now()}`,
            status: 'success',
            amount,
            timestamp: new Date(),
        };
    }
}
