import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/notifications/unread-count - Get unread notification count
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const count = await prisma.notification.count({
            where: {
                userId: auth.user.userId,
                read: false,
            },
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
