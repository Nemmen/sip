# Application Domain Module

**Enterprise-grade, intent-driven workflow engine with command orchestration**

## Overview

This module provides a **complete workflow system** for managing student internship applications with:
- ✅ **Pure validation engine** (no side effects)
- ✅ **Policy-based business rules** (5 configurable policies)
- ✅ **Command orchestration** (async side effects with rollback)
- ✅ **Decision tracing** (5-layer validation audit)
- ✅ **Type-safe** (full TypeScript coverage)
- ✅ **Testable** (pure functions, composable commands)

### Quick Navigation

- 📖 [Quick Start Guide](./QUICKSTART.md) - Get started in 5 minutes
- 🏗️ [Architecture Overview](./ARCHITECTURE.md) - Complete system design
- 🎯 [Orchestrator Guide](./ORCHESTRATOR.md) - Workflow execution with side effects
- 🔧 [Command Layer Guide](./COMMANDS.md) - Creating and using commands
- 📋 [Policy Implementation](./POLICY_IMPLEMENTATION.md) - Business rules and policies
- 💡 [Complete Example](./WORKFLOW_EXAMPLE.md) - End-to-end implementation

---

## What's New: Command Layer & Orchestrator

### Before (Validation Only)

```typescript
// ❌ Old: Validation + Manual side effects
const result = executeIntent(context, appContext);
if (result.allowed) {
  await prisma.application.update(/* ... */);
  await emailService.send(/* ... */);
  await auditService.log(/* ... */);
}
```

### Now (Complete Workflow)

```typescript
// ✅ New: Validation + Automatic command execution
const result = await executeWorkflow({
  intentContext: {
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    actorRole: UserRole.EMPLOYER,
    currentStatus: ApplicationStatus.SHORTLISTED,
  },
  commandContext: {
    applicationId: 'app_123',
    userId: 'user_456',
  },
});

// Commands executed automatically:
// ✅ UPDATE_DATABASE_COMMAND
// ✅ SEND_NOTIFICATION_COMMAND
// ✅ SEND_EMAIL_COMMAND
// ✅ LOG_AUDIT_EVENT_COMMAND
// ✅ TRIGGER_WEBHOOK_COMMAND
```

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│ 1. TYPES & ENUMS                                        │
│    ApplicationStatus, UserRole, ApplicationIntent       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. BUSINESS CONTEXT                                     │
│    KYC status, internship limits, metadata              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. POLICY LAYER (5 Policies)                            │
│    - Time restriction                                   │
│    - Hiring limits                                      │
│    - High-risk applications                             │
│    - Admin override                                     │
│    - Weekend restriction                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. INTENT ENGINE (Pure Validation)                      │
│    executeIntent() - 5 validation layers                │
│    ✅ Role permissions                                  │
│    ✅ Business rules                                    │
│    ✅ Policy evaluation                                 │
│    ✅ Terminal status check                             │
│    ✅ State transition                                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. COMMAND LAYER (Side Effects)                         │
│    5 built-in commands + extensible                     │
│    - UPDATE_DATABASE_COMMAND (supports rollback)        │
│    - SEND_NOTIFICATION_COMMAND                          │
│    - SEND_EMAIL_COMMAND                                 │
│    - LOG_AUDIT_EVENT_COMMAND                            │
│    - TRIGGER_WEBHOOK_COMMAND                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 6. ORCHESTRATOR (Workflow Coordination)                 │
│    executeWorkflow() - Validation + Execution           │
│    - Sequential command execution                       │
│    - Rollback on failure (LIFO)                         │
│    - Retry support                                      │
│    - Performance metrics                                │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Simple Validation (No Side Effects)

```typescript
import { executeIntent, ApplicationIntent, UserRole, ApplicationStatus } from '@/domain/application';

const result = executeIntent(
  {
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    actorRole: UserRole.EMPLOYER,
    currentStatus: ApplicationStatus.SHORTLISTED,
  },
  {
    kycStatus: 'APPROVED',
    maxApplicants: 10,
    acceptedCount: 5,
  }
);

if (result.allowed) {
  console.log('Can accept! Next status:', result.nextStatus);
} else {
  console.error('Cannot accept:', result.reason);
}
```

### 2. Complete Workflow (With Side Effects)

