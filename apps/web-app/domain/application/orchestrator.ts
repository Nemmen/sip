/**
 * Application Workflow Orchestrator
 * 
 * The orchestrator coordinates the complete workflow execution:
 * 1. Validates intent using pure engine (executeIntent)
 * 2. If allowed, executes commands (side effects)
 * 3. Handles command failures and rollback
 * 4. Returns comprehensive workflow result
 * 
 * This maintains separation between:
 * - Pure validation logic (engine.ts)
 * - Side effects (commands.ts)
 * 
 * @module domain/application/orchestrator
 */

import { executeIntent } from './engine';
import type { IntentContext, IntentResult } from './engine';
import type { ApplicationContext } from './context';
import { getCommandsForIntent } from './commands';
import type { Command, CommandContext } from './commands';

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

/**
 * Workflow execution context
 * 
 * Contains all information needed to execute a complete workflow.
 */
export interface WorkflowContext {
  /** Intent execution context */
  intentContext: IntentContext;
  
  /** Application context for business rules */
  appContext?: ApplicationContext;
  
  /** Command execution context */
  commandContext: Omit<CommandContext, 'intent' | 'previousStatus' | 'newStatus' | 'actorRole'>;
  
  /** Whether to execute commands (default: true) */
  executeCommands?: boolean;
  
  /** Custom commands to execute (overrides registry) */
  customCommands?: Command[];
}

/**
 * Command execution summary
 */
export interface CommandExecutionSummary {
  /** Command ID */
  commandId: string;
  
  /** Whether command succeeded */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Command execution time */
  executionTime?: number;
  
  /** Whether rollback was executed */
  rolledBack?: boolean;
}

/**
 * Workflow execution result
 * 
 * Comprehensive result including validation and command execution.
 */
export interface WorkflowResult {
  /** Whether the workflow was allowed (validation passed) */
  allowed: boolean;
  
  /** Next status if workflow succeeded */
  nextStatus?: string;
  
  /** Reason if workflow was denied */
  reason?: string;
  
  /** Structured reason code */
  reasonCode?: string;
  
  /** Intent validation result */
  intentResult: IntentResult;
  
  /** Commands that were executed */
  commandsExecuted: CommandExecutionSummary[];
  
  /** Commands that failed */
  commandsFailed: CommandExecutionSummary[];
  
  /** Whether rollback was executed */
  rollbackExecuted: boolean;
  
  /** Rollback results (if executed) */
  rollbackResults?: CommandExecutionSummary[];
  
  /** Decision trace (if enabled) */
  trace?: IntentResult['trace'];
  
  /** Total workflow execution time */
  totalExecutionTime: number;
}

// ============================================================================
// ORCHESTRATOR IMPLEMENTATION
// ============================================================================

/**
 * Execute a complete workflow
 * 
 * This is the main entry point for executing workflows with side effects.
 * 
 * Workflow steps:
 * 1. Validate intent (pure, no side effects)
 * 2. If allowed, execute commands sequentially
 * 3. If any command fails, rollback executed commands
 * 4. Return comprehensive result
 * 
 * @param context - Workflow execution context
 * @returns Promise resolving to workflow result
 * 
 * @example
 * ```typescript
 * const result = await executeWorkflow({
 *   intentContext: {
 *     intent: ApplicationIntent.ACCEPT_CANDIDATE,
 *     actorRole: UserRole.EMPLOYER,
 *     currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
 *   },
 *   appContext: {
 *     kycStatus: KYCStatus.APPROVED,
 *     maxApplicants: 10,
 *     acceptedCount: 5,
 *   },
 *   commandContext: {
 *     applicationId: 'app_123',
 *     userId: 'user_456',
 *     studentId: 'student_789',
 *     internshipId: 'int_012',
 *   },
 * });
 * 
 * if (result.allowed) {
 *   console.log('Application accepted!');
 *   console.log('Commands executed:', result.commandsExecuted.length);
 * } else {
 *   console.error('Workflow denied:', result.reason);
 * }
 * ```
 */
