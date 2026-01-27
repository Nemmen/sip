// Shared enums for frontend
// These should match the backend Prisma schema enums

export enum ApplicationStatus {
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW = 'UNDER_REVIEW',
    INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    WITHDRAWN = 'WITHDRAWN',
}

export enum InternshipStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    CLOSED = 'CLOSED',
    COMPLETED = 'COMPLETED',
}

export enum KYCStatus {
    PENDING = 'PENDING',
    UNDER_REVIEW = 'UNDER_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum UserRole {
    STUDENT = 'STUDENT',
    EMPLOYER = 'EMPLOYER',
    ADMIN = 'ADMIN',
    TPO = 'TPO',
}

export enum NotificationType {
    APPLICATION_STATUS = 'APPLICATION_STATUS',
    NEW_APPLICATION = 'NEW_APPLICATION',
    MESSAGE = 'MESSAGE',
    INTERNSHIP_UPDATE = 'INTERNSHIP_UPDATE',
    KYC_UPDATE = 'KYC_UPDATE',
    SYSTEM = 'SYSTEM',
}

export enum MilestoneStatus {
    PENDING = 'PENDING',
    FUNDED = 'FUNDED',
    COMPLETED = 'COMPLETED',
    APPROVED = 'APPROVED',
    DISPUTED = 'DISPUTED',
}
