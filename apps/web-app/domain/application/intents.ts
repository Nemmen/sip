/**
 * Application Domain - Business Intents
 * 
 * Intent-driven workflow: Instead of thinking "can I change status X to Y",
 * we think "can I perform business action Z".
 * 
 * Benefits:
 * - More semantic and business-focused
 * - Decouples UI actions from status transitions
 * - Easier to add new workflows without changing UI
 * - Better audit trail (log intents, not statuses)
 * 
 * @module domain/application/intents
 */

/**
 * Business intents that actors can perform on applications.
 * 
 * Each intent represents a business action, not a technical status change.
 * The workflow engine maps intents to appropriate status transitions.
 * 
 * Examples:
 * - Instead of "change status to SHORTLISTED", use "SHORTLIST_CANDIDATE"
 * - Instead of "change status to ACCEPTED", use "ACCEPT_CANDIDATE"
 * 
 * This abstraction allows:
 * - Multiple statuses per intent (e.g., SHORTLIST might skip UNDER_REVIEW)
 * - Context-aware transitions (same intent, different outcomes based on state)
 * - Business-rule validation before status changes
 */
export enum ApplicationIntent {
  /**
   * Student submits a new application.
   * 
   * Preconditions:
   * - Internship must be PUBLISHED
   * - Student hasn't already applied
   * - Application deadline not passed
   * 
   * Result: Application created with status SUBMITTED
   */
  SUBMIT_APPLICATION = 'SUBMIT_APPLICATION',

  /**
   * Student withdraws their application.
   * 
   * Preconditions:
   * - Application exists
   * - Student owns the application
   * - Application not already terminal
   * 
   * Result: Status → WITHDRAWN
   */
  WITHDRAW_APPLICATION = 'WITHDRAW_APPLICATION',

  /**
   * Employer moves application to review.
   * 
   * Preconditions:
   * - Application in SUBMITTED status
   * - Employer owns the internship
   * 
   * Result: Status → UNDER_REVIEW
   */
  REVIEW_APPLICATION = 'REVIEW_APPLICATION',

  /**
   * Employer shortlists a candidate.
   * 
   * Preconditions:
   * - Application in SUBMITTED or UNDER_REVIEW
   * - Employer owns the internship
   * - Application not terminal
   * 
   * Result: Status → SHORTLISTED
   */
  SHORTLIST_CANDIDATE = 'SHORTLIST_CANDIDATE',

  /**
   * Employer schedules an interview.
   * 
   * Preconditions:
   * - Application in SHORTLISTED status
   * - Employer owns the internship
   * 
   * Result: Status → INTERVIEW_SCHEDULED
   */
  SCHEDULE_INTERVIEW = 'SCHEDULE_INTERVIEW',

  /**
   * Employer accepts candidate (extends offer).
   * 
   * Preconditions:
   * - Application in INTERVIEW_SCHEDULED status
   * - Employer owns the internship
   * - Internship has available slots
   * 
   * Result: Status → ACCEPTED (terminal)
   */
  ACCEPT_CANDIDATE = 'ACCEPT_CANDIDATE',

  /**
   * Employer rejects candidate.
   * 
   * Preconditions:
   * - Application not already terminal
   * - Employer owns the internship
   * 
   * Result: Status → REJECTED (terminal)
   */
  REJECT_CANDIDATE = 'REJECT_CANDIDATE',

  /**
   * Admin overrides status (emergency use).
   * 
   * Preconditions:
   * - User has ADMIN role
   * - Valid target status provided
   * 
   * Result: Status → Any status (bypasses business rules)
   * 
   * Warning: Use with caution. Logs are audited.
   */
  ADMIN_OVERRIDE_STATUS = 'ADMIN_OVERRIDE_STATUS',
}

/**
 * Intent metadata for UI and business logic.
 * 
 * Provides context about what each intent does and how it should be presented.
 */
export interface IntentMetadata {
  intent: ApplicationIntent;
  label: string;
  description: string;
  icon: string;
  confirmRequired: boolean;
  category: 'student' | 'employer' | 'admin';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Intent definitions with UI and business metadata.
 * 
 * Used for:
 * - Rendering action buttons
 * - Generating audit logs
 * - Showing confirmation dialogs
 * - Documentation
 */
export const INTENT_METADATA: Record<ApplicationIntent, IntentMetadata> = {
  [ApplicationIntent.SUBMIT_APPLICATION]: {
    intent: ApplicationIntent.SUBMIT_APPLICATION,
    label: 'Submit Application',
    description: 'Submit your application for this internship',
    icon: '📝',
    confirmRequired: false,
    category: 'student',
    severity: 'medium',
  },
  [ApplicationIntent.WITHDRAW_APPLICATION]: {
    intent: ApplicationIntent.WITHDRAW_APPLICATION,
    label: 'Withdraw',
    description: 'Withdraw your application (cannot be undone)',
    icon: '↩',
    confirmRequired: true,
    category: 'student',
    severity: 'high',
  },
  [ApplicationIntent.REVIEW_APPLICATION]: {
    intent: ApplicationIntent.REVIEW_APPLICATION,
    label: 'Move to Review',
    description: 'Mark this application as under review',
    icon: '👀',
    confirmRequired: false,
    category: 'employer',
    severity: 'low',
  },
  [ApplicationIntent.SHORTLIST_CANDIDATE]: {
    intent: ApplicationIntent.SHORTLIST_CANDIDATE,
    label: 'Shortlist',
    description: 'Add candidate to shortlist for further consideration',
    icon: '⭐',
    confirmRequired: false,
    category: 'employer',
    severity: 'medium',
  },
  [ApplicationIntent.SCHEDULE_INTERVIEW]: {
    intent: ApplicationIntent.SCHEDULE_INTERVIEW,
    label: 'Schedule Interview',
    description: 'Schedule an interview with this candidate',
    icon: '📅',
    confirmRequired: false,
    category: 'employer',
    severity: 'medium',
  },
  [ApplicationIntent.ACCEPT_CANDIDATE]: {
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    label: 'Accept',
    description: 'Extend offer to candidate (final decision)',
    icon: '✓',
    confirmRequired: true,
    category: 'employer',
    severity: 'critical',
  },
  [ApplicationIntent.REJECT_CANDIDATE]: {
    intent: ApplicationIntent.REJECT_CANDIDATE,
    label: 'Reject',
    description: 'Decline this application (final decision)',
    icon: '✕',
    confirmRequired: true,
    category: 'employer',
    severity: 'high',
  },
  [ApplicationIntent.ADMIN_OVERRIDE_STATUS]: {
    intent: ApplicationIntent.ADMIN_OVERRIDE_STATUS,
    label: 'Override Status',
    description: 'Admin: Manually set application status',
    icon: '⚡',
    confirmRequired: true,
    category: 'admin',
    severity: 'critical',
  },
};
