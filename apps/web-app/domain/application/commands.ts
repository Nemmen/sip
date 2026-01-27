/**
 * Application Workflow Commands
 * 
 * Commands represent side effects that should be executed after a workflow
 * intent has been validated and approved.
 * 
 * This separates pure validation logic (engine.ts) from side effects (commands).
 * 
 * Command Pattern Benefits:
 * - Separation of concerns (validation vs execution)
 * - Composable side effects
 * - Rollback capability
 * - Async support
 * - Testability (can mock commands)
 * 
 * @module domain/application/commands
 */

import type { ApplicationStatus, UserRole } from './types';
import type { ApplicationIntent } from './intents';
import type { ApplicationContext } from './context';

// ============================================================================
// COMMAND TYPES
// ============================================================================

/**
 * Command execution context
 * 
 * Contains all information needed to execute a command.
 */
export interface CommandContext {
  /** Business intent that triggered this command */
  intent: ApplicationIntent;
  
  /** Role of the actor performing the action */
  actorRole: UserRole;
  
  /** Previous application status */
  previousStatus: ApplicationStatus;
  
  /** New application status */
  newStatus: ApplicationStatus;
  
  /** Application ID */
  applicationId: string;
  
  /** User ID (actor) */
  userId: string;
  
  /** Student ID (application owner) */
  studentId?: string;
  
  /** Employer ID (internship owner) */
  employerId?: string;
  
  /** Internship ID */
  internshipId?: string;
  
  /** Business context (optional) */
  appContext?: ApplicationContext;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Command execution result
 */
export interface CommandResult {
  /** Whether command executed successfully */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Data returned by command */
  data?: unknown;
  
  /** Execution time in milliseconds */
  executionTime?: number;
}

/**
 * Command interface
 * 
 * A command encapsulates a side effect that should be executed
 * after workflow validation passes.
 */
export interface Command {
  /** Unique command identifier */
  id: string;
  
  /** Human-readable description */
  description: string;
  
  /** Whether this command can be retried on failure */
  retryable: boolean;
  
  /** Whether this command supports rollback */
  supportsRollback: boolean;
  
  /** Command priority (higher = executed first) */
  priority: number;
  
  /**
   * Execute the command
   * 
   * @param context - Command execution context
   * @returns Promise resolving to command result
   */
  execute(context: CommandContext): Promise<CommandResult>;
  
  /**
   * Rollback the command (if supported)
   * 
   * @param context - Command execution context
   * @returns Promise resolving to rollback result
   */
  rollback?(context: CommandContext): Promise<CommandResult>;
}

// ============================================================================
// COMMAND IMPLEMENTATIONS
// ============================================================================

/**
 * UPDATE_DATABASE_COMMAND
 * 
 * Updates the application status in the database.
 * 
 * This is the primary command that actually changes the application state.
 */
export const UPDATE_DATABASE_COMMAND: Command = {
  id: 'UPDATE_DATABASE',
  description: 'Update application status in database',
  retryable: true,
  supportsRollback: true,
  priority: 1000, // Highest priority - execute first
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // In real implementation, this would call Prisma/DB
      // For now, we'll simulate the operation
      console.log(`[UPDATE_DATABASE] Updating application ${context.applicationId}:`, {
        from: context.previousStatus,
        to: context.newStatus,
        intent: context.intent,
      });
      
      // Simulate database update
      // await prisma.application.update({
      //   where: { id: context.applicationId },
      //   data: { status: context.newStatus },
      // });
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          applicationId: context.applicationId,
          newStatus: context.newStatus,
          previousStatus: context.previousStatus,
        },
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database update failed',
        executionTime: Date.now() - startTime,
      };
    }
  },
  
  async rollback(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[UPDATE_DATABASE ROLLBACK] Reverting application ${context.applicationId}:`, {
        from: context.newStatus,
        to: context.previousStatus,
      });
      
      // Simulate rollback
      // await prisma.application.update({
      //   where: { id: context.applicationId },
      //   data: { status: context.previousStatus },
      // });
      
      return {
        success: true,
        data: { rolledBack: true },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rollback failed',
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * SEND_NOTIFICATION_COMMAND
 * 
 * Sends notification to relevant users about the status change.
 */
export const SEND_NOTIFICATION_COMMAND: Command = {
  id: 'SEND_NOTIFICATION',
  description: 'Send notification to student/employer',
  retryable: true,
  supportsRollback: false, // Notifications can't be "unsent"
  priority: 500,
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[SEND_NOTIFICATION] Sending notification:`, {
        intent: context.intent,
        to: context.studentId,
        status: context.newStatus,
      });
      
      // In real implementation:
      // await notificationService.send({
      //   userId: context.studentId,
      //   type: 'APPLICATION_STATUS_CHANGE',
      //   data: {
      //     applicationId: context.applicationId,
      //     newStatus: context.newStatus,
      //     internshipId: context.internshipId,
      //   },
      // });
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          notificationSent: true,
          recipient: context.studentId,
        },
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification failed',
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * LOG_AUDIT_EVENT_COMMAND
 * 
 * Logs the workflow action for audit trail.
 */
