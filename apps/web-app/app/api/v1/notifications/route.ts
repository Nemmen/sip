import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/notifications - List notifications
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === 'true';

        const where: any = {
            userId: auth.user.userId,
        };

        if (unreadOnly) {
            where.read = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('List notifications error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/v1/notifications/mark-read - Mark notifications as read
export async function POST(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();
        const { notificationIds } = body;

        if (notificationIds && notificationIds.length > 0) {
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: auth.user.userId,
                },
                data: {
                    read: true,
                },
            });
        } else {
            await prisma.notification.updateMany({
                where: {
                    userId: auth.user.userId,
                },
                data: {
                    read: true,
                },
            });
        }

        return NextResponse.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Mark notifications read error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
