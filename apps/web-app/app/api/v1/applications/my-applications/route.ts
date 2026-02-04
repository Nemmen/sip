import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/applications/my-applications - Get student's applications
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT']);
    if (auth instanceof NextResponse) return auth;

    try {
        const applications = await prisma.application.findMany({
            where: {
                studentId: auth.user.userId,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                internship: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                        location: true,
                        type: true,
                        stipend: true,
                        duration: true,
                    },
                },
            },
        });

        return NextResponse.json(applications);
    } catch (error) {
        console.error('Get my applications error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
