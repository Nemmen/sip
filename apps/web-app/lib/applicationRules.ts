/**
 * Application Eligibility Rules
 * 
 * Centralized business logic for determining whether a student can apply
 * to an internship and providing user-friendly feedback.
 * 
 * This module integrates with the application workflow engine for
 * status management and badge variants.
 * 
 * Benefits:
 * - Single source of truth for eligibility rules
 * - Reusable across multiple components
 * - Easy to test in isolation
 * - Consistent behavior throughout the application
 * - Integrates with centralized workflow engine
 * 
 * Usage:
 * ```typescript
 * import { canApplyToInternship, getBlockReasonMessage } from '@/lib/applicationRules';
 * 
 * const eligibility = canApplyToInternship(internship, myApplications);
 * if (!eligibility.canApply) {
 *   const message = getBlockReasonMessage(eligibility.reason, internship);
 *   // Show error message to user
 * }
 * ```
 */

import { getStatusBadgeVariant } from '@/domain/application';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EligibilityCheck {
  canApply: boolean;
  reason: string;
}

// ============================================================================
// ELIGIBILITY RULES
// ============================================================================

/**
 * Check if a student can apply to an internship.
 * 
 * @param internship - The internship object
 * @param myApplications - Array of student's applications
 * @returns Object with canApply boolean and reason string
 * 
 * Blocking Rules (in order of priority):
 * 1. Cannot apply if already applied (ALREADY_APPLIED)
 * 2. Cannot apply if internship is not PUBLISHED (INTERNSHIP_DRAFT, INTERNSHIP_CLOSED)
 * 3. Cannot apply if deadline has passed (DEADLINE_PASSED)
 * 
 * @example
 * ```typescript
 * const result = canApplyToInternship(internship, myApplications);
 * if (result.canApply) {
 *   // Show application form
 * } else {
 *   // Show block message using result.reason
 * }
 * ```
 */
export function canApplyToInternship(
  internship: any,
  myApplications: any[]
): EligibilityCheck {
  // Rule 1: Check if already applied
  const existingApplication = myApplications.find(
    (app) => app.internshipId === internship.id
  );
  
  if (existingApplication) {
    return {
      canApply: false,
      reason: 'ALREADY_APPLIED',
    };
  }

  // Rule 2: Check internship status
  if (internship.status !== 'PUBLISHED') {
    return {
      canApply: false,
      reason: `INTERNSHIP_${internship.status}`,
    };
  }

  // Rule 3: Check application deadline
  if (internship.applicationDeadline) {
    const deadline = new Date(internship.applicationDeadline);
    const now = new Date();
    
    if (deadline < now) {
      return {
        canApply: false,
        reason: 'DEADLINE_PASSED',
      };
    }
  }

  return { canApply: true, reason: '' };
}

/**
 * Get user-friendly message for why application is blocked.
 * 
 * Maps internal reason codes to human-readable messages.
 * 
 * @param reason - Reason code from canApplyToInternship
 * @param internship - The internship object (optional, for future extensions)
 * @returns User-friendly error message
 * 
 * @example
 * ```typescript
 * const message = getBlockReasonMessage('DEADLINE_PASSED', internship);
 * // Returns: "The application deadline for this internship has passed."
 * ```
 */
export function getBlockReasonMessage(reason: string, internship?: any): string {
  const reasonMap: Record<string, string> = {
    ALREADY_APPLIED: 'You have already applied to this internship.',
    INTERNSHIP_DRAFT: 'This internship is in draft mode and not accepting applications.',
    INTERNSHIP_CLOSED: 'This internship is closed and no longer accepting applications.',
    DEADLINE_PASSED: 'The application deadline for this internship has passed.',
  };

  return reasonMap[reason] || 'This internship is not accepting applications.';
}

/**
 * Get existing application for a specific internship.
 * 
 * @param myApplications - Array of student's applications
 * @param internshipId - ID of the internship to check
 * @returns The application object if found, undefined otherwise
 * 
 * @example
 * ```typescript
 * const existingApp = getExistingApplication(myApplications, internshipId);
 * if (existingApp) {
 *   console.log('Already applied with status:', existingApp.status);
 * }
 * ```
 */
export function getExistingApplication(
  myApplications: any[],
  internshipId: string
): any {
  return myApplications.find((app) => app.internshipId === internshipId);
}

/**
 * Get badge variant for application status.
 * 
 * Delegates to centralized workflow engine for consistent badge styling.
 * 
 * @param status - Application status
 * @returns Badge variant string (info, warning, success, danger, default)
 * 
 * Status Color Mapping (from workflow engine):
 * - SUBMITTED, INTERVIEW_SCHEDULED → info (blue)
 * - UNDER_REVIEW → warning (yellow)
 * - SHORTLISTED, ACCEPTED → success (green)
 * - REJECTED → danger (red)
 * - WITHDRAWN → default (gray)
 * 
 * @example
 * ```typescript
 * const variant = getApplicationStatusBadgeVariant('ACCEPTED');
 * // Returns: 'success'
 * // Usage: <Badge variant={variant}>ACCEPTED</Badge>
 * ```
 */
export function getApplicationStatusBadgeVariant(status: string): string {
  return getStatusBadgeVariant(status);
}
