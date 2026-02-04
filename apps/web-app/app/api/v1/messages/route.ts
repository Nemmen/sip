import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/messages - List conversations
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: auth.user.userId },
                    { receiverId: auth.user.userId },
                ],
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('List messages error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/v1/messages - Send message
export async function POST(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();
        const { receiverId, content, applicationId } = body;

        if (!receiverId || !content) {
            return NextResponse.json(
                { message: 'Receiver ID and content are required' },
                { status: 400 }
            );
        }

        const message = await prisma.message.create({
            data: {
                senderId: auth.user.userId,
                receiverId,
                content,
                applicationId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
