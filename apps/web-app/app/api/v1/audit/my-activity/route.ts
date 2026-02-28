import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/audit/my-activity - Get current user's audit logs
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const logs = await prisma.auditLog.findMany({
            where: { userId: auth.user.userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Get my activity error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