```typescript
import { executeWorkflow } from '@/domain/application';

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
    internshipId: 'int_012',
  },
});

if (result.allowed) {
  console.log('✅ Application accepted!');
  console.log('Commands executed:', result.commandsExecuted.length);
  console.log('Total time:', result.totalExecutionTime, 'ms');
} else {
  console.error('❌ Workflow denied:', result.reason);
}
```

---

## File Structure

---

## File Structure

```
domain/application/
├── index.ts                   # Public API (import from here)
├── types.ts                   # Core types and enums
├── context.ts                 # Business context definitions
├── intents.ts                 # Business intents (8 intents)
├── transitions.ts             # State machine configuration
├── policies.ts                # Policy layer (5 policies)
├── engine.ts                  # Pure validation engine
├── commands.ts                # Command definitions (5 commands)
├── orchestrator.ts            # Workflow orchestration
├── helpers.ts                 # Utility functions (legacy API)
│
├── README.md                  # This file
├── ARCHITECTURE.md            # Complete architecture guide
├── QUICKSTART.md              # Quick start guide
├── ORCHESTRATOR.md            # Orchestrator documentation
├── COMMANDS.md                # Command layer guide
├── POLICY_IMPLEMENTATION.md   # Policy implementation guide
├── WORKFLOW_EXAMPLE.md        # Complete example
└── [other docs...]            # Additional guides
```

---

## Core Concepts

### 1. Intents vs Status Transitions

**Intent-Driven** (Recommended):
```typescript
// ✅ Semantic, business-focused
executeWorkflow({
  intentContext: {
    intent: ApplicationIntent.ACCEPT_CANDIDATE,  // What you want to do
    actorRole: UserRole.EMPLOYER,
    currentStatus: ApplicationStatus.SHORTLISTED,
  },
  commandContext: { /* ... */ },
});
```

**Status-Based** (Legacy):
```typescript
// ⚠️ Old API, still supported
canTransition(
  ApplicationStatus.SHORTLISTED,  // From
  ApplicationStatus.ACCEPTED,     // To
  UserRole.EMPLOYER
);
```

### 2. Validation vs Execution

**Validation Only** (Pure, no side effects):
```typescript
const result = executeIntent(intentContext, appContext);
// Returns: { allowed: boolean, nextStatus?: string, reason?: string }
```

**Complete Workflow** (Validation + Commands):
```typescript
const result = await executeWorkflow({
  intentContext: { /* ... */ },
  commandContext: { /* ... */ },
});
// Returns: WorkflowResult with command execution details
```

### 3. Command Execution

Commands execute **sequentially** in **priority order**:

```
Priority 1000: UPDATE_DATABASE ✅ (supports rollback)
  ↓
Priority 500: SEND_NOTIFICATION ✅
  ↓
Priority 400: SEND_EMAIL ✅
  ↓
Priority 100: LOG_AUDIT_EVENT ✅
  ↓
Priority 50: TRIGGER_WEBHOOK ✅
```

If any command fails, **rollback** executes in reverse order (LIFO).

---

## Usage Examples

### Example 1: API Route Handler

```typescript
// app/api/applications/[id]/accept/route.ts
import { executeWorkflow, ApplicationIntent, UserRole } from '@/domain/application';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  
  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { internship: true, student: true },
  });

  const result = await executeWorkflow({
    intentContext: {
      intent: ApplicationIntent.ACCEPT_CANDIDATE,
      actorRole: UserRole.EMPLOYER,
      currentStatus: application.status,
    },
    appContext: {
      kycStatus: application.student.kycStatus,
      internshipStatus: application.internship.status,
    },
    commandContext: {
      applicationId: application.id,
      userId: session.user.id,
      studentId: application.studentId,
      internshipId: application.internshipId,
    },
  });

  if (!result.allowed) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    status: result.nextStatus,
    commandsExecuted: result.commandsExecuted.length,
  });
}
```

### Example 2: Frontend Component

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function AcceptButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    
    const response = await fetch(`/api/applications/${applicationId}/accept`, {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('Candidate accepted!');
    } else {
      toast.error(data.error);
    }
    
    setLoading(false);
  };

  return (
    <Button onClick={handleAccept} disabled={loading}>
      {loading ? 'Accepting...' : 'Accept Candidate'}
    </Button>
  );
}
```

### Example 3: Custom Commands

```typescript
import { Command, CommandContext, CommandResult } from '@/domain/application';

