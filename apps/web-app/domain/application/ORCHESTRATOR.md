# Application Workflow Orchestrator

Complete guide to using the orchestrator for executing workflows with side effects.

## Overview

The **orchestrator** coordinates complete workflow execution by:
1. Validating intents (pure, no side effects)
2. Executing commands sequentially (side effects)
3. Handling failures with rollback
4. Returning comprehensive results

This maintains **separation of concerns**:
- **Engine** (`engine.ts`) = Pure validation logic
- **Commands** (`commands.ts`) = Side effects
- **Orchestrator** (`orchestrator.ts`) = Coordination

---

## Quick Start

### Basic Usage

```typescript
import { executeWorkflow, ApplicationIntent, UserRole, ApplicationStatus } from '@/domain/application';

// Execute a complete workflow
const result = await executeWorkflow({
  intentContext: {
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    actorRole: UserRole.EMPLOYER,
    currentStatus: ApplicationStatus.SHORTLISTED,
  },
  appContext: {
    kycStatus: 'APPROVED',
    maxApplicants: 10,
    acceptedCount: 5,
  },
  commandContext: {
    applicationId: 'app_123',
    userId: 'user_456',
    studentId: 'student_789',
    employerId: 'emp_012',
    internshipId: 'int_345',
  },
});

if (result.allowed) {
  console.log('Application accepted!');
  console.log('Commands executed:', result.commandsExecuted.length);
  console.log('New status:', result.nextStatus);
} else {
  console.error('Workflow denied:', result.reason);
}
```

### Validation Only (Dry Run)

```typescript
import { validateWorkflow } from '@/domain/application';

// Validate without executing commands
const result = await validateWorkflow({
  intentContext: { /* ... */ },
  commandContext: { /* ... */ },
});

console.log('Would be allowed?', result.allowed);
console.log('Would execute commands:', result.commandsExecuted.length); // Always 0
```

### With Retry Logic

```typescript
import { executeWorkflowWithRetry } from '@/domain/application';

// Retry up to 3 times if commands fail
const result = await executeWorkflowWithRetry(
  {
    intentContext: { /* ... */ },
    commandContext: { /* ... */ },
  },
  3 // maxRetries
);

if (result.commandsFailed.length > 0) {
  console.error('Commands failed after retries');
}
```

---

## Architecture

### Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. VALIDATION (Pure)                                    │
│    executeIntent() checks:                              │
│    - Role permissions                                   │
│    - Business rules                                     │
│    - Policies                                           │
│    - State transitions                                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │ Allowed? │
                    └──────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
            YES                      NO
              │                       │
              ▼                       ▼
┌─────────────────────────┐   ┌──────────────────┐
│ 2. EXECUTE COMMANDS     │   │ RETURN DENIAL    │
│    Sequential:          │   │ (No commands)    │
│    1. UPDATE_DATABASE   │   └──────────────────┘
│    2. SEND_NOTIFICATION │
│    3. SEND_EMAIL        │
│    4. LOG_AUDIT_EVENT   │
│    5. TRIGGER_WEBHOOK   │
└─────────────────────────┘
              │
              ▼
        ┌──────────┐
        │ Success? │
        └──────────┘
              │
    ┌─────────┴─────────┐
    │                   │
   YES                 NO
    │                   │
    ▼                   ▼
┌────────────┐   ┌─────────────────┐
│ RETURN     │   │ 3. ROLLBACK     │
│ SUCCESS    │   │    (Reverse)    │
└────────────┘   └─────────────────┘
```

### Layer Separation

```typescript
// ❌ DON'T: Execute side effects in engine
const result = executeIntent(context);
if (result.allowed) {
  await prisma.application.update(/*...*/); // Wrong!
}

