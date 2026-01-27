# Application Workflow System - Complete Architecture

## System Overview

The Application Workflow System is a **domain-driven, intent-based workflow engine** that separates business logic validation from side effects execution.

### Architecture Principles

1. **Pure Validation**: Engine validates business rules without side effects
2. **Command Pattern**: Side effects encapsulated as composable commands
3. **Separation of Concerns**: Clear boundaries between layers
4. **Async Support**: Full Promise-based async execution
5. **Rollback Capability**: Compensating transactions for failures
6. **Type Safety**: Complete TypeScript type definitions
7. **Testability**: Each layer independently testable

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TYPES & ENUMS (types.ts)                                │
│    - ApplicationStatus, UserRole                            │
│    - WorkflowAction, RolePermissions                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BUSINESS CONTEXT (context.ts)                            │
│    - ApplicationContext interface                           │
│    - KYC, Internship status enums                           │
│    - Denial reason codes                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. BUSINESS INTENTS (intents.ts)                            │
│    - ApplicationIntent enum (8 intents)                     │
│    - Intent metadata (description, category)                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. STATE MACHINE (transitions.ts)                           │
│    - STATUS_TRANSITIONS: valid state transitions            │
│    - ROLE_PERMISSIONS: role-based permissions               │
│    - TERMINAL_STATUSES: end states                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. POLICY LAYER (policies.ts)                               │
│    - 5 Policies: Time, Hiring Limit, Risk, Admin, Weekend  │
│    - Priority-based evaluation                              │
│    - Configurable constraints                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. INTENT ENGINE (engine.ts) - PURE, NO SIDE EFFECTS       │
│    - executeIntent(): Validates business rules              │
│    - 5 Validation Layers:                                   │
│      1. Role Permission Check                               │
│      2. Business Rules Validation                           │
│      3. Policy Evaluation                                   │
│      4. Terminal Status Check                               │
│      5. State Machine Transition                            │
│    - Returns: IntentResult (allowed, nextStatus, trace)     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. COMMAND LAYER (commands.ts) - SIDE EFFECTS              │
│    - 5 Commands: Database, Notification, Email, Audit, Webhook │
│    - Command interface: execute(), rollback?()              │
│    - Priority-based execution order                         │
│    - Async Promise-based operations                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. ORCHESTRATOR (orchestrator.ts) - COORDINATION           │
│    - executeWorkflow(): Validation + Execution              │
│    - Sequential command execution                           │
│    - Rollback on failure (LIFO)                             │
│    - Retry support                                          │
│    - Returns: WorkflowResult (comprehensive)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Workflow Execution

### Execution Flow

```typescript
// 1. User action (API request)
POST /api/applications/:id/accept

// 2. Call orchestrator
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
    // ...
  },
});

// 3. Orchestrator calls engine for validation
const intentResult = executeIntent(intentContext, appContext);

// 4. Engine validates (5 layers):
//    ✅ Layer 1: Role Permission - EMPLOYER can ACCEPT_CANDIDATE
//    ✅ Layer 2: Business Rules - KYC approved, internship active
//    ✅ Layer 3: Policies - Within hiring limit, time allowed
//    ✅ Layer 4: Terminal Status - Not terminal
//    ✅ Layer 5: Transition - SHORTLISTED → ACCEPTED valid

// 5. If allowed, execute commands (priority order):
//    ✅ UPDATE_DATABASE_COMMAND (priority 1000)
//    ✅ SEND_NOTIFICATION_COMMAND (priority 500)
//    ✅ SEND_EMAIL_COMMAND (priority 400)
//    ✅ LOG_AUDIT_EVENT_COMMAND (priority 100)
//    ✅ TRIGGER_WEBHOOK_COMMAND (priority 50)

// 6. Return comprehensive result
{
  allowed: true,
  nextStatus: 'ACCEPTED',
  commandsExecuted: 5,
  commandsFailed: 0,
  totalExecutionTime: 590
}
```

---

## File Structure

```
domain/application/
├── types.ts                   # Core types and enums
├── context.ts                 # Business context definitions
├── intents.ts                 # Business intents
├── transitions.ts             # State machine configuration
├── policies.ts                # Policy layer
├── engine.ts                  # Pure validation engine
├── commands.ts                # Command definitions (side effects)
├── orchestrator.ts            # Workflow orchestration
├── helpers.ts                 # Utility functions
├── index.ts                   # Public API exports
│
├── README.md                  # Overview and getting started
├── QUICKSTART.md              # Quick start guide
├── EXAMPLES.md                # Usage examples
├── IMPLEMENTATION.md          # Engine implementation details
├── POLICIES.md                # Policy layer overview
├── POLICY_IMPLEMENTATION.md   # Policy implementation guide
├── POLICY_QUICKSTART.md       # Policy quick start
├── COMMANDS.md                # Command layer guide
├── ORCHESTRATOR.md            # Orchestrator guide
├── WORKFLOW_EXAMPLE.md        # Complete workflow example
└── ARCHITECTURE.md            # This file
```

