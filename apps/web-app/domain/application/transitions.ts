/**
 * Application Domain - State Machine Configuration
 * 
 * Defines the allowed state transitions and role-based permissions
 * for the application workflow.
 * 
 * @module domain/application/transitions
 */

import { ApplicationStatus, UserRole, RolePermissions, WorkflowAction } from './types';

/**
 * Centralized transition map defining allowed status changes.
 * 
 * Rules:
 * - SUBMITTED can move to UNDER_REVIEW, SHORTLISTED, or REJECTED
 * - UNDER_REVIEW can move to SHORTLISTED or REJECTED
 * - SHORTLISTED can move to INTERVIEW_SCHEDULED or REJECTED
 * - INTERVIEW_SCHEDULED can move to ACCEPTED or REJECTED
 * - ACCEPTED, REJECTED, WITHDRAWN are terminal (no further transitions)
 * 
 * Note: This represents business logic. Backend should enforce these rules.
 */
export const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.SUBMITTED]: [
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.UNDER_REVIEW]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW_SCHEDULED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.INTERVIEW_SCHEDULED]: [
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.ACCEPTED]: [], // Terminal state
  [ApplicationStatus.REJECTED]: [], // Terminal state
  [ApplicationStatus.WITHDRAWN]: [], // Terminal state
};

/**
 * Terminal statuses that cannot transition to any other status.
 */
export const TERMINAL_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
];

/**
 * Role-based permissions for status transitions.
 * 
 * STUDENT:
 * - Can submit applications (SUBMITTED)
 * - Can withdraw application (any status → WITHDRAWN)
 * - Cannot change employer-controlled statuses
 * 
 * EMPLOYER:
 * - Can move through hiring pipeline (SUBMITTED → ... → ACCEPTED/REJECTED)
 * - Cannot undo terminal states
 * 
 * ADMIN:
 * - Full control over all transitions
 * - Can override business rules (use with caution)
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.STUDENT]: {
    canInitiate: [ApplicationStatus.SUBMITTED],
    canTransitionTo: [ApplicationStatus.WITHDRAWN],
    canOverrideTerminal: false,
  },
  [UserRole.EMPLOYER]: {
    canInitiate: [],
    canTransitionTo: [
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.SHORTLISTED,
      ApplicationStatus.INTERVIEW_SCHEDULED,
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.REJECTED,
    ],
    canOverrideTerminal: false,
  },
  [UserRole.ADMIN]: {
    canInitiate: Object.values(ApplicationStatus),
    canTransitionTo: Object.values(ApplicationStatus),
    canOverrideTerminal: true,
  },
};

/**
 * Action definitions with UI metadata.
 * 
 * Maps target status to UI presentation details.
 * Used by UI components to render consistent action buttons.
 */
export const ACTION_DEFINITIONS: Record<ApplicationStatus, Partial<WorkflowAction>> = {
  [ApplicationStatus.SUBMITTED]: {
    label: 'Submit',
    icon: '📝',
    variant: 'primary',
    confirmRequired: false,
    allowedRoles: [UserRole.STUDENT],
  },
  [ApplicationStatus.UNDER_REVIEW]: {
    label: 'Review',
    icon: '👀',
    variant: 'outline',
    confirmRequired: false,
    allowedRoles: [UserRole.EMPLOYER, UserRole.ADMIN],
  },
  [ApplicationStatus.SHORTLISTED]: {
    label: 'Shortlist',
    icon: '⭐',
    variant: 'outline',
    confirmRequired: false,
    allowedRoles: [UserRole.EMPLOYER, UserRole.ADMIN],
  },
  [ApplicationStatus.INTERVIEW_SCHEDULED]: {
    label: 'Schedule Interview',
    icon: '📅',
    variant: 'outline',
    confirmRequired: false,
    allowedRoles: [UserRole.EMPLOYER, UserRole.ADMIN],
  },
  [ApplicationStatus.ACCEPTED]: {
    label: 'Accept',
    icon: '✓',
    variant: 'primary',
    confirmRequired: true,
    allowedRoles: [UserRole.EMPLOYER, UserRole.ADMIN],
  },
  [ApplicationStatus.REJECTED]: {
    label: 'Reject',
    icon: '✕',
    variant: 'danger',
    confirmRequired: true,
    allowedRoles: [UserRole.EMPLOYER, UserRole.ADMIN],
  },
  [ApplicationStatus.WITHDRAWN]: {
    label: 'Withdraw',
    icon: '↩',
    variant: 'default',
    confirmRequired: true,
    allowedRoles: [UserRole.STUDENT, UserRole.ADMIN],
  },
};
