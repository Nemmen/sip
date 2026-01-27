import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUES } from '@sip/constants';

@Injectable()
@Processor(QUEUES.NOTIFICATIONS)
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(private prisma: PrismaService) {
        super();
    }

    async process(job: Job<any>): Promise<any> {
        this.logger.log(`Processing notification: ${job.id}`);

        const { userId, type, title, message, link, metadata } = job.data;

        try {
            // Create notification in database
            await this.prisma.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    message,
                    link,
                    metadata,
                },
            });

            // Send push notification / email based on user preferences
            // await this.sendPushNotification(userId, title, message);
            // await this.sendEmailNotification(userId, title, message);

            this.logger.log(`Notification sent to user: ${userId}`);

            return { success: true, userId };
        } catch (error) {
            this.logger.error(`Notification failed for user: ${userId}`, error);
            throw error;
        }
    }
}
