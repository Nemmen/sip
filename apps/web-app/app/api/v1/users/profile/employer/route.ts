import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// PUT /api/v1/users/profile/employer - Update employer profile
export async function PUT(request: NextRequest) {
    const auth = requireRole(request, ['EMPLOYER']);
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();
        const {
            companyName,
            industry,
            website,
            description,
            logo,
            gstNumber,
            cinNumber,
        } = body;

        // Upsert employer profile
        const profile = await prisma.employerProfile.upsert({
            where: { userId: auth.user.userId },
            create: {
                userId: auth.user.userId,
                companyName: companyName || '',
                industry: industry || '',
                website: website || '',
                description: description || '',
                logo,
                gstNumber,
                cinNumber,
            },
            update: {
                companyName,
                industry,
                website,
                description,
                logo,
                gstNumber,
                cinNumber,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Update employer profile error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/v1/users/profile/employer - Get employer profile
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || auth.user.userId;

        const profile = await prisma.employerProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        kycStatus: true,
                    },
                },
            },
        });

        if (!profile) {
            return NextResponse.json(
                { message: 'Profile not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Get employer profile error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
