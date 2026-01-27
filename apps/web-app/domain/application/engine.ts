/**
 * Application Domain - Intent-Driven Workflow Engine
 * 
 * Core business logic engine that processes intents and determines outcomes.
 * This is the heart of the application workflow system.
 * 
 * Architecture:
 * - Intent-driven: Actions are semantic business operations
 * - State machine: Status transitions are deterministic
 * - Role-based: Permissions enforced at engine level
 * - Context-aware: Business rules based on real-world conditions
 * - Immutable: No side effects, returns outcomes
 * 
 * Flow:
 * 1. UI triggers intent (e.g., "SHORTLIST_CANDIDATE")
 * 2. Engine validates preconditions (role, current status, business rules)
 * 3. Engine validates business context (deadlines, capacity, KYC)
 * 4. Engine determines outcome (allowed/denied, next status, reason code)
 * 5. Caller executes outcome (update DB, notify user, audit log)
 * 
 * @module domain/application/engine
 */

import { ApplicationStatus, UserRole } from './types';
import { ApplicationIntent, INTENT_METADATA } from './intents';
import { STATUS_TRANSITIONS, TERMINAL_STATUSES, ROLE_PERMISSIONS } from './transitions';
import {
  ApplicationContext,
  InternshipStatus,
  KYCStatus,
  DenialReasonCode,
  DENIAL_REASON_MESSAGES,
} from './context';
import { checkPolicies, evaluatePolicies, DEFAULT_POLICIES } from './policies';
import type { Policy } from './policies';

// ============================================================================
// DECISION TRACE TYPES
// ============================================================================

/**
 * Decision trace entry
 * 
 * Records a single validation layer result during intent execution.
 */
export interface TraceEntry {
  /** Validation layer name */
  layer: 'permission' | 'business_rule' | 'policy' | 'terminal_check' | 'transition';
  
  /** Result of this validation layer */
  result: boolean;
  
  /** Rule or policy ID (if applicable) */
  ruleId?: string;
  
  /** Reason for failure (if result is false) */
  reason?: string;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Intent execution context.
 * 
 * Contains all information needed to process a business intent.
 */
export interface IntentContext {
  /** Business intent being performed */
  intent: ApplicationIntent;
  
  /** Role of the actor performing the intent */
  actorRole: UserRole;
  
  /** Current status of the application */
  currentStatus: ApplicationStatus;
  
  /** Optional: Target status for admin override */
  targetStatus?: ApplicationStatus;
  
  /** Optional: Enable decision trace (for debugging/auditing) */
  enableTrace?: boolean;
  
  /** Optional: Custom policies to use (defaults to DEFAULT_POLICIES) */
  policies?: Policy[];
}

/**
 * Intent execution result.
 * 
 * Describes the outcome of attempting to execute an intent.
 */
export interface IntentResult {
  /** Whether the intent is allowed */
  allowed: boolean;
  
  /** Next status if intent succeeds */
  nextStatus?: ApplicationStatus;
  
  /** Reason if intent is denied (legacy) */
  reason?: string;
  
  /** Structured reason code if intent is denied */
  reasonCode?: DenialReasonCode;
  
  /** Metadata about the intent */
  metadata?: {
    requiresConfirmation: boolean;
    severity: string;
    category: string;
  };
  