// ✅ DO: Use orchestrator for side effects
const result = await executeWorkflow({
  intentContext: context,
  commandContext: { applicationId, /* ... */ },
});
// Commands executed automatically if allowed
```

---

## Command Execution

### Command Registry

Each intent is mapped to specific commands:

```typescript
COMMAND_REGISTRY = {
  [ApplicationIntent.ACCEPT_CANDIDATE]: [
    UPDATE_DATABASE_COMMAND,      // Priority 1000
    SEND_NOTIFICATION_COMMAND,    // Priority 500
    SEND_EMAIL_COMMAND,           // Priority 400
    LOG_AUDIT_EVENT_COMMAND,      // Priority 100
    TRIGGER_WEBHOOK_COMMAND,      // Priority 50
  ],
  
  [ApplicationIntent.ADMIN_OVERRIDE_STATUS]: [
    UPDATE_DATABASE_COMMAND,      // Priority 1000
    LOG_AUDIT_EVENT_COMMAND,      // Priority 100
  ],
  
  // ... other intents
}
```

### Command Priorities

Commands execute in priority order (highest first):

| Priority | Command                   | Supports Rollback |
|----------|---------------------------|-------------------|
| 1000     | UPDATE_DATABASE_COMMAND   | ✅ Yes            |
| 500      | SEND_NOTIFICATION_COMMAND | ❌ No             |
| 400      | SEND_EMAIL_COMMAND        | ❌ No             |
| 100      | LOG_AUDIT_EVENT_COMMAND   | ❌ No             |
| 50       | TRIGGER_WEBHOOK_COMMAND   | ❌ No             |

### Rollback Behavior

If a command fails, rollback executes in **reverse order** (LIFO):

```typescript
// Execution order
UPDATE_DATABASE (✅ success)
SEND_NOTIFICATION (✅ success)
SEND_EMAIL (❌ FAILED!)

// Rollback order (reverse)
SEND_NOTIFICATION (⚠️ no rollback support)
UPDATE_DATABASE (✅ rollback to previous status)
```

Only commands with `supportsRollback: true` can be rolled back.

---

## API Reference

### `executeWorkflow(context)`

Execute a complete workflow with validation and commands.

**Parameters:**

```typescript
interface WorkflowContext {
  // Required: Intent validation context
  intentContext: {
    intent: ApplicationIntent;
    actorRole: UserRole;
    currentStatus: ApplicationStatus;
  };
  
  // Optional: Business context
  appContext?: {
    kycStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    internshipStatus?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    maxApplicants?: number;
    acceptedCount?: number;
    companyHiringLimit?: number;
    companyAcceptedCount?: number;
    metadata?: Record<string, any>;
  };
  
  // Required: Command execution context
  commandContext: {
    applicationId: string;
    userId: string;
    studentId?: string;
    employerId?: string;
    internshipId?: string;
    metadata?: Record<string, any>;
  };
  
  // Optional: Control command execution
  executeCommands?: boolean; // default: true
  
  // Optional: Custom commands (overrides registry)
  customCommands?: Command[];
}
```

**Returns:**

```typescript
interface WorkflowResult {
  // Validation result
  allowed: boolean;
  nextStatus?: string;
  reason?: string;
  reasonCode?: string;
  
  // Intent validation result
  intentResult: IntentResult;
  
  // Command execution results
  commandsExecuted: CommandExecutionSummary[];
  commandsFailed: CommandExecutionSummary[];
  rollbackExecuted: boolean;
  rollbackResults?: CommandExecutionSummary[];
  
  // Decision trace (if enabled)
  trace?: TraceEntry[];
  
  // Performance
  totalExecutionTime: number; // milliseconds
}
```

### `validateWorkflow(context)`

Validate workflow without executing commands (dry run).

```typescript
const result = await validateWorkflow({
  intentContext: { /* ... */ },
  commandContext: { /* ... */ },
});

// result.commandsExecuted is always []
// result.allowed indicates if workflow would succeed
```

### `executeWorkflowWithRetry(context, maxRetries)`

Execute workflow with retry on command failure.

```typescript
const result = await executeWorkflowWithRetry(
  context,
  3 // retry up to 3 times
);
```

**Retry Logic:**
- Only retries if all failed commands are `retryable: true`
- Exponential backoff: 1s, 2s, 3s...
- Stops early if validation fails

---

## Real-World Examples

### Example 1: Accept Candidate

```typescript
import { executeWorkflow, ApplicationIntent, UserRole, ApplicationStatus } from '@/domain/application';

