import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-middleware';

// PUT /api/v1/users/profile/student - Update student profile
export async function PUT(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT']);
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();
        const {
            fullName,
            phone,
            dateOfBirth,
            collegeName,
            collegeEmail,
            degree,
            major,
            graduationYear,
            cgpa,
            skills,
            resume,
            portfolio,
            githubUrl,
            linkedinUrl,
            bio,
        } = body;

        // Upsert student profile
        const profile = await prisma.studentProfile.upsert({
            where: { userId: auth.user.userId },
            create: {
                userId: auth.user.userId,
                fullName: fullName || '',
                collegeName: collegeName || '',
                degree: degree || '',
                graduationYear: graduationYear || new Date().getFullYear(),
                phone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                collegeEmail,
                major,
                cgpa,
                skills: skills || [],
                resume,
                portfolio,
                githubUrl,
                linkedinUrl,
                bio,
            },
            update: {
                fullName,
                phone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                collegeName,
                collegeEmail,
                degree,
                major,
                graduationYear,
                cgpa,
                skills,
                resume,
                portfolio,
                githubUrl,
                linkedinUrl,
                bio,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Update student profile error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/v1/users/profile/student - Get student profile
export async function GET(request: NextRequest) {
    const auth = requireRole(request, ['STUDENT', 'EMPLOYER', 'ADMIN']);
    if (auth instanceof NextResponse) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || auth.user.userId;

        const profile = await prisma.studentProfile.findUnique({
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
        console.error('Get student profile error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