---

## API Surface

### Public Exports

```typescript
// Types
export { ApplicationStatus, UserRole } from './types';
export { ApplicationIntent } from './intents';
export { KYCStatus, InternshipStatus, DenialReasonCode } from './context';

// Validation (Pure)
export { executeIntent, getAvailableIntents } from './engine';

// Orchestration (With Side Effects)
export { executeWorkflow, validateWorkflow, executeWorkflowWithRetry } from './orchestrator';

// Commands
export { 
  UPDATE_DATABASE_COMMAND,
  SEND_NOTIFICATION_COMMAND,
  SEND_EMAIL_COMMAND,
  LOG_AUDIT_EVENT_COMMAND,
  TRIGGER_WEBHOOK_COMMAND,
  getCommandsForIntent,
} from './commands';

// Policies
export {
  TIME_RESTRICTION_POLICY,
  COMPANY_HIRING_LIMIT_POLICY,
  HIGH_RISK_APPLICATION_POLICY,
  ADMIN_OVERRIDE_POLICY,
  WEEKEND_RESTRICTION_POLICY,
  evaluatePolicies,
} from './policies';

// Helpers (Legacy API)
export { canTransition, getAllowedActions } from './helpers';
```

---

## Key Interfaces

### WorkflowContext

```typescript
interface WorkflowContext {
  intentContext: {
    intent: ApplicationIntent;
    actorRole: UserRole;
    currentStatus: ApplicationStatus;
    metadata?: Record<string, any>;
  };
  
  appContext?: {
    kycStatus?: KYCStatus;
    internshipStatus?: InternshipStatus;
    maxApplicants?: number;
    acceptedCount?: number;
    companyHiringLimit?: number;
    companyAcceptedCount?: number;
    metadata?: Record<string, any>;
  };
  
  commandContext: {
    applicationId: string;
    userId: string;
    studentId?: string;
    employerId?: string;
    internshipId?: string;
    metadata?: Record<string, any>;
  };
  
  executeCommands?: boolean;
  customCommands?: Command[];
}
```

### WorkflowResult

```typescript
interface WorkflowResult {
  // Validation
  allowed: boolean;
  nextStatus?: string;
  reason?: string;
  reasonCode?: string;
  
  // Intent validation result
  intentResult: IntentResult;
  
  // Command execution
  commandsExecuted: CommandExecutionSummary[];
  commandsFailed: CommandExecutionSummary[];
  rollbackExecuted: boolean;
  rollbackResults?: CommandExecutionSummary[];
  
  // Decision trace (if enabled)
  trace?: TraceEntry[];
  
  // Performance
  totalExecutionTime: number;
}
```

---

## Usage Patterns

### 1. Simple Validation (No Side Effects)

```typescript
import { executeIntent } from '@/domain/application';

const result = executeIntent(intentContext, appContext);
if (result.allowed) {
  console.log('Would be allowed to:', result.nextStatus);
}
```

### 2. Complete Workflow (With Side Effects)

```typescript
import { executeWorkflow } from '@/domain/application';

const result = await executeWorkflow({
  intentContext: { /* ... */ },
  commandContext: { /* ... */ },
});

if (result.allowed) {
  console.log('Workflow completed!');
  console.log('Commands executed:', result.commandsExecuted.length);
}
```

### 3. Dry Run (Validate Only)

```typescript
import { validateWorkflow } from '@/domain/application';

const result = await validateWorkflow(context);
// No commands executed, only validation
```

### 4. With Retry

```typescript
import { executeWorkflowWithRetry } from '@/domain/application';

const result = await executeWorkflowWithRetry(context, 3);
// Retries up to 3 times if commands fail
```

---

## Decision Trace

### 5-Layer Validation

```typescript
trace: [
  {
    layer: 'ROLE_PERMISSION',
    result: 'ALLOWED',
    executionTime: 5
  },
  {
    layer: 'BUSINESS_RULES',
    result: 'ALLOWED',
    executionTime: 12
  },
  {
    layer: 'POLICY_EVALUATION',
    result: 'ALLOWED',
    executionTime: 8,
    metadata: {
      policiesEvaluated: 5,
      policiesPassed: 5
    }
  },
  {
    layer: 'TERMINAL_STATUS',
    result: 'ALLOWED',
    executionTime: 2
  },
  {
    layer: 'STATE_TRANSITION',
    result: 'ALLOWED',
    executionTime: 3,
    metadata: {
      transition: 'SHORTLISTED → ACCEPTED'
    }
  }
]
```

---

## Command Execution Order

### Priority-Based Sequential Execution

| Priority | Command                   | Purpose                    | Rollback |
|----------|---------------------------|----------------------------|----------|
| 1000     | UPDATE_DATABASE           | Persist status change      | ✅       |
| 500      | SEND_NOTIFICATION         | In-app notification        | ❌       |
| 400      | SEND_EMAIL                | Email notification         | ❌       |
| 100      | LOG_AUDIT_EVENT           | Compliance logging         | ❌       |
| 50       | TRIGGER_WEBHOOK           | External integrations      | ❌       |

