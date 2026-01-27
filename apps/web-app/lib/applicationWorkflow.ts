/**
 * Application Workflow Engine
 * 
 * Centralized state machine for student application lifecycle.
 * Defines statuses, allowed transitions, and role-based permissions.
 * 
 * Architecture Benefits:
 * - Single source of truth for application workflow
 * - Type-safe status management
 * - Role-based access control (RBAC)
 * - Consistent behavior across frontend/backend
 * - Easy to audit and modify business rules
 * - Self-documenting workflow logic
 * 
 * Usage:
 * ```typescript
 * import { canTransition, getAllowedActions } from '@/lib/applicationWorkflow';
 * 
 * // Check if employer can accept application
 * if (canTransition('SHORTLISTED', 'ACCEPTED', 'EMPLOYER')) {
 *   // Show accept button
 * }
 * 
 * // Get all available actions for current user
 * const actions = getAllowedActions('SUBMITTED', 'EMPLOYER');
 * // Returns: [{ status: 'SHORTLISTED', ... }, { status: 'REJECTED', ... }]
 * ```
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
 */
export interface WorkflowAction {
  targetStatus: ApplicationStatus;
  label: string;
  icon: string;
  variant: 'primary' | 'outline' | 'danger' | 'default';
  confirmRequired: boolean;
  allowedRoles: UserRole[];
}

// ============================================================================
// STATE MACHINE CONFIGURATION
// ============================================================================

/**
 * Centralized transition map defining allowed status changes.
 * 
 * Rules:
 * - SUBMITTED can move to SHORTLISTED or REJECTED
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
 * Role-based permissions for status transitions.
 * 
 * STUDENT:
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
const ROLE_PERMISSIONS: Record<UserRole, {
  canInitiate: ApplicationStatus[];
  canTransitionTo: ApplicationStatus[];
  canOverrideTerminal: boolean;
}> = {
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
 * Maps target status to UI presentation.
 */
const ACTION_DEFINITIONS: Record<ApplicationStatus, Partial<WorkflowAction>> = {
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

/**
 * Terminal statuses that cannot transition to any other status.
 */
const TERMINAL_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
];

// ============================================================================
// CORE WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Check if a status transition is valid for a given role.
 * 
 * @param currentStatus - Current application status
 * @param targetStatus - Desired target status
 * @param role - User role attempting the transition
 * @returns true if transition is allowed, false otherwise
 * 
 * Validation Rules:
 * 1. Check if transition exists in STATUS_TRANSITIONS map
 * 2. Check if user role has permission for target status
 * 3. Check if current status is terminal (unless admin override)
 * 
 * @example
 * ```typescript
 * canTransition('SUBMITTED', 'SHORTLISTED', 'EMPLOYER') // true
 * canTransition('SUBMITTED', 'SHORTLISTED', 'STUDENT')  // false
 * canTransition('ACCEPTED', 'REJECTED', 'EMPLOYER')     // false
 * canTransition('ACCEPTED', 'REJECTED', 'ADMIN')        // true (admin override)
 * ```
 */
export function canTransition(
  currentStatus: ApplicationStatus | string,
  targetStatus: ApplicationStatus | string,
  role: UserRole | string
): boolean {
  // Convert string inputs to enum values
  const current = currentStatus as ApplicationStatus;
  const target = targetStatus as ApplicationStatus;
  const userRole = role as UserRole;

  // Admins can override terminal status restrictions
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;

  // Check if current status is terminal
  if (isTerminalStatus(current) && !permissions.canOverrideTerminal) {
    return false;
  }

  // Check if transition exists in state machine
  const allowedTransitions = STATUS_TRANSITIONS[current] || [];
  if (!allowedTransitions.includes(target)) {
    return false;
  }

  // Check if role has permission for target status
  if (!permissions.canTransitionTo.includes(target)) {
    return false;
  }

  return true;
}

/**
 * Get all allowed actions for a given status and role.
 * 
 * Returns structured action definitions with UI metadata.
 * Filters based on role permissions.
 * 
 * @param currentStatus - Current application status
 * @param role - User role
 * @returns Array of available actions
 * 
 * @example
 * ```typescript
 * const actions = getAllowedActions('SUBMITTED', 'EMPLOYER');
 * // Returns: [
 * //   { targetStatus: 'SHORTLISTED', label: 'Shortlist', icon: '⭐', ... },
 * //   { targetStatus: 'REJECTED', label: 'Reject', icon: '✕', ... }
 * // ]
 * ```
 */
export function getAllowedActions(
  currentStatus: ApplicationStatus | string,
  role: UserRole | string
): WorkflowAction[] {
  const current = currentStatus as ApplicationStatus;
  const userRole = role as UserRole;

  const allowedTransitions = STATUS_TRANSITIONS[current] || [];
  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (!permissions) return [];

  return allowedTransitions
    .filter(targetStatus => permissions.canTransitionTo.includes(targetStatus))
    .map(targetStatus => {
      const actionDef = ACTION_DEFINITIONS[targetStatus];
      return {
        targetStatus,
        label: actionDef?.label || targetStatus,
        icon: actionDef?.icon || '',
        variant: actionDef?.variant || 'default',
        confirmRequired: actionDef?.confirmRequired || false,
        allowedRoles: actionDef?.allowedRoles || [],
      } as WorkflowAction;
    })
    .filter(action => action.allowedRoles.includes(userRole));
}

