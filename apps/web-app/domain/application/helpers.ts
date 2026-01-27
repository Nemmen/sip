/**
 * Application Domain - Helper Functions
 * 
 * Core business logic functions for the application workflow.
 * Pure functions with no side effects - easy to test and reason about.
 * 
 * Architecture:
 * - Backward compatible API (status-based)
 * - Internally uses intent-driven engine
 * - Translates between status-based and intent-based paradigms
 * 
 * Legacy API → Helpers → Engine → Transitions/Types
 * 
 * @module domain/application/helpers
 */

import { ApplicationStatus, UserRole, WorkflowAction } from './types';
import {
  STATUS_TRANSITIONS,
  TERMINAL_STATUSES,
  ROLE_PERMISSIONS,
  ACTION_DEFINITIONS,
} from './transitions';
import {
  executeIntent,
  statusTransitionToIntent,
  getAvailableIntents,
} from './engine';

/**
 * Check if a status transition is valid for a given role.
 * 
 * IMPLEMENTATION NOTE:
 * This function now uses the intent-driven engine internally.
 * It maps the status transition to an intent, then validates via engine.
 * This ensures consistent validation logic across the system.
 * 
 * Flow:
 * 1. Map (currentStatus, targetStatus) → intent
 * 2. Execute intent via engine
 * 3. Return result
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

  // Map status transition to intent
  const intent = statusTransitionToIntent(current, target);
  
  if (!intent) {
    // No intent maps to this transition - use legacy validation
    // This handles edge cases and maintains backward compatibility
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions) return false;

    if (isTerminalStatus(current) && !permissions.canOverrideTerminal) {
      return false;
    }

    const allowedTransitions = STATUS_TRANSITIONS[current] || [];
    if (!allowedTransitions.includes(target)) {
      return false;
    }

    if (!permissions.canTransitionTo.includes(target)) {
      return false;
    }

    return true;
  }

  // Use engine for validation
  const result = executeIntent({
    intent,
    actorRole: userRole,
    currentStatus: current,
    targetStatus: target,
  });

  return result.allowed;
}

/**
 * Get all allowed actions for a given status and role.
 * 
 * IMPLEMENTATION NOTE:
 * This function now uses the intent-driven engine internally.
 * It gets available intents, then maps them to legacy WorkflowAction format.
 * 
 * Flow:
 * 1. Get available intents from engine
 * 2. Map intents to WorkflowAction objects
 * 3. Return legacy format for backward compatibility
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

  // Use engine to get available intents
  const intents = getAvailableIntents(current, userRole);

  // Map intents to legacy WorkflowAction format
  return intents.map(intentResult => {
    const actionDef = ACTION_DEFINITIONS[intentResult.nextStatus];
    
    return {
      targetStatus: intentResult.nextStatus,
      label: actionDef?.label || intentResult.label,
      icon: actionDef?.icon || intentResult.icon,
      variant: actionDef?.variant || 'default',
      confirmRequired: actionDef?.confirmRequired || intentResult.requiresConfirmation,
      allowedRoles: actionDef?.allowedRoles || [],
    } as WorkflowAction;
  });
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
