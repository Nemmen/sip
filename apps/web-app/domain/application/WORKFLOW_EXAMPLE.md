# Complete Workflow Example

End-to-end example showing how to use the complete workflow system with validation, policies, and command execution.

## Scenario

**User Story:**  
*As an employer, I want to accept a candidate for an internship position, triggering database updates, notifications, and audit logging.*

---

## Step-by-Step Implementation

### 1. API Route Handler

```typescript
// app/api/applications/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeWorkflow, ApplicationIntent, UserRole, ApplicationStatus } from '@/domain/application';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get application details
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        internship: {
          include: {
            company: true,
          },
        },
        student: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // 3. Verify employer owns this internship
    if (application.internship.company.employerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Get current accepted count for internship
    const acceptedCount = await prisma.application.count({
      where: {
        internshipId: application.internshipId,
        status: ApplicationStatus.ACCEPTED,
      },
    });

    // 5. Execute workflow with orchestrator
    const result = await executeWorkflow({
      // Intent validation context
      intentContext: {
        intent: ApplicationIntent.ACCEPT_CANDIDATE,
        actorRole: UserRole.EMPLOYER,
        currentStatus: application.status as ApplicationStatus,
      },

      // Business context
      appContext: {
        kycStatus: application.student.kycStatus,
        internshipStatus: application.internship.status,
        maxApplicants: application.internship.maxApplicants,
        acceptedCount,
      },

      // Command execution context
      commandContext: {
        applicationId: application.id,
        userId: session.user.id,
        studentId: application.studentId,
        employerId: session.user.id,
        internshipId: application.internshipId,
        metadata: {
          companyName: application.internship.company.name,
          internshipTitle: application.internship.title,
          studentName: application.student.name,
          studentEmail: application.student.email,
        },
      },
    });

    // 6. Handle workflow result
    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: result.reason,
          code: result.reasonCode,
        },
        { status: 400 }
      );
    }

    // 7. Check if commands failed
    if (result.commandsFailed.length > 0) {
      console.error('Commands failed:', result.commandsFailed);
      
      // Log to monitoring
      await logCommandFailures(result);
      
      // Return partial success
      return NextResponse.json({
        success: true,
        warning: 'Application accepted but some notifications failed',
        application: {
          id: application.id,
          status: result.nextStatus,
        },
        commandsExecuted: result.commandsExecuted.length,
        commandsFailed: result.commandsFailed.length,
        rollbackExecuted: result.rollbackExecuted,
      });
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      message: 'Candidate accepted successfully',
      application: {
        id: application.id,
        status: result.nextStatus,
      },
      commandsExecuted: result.commandsExecuted.length,
      executionTime: result.totalExecutionTime,
    });

  } catch (error) {
    console.error('Error accepting candidate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to log command failures
async function logCommandFailures(result: any) {
  await prisma.systemLog.create({
    data: {
      level: 'ERROR',
      category: 'WORKFLOW_COMMANDS',
      message: 'Command execution failures',
      metadata: {
        intent: result.intentResult.intent,
        commandsFailed: result.commandsFailed,
        rollbackExecuted: result.rollbackExecuted,
      },
    },
  });
}
```

---

### 2. Frontend Component

```typescript
// components/ApplicationActions.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface ApplicationActionsProps {
  applicationId: string;
  currentStatus: string;
  onSuccess?: () => void;
}

export function ApplicationActions({
  applicationId,
  currentStatus,
  onSuccess,
}: ApplicationActionsProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      const response = await fetch(`/api/applications/${applicationId}/accept`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Cannot accept candidate',
          description: data.error || 'An error occurred',
          variant: 'destructive',
        });
        return;
      }

      if (data.warning) {
        toast({
          title: 'Accepted with warnings',
          description: data.warning,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Candidate accepted',
          description: 'The candidate has been successfully accepted',
          variant: 'success',
        });
      }

      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept candidate',
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleAccept}
        disabled={isAccepting || currentStatus !== 'SHORTLISTED'}
      >
        {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Accept Candidate
      </Button>
    </div>
  );
}
```

---

### 3. Workflow Execution Flow

When the employer clicks "Accept Candidate", the following happens:

