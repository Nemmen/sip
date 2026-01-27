/**
 * Application Domain - Public API
 * 
 * Centralized export for the application workflow domain.
 * This is the only file that should be imported by other modules.
 * 
 * Architecture Layers:
 * 1. Types & Enums (types.ts)
 * 2. Business Intents (intents.ts)
 * 3. State Machine Config (transitions.ts)
 * 4. Intent-Driven Engine (engine.ts)
 * 5. Helper Functions (helpers.ts)
 * 
 * Usage:
 * ```typescript
 * // Legacy API (backward compatible)
 * import { 
 *   ApplicationStatus, 
 *   UserRole, 
 *   canTransition, 
 *   getAllowedActions 
 * } from '@/domain/application';
 * 
 * // New Intent-Driven API
 * import {
 *   ApplicationIntent,
 *   executeIntent,
 *   getAvailableIntents
 * } from '@/domain/application';
 * ```
 * 
 * Architecture Benefits:
 * - Single import point (clean API)
 * - Easy to refactor internal structure
 * - Clear public vs private separation
 * - Future-proof for backend sharing
 * - Intent-driven workflow (semantic actions)
 * - Backward compatible (status-based API still works)
 * 
 * @module domain/application
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export {
  ApplicationStatus,
  UserRole,
} from './types';

export type {
  WorkflowAction,
  RolePermissions,
} from './types';

// ============================================================================
// CONTEXT EXPORTS (Context-Aware Validation)
// ============================================================================

export {
  InternshipStatus,
  KYCStatus,
  DenialReasonCode,
  DENIAL_REASON_MESSAGES,
} from './context';

export type {
  ApplicationContext,
} from './context';

// ============================================================================
// POLICY EXPORTS (Policy Layer)
// ============================================================================

export {
  TIME_RESTRICTION_POLICY,
  COMPANY_HIRING_LIMIT_POLICY,
  HIGH_RISK_APPLICATION_POLICY,
  ADMIN_OVERRIDE_POLICY,
  WEEKEND_RESTRICTION_POLICY,
  DEFAULT_POLICIES,
  evaluatePolicies,
  checkPolicies,
} from './policies';

export type {
  Policy,
  PolicyResult,
} from './policies';

// ============================================================================
// COMMAND EXPORTS (Command Layer)
// ============================================================================

export type {
  Command,
  CommandContext,
  CommandResult,
} from './commands';

export {
  UPDATE_DATABASE_COMMAND,
  SEND_NOTIFICATION_COMMAND,
  SEND_EMAIL_COMMAND,
  LOG_AUDIT_EVENT_COMMAND,
  TRIGGER_WEBHOOK_COMMAND,
  COMMAND_REGISTRY,
  getCommandsForIntent,
} from './commands';

// ============================================================================
// ORCHESTRATOR EXPORTS (Workflow Orchestration)
// ============================================================================

export type {
  WorkflowContext,
  WorkflowResult,
  CommandExecutionSummary,
} from './orchestrator';

export {
  executeWorkflow,
  executeWorkflowWithRetry,
  validateWorkflow,
} from './orchestrator';

// ============================================================================
// INTENT EXPORTS (New Intent-Driven API)
// ============================================================================

export {
  ApplicationIntent,
  INTENT_METADATA,
} from './intents';

export type {
  IntentMetadata,
} from './intents';

// ============================================================================
// ENGINE EXPORTS (New Intent-Driven API)
// ============================================================================

export type {
  IntentContext,
  IntentResult,
  TraceEntry,
} from './engine';

export {
  executeIntent,
  getAvailableIntents,
  intentToTargetStatus,
  statusTransitionToIntent,
} from './engine';

// ============================================================================
// CONFIGURATION EXPORTS
// ============================================================================

export {
  STATUS_TRANSITIONS,
  TERMINAL_STATUSES,
  ROLE_PERMISSIONS,
  ACTION_DEFINITIONS,
} from './transitions';

// ============================================================================
// HELPER FUNCTION EXPORTS (Legacy API - Backward Compatible)
// ============================================================================

export {
  canTransition,
  getAllowedActions,
  isTerminalStatus,
  getHumanStatusLabel,
  getTransitionBlockReason,
  getStatusBadgeVariant,
} from './helpers';
