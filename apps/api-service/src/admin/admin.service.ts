import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getAllUsers(filters: { role?: string; status?: string; page: number; limit: number }): Promise<PaginatedResponse<any>> {
        const where: any = {};

        if (filters.role && filters.role !== 'ALL') {
            where.role = filters.role;
        }
        if (filters.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }

        const skip = (filters.page - 1) * filters.limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    emailVerified: true,
                    kycStatus: true,
                    createdAt: true,
                    updatedAt: true,
                    studentProfile: {
                        select: {
                            fullName: true,
                            collegeName: true,
                        },
                    },
                    employerProfile: {
                        select: {
                            companyName: true,
                            industry: true,
                        },
                    },
                },
                skip,
                take: filters.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users,
            meta: {
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(total / filters.limit),
                hasNext: skip + filters.limit < total,
                hasPrev: filters.page > 1,
            },
        };
    }

    async getAllInternships(filters: { status?: string; page: number; limit: number }): Promise<PaginatedResponse<any>> {
        const where: any = {};

        if (filters.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }

        const skip = (filters.page - 1) * filters.limit;

        const [internships, total] = await Promise.all([
            this.prisma.internship.findMany({
                where,
                include: {
                    employer: {
                        select: {
                            id: true,
                            email: true,
                            employerProfile: {
                                select: {
                                    companyName: true,
                                },
                            },
                        },
                    },
                },
                skip,
                take: filters.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.internship.count({ where }),
        ]);

        return {
            data: internships,
            meta: {
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(total / filters.limit),
                hasNext: skip + filters.limit < total,
                hasPrev: filters.page > 1,
            },
        };
    }

    async getAllApplications(filters: { status?: string; page: number; limit: number }): Promise<PaginatedResponse<any>> {
        const where: any = {};

        if (filters.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }

        const skip = (filters.page - 1) * filters.limit;

        const [applications, total] = await Promise.all([
            this.prisma.application.findMany({
                where,
                include: {
                    student: {
                        select: {
                            id: true,
                            email: true,
                            studentProfile: true,
                        },
                    },
                    internship: {
                        select: {
                            id: true,
                            title: true,
                            employer: {
                                select: {
                                    employerProfile: {
                                        select: {
                                            companyName: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                skip,
                take: filters.limit,
                orderBy: { appliedAt: 'desc' },
            }),
            this.prisma.application.count({ where }),
        ]);

        return {
            data: applications,
            meta: {
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(total / filters.limit),
                hasNext: skip + filters.limit < total,
                hasPrev: filters.page > 1,
            },
        };
    }

    async getAllKYC(status?: string) {
        const where: any = {};

        if (status && status !== 'ALL') {
            if (status === 'PENDING') {
                where.status = { in: ['PENDING', 'UNDER_REVIEW'] };
            } else {
                where.status = status;
            }
        }

        return this.prisma.kYCDocument.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        employerProfile: {
                            select: {
                                companyName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async suspendUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { status: 'SUSPENDED' },
        });
    }

    async activateUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE' },
        });
    }

    async deleteUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Soft delete by setting status to INACTIVE
        // Or hard delete if required:
        return this.prisma.user.delete({
            where: { id: userId },
        });
    }
}
