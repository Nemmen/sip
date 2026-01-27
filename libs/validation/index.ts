import { z } from 'zod';

// Auth Schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email address').max(255),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password too long')
        .regex(/[A-Z]/, 'Password must contain uppercase letter')
        .regex(/[a-z]/, 'Password must contain lowercase letter')
        .regex(/[0-9]/, 'Password must contain number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
    role: z.enum(['STUDENT', 'EMPLOYER'])
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

// Profile Schemas
export const studentProfileSchema = z.object({
    fullName: z.string().min(2).max(100),
    collegeName: z.string().min(2).max(200),
    collegeEmail: z.string().email().optional(),
    degree: z.string().min(2).max(100),
    graduationYear: z.number().int().min(2020).max(2030),
    skills: z.array(z.string()).min(1).max(50),
    resume: z.string().url().optional(),
    portfolio: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    linkedinUrl: z.string().url().optional()
});

export const employerProfileSchema = z.object({
    companyName: z.string().min(2).max(200),
    industry: z.string().min(2).max(100),
    website: z.string().url(),
    description: z.string().min(50).max(2000),
    logo: z.string().url().optional()
});

// Internship Schemas
export const createInternshipSchema = z.object({
    title: z.string().min(5).max(200),
    description: z.string().min(100).max(5000),
    type: z.enum(['FULL_TIME', 'PART_TIME', 'REMOTE', 'HYBRID', 'ON_SITE']),
    location: z.string().min(2).max(200),
    duration: z.number().int().min(1).max(12),
    stipend: z.number().min(0).max(1000000),
    requiredSkills: z.array(z.string()).min(1).max(20),
    preferredSkills: z.array(z.string()).max(20).optional(),
    responsibilities: z.array(z.string()).min(1).max(20),
    benefits: z.array(z.string()).max(10).optional(),
    applicationDeadline: z.string().datetime(),
    startDate: z.string().datetime(),
    maxApplicants: z.number().int().min(1).max(1000).optional()
});

export const updateInternshipSchema = createInternshipSchema.partial().extend({
    status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED']).optional()
});

// Application Schemas
export const createApplicationSchema = z.object({
    internshipId: z.string().uuid(),
    coverLetter: z.string().min(100).max(2000),
    resumeUrl: z.string().url().optional()
});

// KYC Schemas
export const submitKYCSchema = z.object({
    documentType: z.enum(['GST', 'CIN', 'PAN']),
    documentNumber: z.string().min(5).max(50),
    documentUrl: z.string().url()
});

// Milestone Schemas
export const createMilestoneSchema = z.object({
    applicationId: z.string().uuid(),
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(1000),
    amount: z.number().min(0).max(1000000),
    dueDate: z.string().datetime()
});

export const approveMilestoneSchema = z.object({
    milestoneId: z.string().uuid(),
    approved: z.boolean(),
    feedback: z.string().max(500).optional()
});

// Escrow Schemas
export const fundEscrowSchema = z.object({
    milestoneId: z.string().uuid(),
    amount: z.number().positive(),
    paymentMethodId: z.string().min(1)
});

// Message Schemas
export const sendMessageSchema = z.object({
    receiverId: z.string().uuid(),
    content: z.string().min(1).max(5000),
    attachments: z.array(z.string().url()).max(5).optional()
});

// Search Schemas
export const searchInternshipsSchema = z.object({
    query: z.string().max(200).optional(),
    skills: z.array(z.string()).max(10).optional(),
    location: z.string().max(100).optional(),
    type: z.string().optional(),
    minStipend: z.number().min(0).optional(),
    maxStipend: z.number().min(0).optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
});

// Helper function to validate
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
}

export function validateSafe<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}
