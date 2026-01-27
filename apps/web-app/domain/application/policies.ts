/**
 * Application Workflow Policies
 * 
 * Policies are higher-level business rules that can block or allow intents
 * based on organizational constraints, risk management, or operational policies.
 * 
 * Unlike business rules (which validate data constraints), policies enforce
 * strategic decisions, compliance requirements, and risk mitigation.
 * 
 * Policy evaluation happens AFTER business rules validation.
 * 
 * @module domain/application/policies
 */

import { ApplicationIntent } from './intents';
import type { UserRole, ApplicationStatus } from './types';
import { UserRole as UserRoleEnum } from './types';
import type { ApplicationContext, DenialReasonCode } from './context';

// ============================================================================
// POLICY TYPES
// ============================================================================

/**
 * Policy evaluation result
 */
export interface PolicyResult {
  /** Whether the policy allows this intent */
  allowed: boolean;
  
  /** Reason for denial (if not allowed) */
  reason?: string;
  
  /** Structured error code (if applicable) */
  reasonCode?: DenialReasonCode;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Policy definition
 * 
 * A policy is a higher-level business rule that enforces strategic,
 * compliance, or risk-based constraints on workflow actions.
 */
export interface Policy {
  /** Unique policy identifier */
  id: string;
  
  /** Human-readable policy description */
  description: string;
  
  /** Which intents this policy applies to (undefined = all intents) */
  appliesToIntent?: ApplicationIntent[];
  
  /** Which roles this policy applies to (undefined = all roles) */
  appliesToRole?: UserRole[];
  
  /** Whether this policy is enabled */
  enabled: boolean;
  
  /** Policy priority (higher = evaluated first) */
  priority: number;
  
