import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/admin/stats - Get admin dashboard stats
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const [
            totalUsers,
            totalStudents,
            totalEmployers,
            totalInternships,
            totalApplications,
            pendingKyc,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'EMPLOYER' } }),
            prisma.internship.count(),
            prisma.application.count(),
            prisma.user.count({ where: { kycStatus: 'PENDING' } }),
        ]);

        return NextResponse.json({
            totalUsers,
            totalStudents,
            totalEmployers,
            totalInternships,
            totalApplications,
            pendingKyc,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