---

## Error Handling

### Rollback Strategy

```
Execution Order:
  UPDATE_DATABASE (✅)
  SEND_NOTIFICATION (✅)
  SEND_EMAIL (❌ FAILED!)

Rollback Order (LIFO):
  SEND_NOTIFICATION (⚠️ no rollback)
  UPDATE_DATABASE (✅ rollback executed)
```

### Command Failure Response

```typescript
{
  allowed: true,
  nextStatus: 'ACCEPTED',
  commandsExecuted: [
    { commandId: 'UPDATE_DATABASE_COMMAND', success: true },
    { commandId: 'SEND_NOTIFICATION_COMMAND', success: true }
  ],
  commandsFailed: [
    { commandId: 'SEND_EMAIL_COMMAND', success: false, error: 'SMTP unavailable' }
  ],
  rollbackExecuted: true,
  rollbackResults: [
    { commandId: 'UPDATE_DATABASE_COMMAND', success: true, rolledBack: true }
  ]
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test engine (pure validation)
const result = executeIntent(context, appContext);
expect(result.allowed).toBe(true);

// Test individual commands
const cmdResult = await UPDATE_DATABASE_COMMAND.execute(context);
expect(cmdResult.success).toBe(true);

// Test policies
const policyResult = TIME_RESTRICTION_POLICY.evaluate(context);
expect(policyResult.allowed).toBe(true);
```

### Integration Tests

```typescript
// Test complete workflow
const result = await executeWorkflow(context);
expect(result.allowed).toBe(true);
expect(result.commandsExecuted.length).toBe(5);
expect(result.commandsFailed.length).toBe(0);
```

---

## Performance Characteristics

### Typical Execution Times

| Operation                  | Time    | Notes                          |
|----------------------------|---------|--------------------------------|
| Intent validation          | 10-30ms | Pure, in-memory                |
| Database update            | 30-50ms | Single query                   |
| Send notification          | 50-150ms| In-app, async                  |
| Send email                 | 100-300ms| External service              |
| Log audit event            | 10-20ms | Single insert                  |
| Trigger webhook            | 50-200ms| External HTTP call             |
| **Total workflow**         | **250-750ms** | Sequential execution   |

---

## Extension Points

### Adding Custom Commands

```typescript
const CUSTOM_COMMAND: Command = {
  id: 'CUSTOM_COMMAND',
  description: 'Custom side effect',
  priority: 600,
  retryable: true,
  supportsRollback: false,
  execute: async (context) => { /* ... */ },
};

// Add to registry
COMMAND_REGISTRY[ApplicationIntent.ACCEPT_CANDIDATE].push(CUSTOM_COMMAND);
```

### Adding Custom Policies

```typescript
const CUSTOM_POLICY: Policy = {
  id: 'CUSTOM_POLICY',
  description: 'Custom business rule',
  priority: 600,
  evaluate: (context) => {
    // Custom logic
    return { allowed: true };
  },
};

// Add to policies array
const policies = [...DEFAULT_POLICIES, CUSTOM_POLICY];
```

---

## Best Practices

### ✅ DO

1. Use `executeWorkflow()` for production workflows
2. Use `executeIntent()` for validation-only use cases
3. Handle `commandsFailed` gracefully
4. Monitor `executionTime` for performance
5. Log rollback events for debugging
6. Test commands independently
7. Keep commands focused (single responsibility)

### ❌ DON'T

1. Mix validation and side effects in engine
2. Ignore `commandsFailed` results
3. Use `executeIntent()` then manually run side effects
4. Create commands with multiple responsibilities
5. Skip error handling for command failures
6. Assume all commands will succeed
7. Forget to implement rollback for critical commands

---

## Monitoring & Observability

### Metrics to Track

```typescript
// Workflow metrics
- workflow_execution_count
- workflow_execution_time
- workflow_allowed_rate
- workflow_denied_rate

// Command metrics
- command_execution_count
- command_success_rate
- command_failure_rate
- command_execution_time
- command_rollback_count

// Business metrics
- applications_accepted_count
- applications_rejected_count
- policy_violation_count
```

---

## Migration Guide

### From Legacy API

```typescript
// ❌ Old: Status-based API
if (canTransition(currentStatus, newStatus, role)) {
  await prisma.application.update({ /* ... */ });
  await emailService.send({ /* ... */ });
}

// ✅ New: Intent-driven workflow
const result = await executeWorkflow({
  intentContext: {
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    actorRole: role,
    currentStatus,
  },
  commandContext: { applicationId, userId },
});
```

---

## See Also

- [Quick Start Guide](./QUICKSTART.md)
- [Orchestrator Guide](./ORCHESTRATOR.md)
- [Command Layer Guide](./COMMANDS.md)
- [Policy Implementation](./POLICY_IMPLEMENTATION.md)
- [Complete Example](./WORKFLOW_EXAMPLE.md)
