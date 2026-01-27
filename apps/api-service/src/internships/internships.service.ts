import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InternshipStatus } from '@prisma/client';

@Injectable()
export class InternshipsService {
    constructor(private prisma: PrismaService) { }

    async create(employerId: string, data: any) {
        return this.prisma.internship.create({
            data: {
                ...data,
                employerId,
                status: 'DRAFT',
            },
        });
    }

    async findAll(filters?: any) {
        const where: any = { status: 'PUBLISHED' };

        if (filters?.skills?.length) {
            where.requiredSkills = {
                hasSome: filters.skills,
            };
        }

        if (filters?.location) {
            where.location = {
                contains: filters.location,
                mode: 'insensitive',
            };
        }

        if (filters?.minStipend) {
            where.stipend = { gte: filters.minStipend };
        }

        const [data, total] = await Promise.all([
            this.prisma.internship.findMany({
                where,
                include: {
                    employer: {
                        select: {
                            id: true,
                            employerProfile: {
                                select: {
                                    companyName: true,
                                    logo: true,
                                    trustScore: true,
                                },
                            },
                        },
                    },
                },
                skip: (filters?.page - 1) * filters?.limit || 0,
                take: filters?.limit || 20,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.internship.count({ where }),
        ]);

        return {
            data,
            total,
            page: filters?.page || 1,
            limit: filters?.limit || 20,
            hasMore: total > (filters?.page || 1) * (filters?.limit || 20),
        };
    }

    async findOne(id: string) {
        const internship = await this.prisma.internship.findUnique({
            where: { id },
            include: {
                employer: {
                    select: {
                        id: true,
                        email: true,
                        employerProfile: true,
                    },
                },
            },
        });

        if (!internship) {
            throw new NotFoundException('Internship not found');
        }

        // Increment view count
        await this.prisma.internship.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });

        return internship;
    }

    async update(id: string, employerId: string, data: any) {
        const internship = await this.prisma.internship.findUnique({
            where: { id },
        });

        if (!internship) {
            throw new NotFoundException('Internship not found');
        }

        if (internship.employerId !== employerId) {
            throw new ForbiddenException('Not authorized to update this internship');
        }

        return this.prisma.internship.update({
            where: { id },
            data,
        });
    }

    async publish(id: string, employerId: string) {
        return this.update(id, employerId, { status: 'PUBLISHED' as InternshipStatus });
    }

    async close(id: string, employerId: string) {
        return this.update(id, employerId, { status: 'CLOSED' as InternshipStatus });
    }

    async delete(id: string, employerId: string) {
        const internship = await this.prisma.internship.findUnique({
            where: { id },
        });

        if (!internship) {
            throw new NotFoundException('Internship not found');
        }

        if (internship.employerId !== employerId) {
            throw new ForbiddenException('Not authorized to delete this internship');
        }

        return this.prisma.internship.delete({ where: { id } });
    }

    async getEmployerInternships(employerId: string) {
        return this.prisma.internship.findMany({
            where: { employerId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