async function acceptCandidate(applicationId: string, employerId: string) {
  const result = await executeWorkflow({
    intentContext: {
      intent: ApplicationIntent.ACCEPT_CANDIDATE,
      actorRole: UserRole.EMPLOYER,
      currentStatus: ApplicationStatus.SHORTLISTED,
    },
    appContext: {
      kycStatus: 'APPROVED',
      maxApplicants: 10,
      acceptedCount: 5,
    },
    commandContext: {
      applicationId,
      userId: employerId,
      employerId,
      studentId: 'student_123',
      internshipId: 'int_456',
    },
  });

  if (result.allowed) {
    console.log('✅ Candidate accepted');
    console.log('Commands executed:', result.commandsExecuted.map(c => c.commandId));
    // ['UPDATE_DATABASE_COMMAND', 'SEND_NOTIFICATION_COMMAND', 'SEND_EMAIL_COMMAND', 'LOG_AUDIT_EVENT_COMMAND', 'TRIGGER_WEBHOOK_COMMAND']
    
    console.log('New status:', result.nextStatus);
    // 'ACCEPTED'
    
    console.log('Execution time:', result.totalExecutionTime, 'ms');
  } else {
    console.error('❌ Cannot accept candidate:', result.reason);
    console.error('Reason code:', result.reasonCode);
  }
}
```

### Example 2: Admin Override with Trace

```typescript
async function adminOverrideStatus(applicationId: string, newStatus: string) {
  const result = await executeWorkflow({
    intentContext: {
      intent: ApplicationIntent.ADMIN_OVERRIDE_STATUS,
      actorRole: UserRole.ADMIN,
      currentStatus: ApplicationStatus.PENDING,
      metadata: { targetStatus: newStatus },
    },
    commandContext: {
      applicationId,
      userId: 'admin_123',
      metadata: { reason: 'Manual intervention required' },
    },
  });

  if (result.trace) {
    console.log('Decision trace:');
    result.trace.forEach(entry => {
      console.log(`- ${entry.layer}: ${entry.result} (${entry.executionTime}ms)`);
      if (entry.result === 'DENIED') {
        console.log(`  Reason: ${entry.reason}`);
      }
    });
  }

  return result;
}
```

### Example 3: Custom Commands

```typescript
import { Command, CommandContext, CommandResult } from '@/domain/application';

