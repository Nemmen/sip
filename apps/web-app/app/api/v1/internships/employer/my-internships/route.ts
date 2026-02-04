import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/internships/employer/my-internships - Get employer's internships
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['EMPLOYER']);
    if (auth instanceof NextResponse) return auth;

    try {
        const internships = await prisma.internship.findMany({
            where: {
                employerId: auth.user.userId,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
        });

        return NextResponse.json(internships);
    } catch (error) {
        console.error('Get employer internships error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