const SEND_SMS_COMMAND: Command = {
  id: 'SEND_SMS_COMMAND',
  description: 'Send SMS notification',
  priority: 450,
  retryable: true,
  supportsRollback: false,
  
  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      await smsService.send({
        to: context.metadata?.phone,
        message: `Application status: ${context.newStatus}`,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Use custom command
const result = await executeWorkflow({
  intentContext: { /* ... */ },
  commandContext: { /* ... */ },
  customCommands: [
    UPDATE_DATABASE_COMMAND,
    SEND_SMS_COMMAND,  // Custom command
    LOG_AUDIT_EVENT_COMMAND,
  ],
});
```

---

## State Machine

### Status Flow

```
SUBMITTED
  ├─> UNDER_REVIEW
  │     └─> SHORTLISTED
  │           └─> INTERVIEW_SCHEDULED
  │                 ├─> ACCEPTED ✓ (terminal)
  │                 └─> REJECTED ✗ (terminal)
  ├─> SHORTLISTED (direct)
  └─> REJECTED ✗ (terminal)

WITHDRAWN ↩ (terminal - student only)
```

### Terminal Statuses

Applications in these statuses cannot transition further:
- **ACCEPTED**: Offer extended, candidate accepted
- **REJECTED**: Application declined
- **WITHDRAWN**: Student withdrew application

## Role Permissions

### Student
- **Can Initiate**: Submit applications
- **Can Transition To**: Withdraw (from any status)
- **Cannot**: Change employer-controlled statuses

### Employer
- **Can Transition To**: 
  - UNDER_REVIEW
  - SHORTLISTED
  - INTERVIEW_SCHEDULED
  - ACCEPTED
  - REJECTED
- **Cannot**: Override terminal statuses

### Admin
- **Full Control**: All transitions
- **Can Override**: Terminal status restrictions
- **Use Caution**: Admin overrides bypass business rules

## Functions Reference

### canTransition()
Check if a status transition is valid for a role.

**Signature:**
```typescript
canTransition(
  currentStatus: ApplicationStatus | string,
  targetStatus: ApplicationStatus | string,
  role: UserRole | string
): boolean
```

### getAllowedActions()
Get all permitted actions for a status and role.

**Signature:**
```typescript
getAllowedActions(
  currentStatus: ApplicationStatus | string,
  role: UserRole | string
): WorkflowAction[]
```

### isTerminalStatus()
Check if a status is terminal (no further transitions).

**Signature:**
```typescript
isTerminalStatus(status: ApplicationStatus | string): boolean
```

### getHumanStatusLabel()
Get human-readable label for a status.

**Signature:**
```typescript
getHumanStatusLabel(status: ApplicationStatus | string): string
```

### getTransitionBlockReason()
Get explanation for why a transition is blocked.

**Signature:**
```typescript
getTransitionBlockReason(
  currentStatus: ApplicationStatus | string,
  targetStatus: ApplicationStatus | string,
  role: UserRole | string
): string
```

### getStatusBadgeVariant()
Get UI badge variant for a status.

**Signature:**
```typescript
getStatusBadgeVariant(status: ApplicationStatus | string): string
```

**Returns:** `'info' | 'warning' | 'success' | 'danger' | 'default'`

## Testing

```typescript
import { canTransition, ApplicationStatus, UserRole } from '@/domain/application';

describe('Application Workflow', () => {
  test('employer can shortlist submitted application', () => {
    expect(canTransition('SUBMITTED', 'SHORTLISTED', 'EMPLOYER')).toBe(true);
  });
  
  test('student cannot shortlist their own application', () => {
    expect(canTransition('SUBMITTED', 'SHORTLISTED', 'STUDENT')).toBe(false);
  });
  
  test('terminal statuses cannot transition', () => {
    expect(canTransition('ACCEPTED', 'REJECTED', 'EMPLOYER')).toBe(false);
  });
});
```

## Future Enhancements

### Backend Integration
The domain module is designed to be shared with the backend:

```typescript
// Backend (NestJS)
import { canTransition, ApplicationStatus, UserRole } from '@sip/domain/application';

async updateApplicationStatus(id: string, newStatus: ApplicationStatus, userId: string) {
  const application = await this.findOne(id);
  const user = await this.userService.findOne(userId);
  
  // Validate transition using domain logic
  if (!canTransition(application.status, newStatus, user.role)) {
    throw new ForbiddenException('Invalid status transition');
  }
  
  // Perform update...
}
```

### Webhook Events
```typescript
import { TERMINAL_STATUSES } from '@/domain/application';

if (TERMINAL_STATUSES.includes(newStatus)) {
  await this.webhookService.sendEvent('application.completed', application);
}
```

### Audit Logging
```typescript
import { getHumanStatusLabel } from '@/domain/application';

await this.auditService.log({
  action: 'STATUS_CHANGE',
  description: `Application moved to ${getHumanStatusLabel(newStatus)}`,
  userId,
  applicationId,
});
```

### Context-Aware Validation (Business Rules)

```typescript
import { 
  executeIntent, 
  ApplicationIntent, 
  UserRole,
  InternshipStatus,
  KYCStatus,
  DenialReasonCode
} from '@/domain/application';

// Example 1: Accept candidate with capacity check
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
}, {
  internshipStatus: InternshipStatus.PUBLISHED,
  maxApplicants: 10,
  acceptedCount: 10, // Capacity reached!
  kycStatus: KYCStatus.APPROVED,
});

if (!result.allowed) {
  console.error(result.reasonCode); // MAX_APPLICANTS_REACHED
  console.error(result.reason); // "This internship has reached maximum capacity."
}

// Example 2: Submit application with deadline check
const result = executeIntent({
  intent: ApplicationIntent.SUBMIT_APPLICATION,
  actorRole: UserRole.STUDENT,
  currentStatus: ApplicationStatus.SUBMITTED,
}, {
  internshipStatus: InternshipStatus.PUBLISHED,
  applicationDeadline: new Date('2024-01-15'),
  currentDate: new Date('2024-01-20'), // Deadline passed!
});

if (!result.allowed) {
  console.error(result.reasonCode); // DEADLINE_EXPIRED
  console.error(result.reason); // "Application deadline has passed."
}

// Example 3: Employer action with KYC check
const result = executeIntent({
  intent: ApplicationIntent.SHORTLIST_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.UNDER_REVIEW,
}, {
  kycStatus: KYCStatus.PENDING, // KYC not approved!
  ownsInternship: true,
});

if (!result.allowed) {
  console.error(result.reasonCode); // KYC_PENDING
  console.error(result.reason); // "Your KYC verification is pending approval."
}

// Example 4: Backward compatible (no context)
const result = executeIntent({
  intent: ApplicationIntent.REVIEW_APPLICATION,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.SUBMITTED,
});
// Works without context - only validates role and status transition

// Example 5: Structured error handling
const result = executeIntent(intentContext, appContext);

if (!result.allowed) {
  switch (result.reasonCode) {
    case DenialReasonCode.MAX_APPLICANTS_REACHED:
      showToast('This position is full.', 'warning');
      break;
    case DenialReasonCode.DEADLINE_EXPIRED:
      showToast('Applications are closed.', 'error');
      break;
    case DenialReasonCode.KYC_NOT_APPROVED:
      router.push('/employer/kyc');
      break;
    default:
      showToast(result.reason, 'error');
  }
}
```

## Benefits

### 1. Maintainability
- Single source of truth for business rules
- Change once, update everywhere
- Clear separation of concerns

### 2. Testability
- Pure functions (no side effects)
- No framework dependencies
- Easy to mock and test

### 3. Type Safety
- Compile-time validation
- IDE autocomplete
- Catches errors early

### 4. Reusability
- Use in React components
- Use in backend validators
- Use in CLI tools

### 5. Documentation
- Self-documenting code
- JSDoc comments
- Clear API surface

### 6. Business Rule Enforcement
- Deadline validation
- Capacity management
- KYC compliance
- Ownership verification
- Structured error codes

## Migration Guide

### Before (Scattered Logic)
```typescript
// In component A
const canShortlist = status === 'SUBMITTED' && userRole === 'EMPLOYER';

// In component B
const canShortlist = ['SUBMITTED', 'UNDER_REVIEW'].includes(status);

// In component C (inconsistent!)
const canShortlist = status !== 'ACCEPTED' && status !== 'REJECTED';
```

### After (Centralized)
```typescript
// In all components
import { canTransition } from '@/domain/application';

const canShortlist = canTransition(status, 'SHORTLISTED', userRole);
```

## Contributing

When modifying the workflow:

1. **Update types.ts** for new statuses/roles
2. **Update transitions.ts** for new rules
3. **Update helpers.ts** if new logic needed
4. **Add tests** for new behavior
5. **Update README.md** documentation

## Related Modules

- **lib/applicationRules.ts**: Student eligibility rules (uses this module)
- **apps/api-service/src/applications**: Backend service (future integration)