export async function executeWorkflow(
  context: WorkflowContext
): Promise<WorkflowResult> {
  const workflowStartTime = Date.now();
  const {
    intentContext,
    appContext,
    commandContext,
    executeCommands = true,
    customCommands,
  } = context;

  // Step 1: Validate intent (pure, no side effects)
  const intentResult = executeIntent(intentContext, appContext);

  // If validation failed, return early (no commands executed)
  if (!intentResult.allowed) {
    return {
      allowed: false,
      reason: intentResult.reason,
      reasonCode: intentResult.reasonCode,
      intentResult,
      commandsExecuted: [],
      commandsFailed: [],
      rollbackExecuted: false,
      trace: intentResult.trace,
      totalExecutionTime: Date.now() - workflowStartTime,
    };
  }

  // If commands disabled, return validation result only
  if (!executeCommands) {
    return {
      allowed: true,
      nextStatus: intentResult.nextStatus,
      intentResult,
      commandsExecuted: [],
      commandsFailed: [],
      rollbackExecuted: false,
      trace: intentResult.trace,
      totalExecutionTime: Date.now() - workflowStartTime,
    };
  }

  // Step 2: Get commands to execute
  const commands = customCommands || getCommandsForIntent(intentContext.intent);

  // Prepare command context
  const fullCommandContext: CommandContext = {
    ...commandContext,
    intent: intentContext.intent,
    actorRole: intentContext.actorRole,
    previousStatus: intentContext.currentStatus,
    newStatus: intentResult.nextStatus!,
    appContext,
  };

  // Step 3: Execute commands sequentially
  const commandsExecuted: CommandExecutionSummary[] = [];
  const commandsFailed: CommandExecutionSummary[] = [];
  let commandFailed = false;

  for (const command of commands) {
    try {
      console.log(`[ORCHESTRATOR] Executing command: ${command.id}`);
      
      const result = await command.execute(fullCommandContext);

      const summary: CommandExecutionSummary = {
        commandId: command.id,
        success: result.success,
        error: result.error,
        executionTime: result.executionTime,
      };

      if (result.success) {
        commandsExecuted.push(summary);
        console.log(`[ORCHESTRATOR] ✅ ${command.id} succeeded`);
      } else {
        commandsFailed.push(summary);
        commandFailed = true;
        console.error(`[ORCHESTRATOR] ❌ ${command.id} failed:`, result.error);
        break; // Stop executing further commands
      }
    } catch (error) {
      const summary: CommandExecutionSummary = {
        commandId: command.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      commandsFailed.push(summary);
      commandFailed = true;
      console.error(`[ORCHESTRATOR] ❌ ${command.id} threw exception:`, error);
      break;
    }
  }

  // Step 4: Rollback if any command failed
  let rollbackExecuted = false;
  let rollbackResults: CommandExecutionSummary[] | undefined;

  if (commandFailed) {
    console.log('[ORCHESTRATOR] Command failed, initiating rollback...');
    rollbackResults = await rollbackCommands(commandsExecuted, fullCommandContext);
    rollbackExecuted = rollbackResults.length > 0;
  }

  // Step 5: Return comprehensive result
  const totalExecutionTime = Date.now() - workflowStartTime;

  return {
    allowed: true,
    nextStatus: intentResult.nextStatus,
    intentResult,
    commandsExecuted,
    commandsFailed,
    rollbackExecuted,
    rollbackResults,
    trace: intentResult.trace,
    totalExecutionTime,
  };
}

/**
 * Rollback executed commands
 * 
 * Rolls back commands in reverse order (LIFO).
 * Only rolls back commands that support rollback.
 * 
 * @param executedCommands - Commands that were executed
 * @param context - Command context
 * @returns Array of rollback results
 */
async function rollbackCommands(
  executedCommands: CommandExecutionSummary[],
  context: CommandContext
): Promise<CommandExecutionSummary[]> {
  const rollbackResults: CommandExecutionSummary[] = [];

  // Get command definitions
  const commands = getCommandsForIntent(context.intent);

  // Rollback in reverse order (LIFO)
  for (let i = executedCommands.length - 1; i >= 0; i--) {
    const executedCommand = executedCommands[i];
    const command = commands.find(c => c.id === executedCommand.commandId);

    if (!command) {
      console.warn(`[ORCHESTRATOR] Command ${executedCommand.commandId} not found for rollback`);
      continue;
    }

    if (!command.supportsRollback || !command.rollback) {
      console.log(`[ORCHESTRATOR] ⚠️ ${command.id} does not support rollback`);
      rollbackResults.push({
        commandId: command.id,
        success: false,
        error: 'Rollback not supported',
        rolledBack: false,
      });
      continue;
    }

    try {
      console.log(`[ORCHESTRATOR] Rolling back: ${command.id}`);
      const result = await command.rollback(context);

      rollbackResults.push({
        commandId: command.id,
        success: result.success,
        error: result.error,
        executionTime: result.executionTime,
        rolledBack: result.success,
      });

      if (result.success) {
        console.log(`[ORCHESTRATOR] ✅ Rollback ${command.id} succeeded`);
      } else {
        console.error(`[ORCHESTRATOR] ❌ Rollback ${command.id} failed:`, result.error);
      }
    } catch (error) {
      console.error(`[ORCHESTRATOR] ❌ Rollback ${command.id} threw exception:`, error);
      rollbackResults.push({
        commandId: command.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rolledBack: false,
      });
    }
  }

  return rollbackResults;
}

/**
 * Execute workflow with retry
 * 
 * Retries the workflow up to maxRetries times if commands fail.
 * 
 * @param context - Workflow context
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Promise resolving to workflow result
 */
export async function executeWorkflowWithRetry(
  context: WorkflowContext,
  maxRetries: number = 3
): Promise<WorkflowResult> {
  let lastResult: WorkflowResult | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    console.log(`[ORCHESTRATOR] Workflow attempt ${attempt + 1}/${maxRetries + 1}`);
    
    const result = await executeWorkflow(context);

    // If validation failed or no commands failed, return result
    if (!result.allowed || result.commandsFailed.length === 0) {
      return result;
    }

    // Check if failed commands are retryable
    const failedCommands = result.commandsFailed;
    const commands = context.customCommands || getCommandsForIntent(context.intentContext.intent);
    const allRetryable = failedCommands.every(fc => {
      const command = commands.find(c => c.id === fc.commandId);
      return command?.retryable ?? false;
    });

    if (!allRetryable) {
      console.log('[ORCHESTRATOR] Failed commands are not retryable');
      return result;
    }

    lastResult = result;
    attempt++;

    if (attempt <= maxRetries) {
      console.log(`[ORCHESTRATOR] Retrying in ${attempt * 1000}ms...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }

  console.log('[ORCHESTRATOR] Max retries exceeded');
  return lastResult!;
}

/**
 * Validate workflow without executing commands
 * 
 * Useful for dry-run validation.
 * 
 * @param context - Workflow context
 * @returns Promise resolving to workflow result (no commands executed)
 */
export async function validateWorkflow(
  context: WorkflowContext
): Promise<WorkflowResult> {
  return executeWorkflow({
    ...context,
    executeCommands: false,
  });
}
