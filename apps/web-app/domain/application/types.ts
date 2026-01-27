/**
 * Application Domain - Type Definitions
 * 
 * Core types and enums for the application lifecycle domain.
 * These types are shared across frontend and backend (future).
 * 
 * @module domain/application/types
 */

/**
 * All possible application statuses in the system.
 * 
 * Lifecycle Flow:
 * 1. SUBMITTED → Student submits application
 * 2. UNDER_REVIEW → Employer reviews application
 * 3. SHORTLISTED → Application passes initial screening
 * 4. INTERVIEW_SCHEDULED → Interview arranged
 * 5. ACCEPTED → Offer extended (terminal)
 * 6. REJECTED → Application declined (terminal)
 * 7. WITHDRAWN → Student withdraws (terminal)
 */
export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * Roles in the system with different permissions.
 */
export enum UserRole {
  STUDENT = 'STUDENT',
  EMPLOYER = 'EMPLOYER',
  ADMIN = 'ADMIN',
}

/**
 * Action definition with UI metadata.
 * 
 * Used to render action buttons in the UI with consistent styling.
 */
export interface WorkflowAction {
  targetStatus: ApplicationStatus;
  label: string;
  icon: string;
  variant: 'primary' | 'outline' | 'danger' | 'default';
  confirmRequired: boolean;
  allowedRoles: UserRole[];
}

/**
 * Role permissions configuration.
 * 
 * Defines what actions each role can perform.
 */
export interface RolePermissions {
  canInitiate: ApplicationStatus[];
  canTransitionTo: ApplicationStatus[];
  canOverrideTerminal: boolean;
}
