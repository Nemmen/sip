import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, verifyAuth } from '@/lib/auth-middleware';

// GET /api/v1/internships/[id] - Get internship by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const internship = await prisma.internship.findUnique({
            where: { id },
            include: {
                employer: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });

        if (!internship) {
            return NextResponse.json(
                { message: 'Internship not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(internship);
    } catch (error) {
        console.error('Get internship error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/v1/internships/[id] - Update internship (Employer only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireRole(request, ['EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;
        const body = await request.json();

        // Check ownership
        const existing = await prisma.internship.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { message: 'Internship not found' },
                { status: 404 }
            );
        }

        if (existing.employerId !== auth.user.userId && auth.user.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Forbidden' },
                { status: 403 }
            );
        }

        const internship = await prisma.internship.update({
            where: { id },
            data: {
                ...body,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(internship);
    } catch (error) {
        console.error('Update internship error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/v1/internships/[id] - Delete internship (Employer only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = requireRole(request, ['EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;

        // Check ownership
        const existing = await prisma.internship.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { message: 'Internship not found' },
                { status: 404 }
            );
        }

        if (existing.employerId !== auth.user.userId && auth.user.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Forbidden' },
                { status: 403 }
            );
        }

        await prisma.internship.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Internship deleted' });
    } catch (error) {
        console.error('Delete internship error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
