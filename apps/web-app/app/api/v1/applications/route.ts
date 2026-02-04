import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/applications - List applications
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status');

        const where: any = {};

        // Filter by role
        if (auth.user.role === 'STUDENT') {
            where.studentId = auth.user.userId;
        } else if (auth.user.role === 'EMPLOYER') {
            where.internship = {
                employerId: auth.user.userId,
            };
        }

        if (status) where.status = status;

        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { appliedAt: 'desc' },
                include: {
                    internship: {
                        select: {
                            id: true,
                            title: true,
                            company: true,
                            location: true,
                            type: true,
                        },
                    },
                    student: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.application.count({ where }),
        ]);

        return NextResponse.json({
            data: applications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('List applications error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/v1/applications - Create application (Student only)
export async function POST(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT']);
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();
        const { internshipId, coverLetter } = body;

        if (!internshipId) {
            return NextResponse.json(
                { message: 'Internship ID is required' },
                { status: 400 }
            );
        }

        // Check if internship exists
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId },
        });

        if (!internship) {
            return NextResponse.json(
                { message: 'Internship not found' },
                { status: 404 }
            );
        }

        // Check for existing application
        const existingApplication = await prisma.application.findFirst({
            where: {
                internshipId,
                studentId: auth.user.userId,
            },
        });

        if (existingApplication) {
            return NextResponse.json(
                { message: 'You have already applied to this internship' },
                { status: 409 }
            );
        }

        const application = await prisma.application.create({
            data: {
                internshipId,
                studentId: auth.user.userId,
                coverLetter,
                status: 'APPLIED',
            },
            include: {
                internship: {
                    select: {
                        id: true,
                        title: true,
                        company: true,
                    },
                },
            },
        });

        return NextResponse.json(application, { status: 201 });
    } catch (error) {
        console.error('Create application error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