```
┌─────────────────────────────────────────────────────────┐
│ 1. FRONTEND                                             │
│    User clicks "Accept Candidate" button               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. API ROUTE                                            │
│    POST /api/applications/[id]/accept                   │
│    - Authenticate user                                  │
│    - Fetch application data                             │
│    - Prepare workflow context                           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. ORCHESTRATOR (executeWorkflow)                       │
│    Coordinates validation + execution                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. VALIDATION (executeIntent) - PURE                    │
│    ✅ Role: EMPLOYER can ACCEPT_CANDIDATE               │
│    ✅ Business Rules: KYC approved, internship active   │
│    ✅ Policies: Within hiring limit, time allowed       │
│    ✅ Transition: SHORTLISTED → ACCEPTED valid          │
│    Result: ALLOWED                                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. COMMAND EXECUTION (Priority Order)                   │
│                                                         │
│    Priority 1000: UPDATE_DATABASE_COMMAND               │
│    ✅ Update application.status = 'ACCEPTED'            │
│    Execution time: 45ms                                 │
│                                                         │
│    Priority 500: SEND_NOTIFICATION_COMMAND              │
│    ✅ Send in-app notification to student               │
│    Execution time: 120ms                                │
│                                                         │
│    Priority 400: SEND_EMAIL_COMMAND                     │
│    ✅ Send "Congratulations" email                      │
│    Execution time: 230ms                                │
│                                                         │
│    Priority 100: LOG_AUDIT_EVENT_COMMAND                │
│    ✅ Log to audit trail                                │
│    Execution time: 15ms                                 │
│                                                         │
│    Priority 50: TRIGGER_WEBHOOK_COMMAND                 │
│    ✅ Trigger integration webhooks                      │
│    Execution time: 180ms                                │
│                                                         │
│    Total execution time: 590ms                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 6. RESPONSE                                             │
│    Return success to frontend                           │
│    {                                                    │
│      success: true,                                     │
│      application: { id, status: 'ACCEPTED' },           │
│      commandsExecuted: 5,                               │
│      executionTime: 590                                 │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 7. FRONTEND UPDATE                                      │
│    - Show success toast                                 │
│    - Refresh application list                           │
│    - Update UI to show new status                       │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Error Handling Example

**Scenario:** Email service is down

```
┌─────────────────────────────────────────────────────────┐
│ VALIDATION: ✅ ALLOWED                                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ COMMAND EXECUTION                                       │
│                                                         │
│    UPDATE_DATABASE_COMMAND: ✅ Success                  │
│    SEND_NOTIFICATION_COMMAND: ✅ Success                │
│    SEND_EMAIL_COMMAND: ❌ FAILED!                       │
│    Error: "SMTP server unavailable"                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ ROLLBACK (Reverse Order)                                │
│                                                         │
│    SEND_NOTIFICATION_COMMAND:                           │
│    ⚠️ No rollback support (notification already sent)   │
│                                                         │
│    UPDATE_DATABASE_COMMAND:                             │
│    ✅ Rollback: status = 'SHORTLISTED'                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ RESPONSE                                                │
│    {                                                    │
│      success: true,                                     │
│      warning: "Accepted but some notifications failed", │
│      commandsExecuted: 2,                               │
│      commandsFailed: 1,                                 │
│      rollbackExecuted: true                             │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
```

---

### 5. Validation Denial Example

**Scenario:** Trying to accept without KYC approval

```
┌─────────────────────────────────────────────────────────┐
│ VALIDATION: ❌ DENIED                                   │
│                                                         │
│ Layer 1: Role Permission - ✅ ALLOWED                   │
│ Layer 2: Business Rules - ❌ DENIED                     │
│   Reason: "Student KYC not approved"                    │
│   Code: "KYC_NOT_APPROVED"                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ COMMANDS: ⏭️ SKIPPED (No execution)                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ RESPONSE                                                │
│    HTTP 400 Bad Request                                 │
│    {                                                    │
│      success: false,                                    │
│      error: "Student KYC not approved",                 │
│      code: "KYC_NOT_APPROVED"                           │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Testing

### Integration Test

```typescript
import { executeWorkflow, ApplicationIntent, UserRole, ApplicationStatus } from '@/domain/application';

describe('Accept Candidate Workflow', () => {
  it('should accept candidate and execute all commands', async () => {
    const result = await executeWorkflow({
      intentContext: {
        intent: ApplicationIntent.ACCEPT_CANDIDATE,
        actorRole: UserRole.EMPLOYER,
        currentStatus: ApplicationStatus.SHORTLISTED,
      },
      appContext: {
        kycStatus: 'APPROVED',
        internshipStatus: 'ACTIVE',
        maxApplicants: 10,
        acceptedCount: 5,
      },
      commandContext: {
        applicationId: 'test_app_123',
        userId: 'test_employer_456',
        studentId: 'test_student_789',
        internshipId: 'test_int_012',
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.nextStatus).toBe(ApplicationStatus.ACCEPTED);
    expect(result.commandsExecuted.length).toBe(5);
    expect(result.commandsFailed.length).toBe(0);
    expect(result.rollbackExecuted).toBe(false);
  });

  it('should deny if KYC not approved', async () => {
    const result = await executeWorkflow({
      intentContext: {
        intent: ApplicationIntent.ACCEPT_CANDIDATE,
        actorRole: UserRole.EMPLOYER,
        currentStatus: ApplicationStatus.SHORTLISTED,
      },
      appContext: {
        kycStatus: 'PENDING', // Not approved
        internshipStatus: 'ACTIVE',
      },
      commandContext: {
        applicationId: 'test_app_123',
        userId: 'test_employer_456',
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('KYC_NOT_APPROVED');
    expect(result.commandsExecuted.length).toBe(0);
  });
});
```

---

## Monitoring

### Command Execution Metrics

```typescript
// Log metrics after workflow execution
const result = await executeWorkflow(context);

await metrics.track({
  event: 'workflow_executed',
  properties: {
    intent: context.intentContext.intent,
    allowed: result.allowed,
    commandsExecuted: result.commandsExecuted.length,
    commandsFailed: result.commandsFailed.length,
    rollbackExecuted: result.rollbackExecuted,
    totalExecutionTime: result.totalExecutionTime,
  },
});

// Track individual command performance
result.commandsExecuted.forEach(cmd => {
  metrics.track({
    event: 'command_executed',
    properties: {
      commandId: cmd.commandId,
      success: cmd.success,
      executionTime: cmd.executionTime,
    },
  });
});
```

---

## See Also

- [Orchestrator Guide](./ORCHESTRATOR.md)
- [Command Layer Guide](./COMMANDS.md)
- [Policy Implementation Guide](./POLICY_IMPLEMENTATION.md)
