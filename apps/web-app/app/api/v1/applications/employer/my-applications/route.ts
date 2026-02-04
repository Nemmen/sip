import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/applications/employer/my-applications - Get applications to employer's internships
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['EMPLOYER']);
    if (auth instanceof NextResponse) return auth;

    try {
        const applications = await prisma.application.findMany({
            where: {
                internship: {
                    employerId: auth.user.userId,
                },
            },
            orderBy: { appliedAt: 'desc' },
            include: {
                internship: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                    },
                },
                student: {
                    select: {
                        id: true,
                        email: true,
                        studentProfile: {
                            select: {
                                fullName: true,
                                collegeName: true,
                                skills: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(applications);
    } catch (error) {
        console.error('Get employer applications error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
