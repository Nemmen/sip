# Command Layer Guide

Complete guide to understanding and extending the command layer for side effects.

## Overview

The **command layer** encapsulates all side effects (database updates, notifications, emails, etc.) as composable, testable units.

**Key Principles:**
- ✅ Engine stays pure (no side effects)
- ✅ Commands are executed AFTER validation passes
- ✅ Commands support async operations
- ✅ Commands can be rolled back (optional)
- ✅ Commands execute in priority order

---

## Command Anatomy

### Command Interface

```typescript
interface Command {
  // Unique identifier
  id: string;
  
  // Human-readable description
  description: string;
  
  // Execution priority (higher = executes first)
  priority: number;
  
  // Can this command be retried on failure?
  retryable: boolean;
  
  // Does this command support rollback?
  supportsRollback: boolean;
  
  // Execute the command
  execute(context: CommandContext): Promise<CommandResult>;
  
  // Rollback the command (optional)
  rollback?(context: CommandContext): Promise<CommandResult>;
}
```

### Command Context

```typescript
interface CommandContext {
  // Intent information
  intent: ApplicationIntent;
  actorRole: UserRole;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  
  // Entity IDs
  applicationId: string;
  userId: string;
  studentId?: string;
  employerId?: string;
  internshipId?: string;
  
  // Business context
  appContext?: ApplicationContext;
  
  // Additional metadata
  metadata?: Record<string, any>;
}
```

### Command Result

```typescript
interface CommandResult {
  // Was execution successful?
  success: boolean;
  
  // Error message (if failed)
  error?: string;
  
  // Result data (optional)
  data?: any;
  
  // Execution time (milliseconds)
  executionTime?: number;
}
```

---

## Built-in Commands

### 1. UPDATE_DATABASE_COMMAND

**Purpose:** Update application status in database

**Priority:** 1000 (highest)

**Rollback:** ✅ Yes (reverts to previous status)

**Usage:**
```typescript
// Automatically executed by orchestrator
// Updates: prisma.application.update({ where: { id }, data: { status: newStatus } })
```

**Rollback Logic:**
```typescript
// Reverts to previousStatus
await prisma.application.update({
  where: { id: context.applicationId },
  data: { status: context.previousStatus },
});
```

---

### 2. SEND_NOTIFICATION_COMMAND

**Purpose:** Send in-app notification to student

**Priority:** 500

