import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
    constructor(private prisma: PrismaService) { }

    async create(internshipId: string, studentId: string, data: any) {
        // Check if already applied
        const existing = await this.prisma.application.findUnique({
            where: {
                internshipId_studentId: {
                    internshipId,
                    studentId,
                },
            },
        });

        if (existing) {
            throw new ConflictException('Already applied to this internship');
        }

        // Check if internship is still accepting applications
        const internship = await this.prisma.internship.findUnique({
            where: { id: internshipId },
        });

        if (!internship || internship.status !== 'PUBLISHED') {
            throw new ConflictException('Internship not accepting applications');
        }

        if (new Date() > internship.applicationDeadline) {
            throw new ConflictException('Application deadline passed');
        }

        return this.prisma.application.create({
            data: {
                internshipId,
                studentId,
                ...data,
                status: 'SUBMITTED',
            },
            include: {
                internship: {
                    include: {
                        employer: {
                            select: {
                                employerProfile: {
                                    select: { companyName: true },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    async findStudentApplications(studentId: string) {
        return this.prisma.application.findMany({
            where: { studentId },
            include: {
                internship: {
                    include: {
                        employer: {
                            select: {
                                employerProfile: {
                                    select: { companyName: true, logo: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { appliedAt: 'desc' },
        });
    }

    async findEmployerApplications(employerId: string) {
        return this.prisma.application.findMany({
            where: {
                internship: {
                    employerId,
                },
            },
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
                        status: true,
                    },
                },
            },
            orderBy: { appliedAt: 'desc' },
        });
    }

    async findInternshipApplications(internshipId: string) {
        return this.prisma.application.findMany({
            where: { internshipId },
            include: {
                student: {
                    select: {
                        studentProfile: true,
                    },
                },
            },
            orderBy: { aiMatchScore: 'desc' },
        });
    }

    async updateStatus(id: string, status: ApplicationStatus, interviewDate?: Date, interviewNotes?: string) {
        const application = await this.prisma.application.update({
            where: { id },
            data: {
                status,
                ...(interviewDate && { interviewDate }),
                ...(interviewNotes && { interviewNotes }),
            },
            include: {
                student: {
                    select: {
                        id: true,
                        email: true,
                        studentProfile: {
                            select: {
                                fullName: true,
                            },
                        },
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
        });

        // Send notification if interview is scheduled
        if (status === 'INTERVIEW_SCHEDULED' && interviewDate) {
            await this.prisma.notification.create({
                data: {
                    userId: application.studentId,
                    type: 'APPLICATION_STATUS',
                    title: 'Interview Scheduled',
                    message: `Your interview for ${application.internship.title} at ${application.internship.employer.employerProfile.companyName} has been scheduled for ${new Date(interviewDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}.${interviewNotes ? ` Notes: ${interviewNotes}` : ''}`,
                    link: `/student/applications/${application.id}`,
                },
            });
        }

        return application;
    }

    async findOne(id: string, userId: string) {
        const application = await this.prisma.application.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        email: true,
                        studentProfile: true,
                    },
                },
                internship: {
                    include: {
                        employer: {
                            select: {
                                id: true,
                                email: true,
                                employerProfile: true,
                            },
                        },
                    },
                },
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Verify user has access (student who applied or employer who posted internship)
        const hasAccess =
            application.studentId === userId ||
            application.internship.employerId === userId;

        if (!hasAccess) {
            throw new NotFoundException('Application not found');
        }

        return application;
    }

    async withdraw(id: string, studentId: string) {
        const application = await this.prisma.application.findUnique({
            where: { id },
        });

        if (!application || application.studentId !== studentId) {
            throw new NotFoundException('Application not found');
        }

        return this.updateStatus(id, 'WITHDRAWN');
    }
}