  /**
   * Evaluate whether this policy allows the intent
   * 
   * @param intent - Business intent being performed
   * @param actorRole - Role of the actor
   * @param currentStatus - Current application status
   * @param context - Business context
   * @param currentDate - Current date/time (for testability)
   * @returns Policy evaluation result
   */
  evaluate(
    intent: ApplicationIntent,
    actorRole: UserRole,
    currentStatus: ApplicationStatus,
    context?: ApplicationContext,
    currentDate?: Date
  ): PolicyResult;
}

// ============================================================================
// POLICY IMPLEMENTATIONS
// ============================================================================

/**
 * TIME_RESTRICTION_POLICY
 * 
 * Restricts employer actions to business hours (6 AM - 11 PM).
 * 
 * Rationale:
 * - Prevents late-night impulsive decisions
 * - Ensures decisions are made during business hours
 * - Reduces risk of errors during off-hours
 * 
 * Applies to: All employer intents except ADMIN_OVERRIDE
 */
export const TIME_RESTRICTION_POLICY: Policy = {
  id: 'TIME_RESTRICTION',
  description: 'Employer actions only allowed during business hours (6 AM - 11 PM)',
  appliesToRole: [UserRoleEnum.EMPLOYER],
  enabled: true,
  priority: 100,
  
  evaluate(intent, actorRole, currentStatus, context, currentDate = new Date()) {
    // Skip for admin override
    if (intent === 'ADMIN_OVERRIDE_STATUS') {
      return { allowed: true };
    }
    
    // Check if current time is within business hours
    const hour = currentDate.getHours();
    const isBusinessHours = hour >= 6 && hour < 23;
    
    if (!isBusinessHours) {
      return {
        allowed: false,
        reason: 'Employer actions are only allowed during business hours (6 AM - 11 PM).',
        metadata: {
          currentHour: hour,
          businessHoursStart: 6,
          businessHoursEnd: 23,
        },
      };
    }
    
    return { allowed: true };
  },
};

/**
 * COMPANY_HIRING_LIMIT_POLICY
 * 
 * Enforces a global hiring limit across all internships for a company.
 * 
 * Rationale:
 * - Prevents over-hiring beyond company capacity
 * - Budget management
 * - Resource allocation control
 * 
 * Applies to: ACCEPT_CANDIDATE intent only
 */
export const COMPANY_HIRING_LIMIT_POLICY: Policy = {
  id: 'COMPANY_HIRING_LIMIT',
  description: 'Enforces global hiring limit across all company internships',
  appliesToIntent: ['ACCEPT_CANDIDATE' as ApplicationIntent],
  appliesToRole: [UserRoleEnum.EMPLOYER],
  enabled: true,
  priority: 90,
  
  evaluate(intent, actorRole, currentStatus, context) {
    // Only applies to accept candidate
    if (intent !== 'ACCEPT_CANDIDATE') {
      return { allowed: true };
    }
    
    // Check if context includes company-wide accepted count
    if (context?.companyAcceptedCount !== undefined && context?.companyHiringLimit !== undefined) {
      if (context.companyAcceptedCount >= context.companyHiringLimit) {
        return {
          allowed: false,
          reason: `Your company has reached its hiring limit of ${context.companyHiringLimit} interns.`,
          metadata: {
            companyAcceptedCount: context.companyAcceptedCount,
            companyHiringLimit: context.companyHiringLimit,
          },
        };
      }
    }
    
    return { allowed: true };
  },
};

/**
 * HIGH_RISK_APPLICATION_POLICY
 * 
 * Flags or blocks applications with low match scores that pose higher risk.
 * 
 * Rationale:
 * - Reduces risk of poor candidate-internship fit
 * - Encourages employers to focus on better matches
 * - Quality over quantity
 * 
 * Applies to: ACCEPT_CANDIDATE intent only
 * 
 * Note: This is a "soft" policy - it warns but doesn't block.
 * In production, you might want to make this configurable.
 */
export const HIGH_RISK_APPLICATION_POLICY: Policy = {
  id: 'HIGH_RISK_APPLICATION',
  description: 'Warns when accepting candidates with low match scores (< 60%)',
  appliesToIntent: ['ACCEPT_CANDIDATE' as ApplicationIntent],
  appliesToRole: [UserRoleEnum.EMPLOYER],
  enabled: true,
  priority: 50,
  
  evaluate(intent, actorRole, currentStatus, context) {
    // Only applies to accept candidate
    if (intent !== 'ACCEPT_CANDIDATE') {
      return { allowed: true };
    }
    
    // Check match score threshold
    const MATCH_SCORE_THRESHOLD = 60;
    
    if (context?.matchScore !== undefined && context.matchScore < MATCH_SCORE_THRESHOLD) {
      // Soft policy: Allow but with warning in metadata
      return {
        allowed: true,
        reason: `Warning: Low match score (${context.matchScore}%). This candidate may not be an ideal fit.`,
        metadata: {
          isWarning: true,
          matchScore: context.matchScore,
          threshold: MATCH_SCORE_THRESHOLD,
          recommendation: 'Consider reviewing candidate qualifications before accepting.',
        },
      };
    }
    
    return { allowed: true };
  },
};

/**
 * ADMIN_OVERRIDE_POLICY
 * 
 * Allows admins to bypass all other policies.
 * 
 * Rationale:
 * - System administrators need emergency override capability
 * - Handle exceptional cases
 * - Support and customer service scenarios
 * 
 * Applies to: All intents when actor is ADMIN
 */
export const ADMIN_OVERRIDE_POLICY: Policy = {
  id: 'ADMIN_OVERRIDE',
  description: 'Admins can bypass all policy restrictions',
  appliesToRole: [UserRoleEnum.ADMIN],
  enabled: true,
  priority: 1000, // Highest priority - evaluated first
  
  evaluate(intent, actorRole) {
    // Admin always allowed
    if (actorRole === UserRoleEnum.ADMIN) {
      return {
        allowed: true,
        metadata: {
          adminOverride: true,
        },
      };
    }
    
    return { allowed: true };
  },
};

/**
 * WEEKEND_RESTRICTION_POLICY
 * 
 * (Optional bonus policy)
 * Restricts certain sensitive actions on weekends.
 * 
 * Rationale:
 * - Ensures important decisions are made during weekdays
 * - Prevents weekend impulsive decisions
 * - Aligns with support team availability
 */
export const WEEKEND_RESTRICTION_POLICY: Policy = {
  id: 'WEEKEND_RESTRICTION',
  description: 'Restricts acceptance/rejection actions on weekends',
  appliesToIntent: [
    'ACCEPT_CANDIDATE' as ApplicationIntent,
    'REJECT_CANDIDATE' as ApplicationIntent,
  ],
  appliesToRole: [UserRoleEnum.EMPLOYER],
  enabled: false, // Disabled by default - enable if needed
  priority: 80,
  
  evaluate(intent, actorRole, currentStatus, context, currentDate = new Date()) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    
    if (isWeekend) {
      return {
        allowed: false,
        reason: 'Candidate acceptance and rejection actions are not allowed on weekends. Please try again on a weekday.',
        metadata: {
          currentDay: dayOfWeek,
          isWeekend,
        },
      };
    }
    
    return { allowed: true };
  },
};

