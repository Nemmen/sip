// Data Transfer Objects (DTOs)

export interface RegisterDto {
    email: string;
    password: string;
    role: 'STUDENT' | 'EMPLOYER';
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface CreateInternshipDto {
    title: string;
    description: string;
    type: string;
    location: string;
    duration: number;
    stipend: number;
    requiredSkills: string[];
    preferredSkills?: string[];
    responsibilities: string[];
    benefits?: string[];
    applicationDeadline: string;
    startDate: string;
    maxApplicants?: number;
}

export interface UpdateInternshipDto {
    title?: string;
    description?: string;
    type?: string;
    location?: string;
    duration?: number;
    stipend?: number;
    requiredSkills?: string[];
    preferredSkills?: string[];
    responsibilities?: string[];
    benefits?: string[];
    applicationDeadline?: string;
    startDate?: string;
    status?: string;
}

export interface CreateApplicationDto {
    internshipId: string;
    coverLetter: string;
    resumeUrl?: string;
}

export interface UpdateStudentProfileDto {
    fullName?: string;
    collegeName?: string;
    degree?: string;
    graduationYear?: number;
    skills?: string[];
    resume?: string;
    portfolio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
}

export interface UpdateEmployerProfileDto {
    companyName?: string;
    industry?: string;
    website?: string;
    description?: string;
    logo?: string;
}

export interface SubmitKYCDto {
    documentType: 'GST' | 'CIN' | 'PAN';
    documentNumber: string;
    documentUrl: string;
}

export interface CreateMilestoneDto {
    applicationId: string;
    title: string;
    description: string;
    amount: number;
    dueDate: string;
}

export interface ApproveMilestoneDto {
    milestoneId: string;
    approved: boolean;
    feedback?: string;
}

export interface FundEscrowDto {
    milestoneId: string;
    amount: number;
    paymentMethodId: string;
}

export interface SendMessageDto {
    receiverId: string;
    content: string;
    attachments?: string[];
}

export interface SearchInternshipsDto {
    query?: string;
    skills?: string[];
    location?: string;
    type?: string;
    minStipend?: number;
    maxStipend?: number;
    page?: number;
    limit?: number;
}
