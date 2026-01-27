import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                emailVerified: true,
                createdAt: true,
                studentProfile: true,
                employerProfile: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateStudentProfile(userId: string, data: any) {
        return this.prisma.studentProfile.update({
            where: { userId },
            data,
        });
    }

    async updateEmployerProfile(userId: string, data: any) {
        return this.prisma.employerProfile.update({
            where: { userId },
            data,
        });
    }
}
