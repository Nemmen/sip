import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/kyc/status - Get KYC status
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const user = await prisma.user.findUnique({
            where: { id: auth.user.userId },
            select: {
                kycStatus: true,
                kycSubmittedAt: true,
                kycVerifiedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: user.kycStatus,
            submittedAt: user.kycSubmittedAt,
            verifiedAt: user.kycVerifiedAt,
        });
    } catch (error) {
        console.error('Get KYC status error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/v1/kyc/submit - Submit KYC
export async function POST(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER']);
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();

        const user = await prisma.user.update({
            where: { id: auth.user.userId },
            data: {
                kycStatus: 'PENDING',
                kycSubmittedAt: new Date(),
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            message: 'KYC submitted successfully',
            status: user.kycStatus,
        });
    } catch (error) {
        console.error('Submit KYC error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
