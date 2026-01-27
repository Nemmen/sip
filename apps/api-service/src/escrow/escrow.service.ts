import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowStatus, MilestoneStatus } from '@prisma/client';
import { QUEUES, JOB_PRIORITY } from '@sip/constants';

@Injectable()
export class EscrowService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue(QUEUES.ESCROW_PAYOUT) private escrowQueue: Queue,
    ) { }

    async fundMilestone(milestoneId: string, amount: number, paymentData: any) {
        const milestone = await this.prisma.milestone.findUnique({
            where: { id: milestoneId },
        });

        if (!milestone) {
            throw new BadRequestException('Milestone not found');
        }

        if (milestone.amount !== amount) {
            throw new BadRequestException('Amount mismatch');
        }

        // Check if already funded
        const existing = await this.prisma.escrowTransaction.findUnique({
            where: { milestoneId },
        });

        if (existing && existing.status === 'FUNDS_HELD') {
            throw new BadRequestException('Milestone already funded');
        }

        // Create or update escrow transaction
        const transaction = await this.prisma.escrowTransaction.upsert({
            where: { milestoneId },
            create: {
                milestoneId,
                amount,
                status: 'PENDING',
                transactionId: paymentData.transactionId,
                paymentGatewayResponse: paymentData,
            },
            update: {
                amount,
                status: 'PENDING',
                transactionId: paymentData.transactionId,
                paymentGatewayResponse: paymentData,
            },
        });

        // In production, integrate with payment gateway here
        // For now, mark as FUNDS_HELD
        await this.prisma.escrowTransaction.update({
            where: { id: transaction.id },
            data: { status: 'FUNDS_HELD' },
        });

        return transaction;
    }

    async approveMilestone(milestoneId: string) {
        const milestone = await this.prisma.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                escrowTransaction: true,
                application: {
                    include: {
                        student: true,
                        internship: true,
                    },
                },
            },
        });

        if (!milestone) {
            throw new BadRequestException('Milestone not found');
        }

        if (milestone.status !== 'SUBMITTED') {
            throw new BadRequestException('Milestone not submitted');
        }

        if (!milestone.escrowTransaction || milestone.escrowTransaction.status !== 'FUNDS_HELD') {
            throw new BadRequestException('Escrow not funded');
        }

        // Update milestone status
        await this.prisma.milestone.update({
            where: { id: milestoneId },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
            },
        });

        // Add to payout queue
        await this.escrowQueue.add(
            'process-payout',
            {
                milestoneId,
                transactionId: milestone.escrowTransaction.id,
                studentId: milestone.application.studentId,
                amount: milestone.amount,
            },
            {
                priority: JOB_PRIORITY.HIGH,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
            },
        );

        return { message: 'Milestone approved, payout queued' };
    }

    async getMilestones(applicationId: string) {
        return this.prisma.milestone.findMany({
            where: { applicationId },
            include: {
                escrowTransaction: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async createMilestone(applicationId: string, data: any) {
        return this.prisma.milestone.create({
            data: {
                applicationId,
                ...data,
                status: 'NOT_STARTED',
            },
        });
    }
}
