/**
 * Application Domain - Context Definitions
 * 
 * Context provides real-world business information needed to validate
 * whether an intent can be executed.
 * 
 * Why Context-Aware?
 * - Status alone isn't enough (e.g., "SUBMITTED" doesn't tell if deadline passed)
 * - Business rules depend on external factors (internship status, capacity, KYC)
 * - Enables rich validation without coupling to database
 * 
 * Architecture:
 * - Context is optional (backward compatible)
 * - Context is immutable (passed in, not modified)
 * - Context is comprehensive (all validation data in one place)
 * 
 * @module domain/application/context
 */

/**
 * Internship status values.
 * 
 * Determines whether the internship is accepting applications.
 */
export enum InternshipStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

/**
 * KYC verification status.
 * 
 * Employers must have approved KYC to perform certain actions.
 */
export enum KYCStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Application context for business rule validation.
 * 
 * Contains all external factors needed to validate an intent.
 * Pass this to executeIntent() for context-aware validation.
 * 
 * Design Principles:
 * - All fields optional (for backward compatibility)
 * - Comprehensive (includes all validation data)
 * - Immutable (read-only, not modified by engine)
 * - Self-contained (no external dependencies)
 * 
 * @example
 * ```typescript
 * const context: ApplicationContext = {
 *   internshipStatus: InternshipStatus.PUBLISHED,
 *   applicationDeadline: new Date('2026-02-15'),
 *   currentDate: new Date(),
 *   maxApplicants: 10,
 *   acceptedCount: 8,
 *   kycStatus: KYCStatus.APPROVED,
 *   matchScore: 85,
 * };
 * 
 * const result = executeIntent({
 *   intent: ApplicationIntent.ACCEPT_CANDIDATE,
 *   actorRole: UserRole.EMPLOYER,
 *   currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
 * }, context);
 * 
 * // Engine validates business rules using context
 * if (!result.allowed) {
 *   console.log(result.reasonCode); // e.g., 'MAX_APPLICANTS_REACHED'
 * }
 * ```
 */
export interface ApplicationContext {
  /**
   * Status of the internship.
   * 
   * Rules:
   * - Cannot submit applications if DRAFT or CLOSED
   * - Cannot accept candidates if CLOSED
   */
  internshipStatus?: InternshipStatus;

  /**
   * Application deadline for the internship.
   * 
   * Rules:
   * - Cannot submit applications after deadline
   */
  applicationDeadline?: Date;

  /**
   * Current date/time (for deadline validation).
   * 
   * Defaults to now if not provided.
   * Can be overridden for testing.
   */
  currentDate?: Date;

  /**
   * Maximum number of applicants allowed.
   * 
   * Rules:
   * - Cannot accept candidates if limit reached
   */
  maxApplicants?: number;

  /**
   * Number of candidates already accepted.
   * 
   * Rules:
   * - Cannot accept if acceptedCount >= maxApplicants
   */
  acceptedCount?: number;

  /**
   * Total number of candidates accepted across all company internships.
   * 
   * Policy:
   * - COMPANY_HIRING_LIMIT_POLICY uses this to enforce global hiring limit
   */
  companyAcceptedCount?: number;

  /**
   * Maximum hiring limit for the entire company.
   * 
   * Policy:
   * - COMPANY_HIRING_LIMIT_POLICY enforces this limit
   */
  companyHiringLimit?: number;

  /**
   * Employer's KYC verification status.
   * 
   * Rules:
   * - Employer must have APPROVED KYC for most actions
   * - Students don't need KYC
   */
  kycStatus?: KYCStatus;

  /**
   * AI match score for the candidate (0-100).
   * 
   * Optional. Can be used for conditional workflows.
   * 
   * Policies:
   * - HIGH_RISK_APPLICATION_POLICY warns if score < 60
   * 
   * Future use:
   * - Auto-shortlist if score > threshold
   * - Fast-track interviews for high scores
   */
  matchScore?: number;

  /**
   * Whether the application is already withdrawn.
   * 
   * Rules:
   * - Cannot perform actions on withdrawn applications
   */
  isWithdrawn?: boolean;

  /**
   * Whether the employer owns the internship.
   * 
   * Rules:
   * - Cannot perform employer actions on other's internships
   */
  ownsInternship?: boolean;

  /**
   * Whether the student owns the application.
   * 
   * Rules:
   * - Cannot withdraw other students' applications
   */
  ownsApplication?: boolean;
}

/**
 * Denial reason codes for context-aware validation.
 * 
 * Structured reason codes enable:
 * - i18n (translate codes to user's language)
 * - Consistent error handling
 * - Analytics (track why intents fail)
 * - Better UX (show specific help messages)
 */
export enum DenialReasonCode {
  // Permission-related
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  NOT_OWNER = 'NOT_OWNER',
  
  // Status-related
  TERMINAL_STATUS = 'TERMINAL_STATUS',
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  ALREADY_WITHDRAWN = 'ALREADY_WITHDRAWN',
  
  // Internship-related
  INTERNSHIP_DRAFT = 'INTERNSHIP_DRAFT',
  INTERNSHIP_CLOSED = 'INTERNSHIP_CLOSED',
  DEADLINE_EXPIRED = 'DEADLINE_EXPIRED',
  MAX_APPLICANTS_REACHED = 'MAX_APPLICANTS_REACHED',
  
  // KYC-related
  KYC_NOT_APPROVED = 'KYC_NOT_APPROVED',
  KYC_PENDING = 'KYC_PENDING',
  KYC_REJECTED = 'KYC_REJECTED',
  
  // Generic
  MISSING_TARGET_STATUS = 'MISSING_TARGET_STATUS',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Human-readable messages for denial reason codes.
 * 
 * Used to provide helpful feedback to users.
 * Can be overridden with i18n translations.
 */
export const DENIAL_REASON_MESSAGES: Record<DenialReasonCode, string> = {
  [DenialReasonCode.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
  [DenialReasonCode.NOT_OWNER]: 'You can only perform this action on your own internships/applications.',
  
  [DenialReasonCode.TERMINAL_STATUS]: 'This application is in a final state and cannot be modified.',
  [DenialReasonCode.INVALID_TRANSITION]: 'This status change is not allowed.',
  [DenialReasonCode.ALREADY_WITHDRAWN]: 'This application has been withdrawn and cannot be modified.',
  
  [DenialReasonCode.INTERNSHIP_DRAFT]: 'This internship is in draft mode and not accepting applications.',
  [DenialReasonCode.INTERNSHIP_CLOSED]: 'This internship is closed and no longer accepting applications.',
  [DenialReasonCode.DEADLINE_EXPIRED]: 'The application deadline has passed.',
  [DenialReasonCode.MAX_APPLICANTS_REACHED]: 'This internship has reached its maximum capacity.',
  
  [DenialReasonCode.KYC_NOT_APPROVED]: 'Your KYC verification is not approved. Please complete KYC to continue.',
  [DenialReasonCode.KYC_PENDING]: 'Your KYC verification is pending. Please wait for approval.',
  [DenialReasonCode.KYC_REJECTED]: 'Your KYC verification was rejected. Please contact support.',
  
  [DenialReasonCode.MISSING_TARGET_STATUS]: 'Target status is required for this action.',
  [DenialReasonCode.UNKNOWN_ERROR]: 'An unknown error occurred.',
};