/**
 * Check if a status is terminal (no further transitions allowed).
 * 
 * @param status - Application status to check
 * @returns true if status is terminal
 * 
 * Terminal statuses: ACCEPTED, REJECTED, WITHDRAWN
 * 
 * @example
 * ```typescript
 * isTerminalStatus('ACCEPTED')  // true
 * isTerminalStatus('SUBMITTED') // false
 * ```
 */
export function isTerminalStatus(status: ApplicationStatus | string): boolean {
  return TERMINAL_STATUSES.includes(status as ApplicationStatus);
}

/**
 * Get human-readable label for application status.
 * 
 * @param status - Application status
 * @returns Formatted status label
 * 
 * @example
 * ```typescript
 * getHumanStatusLabel('INTERVIEW_SCHEDULED') // 'Interview Scheduled'
 * getHumanStatusLabel('UNDER_REVIEW')        // 'Under Review'
 * ```
 */
export function getHumanStatusLabel(status: ApplicationStatus | string): string {
  const statusLabels: Record<ApplicationStatus, string> = {
    [ApplicationStatus.SUBMITTED]: 'Submitted',
    [ApplicationStatus.UNDER_REVIEW]: 'Under Review',
    [ApplicationStatus.SHORTLISTED]: 'Shortlisted',
    [ApplicationStatus.INTERVIEW_SCHEDULED]: 'Interview Scheduled',
    [ApplicationStatus.ACCEPTED]: 'Accepted',
    [ApplicationStatus.REJECTED]: 'Rejected',
    [ApplicationStatus.WITHDRAWN]: 'Withdrawn',
  };

  return statusLabels[status as ApplicationStatus] || status.toString();
}

/**
 * Get reason why a transition is blocked (for tooltips/error messages).
 * 
 * @param currentStatus - Current application status
 * @param targetStatus - Desired target status
 * @param role - User role
 * @returns Human-readable explanation
 * 
 * @example
 * ```typescript
 * getTransitionBlockReason('ACCEPTED', 'REJECTED', 'EMPLOYER')
 * // 'Application is already accepted. No further actions allowed.'
 * 
 * getTransitionBlockReason('SUBMITTED', 'ACCEPTED', 'EMPLOYER')
 * // 'Cannot move directly from SUBMITTED to ACCEPTED...'
 * ```
 */
export function getTransitionBlockReason(
  currentStatus: ApplicationStatus | string,
  targetStatus: ApplicationStatus | string,
  role: UserRole | string
): string {
  const current = currentStatus as ApplicationStatus;
  const target = targetStatus as ApplicationStatus;
  const userRole = role as UserRole;

  // Check if terminal
  if (isTerminalStatus(current)) {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions?.canOverrideTerminal) {
      return `Application is already ${getHumanStatusLabel(current).toLowerCase()}. No further actions allowed.`;
    }
  }

  // Check if transition exists
  const allowedTransitions = STATUS_TRANSITIONS[current] || [];
  if (!allowedTransitions.includes(target)) {
    if (allowedTransitions.length === 0) {
      return `No actions available for ${getHumanStatusLabel(current)} status.`;
    }
    const allowedLabels = allowedTransitions.map(s => getHumanStatusLabel(s)).join(', ');
    return `Cannot move from ${getHumanStatusLabel(current)} to ${getHumanStatusLabel(target)}. Allowed: ${allowedLabels}.`;
  }

  // Check role permission
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions?.canTransitionTo.includes(target)) {
    return `Your role (${userRole}) does not have permission to ${getHumanStatusLabel(target).toLowerCase()} applications.`;
  }

  return '';
}

/**
 * Get badge variant for application status (for UI components).
 * 
 * @param status - Application status
 * @returns Badge variant string
 * 
 * @example
 * ```typescript
 * getStatusBadgeVariant('ACCEPTED')  // 'success'
 * getStatusBadgeVariant('REJECTED')  // 'danger'
 * ```
 */
export function getStatusBadgeVariant(status: ApplicationStatus | string): string {
  const variantMap: Record<ApplicationStatus, string> = {
    [ApplicationStatus.SUBMITTED]: 'info',
    [ApplicationStatus.UNDER_REVIEW]: 'warning',
    [ApplicationStatus.SHORTLISTED]: 'success',
    [ApplicationStatus.INTERVIEW_SCHEDULED]: 'info',
    [ApplicationStatus.ACCEPTED]: 'success',
    [ApplicationStatus.REJECTED]: 'danger',
    [ApplicationStatus.WITHDRAWN]: 'default',
  };

  return variantMap[status as ApplicationStatus] || 'default';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  ApplicationStatus,
  UserRole,
  STATUS_TRANSITIONS,
  canTransition,
  getAllowedActions,
  isTerminalStatus,
  getHumanStatusLabel,
  getTransitionBlockReason,
  getStatusBadgeVariant,
};