// ============================================================================
// POLICY REGISTRY
// ============================================================================

/**
 * Default policy registry
 * 
 * Policies are evaluated in priority order (highest first).
 * 
 * To customize policies:
 * 1. Modify policy.enabled flag
 * 2. Adjust policy.priority
 * 3. Add custom policies to this array
 */
export const DEFAULT_POLICIES: Policy[] = [
  ADMIN_OVERRIDE_POLICY,        // Priority 1000 - evaluated first
  TIME_RESTRICTION_POLICY,      // Priority 100
  COMPANY_HIRING_LIMIT_POLICY,  // Priority 90
  WEEKEND_RESTRICTION_POLICY,   // Priority 80 (disabled by default)
  HIGH_RISK_APPLICATION_POLICY, // Priority 50
].sort((a, b) => b.priority - a.priority); // Sort by priority descending

// ============================================================================
// POLICY EVALUATION ENGINE
// ============================================================================

/**
 * Evaluate all applicable policies for an intent
 * 
 * @param intent - Business intent being performed
 * @param actorRole - Role of the actor
 * @param currentStatus - Current application status
 * @param context - Business context
 * @param policies - Policies to evaluate (defaults to DEFAULT_POLICIES)
 * @param currentDate - Current date/time (for testing)
 * @returns Array of policy results with policy ID
 */
export function evaluatePolicies(
  intent: ApplicationIntent,
  actorRole: UserRole,
  currentStatus: ApplicationStatus,
  context?: ApplicationContext,
  policies: Policy[] = DEFAULT_POLICIES,
  currentDate?: Date
): Array<PolicyResult & { policyId: string }> {
  const results: Array<PolicyResult & { policyId: string }> = [];
  
  for (const policy of policies) {
    // Skip disabled policies
    if (!policy.enabled) {
      continue;
    }
    
    // Check if policy applies to this intent
    if (policy.appliesToIntent && !policy.appliesToIntent.includes(intent)) {
      continue;
    }
    
    // Check if policy applies to this role
    if (policy.appliesToRole && !policy.appliesToRole.includes(actorRole)) {
      continue;
    }
    
    // Evaluate policy
    const result = policy.evaluate(intent, actorRole, currentStatus, context, currentDate);
    
    results.push({
      ...result,
      policyId: policy.id,
    });
    
    // If this is a blocking policy (not a warning), stop evaluation
    if (!result.allowed && !result.metadata?.isWarning) {
      break;
    }
  }
  
  return results;
}

/**
 * Check if policies allow this intent
 * 
 * @param intent - Business intent being performed
 * @param actorRole - Role of the actor
 * @param currentStatus - Current application status
 * @param context - Business context
 * @param policies - Policies to evaluate (defaults to DEFAULT_POLICIES)
 * @param currentDate - Current date/time (for testing)
 * @returns First blocking policy result, or { allowed: true } if all pass
 */
export function checkPolicies(
  intent: ApplicationIntent,
  actorRole: UserRole,
  currentStatus: ApplicationStatus,
  context?: ApplicationContext,
  policies?: Policy[],
  currentDate?: Date
): PolicyResult & { policyId?: string } {
  const results = evaluatePolicies(
    intent,
    actorRole,
    currentStatus,
    context,
    policies,
    currentDate
  );
  
  // Find first blocking policy
  const blockingPolicy = results.find(r => !r.allowed && !r.metadata?.isWarning);
  
  if (blockingPolicy) {
    return blockingPolicy;
  }
  
  // All policies passed
  return { allowed: true };
}
