import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/applications/[id] - Get application by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;

        const application = await prisma.application.findUnique({
            where: { id },
            include: {
                internship: {
                    include: {
                        employer: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                },
                student: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });

        if (!application) {
            return NextResponse.json(
                { message: 'Application not found' },
                { status: 404 }
            );
        }

        // Check access
        if (
            auth.user.role === 'STUDENT' && application.studentId !== auth.user.userId
        ) {
            return NextResponse.json(
                { message: 'Forbidden' },
                { status: 403 }
            );
        }

        if (
            auth.user.role === 'EMPLOYER' &&
            application.internship.employerId !== auth.user.userId
        ) {
            return NextResponse.json(
                { message: 'Forbidden' },
                { status: 403 }
            );
        }

        return NextResponse.json(application);
    } catch (error) {
        console.error('Get application error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/v1/applications/[id] - Update application status
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireRole(request, ['EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;
        const body = await request.json();
        const { status, interviewDate, interviewNotes } = body;

        const application = await prisma.application.findUnique({
            where: { id },
            include: {
                internship: true,
            },
        });

        if (!application) {
            return NextResponse.json(
                { message: 'Application not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (
            auth.user.role === 'EMPLOYER' &&
            application.internship.employerId !== auth.user.userId
        ) {
            return NextResponse.json(
                { message: 'Forbidden' },
                { status: 403 }
            );
        }

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: {
                status,
                interviewDate: interviewDate ? new Date(interviewDate) : undefined,
                interviewNotes,
                updatedAt: new Date(),
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

        return NextResponse.json(updatedApplication);
    } catch (error) {
        console.error('Update application error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/v1/applications/[id] - Withdraw application (Student only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireRole(request, ['STUDENT']);
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;

        const application = await prisma.application.findUnique({
            where: { id },
        });

        if (!application) {
            return NextResponse.json(
                { message: 'Application not found' },
                { status: 404 }
            );
        }

        if (application.studentId !== auth.user.userId) {
            return NextResponse.json(
                { message: 'Forbidden' },
                { status: 403 }
            );
        }

        await prisma.application.update({
            where: { id },
            data: {
                status: 'WITHDRAWN',
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ message: 'Application withdrawn' });
    } catch (error) {
        console.error('Withdraw application error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
