// Export all enums
export * from './enums';
export * from './dto';

// User & Auth Types
export enum UserRole {
    STUDENT = 'STUDENT',
    EMPLOYER = 'EMPLOYER',
    ADMIN = 'ADMIN',
    TPO = 'TPO'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
    PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export interface User {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface StudentProfile {
    id: string;
    userId: string;
    fullName: string;
    collegeName: string;
    collegeEmail: string;
    degree: string;
    graduationYear: number;
    skills: string[];
    resume?: string;
    portfolio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
}

export interface EmployerProfile {
    id: string;
    userId: string;
    companyName: string;
    industry: string;
    website: string;
    description: string;
    logo?: string;
    gstNumber?: string;
    cinNumber?: string;
    trustScore: number;
    kycStatus: KYCStatus;
}

// KYC Types
export enum KYCStatus {
    NOT_SUBMITTED = 'NOT_SUBMITTED',
    PENDING = 'PENDING',
    UNDER_REVIEW = 'UNDER_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    RESUBMIT_REQUIRED = 'RESUBMIT_REQUIRED'
}

export interface KYCDocument {
    id: string;
    userId: string;
    documentType: 'GST' | 'CIN' | 'PAN' | 'OTHER';
    documentNumber: string;
    documentUrl: string;
    status: KYCStatus;
    reviewedBy?: string;
    reviewedAt?: Date;
    rejectionReason?: string;
}

// Internship Types
export enum InternshipType {
    FULL_TIME = 'FULL_TIME',
    PART_TIME = 'PART_TIME',
    REMOTE = 'REMOTE',
    HYBRID = 'HYBRID',
    ON_SITE = 'ON_SITE'
}

export enum InternshipStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    CLOSED = 'CLOSED',
    CANCELLED = 'CANCELLED'
}

export interface Internship {
    id: string;
    employerId: string;
    title: string;
    description: string;
    type: InternshipType;
    status: InternshipStatus;
    location: string;
    duration: number; // in months
    stipend: number;
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    benefits: string[];
    applicationDeadline: Date;
    startDate: Date;
    maxApplicants: number;
    createdAt: Date;
    updatedAt: Date;
}

// Application Types
export enum ApplicationStatus {
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW = 'UNDER_REVIEW',
    SHORTLISTED = 'SHORTLISTED',
    INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    WITHDRAWN = 'WITHDRAWN'
}

export interface Application {
    id: string;
    internshipId: string;
    studentId: string;
    status: ApplicationStatus;
    coverLetter: string;
    resumeUrl: string;
    aiMatchScore?: number;
    appliedAt: Date;
    updatedAt: Date;
}

// Escrow & Payment Types
export enum EscrowStatus {
    PENDING = 'PENDING',
    FUNDS_HELD = 'FUNDS_HELD',
    RELEASED = 'RELEASED',
    REFUNDED = 'REFUNDED',
    DISPUTED = 'DISPUTED'
}

export enum MilestoneStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PAID = 'PAID'
}

export interface Milestone {
    id: string;
    applicationId: string;
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: MilestoneStatus;
    submittedAt?: Date;
    approvedAt?: Date;
    paidAt?: Date;
}

export interface EscrowTransaction {
    id: string;
    milestoneId: string;
    amount: number;
    status: EscrowStatus;
    transactionId?: string;
    initiatedAt: Date;
    completedAt?: Date;
    metadata?: Record<string, any>;
}

// Messaging Types
export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    attachments?: string[];
    isVerified: boolean;
    readAt?: Date;
    createdAt: Date;
}

// Notification Types
export enum NotificationType {
    APPLICATION_STATUS = 'APPLICATION_STATUS',
    MILESTONE_UPDATE = 'MILESTONE_UPDATE',
    MESSAGE = 'MESSAGE',
    KYC_UPDATE = 'KYC_UPDATE',
    PAYMENT = 'PAYMENT',
    SYSTEM = 'SYSTEM'
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: Date;
}

// AI Matching Types
export interface SkillEmbedding {
    id: string;
    skillName: string;
    embedding: number[];
    category: string;
}

export interface MatchResult {
    internshipId: string;
    matchScore: number;
    skillMatches: string[];
    skillGaps: string[];
    reasoning: string;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// JWT Payload
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}

// Audit Log
export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    KYC_SUBMIT = 'KYC_SUBMIT',
    ESCROW_FUND = 'ESCROW_FUND',
    MILESTONE_APPROVE = 'MILESTONE_APPROVE'
}

export interface AuditLog {
    id: string;
    userId: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}

export * from './dto';
