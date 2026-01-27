import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
    constructor(private prisma: PrismaService) { }

    async sendMessage(senderId: string, receiverId: string, content: string, attachments?: string[]) {
        const conversationId = this.getConversationId(senderId, receiverId);

        return this.prisma.message.create({
            data: {
                conversationId,
                senderId,
                receiverId,
                content,
                attachments: attachments || [],
            },
        });
    }

    async getConversations(userId: string) {
        const messages = await this.prisma.message.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            orderBy: { createdAt: 'desc' },
            distinct: ['conversationId'],
            take: 50,
        });

        return messages;
    }

    async getMessages(userId: string, otherUserId: string) {
        const conversationId = this.getConversationId(userId, otherUserId);

        return this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        studentProfile: { select: { fullName: true } },
                        employerProfile: { select: { companyName: true } },
                    },
                },
            },
        });
    }

    async markAsRead(messageId: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (message && message.receiverId === userId) {
            return this.prisma.message.update({
                where: { id: messageId },
                data: { readAt: new Date() },
            });
        }
    }

    private getConversationId(userId1: string, userId2: string): string {
        return [userId1, userId2].sort().join('-');
    }
}