// Define custom command
const SEND_SMS_COMMAND: Command = {
  id: 'SEND_SMS_COMMAND',
  description: 'Send SMS notification to student',
  priority: 450, // Between SEND_EMAIL (400) and SEND_NOTIFICATION (500)
  retryable: true,
  supportsRollback: false,
  
  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      await smsService.send({
        to: context.metadata?.phoneNumber,
        message: `Your application status: ${context.newStatus}`,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

// Use custom commands
const result = await executeWorkflow({
  intentContext: { /* ... */ },
  commandContext: { /* ... */ },
  customCommands: [
    UPDATE_DATABASE_COMMAND,
    SEND_SMS_COMMAND, // Custom command
    LOG_AUDIT_EVENT_COMMAND,
  ],
});
```

### Example 4: Handling Failures

```typescript
const result = await executeWorkflow({
  intentContext: { /* ... */ },
  commandContext: { /* ... */ },
});

if (result.commandsFailed.length > 0) {
  console.error('❌ Commands failed:');
  result.commandsFailed.forEach(failed => {
    console.error(`- ${failed.commandId}: ${failed.error}`);
  });
  
  if (result.rollbackExecuted) {
    console.log('🔄 Rollback executed:');
    result.rollbackResults?.forEach(rb => {
      if (rb.rolledBack) {
        console.log(`- ✅ ${rb.commandId} rolled back successfully`);
      } else {
        console.error(`- ❌ ${rb.commandId} rollback failed: ${rb.error}`);
      }
    });
  } else {
    console.warn('⚠️ No rollback executed (commands do not support rollback)');
  }
}
```

---

## Best Practices

### 1. Use Orchestrator for Side Effects

```typescript
// ❌ DON'T: Mix validation and side effects
const intentResult = executeIntent(context);
if (intentResult.allowed) {
  await prisma.application.update(/*...*/);
  await emailService.send(/*...*/);
}

// ✅ DO: Use orchestrator
const result = await executeWorkflow({
  intentContext: context,
  commandContext: { /* ... */ },
});
```

### 2. Validate First (Dry Run)

```typescript
// Check if workflow would succeed before committing
const dryRun = await validateWorkflow(context);

if (dryRun.allowed) {
  const confirmed = await askUserConfirmation();
  
  if (confirmed) {
    const result = await executeWorkflow(context);
  }
}
```

### 3. Handle Command Failures

```typescript
const result = await executeWorkflow(context);

if (result.commandsFailed.length > 0) {
  // Log failures for monitoring
  await monitoring.logCommandFailure({
    intent: context.intentContext.intent,
    failedCommands: result.commandsFailed,
  });
  
  // Alert admins for critical commands
  if (result.commandsFailed.some(c => c.commandId === 'UPDATE_DATABASE_COMMAND')) {
    await alertService.notify('Database update failed!');
  }
}
```

### 4. Use Custom Commands Sparingly

```typescript
// ✅ Good: Use registry for standard intents
const result = await executeWorkflow(context);

// ⚠️ Use custom commands only for special cases
const customResult = await executeWorkflow({
  ...context,
  customCommands: [CUSTOM_COMMAND],
});
```

### 5. Monitor Performance

```typescript
const result = await executeWorkflow(context);

console.log('Total execution time:', result.totalExecutionTime);

result.commandsExecuted.forEach(cmd => {
  console.log(`${cmd.commandId}: ${cmd.executionTime}ms`);
});

// Alert if slow
if (result.totalExecutionTime > 5000) {
  await monitoring.alert('Slow workflow execution');
}
```

---

## Testing

### Unit Tests

```typescript
import { executeWorkflow, validateWorkflow } from '@/domain/application';

describe('Workflow Orchestrator', () => {
  it('should validate and execute commands', async () => {
    const result = await executeWorkflow({
      intentContext: {
        intent: ApplicationIntent.ACCEPT_CANDIDATE,
        actorRole: UserRole.EMPLOYER,
        currentStatus: ApplicationStatus.SHORTLISTED,
      },
      commandContext: {
        applicationId: 'test_123',
        userId: 'user_456',
      },
    });
    
    expect(result.allowed).toBe(true);
    expect(result.commandsExecuted.length).toBeGreaterThan(0);
  });
  
  it('should rollback on command failure', async () => {
    // Mock command to fail
    const failingCommand = {
      ...SEND_EMAIL_COMMAND,
      execute: async () => ({ success: false, error: 'Test failure' }),
    };
    
    const result = await executeWorkflow({
      intentContext: { /* ... */ },
      commandContext: { /* ... */ },
      customCommands: [UPDATE_DATABASE_COMMAND, failingCommand],
    });
    
    expect(result.commandsFailed.length).toBe(1);
    expect(result.rollbackExecuted).toBe(true);
  });
});
```

---

## Troubleshooting

### Commands not executing

**Problem:** `result.commandsExecuted` is empty

**Solutions:**
1. Check if `result.allowed` is `true` (validation must pass first)
2. Ensure `executeCommands` is not set to `false`
3. Check if intent has commands in `COMMAND_REGISTRY`

### Rollback not working

**Problem:** `result.rollbackExecuted` is `false` even though commands failed

**Solutions:**
1. Check if failed commands support rollback (`supportsRollback: true`)
2. Only `UPDATE_DATABASE_COMMAND` supports rollback by default
3. Implement custom `rollback()` method for your commands

### Slow performance

**Problem:** `totalExecutionTime` is high

**Solutions:**
1. Check individual `commandsExecuted[].executionTime`
2. Optimize slow commands (database queries, API calls)
3. Consider parallelizing non-dependent commands (future feature)
4. Use caching for expensive operations

---

## Future Enhancements

- [ ] Parallel command execution (for independent commands)
- [ ] Command queuing (async execution)
- [ ] Saga pattern (distributed transactions)
- [ ] Command scheduling (delayed execution)
- [ ] Command compensation (advanced rollback)
- [ ] Event sourcing integration
- [ ] GraphQL integration
- [ ] Real-time progress updates (WebSocket)

---

## See Also

- [Command Layer Guide](./COMMANDS.md)
- [Policy Layer Guide](./POLICY_IMPLEMENTATION.md)
- [Engine Documentation](./IMPLEMENTATION.md)
- [Quick Start Guide](./QUICKSTART.md)