  /**
   * Decision trace (only included if enableTrace is true)
   * 
   * Shows all validation layers that were evaluated and their results.
   * Useful for:
   * - Debugging workflow issues
   * - Audit logging
   * - Understanding why an intent was denied
   * - Development and testing
   */
  trace?: TraceEntry[];
}

/**
 * Intent-to-status mapping.
 * 
 * Defines which status each intent transitions to.
 * This mapping is context-aware: same intent may produce different status
 * based on current state.
 */
const INTENT_STATUS_MAP: Record<ApplicationIntent, (currentStatus: ApplicationStatus) => ApplicationStatus> = {
  [ApplicationIntent.SUBMIT_APPLICATION]: () => ApplicationStatus.SUBMITTED,
  [ApplicationIntent.WITHDRAW_APPLICATION]: () => ApplicationStatus.WITHDRAWN,
  [ApplicationIntent.REVIEW_APPLICATION]: () => ApplicationStatus.UNDER_REVIEW,
  [ApplicationIntent.SHORTLIST_CANDIDATE]: () => ApplicationStatus.SHORTLISTED,
  [ApplicationIntent.SCHEDULE_INTERVIEW]: () => ApplicationStatus.INTERVIEW_SCHEDULED,
  [ApplicationIntent.ACCEPT_CANDIDATE]: () => ApplicationStatus.ACCEPTED,
  [ApplicationIntent.REJECT_CANDIDATE]: () => ApplicationStatus.REJECTED,
  [ApplicationIntent.ADMIN_OVERRIDE_STATUS]: () => ApplicationStatus.SUBMITTED, // Placeholder, requires targetStatus
};

/**
 * Intent permission map.
 * 
 * Defines which roles can perform each intent.
 */
const INTENT_PERMISSIONS: Record<ApplicationIntent, UserRole[]> = {
  [ApplicationIntent.SUBMIT_APPLICATION]: [UserRole.STUDENT],
  [ApplicationIntent.WITHDRAW_APPLICATION]: [UserRole.STUDENT, UserRole.ADMIN],
  [ApplicationIntent.REVIEW_APPLICATION]: [UserRole.EMPLOYER, UserRole.ADMIN],
  [ApplicationIntent.SHORTLIST_CANDIDATE]: [UserRole.EMPLOYER, UserRole.ADMIN],
  [ApplicationIntent.SCHEDULE_INTERVIEW]: [UserRole.EMPLOYER, UserRole.ADMIN],
  [ApplicationIntent.ACCEPT_CANDIDATE]: [UserRole.EMPLOYER, UserRole.ADMIN],
  [ApplicationIntent.REJECT_CANDIDATE]: [UserRole.EMPLOYER, UserRole.ADMIN],
  [ApplicationIntent.ADMIN_OVERRIDE_STATUS]: [UserRole.ADMIN],
};

// ============================================================================
// BUSINESS RULE VALIDATION
// ============================================================================

/**
 * Validate business rules based on application context.
 * 
 * These rules enforce real-world constraints that go beyond status transitions:
 * - Deadlines (time-based)
 * - Capacity limits (resource-based)
 * - KYC requirements (compliance-based)
 * - Ownership (authorization-based)
 * 
 * Rules are checked BEFORE status transition validation.
 * 
 * @param intent - Business intent being performed
 * @param actorRole - Role of the actor
 * @param context - Business context
 * @returns Denial reason code if rule violated, undefined if all rules pass
 */
function validateBusinessRules(
  intent: ApplicationIntent,
  actorRole: UserRole,
  context?: ApplicationContext
): { code: DenialReasonCode; message: string } | undefined {
  // Skip context rules if no context provided (backward compatibility)
  if (!context) {
    return undefined;
  }

  // RULE 1: Cannot submit application if internship is not PUBLISHED
  if (intent === ApplicationIntent.SUBMIT_APPLICATION) {
    if (context.internshipStatus === InternshipStatus.DRAFT) {
      return {
        code: DenialReasonCode.INTERNSHIP_DRAFT,
        message: DENIAL_REASON_MESSAGES[DenialReasonCode.INTERNSHIP_DRAFT],
      };
    }
    
    if (context.internshipStatus === InternshipStatus.CLOSED) {
      return {
        code: DenialReasonCode.INTERNSHIP_CLOSED,
        message: DENIAL_REASON_MESSAGES[DenialReasonCode.INTERNSHIP_CLOSED],
      };
    }
  }

  // RULE 2: Cannot submit application if deadline has passed
  if (intent === ApplicationIntent.SUBMIT_APPLICATION) {
    if (context.applicationDeadline) {
      const now = context.currentDate || new Date();
      if (now > context.applicationDeadline) {
        return {
          code: DenialReasonCode.DEADLINE_EXPIRED,
          message: DENIAL_REASON_MESSAGES[DenialReasonCode.DEADLINE_EXPIRED],
        };
      }
    }
  }

  // RULE 3: Cannot accept candidate if internship is CLOSED
  if (intent === ApplicationIntent.ACCEPT_CANDIDATE) {
    if (context.internshipStatus === InternshipStatus.CLOSED) {
      return {
        code: DenialReasonCode.INTERNSHIP_CLOSED,
        message: 'Cannot accept candidates for a closed internship.',
      };
    }
  }

  // RULE 4: Cannot accept candidate if max applicants reached
  if (intent === ApplicationIntent.ACCEPT_CANDIDATE) {
    if (
      context.maxApplicants !== undefined &&
      context.acceptedCount !== undefined &&
      context.acceptedCount >= context.maxApplicants
    ) {
      return {
        code: DenialReasonCode.MAX_APPLICANTS_REACHED,
        message: DENIAL_REASON_MESSAGES[DenialReasonCode.MAX_APPLICANTS_REACHED],
      };
    }
  }

  // RULE 5: Cannot perform actions on withdrawn applications
  if (context.isWithdrawn && intent !== ApplicationIntent.ADMIN_OVERRIDE_STATUS) {
    // Allow admin override even on withdrawn applications
    const writeIntents = [
      ApplicationIntent.SHORTLIST_CANDIDATE,
      ApplicationIntent.SCHEDULE_INTERVIEW,
      ApplicationIntent.ACCEPT_CANDIDATE,
      ApplicationIntent.REJECT_CANDIDATE,
      ApplicationIntent.REVIEW_APPLICATION,
    ];
    
    if (writeIntents.includes(intent)) {
      return {
        code: DenialReasonCode.ALREADY_WITHDRAWN,
        message: DENIAL_REASON_MESSAGES[DenialReasonCode.ALREADY_WITHDRAWN],
      };
    }
  }

  // RULE 6: Employer must have approved KYC for employer actions
  if (actorRole === UserRole.EMPLOYER) {
    const employerIntents = [
      ApplicationIntent.REVIEW_APPLICATION,
      ApplicationIntent.SHORTLIST_CANDIDATE,
      ApplicationIntent.SCHEDULE_INTERVIEW,
      ApplicationIntent.ACCEPT_CANDIDATE,
      ApplicationIntent.REJECT_CANDIDATE,
    ];

    if (employerIntents.includes(intent) && context.kycStatus) {
      if (context.kycStatus === KYCStatus.NOT_SUBMITTED) {
        return {
          code: DenialReasonCode.KYC_NOT_APPROVED,
          message: 'Please submit KYC verification to perform this action.',
        };
      }
      
      if (context.kycStatus === KYCStatus.PENDING) {
        return {
          code: DenialReasonCode.KYC_PENDING,
          message: DENIAL_REASON_MESSAGES[DenialReasonCode.KYC_PENDING],
        };
      }
      
      if (context.kycStatus === KYCStatus.REJECTED) {
        return {
          code: DenialReasonCode.KYC_REJECTED,
          message: DENIAL_REASON_MESSAGES[DenialReasonCode.KYC_REJECTED],
        };
      }
    }
  }

  // RULE 7: Ownership validation
  if (context.ownsInternship === false && actorRole === UserRole.EMPLOYER) {
    const ownershipIntents = [
      ApplicationIntent.REVIEW_APPLICATION,
      ApplicationIntent.SHORTLIST_CANDIDATE,
      ApplicationIntent.SCHEDULE_INTERVIEW,
      ApplicationIntent.ACCEPT_CANDIDATE,
      ApplicationIntent.REJECT_CANDIDATE,
    ];
    
    if (ownershipIntents.includes(intent)) {
      return {
        code: DenialReasonCode.NOT_OWNER,
        message: 'You can only perform this action on your own internships.',
      };
    }
  }

  if (context.ownsApplication === false && actorRole === UserRole.STUDENT) {
    if (intent === ApplicationIntent.WITHDRAW_APPLICATION) {
      return {
        code: DenialReasonCode.NOT_OWNER,
        message: 'You can only withdraw your own applications.',
      };
    }
  }

  // All rules passed
  return undefined;
}

/**
 * Execute a business intent and determine the outcome.
 * 
 * UPGRADED: Now supports optional ApplicationContext for business rule validation.
 * 
 * This is the core workflow engine function. It:
 * 1. Validates actor has permission to perform intent
 * 2. Validates business rules (if context provided)
 * 3. Validates policies (if enabled)
 * 4. Determines target status based on intent
 * 5. Validates status transition is allowed
 * 6. Checks state machine rules (terminal status, etc.)
 * 7. Returns result with next status or structured denial reason
 * 8. Optionally includes decision trace (if enableTrace is true)
 * 
 * This function is pure (no side effects) and deterministic.
 * Callers are responsible for executing the result.
 * 
 * @param context - Intent execution context
 * @param appContext - Optional application context for business rule validation
 * @returns Intent execution result
 * 
 * @example
 * ```typescript
 * // Without context (backward compatible)
 * const result = executeIntent({
 *   intent: ApplicationIntent.SHORTLIST_CANDIDATE,
 *   actorRole: UserRole.EMPLOYER,
 *   currentStatus: ApplicationStatus.SUBMITTED,
 * });
 * 
 * // With context (context-aware validation)
 * const result = executeIntent({
 *   intent: ApplicationIntent.ACCEPT_CANDIDATE,
 *   actorRole: UserRole.EMPLOYER,
 *   currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
 * }, {
 *   internshipStatus: InternshipStatus.PUBLISHED,
 *   maxApplicants: 10,
 *   acceptedCount: 9,
 *   kycStatus: KYCStatus.APPROVED,
 * });
 * 
 * // With trace (for debugging)
 * const result = executeIntent({
 *   intent: ApplicationIntent.ACCEPT_CANDIDATE,
 *   actorRole: UserRole.EMPLOYER,
 *   currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
 *   enableTrace: true,
 * }, {
 *   internshipStatus: InternshipStatus.PUBLISHED,
 *   maxApplicants: 10,
 *   acceptedCount: 9,
 *   kycStatus: KYCStatus.APPROVED,
 * });
 * 
 * if (result.allowed) {
 *   await updateApplicationStatus(appId, result.nextStatus);
 *   await sendNotification(studentId, result.nextStatus);
 *   await auditLog({ action: context.intent, result });
 * } else {
 *   console.error('Intent denied:', result.reasonCode, result.reason);
 *   if (result.trace) {
 *     console.log('Decision trace:', result.trace);
 *   }
 * }
 * ```
 */
export function executeIntent(
  context: IntentContext,
  appContext?: ApplicationContext
): IntentResult {
  const { intent, actorRole, currentStatus, targetStatus, enableTrace = false, policies } = context;
  const metadata = INTENT_METADATA[intent];
  const trace: TraceEntry[] = [];

  // Step 1: Validate role permission
  const allowedRoles = INTENT_PERMISSIONS[intent];
  const permissionCheck = allowedRoles.includes(actorRole);
  
  if (enableTrace) {
    trace.push({
      layer: 'permission',
      result: permissionCheck,
      reason: permissionCheck ? undefined : `Role ${actorRole} not in allowed roles: ${allowedRoles.join(', ')}`,
      metadata: { allowedRoles, actorRole },
    });
  }
  
  if (!permissionCheck) {
    return {
      allowed: false,
      reason: `Role ${actorRole} does not have permission to perform ${intent}. Allowed roles: ${allowedRoles.join(', ')}.`,
      reasonCode: DenialReasonCode.INSUFFICIENT_PERMISSIONS,
      metadata: {
        requiresConfirmation: metadata.confirmRequired,
        severity: metadata.severity,
        category: metadata.category,
      },
      trace: enableTrace ? trace : undefined,
    };
  }

  // Step 1.5: Business rule validation (if context provided)
  const ruleViolation = validateBusinessRules(intent, actorRole, appContext);
  
  if (enableTrace) {
    trace.push({
      layer: 'business_rule',
      result: !ruleViolation,
      ruleId: ruleViolation?.code,
      reason: ruleViolation?.message,
    });
  }
  
  if (ruleViolation) {
    return {
      allowed: false,
      reason: ruleViolation.message,
      reasonCode: ruleViolation.code,
      metadata: {
        requiresConfirmation: metadata.confirmRequired,
        severity: metadata.severity,
        category: metadata.category,
      },
      trace: enableTrace ? trace : undefined,
    };
  }

  // Step 1.75: Policy validation
  const policyCheck = checkPolicies(
    intent,
    actorRole,
    currentStatus,
    appContext,
    policies || DEFAULT_POLICIES,
    appContext?.currentDate
  );
  
  if (enableTrace) {
    const allPolicyResults = evaluatePolicies(
      intent,
      actorRole,
      currentStatus,
      appContext,
      policies || DEFAULT_POLICIES,
      appContext?.currentDate
    );
    
    for (const policyResult of allPolicyResults) {
      trace.push({
        layer: 'policy',
        result: policyResult.allowed,
        ruleId: policyResult.policyId,
        reason: policyResult.reason,
        metadata: policyResult.metadata,
      });
    }
  }
  
  if (!policyCheck.allowed) {
    return {
      allowed: false,
      reason: policyCheck.reason || 'Policy violation',
      reasonCode: policyCheck.reasonCode,
      metadata: {
        requiresConfirmation: metadata.confirmRequired,
        severity: metadata.severity,
        category: metadata.category,
      },
      trace: enableTrace ? trace : undefined,
    };
  }

  // Step 2: Determine target status
  let nextStatus: ApplicationStatus;
  
  if (intent === ApplicationIntent.ADMIN_OVERRIDE_STATUS) {
    // Admin override requires explicit target status
    if (!targetStatus) {
      return {
        allowed: false,
        reason: 'Admin override requires explicit target status.',
        metadata: {
          requiresConfirmation: metadata.confirmRequired,
          severity: metadata.severity,
          category: metadata.category,
        },
      };
    }
    nextStatus = targetStatus;
  } else {
    // Regular intents map to specific statuses
    const statusResolver = INTENT_STATUS_MAP[intent];
    nextStatus = statusResolver(currentStatus);
  }

  // Step 3: Check if current status is terminal (unless admin override)
  const permissions = ROLE_PERMISSIONS[actorRole];
  const terminalCheck = !(TERMINAL_STATUSES.includes(currentStatus) && !permissions.canOverrideTerminal);
  
  if (enableTrace) {
    trace.push({
      layer: 'terminal_check',
      result: terminalCheck,
      reason: terminalCheck ? undefined : `Application is in terminal status ${currentStatus}`,
      metadata: { currentStatus, isTerminal: TERMINAL_STATUSES.includes(currentStatus) },
    });
  }
  
  if (!terminalCheck) {
    return {
      allowed: false,
      reason: `Application is in terminal status ${currentStatus}. No further actions allowed.`,
      reasonCode: DenialReasonCode.TERMINAL_STATUS,
      metadata: {
        requiresConfirmation: metadata.confirmRequired,
        severity: metadata.severity,
        category: metadata.category,
      },
      trace: enableTrace ? trace : undefined,
    };
  }

  // Step 4: Validate status transition exists in state machine
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  
  // Admin can override state machine rules
  if (permissions.canOverrideTerminal) {
    if (enableTrace) {
      trace.push({
        layer: 'transition',
        result: true,
        reason: 'Admin override - bypasses transition validation',
        metadata: { nextStatus, isAdminOverride: true },
      });
    }
    
    // Admin override - allow any transition
    return {
      allowed: true,
      nextStatus,
      metadata: {
        requiresConfirmation: metadata.confirmRequired,
        severity: metadata.severity,
        category: metadata.category,
      },
      trace: enableTrace ? trace : undefined,
    };
  }

  // For non-admin, check if transition is valid
  const transitionValid = allowedTransitions.includes(nextStatus);
  
  if (enableTrace) {
    trace.push({
      layer: 'transition',
      result: transitionValid,
      reason: transitionValid ? undefined : `Transition from ${currentStatus} to ${nextStatus} not allowed`,
      metadata: { currentStatus, nextStatus, allowedTransitions },
    });
  }
  
  if (!transitionValid) {
    const allowedStatusLabels = allowedTransitions.map(s => s).join(', ');
    return {
      allowed: false,
      reason: `Cannot transition from ${currentStatus} to ${nextStatus}. Allowed: ${allowedStatusLabels || 'none'}.`,
      reasonCode: DenialReasonCode.INVALID_TRANSITION,
      metadata: {
        requiresConfirmation: metadata.confirmRequired,
        severity: metadata.severity,
        category: metadata.category,
      },
      trace: enableTrace ? trace : undefined,
    };
  }

  // Step 5: Intent is valid - return success
  return {
    allowed: true,
    nextStatus,
    metadata: {
      requiresConfirmation: metadata.confirmRequired,
      severity: metadata.severity,
      category: metadata.category,
    },
    trace: enableTrace ? trace : undefined,
  };
}

/**
 * Get all available intents for a given status and role.
 * 
 * Returns intents that the actor can perform in the current state.
 * This is useful for rendering UI action buttons.
 * 
 * @param currentStatus - Current application status
 * @param actorRole - Role of the actor
 * @returns Array of allowed intents with metadata
 * 
 * @example
 * ```typescript
 * const intents = getAvailableIntents(ApplicationStatus.SUBMITTED, UserRole.EMPLOYER);
 * // Returns: [
 * //   { intent: REVIEW_APPLICATION, label: 'Move to Review', ... },
 * //   { intent: SHORTLIST_CANDIDATE, label: 'Shortlist', ... },
 * //   { intent: REJECT_CANDIDATE, label: 'Reject', ... }
 * // ]
 * ```
 */
export function getAvailableIntents(
  currentStatus: ApplicationStatus,
  actorRole: UserRole
): Array<{
  intent: ApplicationIntent;
  label: string;
  icon: string;
  requiresConfirmation: boolean;
  nextStatus: ApplicationStatus;
}> {
  const availableIntents: ApplicationIntent[] = Object.values(ApplicationIntent).filter(
    intent => intent !== ApplicationIntent.ADMIN_OVERRIDE_STATUS // Exclude admin override from regular list
  );

  return availableIntents
    .map(intent => {
      const result = executeIntent({ intent, actorRole, currentStatus });
      const metadata = INTENT_METADATA[intent];
      
      if (result.allowed && result.nextStatus) {
        return {
          intent,
          label: metadata.label,
          icon: metadata.icon,
          requiresConfirmation: metadata.confirmRequired,
          nextStatus: result.nextStatus,
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * Map intent to traditional status-based action.
 * 
 * This is a compatibility layer for the old API.
 * Converts intent-based workflow to status-based workflow.
 * 
 * @param intent - Business intent
 * @param currentStatus - Current status
 * @returns Target status for the intent
 */
export function intentToTargetStatus(
  intent: ApplicationIntent,
  currentStatus: ApplicationStatus
): ApplicationStatus {
  const statusResolver = INTENT_STATUS_MAP[intent];
  return statusResolver(currentStatus);
}

/**
 * Map status transition to intent.
 * 
 * Reverse mapping: Given current status and target status,
 * determine which intent would perform that transition.
 * 
 * Used for backward compatibility with status-based API.
 * 
 * @param currentStatus - Current status
 * @param targetStatus - Target status
 * @returns Intent that performs the transition, or undefined
 */
export function statusTransitionToIntent(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus
): ApplicationIntent | undefined {
  // Find intent that produces this transition
  for (const [intentKey, statusResolver] of Object.entries(INTENT_STATUS_MAP)) {
    const intent = intentKey as ApplicationIntent;
    const resolvedStatus = statusResolver(currentStatus);
    
    if (resolvedStatus === targetStatus) {
      return intent;
    }
  }
  
  return undefined;
}
