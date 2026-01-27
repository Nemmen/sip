// Brand Colors
export const COLORS = {
    primary: '#243447',
    accent: '#E1A337',
    lightBg: '#F3EEE6',
    white: '#FFFFFF',
    black: '#000000',
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827'
    },
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
};

// API Configuration
export const API_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    timeout: 30000,
    retries: 3
};

// Pagination
export const PAGINATION = {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100
};

// File Upload
export const FILE_UPLOAD = {
    maxSizeInMB: 5,
    allowedResume: ['pdf', 'doc', 'docx'],
    allowedImage: ['jpg', 'jpeg', 'png', 'webp'],
    allowedDocument: ['pdf', 'jpg', 'jpeg', 'png']
};

// Validation Rules
export const VALIDATION = {
    password: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecialChar: true
    },
    email: {
        maxLength: 255
    },
    phone: {
        minLength: 10,
        maxLength: 15
    }
};

// Rate Limiting
export const RATE_LIMIT = {
    login: {
        points: 5,
        duration: 900 // 15 minutes
    },
    api: {
        points: 100,
        duration: 60 // 1 minute
    },
    fileUpload: {
        points: 10,
        duration: 3600 // 1 hour
    }
};

// Queue Names
export const QUEUES = {
    KYC_CHECK: 'kyc-verification',
    ESCROW_PAYOUT: 'escrow-payout',
    AI_MATCHING: 'ai-matching',
    NOTIFICATIONS: 'notifications',
    EMAIL: 'email'
};

// Job Priorities
export const JOB_PRIORITY = {
    CRITICAL: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4
};

// JWT Configuration
export const JWT_CONFIG = {
    accessTokenExpiry: '7d',
    refreshTokenExpiry: '30d',
    algorithm: 'HS256' as const
};

// WebSocket Events
export const WS_EVENTS = {
    // Connection
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',

    // Messages
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_READ: 'message:read',

    // Notifications
    NOTIFICATION_NEW: 'notification:new',

    // Application Updates
    APPLICATION_STATUS_CHANGED: 'application:status',

    // Milestone Updates
    MILESTONE_APPROVED: 'milestone:approved',
    MILESTONE_PAID: 'milestone:paid'
};

// Skills Categories
export const SKILL_CATEGORIES = [
    'Frontend Development',
    'Backend Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'DevOps',
    'UI/UX Design',
    'Digital Marketing',
    'Content Writing',
    'Business Development',
    'Sales',
    'Finance',
    'Human Resources',
    'Operations',
    'Other'
];

// Industries
export const INDUSTRIES = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'E-commerce',
    'Manufacturing',
    'Consulting',
    'Marketing',
    'Media',
    'Real Estate',
    'Agriculture',
    'Transportation',
    'Energy',
    'Hospitality',
    'Other'
];

// Application Status Flow
export const APPLICATION_FLOW = {
    SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
    UNDER_REVIEW: ['SHORTLISTED', 'REJECTED'],
    SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED'],
    INTERVIEW_SCHEDULED: ['ACCEPTED', 'REJECTED'],
    ACCEPTED: [],
    REJECTED: [],
    WITHDRAWN: []
};

// Trust Score Weights
export const TRUST_SCORE_WEIGHTS = {
    KYC_VERIFIED: 30,
    COMPLETED_INTERNSHIPS: 40,
    POSITIVE_REVIEWS: 20,
    RESPONSE_TIME: 10
};

export const ERROR_MESSAGES = {
    // Auth
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_ALREADY_EXISTS: 'Email already registered',
    EMAIL_NOT_VERIFIED: 'Please verify your email',
    UNAUTHORIZED: 'Unauthorized access',

    // KYC
    KYC_REQUIRED: 'KYC verification required',
    KYC_PENDING: 'KYC verification pending',
    KYC_REJECTED: 'KYC verification rejected',

    // Internship
    INTERNSHIP_NOT_FOUND: 'Internship not found',
    INTERNSHIP_CLOSED: 'Internship applications closed',
    ALREADY_APPLIED: 'You have already applied to this internship',

    // Application
    APPLICATION_NOT_FOUND: 'Application not found',
    INVALID_STATUS_TRANSITION: 'Invalid status transition',

    // Escrow
    INSUFFICIENT_FUNDS: 'Insufficient funds',
    ESCROW_ALREADY_FUNDED: 'Escrow already funded',
    MILESTONE_NOT_COMPLETED: 'Milestone not completed',

    // General
    SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
    NOT_FOUND: 'Resource not found'
};

export const SUCCESS_MESSAGES = {
    REGISTERED: 'Registration successful',
    LOGIN_SUCCESS: 'Login successful',
    PROFILE_UPDATED: 'Profile updated successfully',
    APPLICATION_SUBMITTED: 'Application submitted successfully',
    KYC_SUBMITTED: 'KYC documents submitted for review',
    MILESTONE_APPROVED: 'Milestone approved successfully',
    PAYMENT_PROCESSED: 'Payment processed successfully'
};