**Rollback:** ❌ No (notifications can't be unsent)

**Usage:**
```typescript
// Sends notification like:
// "Your application status changed: PENDING → ACCEPTED"
```

**Notification Format:**
```typescript
{
  userId: context.studentId,
  type: 'APPLICATION_STATUS_CHANGED',
  title: 'Application Update',
  message: `Your application status: ${context.newStatus}`,
  data: {
    applicationId: context.applicationId,
    previousStatus: context.previousStatus,
    newStatus: context.newStatus,
  },
}
```

---

### 3. SEND_EMAIL_COMMAND

**Purpose:** Send email notification

**Priority:** 400

**Rollback:** ❌ No (emails can't be recalled)

**Usage:**
```typescript
// Sends email to student or employer
// Template selected based on intent
```

**Email Templates:**
- `ACCEPT_CANDIDATE` → "Congratulations! You've been accepted"
- `REJECT_CANDIDATE` → "Application status update"
- `SHORTLIST_CANDIDATE` → "You've been shortlisted"

---

### 4. LOG_AUDIT_EVENT_COMMAND

**Purpose:** Log workflow action to audit trail

**Priority:** 100

**Rollback:** ❌ No (audit logs are append-only)

**Usage:**
```typescript
// Logs to audit trail for compliance
```

**Audit Log Format:**
```typescript
{
  entityType: 'APPLICATION',
  entityId: context.applicationId,
  action: context.intent,
  userId: context.userId,
  previousStatus: context.previousStatus,
  newStatus: context.newStatus,
  metadata: context.metadata,
}
```

---

### 5. TRIGGER_WEBHOOK_COMMAND

**Purpose:** Trigger external webhooks for integrations

**Priority:** 50 (lowest)

**Rollback:** ❌ No (external systems can't be rolled back)

**Usage:**
```typescript
// Triggers webhooks configured for the application
```

**Webhook Payload:**
```typescript
{
  event: 'application.status.changed',
  applicationId: context.applicationId,
  previousStatus: context.previousStatus,
  newStatus: context.newStatus,
  timestamp: new Date().toISOString(),
}
```

---

## Command Registry

### How It Works

The `COMMAND_REGISTRY` maps each intent to its commands:

```typescript
const COMMAND_REGISTRY: Record<ApplicationIntent, Command[]> = {
  [ApplicationIntent.ACCEPT_CANDIDATE]: [
    UPDATE_DATABASE_COMMAND,
    SEND_NOTIFICATION_COMMAND,
    SEND_EMAIL_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
    TRIGGER_WEBHOOK_COMMAND,
  ],
  
  [ApplicationIntent.REJECT_CANDIDATE]: [
    UPDATE_DATABASE_COMMAND,
    SEND_NOTIFICATION_COMMAND,
    SEND_EMAIL_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
  ],
  
  [ApplicationIntent.ADMIN_OVERRIDE_STATUS]: [
    UPDATE_DATABASE_COMMAND,
    LOG_AUDIT_EVENT_COMMAND, // Only audit, no notifications
  ],
  
  // ... more intents
};
```

### Getting Commands

```typescript
import { getCommandsForIntent, ApplicationIntent } from '@/domain/application';

const commands = getCommandsForIntent(ApplicationIntent.ACCEPT_CANDIDATE);
// Returns commands sorted by priority (descending)
```

---

## Creating Custom Commands

### Example: SMS Notification Command

```typescript
import { Command, CommandContext, CommandResult } from '@/domain/application';

const SEND_SMS_COMMAND: Command = {
  id: 'SEND_SMS_COMMAND',
  description: 'Send SMS notification to student',
  priority: 450, // Between email (400) and notification (500)
  retryable: true, // Can retry if SMS service is down
  supportsRollback: false, // Can't recall SMS
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Get student phone number
      const student = await prisma.user.findUnique({
        where: { id: context.studentId },
        select: { phone: true },
      });
      
      if (!student?.phone) {
        return {
          success: false,
          error: 'Student phone number not found',
          executionTime: Date.now() - startTime,
        };
      }
      
      // Send SMS
      await smsService.send({
        to: student.phone,
        message: `Your application status: ${context.newStatus}`,
      });
      
      return {
        success: true,
        data: { phone: student.phone },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  },
};
```

### Example: Slack Notification Command

```typescript
const SEND_SLACK_NOTIFICATION_COMMAND: Command = {
  id: 'SEND_SLACK_NOTIFICATION_COMMAND',
  description: 'Send notification to company Slack channel',
  priority: 300,
  retryable: true,
  supportsRollback: false,
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Get company Slack webhook
      const company = await prisma.company.findUnique({
        where: { id: context.employerId },
        select: { slackWebhookUrl: true },
      });
      
      if (!company?.slackWebhookUrl) {
        return {
          success: true, // Not an error, just skip
          data: { skipped: true },
          executionTime: Date.now() - startTime,
        };
      }
      
      // Send Slack message
      await fetch(company.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Application ${context.applicationId} status: ${context.previousStatus} → ${context.newStatus}`,
        }),
      });
      
      return {
        success: true,
        data: { channel: company.slackWebhookUrl },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  },
};
```

### Example: Command with Rollback

```typescript
const UPDATE_ESCROW_COMMAND: Command = {
  id: 'UPDATE_ESCROW_COMMAND',
  description: 'Update escrow payment status',
  priority: 900, // High priority (after database)
  retryable: true,
  supportsRollback: true, // Supports rollback
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Reserve escrow funds
      await escrowService.reserve({
        applicationId: context.applicationId,
        amount: context.metadata?.escrowAmount,
      });
      
      return {
        success: true,
        data: { reserved: true },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  },
  
  async rollback(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Release escrow funds
      await escrowService.release({
        applicationId: context.applicationId,
      });
      
      return {
        success: true,
        data: { released: true },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  },
};
```

---

## Using Custom Commands

### Option 1: Add to Registry (Recommended)

```typescript
// In commands.ts, update COMMAND_REGISTRY

export const COMMAND_REGISTRY: Record<ApplicationIntent, Command[]> = {
  [ApplicationIntent.ACCEPT_CANDIDATE]: [
    UPDATE_DATABASE_COMMAND,
    UPDATE_ESCROW_COMMAND, // Add custom command
    SEND_NOTIFICATION_COMMAND,
    SEND_SMS_COMMAND, // Add custom command
    SEND_EMAIL_COMMAND,
    LOG_AUDIT_EVENT_COMMAND,
    TRIGGER_WEBHOOK_COMMAND,
  ],
  // ... other intents
};
```

### Option 2: Use `customCommands` (For Special Cases)

```typescript
import { executeWorkflow } from '@/domain/application';

const result = await executeWorkflow({
  intentContext: { /* ... */ },
  commandContext: { /* ... */ },
  customCommands: [
    UPDATE_DATABASE_COMMAND,
    SEND_SMS_COMMAND, // Custom command for this workflow only
    LOG_AUDIT_EVENT_COMMAND,
  ],
});
```

---

## Command Execution Order

### Priority-Based Execution

Commands execute in priority order (highest first):

```
Priority 1000: UPDATE_DATABASE_COMMAND
  ↓
Priority 900: UPDATE_ESCROW_COMMAND
  ↓
Priority 500: SEND_NOTIFICATION_COMMAND
  ↓
Priority 450: SEND_SMS_COMMAND
  ↓
Priority 400: SEND_EMAIL_COMMAND
  ↓
Priority 300: SEND_SLACK_NOTIFICATION_COMMAND
  ↓
Priority 100: LOG_AUDIT_EVENT_COMMAND
  ↓
Priority 50: TRIGGER_WEBHOOK_COMMAND
```

### Why Priority Matters

1. **Database First:** Ensures data is persisted before notifications
2. **Notifications Next:** Users see updates quickly
3. **Audit Last:** Logs complete workflow (even if webhooks fail)
4. **Webhooks Last:** External integrations don't block critical operations

---

## Rollback Strategy

### Rollback Execution Order

Rollback executes in **reverse order** (LIFO):

```
Execution:
  UPDATE_DATABASE (✅)
  UPDATE_ESCROW (✅)
  SEND_EMAIL (❌ FAILED!)

Rollback (reverse):
  UPDATE_ESCROW (✅ rollback escrow)
  UPDATE_DATABASE (✅ rollback to previous status)
  SEND_EMAIL (⚠️ no rollback support)
```

### Compensating Transactions

For commands that can't be rolled back, use compensating transactions:

```typescript
const SEND_EMAIL_COMMAND: Command = {
  // ... other properties
  
  async execute(context: CommandContext): Promise<CommandResult> {
    await emailService.send(/* ... */);
    return { success: true };
  },
  
  // Can't unsend email, so send "correction" email
  async rollback(context: CommandContext): Promise<CommandResult> {
    await emailService.send({
      to: context.studentId,
      subject: 'Application Update Correction',
      body: 'Please disregard previous email. Your application status has not changed.',
    });
    return { success: true };
  },
};
```

---

## Testing Commands

### Unit Testing

```typescript
import { UPDATE_DATABASE_COMMAND } from '@/domain/application';

describe('UPDATE_DATABASE_COMMAND', () => {
  it('should update application status', async () => {
    const context = {
      intent: ApplicationIntent.ACCEPT_CANDIDATE,
      actorRole: UserRole.EMPLOYER,
      previousStatus: ApplicationStatus.SHORTLISTED,
      newStatus: ApplicationStatus.ACCEPTED,
      applicationId: 'test_123',
      userId: 'user_456',
    };
    
    const result = await UPDATE_DATABASE_COMMAND.execute(context);
    
    expect(result.success).toBe(true);
    expect(result.executionTime).toBeGreaterThan(0);
  });
  
  it('should rollback on error', async () => {
    // ... test rollback
  });
});
```

### Integration Testing

```typescript
import { executeWorkflow } from '@/domain/application';

describe('Workflow Integration', () => {
  it('should execute all commands', async () => {
    const result = await executeWorkflow({
      intentContext: { /* ... */ },
      commandContext: { /* ... */ },
    });
    
    expect(result.commandsExecuted).toHaveLength(5);
    expect(result.commandsFailed).toHaveLength(0);
  });
});
```

---

## Best Practices

### 1. Keep Commands Focused

```typescript
// ❌ DON'T: Command does too much
const MEGA_COMMAND: Command = {
  async execute(context) {
    await updateDatabase();
    await sendEmail();
    await logAudit();
    await triggerWebhook();
  },
};

// ✅ DO: Separate commands
const UPDATE_DATABASE_COMMAND: Command = { /* ... */ };
const SEND_EMAIL_COMMAND: Command = { /* ... */ };
const LOG_AUDIT_COMMAND: Command = { /* ... */ };
```

### 2. Handle Errors Gracefully

```typescript
const SEND_EMAIL_COMMAND: Command = {
  async execute(context) {
    try {
      await emailService.send(/* ... */);
      return { success: true };
    } catch (error) {
      // Log error but don't fail workflow
      console.error('Email failed:', error);
      return {
        success: true, // Mark as success to continue workflow
        data: { skipped: true },
      };
    }
  },
};
```

### 3. Use Idempotent Operations

```typescript
const UPDATE_DATABASE_COMMAND: Command = {
  async execute(context) {
    // Idempotent: Can be called multiple times safely
    await prisma.application.upsert({
      where: { id: context.applicationId },
      update: { status: context.newStatus },
      create: { /* ... */ },
    });
  },
};
```

### 4. Measure Performance

```typescript
const SEND_EMAIL_COMMAND: Command = {
  async execute(context) {
    const startTime = Date.now();
    
    await emailService.send(/* ... */);
    
    const executionTime = Date.now() - startTime;
    
    // Alert if slow
    if (executionTime > 5000) {
      await monitoring.alert('Slow email command');
    }
    
    return { success: true, executionTime };
  },
};
```

### 5. Design for Retry

```typescript
const SEND_NOTIFICATION_COMMAND: Command = {
  retryable: true, // Enable retry
  
  async execute(context) {
    try {
      // Use exponential backoff
      await notificationService.send(/* ... */);
      return { success: true };
    } catch (error) {
      // Return error for retry
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

---

## Advanced Patterns

### Conditional Execution

```typescript
const SEND_EMAIL_COMMAND: Command = {
  async execute(context) {
    // Skip if student opted out
    if (context.metadata?.emailOptOut) {
      return {
        success: true,
        data: { skipped: true },
      };
    }
    
    await emailService.send(/* ... */);
    return { success: true };
  },
};
```

### Batching

```typescript
const BATCH_NOTIFICATION_COMMAND: Command = {
  async execute(context) {
    const userIds = context.metadata?.notifyUserIds || [];
    
    // Batch send
    await notificationService.sendBatch(
      userIds.map(userId => ({
        userId,
        message: `Application ${context.applicationId} updated`,
      }))
    );
    
    return { success: true };
  },
};
```

### Parallel Sub-Commands

```typescript
const PARALLEL_NOTIFICATION_COMMAND: Command = {
  async execute(context) {
    // Execute multiple notifications in parallel
    const results = await Promise.allSettled([
      smsService.send(/* ... */),
      emailService.send(/* ... */),
      pushService.send(/* ... */),
    ]);
    
    const allSucceeded = results.every(r => r.status === 'fulfilled');
    
    return {
      success: allSucceeded,
      data: { results },
    };
  },
};
```

---

## Troubleshooting

### Command not executing

**Problem:** Custom command not executing

**Solutions:**
1. Add to `COMMAND_REGISTRY` for the intent
2. Use `customCommands` parameter
3. Check priority (higher priority executes first)

### Rollback not working

**Problem:** Rollback not executing

**Solutions:**
1. Set `supportsRollback: true`
2. Implement `rollback()` method
3. Check rollback logs in `result.rollbackResults`

### Performance issues

**Problem:** Commands taking too long

**Solutions:**
1. Check `executionTime` for each command
2. Optimize database queries (use indexes)
3. Cache expensive operations
4. Consider async/background jobs for slow commands

---

## See Also

- [Orchestrator Guide](./ORCHESTRATOR.md)
- [Policy Layer Guide](./POLICY_IMPLEMENTATION.md)
- [Engine Documentation](./IMPLEMENTATION.md)
