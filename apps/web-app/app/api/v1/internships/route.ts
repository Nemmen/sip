import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// GET /api/v1/internships - List internships
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const location = searchParams.get('location');
        const search = searchParams.get('search');

        const where: any = {};

        if (status) where.status = status;
        if (type) where.type = type;
        if (location) where.location = { contains: location, mode: 'insensitive' };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [internships, total] = await Promise.all([
            prisma.internship.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    employer: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.internship.count({ where }),
        ]);

        return NextResponse.json({
            data: internships,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('List internships error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/v1/internships - Create internship (Employer only)
export async function POST(request: NextRequest) {
    const auth = requireRole(request, ['EMPLOYER']);
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();

        const internship = await prisma.internship.create({
            data: {
                ...body,
                employerId: auth.user.userId,
                status: 'DRAFT',
            },
        });

        return NextResponse.json(internship, { status: 201 });
    } catch (error) {
        console.error('Create internship error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