export const LOG_AUDIT_EVENT_COMMAND: Command = {
  id: 'LOG_AUDIT_EVENT',
  description: 'Log workflow action to audit trail',
  retryable: true,
  supportsRollback: false, // Audit logs are append-only
  priority: 100,
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[LOG_AUDIT_EVENT] Logging audit event:`, {
        intent: context.intent,
        userId: context.userId,
        applicationId: context.applicationId,
        from: context.previousStatus,
        to: context.newStatus,
        timestamp: new Date().toISOString(),
      });
      
      // In real implementation:
      // await auditService.log({
      //   action: context.intent,
      //   userId: context.userId,
      //   resourceType: 'APPLICATION',
      //   resourceId: context.applicationId,
      //   metadata: {
      //     previousStatus: context.previousStatus,
      //     newStatus: context.newStatus,
      //     role: context.actorRole,
      //   },
      // });
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          auditLogId: `audit_${Date.now()}`,
          action: context.intent,
        },
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Audit logging failed',
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * TRIGGER_WEBHOOK_COMMAND
 * 
 * Triggers external webhooks for integrations.
 */
export const TRIGGER_WEBHOOK_COMMAND: Command = {
  id: 'TRIGGER_WEBHOOK',
  description: 'Trigger external webhooks',
  retryable: true,
  supportsRollback: false,
  priority: 50,
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[TRIGGER_WEBHOOK] Triggering webhook:`, {
        event: `application.${context.intent.toLowerCase()}`,
        applicationId: context.applicationId,
        status: context.newStatus,
      });
      
      // In real implementation:
      // await webhookService.trigger({
      //   event: `application.${context.intent.toLowerCase()}`,
      //   payload: {
      //     applicationId: context.applicationId,
      //     internshipId: context.internshipId,
      //     status: context.newStatus,
      //     previousStatus: context.previousStatus,
      //     timestamp: new Date().toISOString(),
      //   },
      // });
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          webhookTriggered: true,
          event: `application.${context.intent.toLowerCase()}`,
        },
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook trigger failed',
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * SEND_EMAIL_COMMAND
 * 
 * Sends email notifications to users.
 */
export const SEND_EMAIL_COMMAND: Command = {
  id: 'SEND_EMAIL',
  description: 'Send email notification',
  retryable: true,
  supportsRollback: false,
  priority: 400,
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[SEND_EMAIL] Sending email:`, {
        intent: context.intent,
        status: context.newStatus,
      });
      
      // In real implementation:
      // await emailService.send({
      //   to: studentEmail,
      //   template: 'application-status-change',
      //   data: {
      //     status: context.newStatus,
      //     internshipTitle: internship.title,
      //   },
      // });
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: { emailSent: true },
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed',
        executionTime: Date.now() - startTime,
      };
    }
  },
};

// ============================================================================
// COMMAND REGISTRY
// ============================================================================

/**
 * Command Registry
 * 
 * Maps intents to their corresponding commands.
 * Commands are executed in priority order (highest first).
 */
export const COMMAND_REGISTRY: Record<ApplicationIntent, Command[]> = {
  SUBMIT_APPLICATION: [
    UPDATE_DATABASE_COMMAND,
    SEND_NOTIFICATION_COMMAND,
    SEND_EMAIL_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
  ],
  
  WITHDRAW_APPLICATION: [
    UPDATE_DATABASE_COMMAND,
    SEND_NOTIFICATION_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
  ],
  
  REVIEW_APPLICATION: [
    UPDATE_DATABASE_COMMAND,
    SEND_NOTIFICATION_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
  ],
  
  SHORTLIST_CANDIDATE: [
    UPDATE_DATABASE_COMMAND,
    SEND_NOTIFICATION_COMMAND,
    SEND_EMAIL_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
    TRIGGER_WEBHOOK_COMMAND,
  ],
  
  SCHEDULE_INTERVIEW: [
    UPDATE_DATABASE_COMMAND,
    SEND_NOTIFICATION_COMMAND,
    SEND_EMAIL_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
  ],
  
  ACCEPT_CANDIDATE: [
    UPDATE_DATABASE_COMMAND,
    SEND_NOTIFICATION_COMMAND,
    SEND_EMAIL_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
    TRIGGER_WEBHOOK_COMMAND,
  ],
  
  REJECT_CANDIDATE: [
    UPDATE_DATABASE_COMMAND,
    SEND_NOTIFICATION_COMMAND,
    SEND_EMAIL_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
  ],
  
  ADMIN_OVERRIDE_STATUS: [
    UPDATE_DATABASE_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
  ],
};

/**
 * Get commands for a specific intent
 * 
 * Returns commands sorted by priority (highest first).
 * 
 * @param intent - Application intent
 * @returns Array of commands to execute
 */
export function getCommandsForIntent(intent: ApplicationIntent): Command[] {
  const commands = COMMAND_REGISTRY[intent] || [];
  return [...commands].sort((a, b) => b.priority - a.priority);
}
