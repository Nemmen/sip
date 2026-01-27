# Application Workflow - Usage Examples

Real-world examples showing how to use the context-aware application workflow engine.

## Table of Contents

1. [Basic Usage (No Context)](#basic-usage-no-context)
2. [Context-Aware Validation](#context-aware-validation)
3. [React Component Examples](#react-component-examples)
4. [Backend Validation Examples](#backend-validation-examples)
5. [Error Handling Patterns](#error-handling-patterns)

---

## Basic Usage (No Context)

### Example 1: Simple Status Transition Check

```typescript
import { executeIntent, ApplicationIntent, UserRole, ApplicationStatus } from '@/domain/application';

const result = executeIntent({
  intent: ApplicationIntent.SHORTLIST_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.SUBMITTED,
});

if (result.allowed) {
  // Proceed with shortlisting
  await updateApplicationStatus(appId, result.nextStatus);
  await sendNotification(studentId, 'shortlisted');
} else {
  // Show error to user
  showToast(result.reason, 'error');
}
```

### Example 2: Get Available Actions for UI

```typescript
import { getAvailableIntents, UserRole, ApplicationStatus } from '@/domain/application';

const availableActions = getAvailableIntents(
  ApplicationStatus.UNDER_REVIEW,
  UserRole.EMPLOYER
);

// Returns:
// [
//   { intent: SHORTLIST_CANDIDATE, label: 'Shortlist Candidate', icon: '⭐', ... },
//   { intent: SCHEDULE_INTERVIEW, label: 'Schedule Interview', icon: '📅', ... },
//   { intent: REJECT_CANDIDATE, label: 'Reject', icon: '❌', ... }
// ]

// Render action buttons
{availableActions.map(action => (
  <Button
    key={action.intent}
    onClick={() => handleAction(action.intent)}
    variant={action.severity === 'destructive' ? 'destructive' : 'default'}
  >
    {action.icon} {action.label}
  </Button>
))}
```

---

## Context-Aware Validation

### Example 3: Deadline Validation

```typescript
import { 
  executeIntent, 
  ApplicationIntent, 
  UserRole,
  ApplicationStatus,
  InternshipStatus,
  DenialReasonCode
} from '@/domain/application';

async function submitApplication(internship: Internship, studentId: string) {
  const result = executeIntent({
    intent: ApplicationIntent.SUBMIT_APPLICATION,
    actorRole: UserRole.STUDENT,
    currentStatus: ApplicationStatus.SUBMITTED,
  }, {
    // Context for business rules
    internshipStatus: internship.status as InternshipStatus,
    applicationDeadline: new Date(internship.applicationDeadline),
    currentDate: new Date(),
  });

  if (!result.allowed) {
    if (result.reasonCode === DenialReasonCode.DEADLINE_EXPIRED) {
      return {
        success: false,
        error: 'Applications for this internship have closed.',
        canReapply: false,
      };
    }
    
    if (result.reasonCode === DenialReasonCode.INTERNSHIP_DRAFT) {
      return {
        success: false,
        error: 'This internship is not yet published.',
        canReapply: true,
      };
    }
    
    return {
      success: false,
      error: result.reason,
      canReapply: false,
    };
  }

  // Proceed with submission
  const application = await createApplication({
    internshipId: internship.id,
    studentId,
    status: result.nextStatus,
  });

  return { success: true, application };
}
```

### Example 4: Capacity Management

```typescript
import { 
  executeIntent, 
  ApplicationIntent, 
  UserRole,
  ApplicationStatus,
  InternshipStatus,
  DenialReasonCode
} from '@/domain/application';

async function acceptCandidate(
  applicationId: string,
  internship: Internship,
  employerId: string
) {
  // Fetch current accepted count
  const acceptedCount = await prisma.application.count({
    where: {
      internshipId: internship.id,
      status: ApplicationStatus.ACCEPTED,
    },
  });

  const result = executeIntent({
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    actorRole: UserRole.EMPLOYER,
    currentStatus: application.status as ApplicationStatus,
  }, {
    internshipStatus: internship.status as InternshipStatus,
    maxApplicants: internship.maxApplicants,
    acceptedCount,
    kycStatus: employer.kycStatus as KYCStatus,
    ownsInternship: internship.employerId === employerId,
  });

  if (!result.allowed) {
    if (result.reasonCode === DenialReasonCode.MAX_APPLICANTS_REACHED) {
      return {
        success: false,
        error: 'This internship has reached maximum capacity.',
        remainingSlots: 0,
      };
    }

    if (result.reasonCode === DenialReasonCode.NOT_OWNER) {
      return {
        success: false,
        error: 'You can only accept candidates for your own internships.',
      };
    }

    if (result.reasonCode === DenialReasonCode.KYC_NOT_APPROVED) {
      return {
        success: false,
        error: 'Please complete KYC verification first.',
        redirectTo: '/employer/kyc',
      };
    }

    return {
      success: false,
      error: result.reason,
    };
  }

  // Proceed with acceptance
  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: { status: result.nextStatus },
  });

  // Send notifications
  await sendEmail(student.email, 'Application Accepted');
  await createNotification(student.id, 'Your application was accepted!');

  return {
    success: true,
    application: updatedApplication,
    remainingSlots: internship.maxApplicants - (acceptedCount + 1),
  };
}
```

### Example 5: KYC Compliance

```typescript
import { 
  executeIntent, 
  ApplicationIntent, 
  UserRole,
  ApplicationStatus,
  KYCStatus,
  DenialReasonCode,
  DENIAL_REASON_MESSAGES
} from '@/domain/application';

async function employerAction(
  intent: ApplicationIntent,
  applicationId: string,
  employerId: string
) {
  const application = await getApplication(applicationId);
  const employer = await getEmployer(employerId);
  const internship = await getInternship(application.internshipId);

  const result = executeIntent({
    intent,
    actorRole: UserRole.EMPLOYER,
    currentStatus: application.status as ApplicationStatus,
  }, {
    kycStatus: employer.kycStatus as KYCStatus,
    ownsInternship: internship.employerId === employerId,
  });

  if (!result.allowed) {
    // Structured error handling based on reason code
    switch (result.reasonCode) {
      case DenialReasonCode.KYC_NOT_APPROVED:
        throw new UnauthorizedException({
          message: DENIAL_REASON_MESSAGES[DenialReasonCode.KYC_NOT_APPROVED],
          action: 'COMPLETE_KYC',
          redirectUrl: '/employer/kyc',
        });

      case DenialReasonCode.KYC_PENDING:
        throw new UnauthorizedException({
          message: DENIAL_REASON_MESSAGES[DenialReasonCode.KYC_PENDING],
          action: 'WAIT_FOR_APPROVAL',
          estimatedTime: '24-48 hours',
        });

      case DenialReasonCode.KYC_REJECTED:
        throw new UnauthorizedException({
          message: DENIAL_REASON_MESSAGES[DenialReasonCode.KYC_REJECTED],
          action: 'RESUBMIT_KYC',
          supportUrl: '/support/kyc-rejection',
        });

      case DenialReasonCode.NOT_OWNER:
        throw new ForbiddenException({
          message: result.reason,
          action: 'CONTACT_OWNER',
        });

      default:
        throw new BadRequestException(result.reason);
    }
  }

  // Proceed with action
  return await updateApplication(applicationId, result.nextStatus);
}
```

---

## React Component Examples

### Example 6: Action Buttons with Context Validation

```typescript
'use client';

import { useState } from 'react';
import { 
  executeIntent, 
  getAvailableIntents,
  ApplicationIntent, 
  UserRole,
  ApplicationStatus,
  InternshipStatus,
  KYCStatus,
  DenialReasonCode
} from '@/domain/application';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface ApplicationActionsProps {
  application: Application;
  internship: Internship;
  employer: Employer;
}

export function ApplicationActions({ 
  application, 
  internship, 
  employer 
}: ApplicationActionsProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Get available actions for current status
  const availableIntents = getAvailableIntents(
    application.status as ApplicationStatus,
    UserRole.EMPLOYER
  );

  async function handleAction(intent: ApplicationIntent) {
    setLoading(true);

    try {
      // Fetch latest data for validation
      const acceptedCount = await fetchAcceptedCount(internship.id);

      // Validate with full context
      const result = executeIntent({
        intent,
        actorRole: UserRole.EMPLOYER,
        currentStatus: application.status as ApplicationStatus,
      }, {
        internshipStatus: internship.status as InternshipStatus,
        maxApplicants: internship.maxApplicants,
        acceptedCount,
        kycStatus: employer.kycStatus as KYCStatus,
        ownsInternship: internship.employerId === employer.id,
        isWithdrawn: application.status === ApplicationStatus.WITHDRAWN,
      });

      if (!result.allowed) {
        // Handle specific denial reasons
        switch (result.reasonCode) {
          case DenialReasonCode.KYC_NOT_APPROVED:
          case DenialReasonCode.KYC_PENDING:
          case DenialReasonCode.KYC_REJECTED:
            toast({
              title: 'KYC Verification Required',
              description: result.reason,
              variant: 'destructive',
            });
            router.push('/employer/kyc');
            return;

          case DenialReasonCode.MAX_APPLICANTS_REACHED:
            toast({
              title: 'Capacity Reached',
              description: 'This internship has reached maximum capacity.',
              variant: 'destructive',
            });
            return;

          case DenialReasonCode.DEADLINE_EXPIRED:
          case DenialReasonCode.INTERNSHIP_CLOSED:
            toast({
              title: 'Action Not Allowed',
              description: result.reason,
              variant: 'destructive',
            });
            return;

          default:
            toast({
              title: 'Error',
              description: result.reason,
              variant: 'destructive',
            });
            return;
        }
      }

      // Execute the action
      await updateApplicationStatus(application.id, result.nextStatus);

      toast({
        title: 'Success',
        description: `Application ${result.nextStatus.toLowerCase()}.`,
      });

      // Refresh data
      router.refresh();

    } catch (error) {
      console.error('Action failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform action. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {availableIntents.map(({ intent, label, icon, severity, confirmRequired }) => (
        <Button
          key={intent}
          onClick={() => {
            if (confirmRequired) {
              if (confirm(`Are you sure you want to ${label.toLowerCase()}?`)) {
                handleAction(intent);
              }
            } else {
              handleAction(intent);
            }
          }}
          variant={severity === 'destructive' ? 'destructive' : 'default'}
          disabled={loading}
        >
          {icon} {label}
        </Button>
      ))}
    </div>
  );
}
```

### Example 7: Submit Application Form

```typescript
'use client';

import { useState } from 'react';
import { 
  executeIntent, 
  ApplicationIntent, 
  UserRole,
  ApplicationStatus,
  InternshipStatus,
  DenialReasonCode
} from '@/domain/application';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ApplyFormProps {
  internship: Internship;
  studentId: string;
}

export function ApplyForm({ internship, studentId }: ApplyFormProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Pre-validate before submission
      const validationResult = executeIntent({
        intent: ApplicationIntent.SUBMIT_APPLICATION,
        actorRole: UserRole.STUDENT,
        currentStatus: ApplicationStatus.SUBMITTED,
      }, {
        internshipStatus: internship.status as InternshipStatus,
        applicationDeadline: new Date(internship.applicationDeadline),
        currentDate: new Date(),
      });

      if (!validationResult.allowed) {
        // Show user-friendly error based on denial reason
        switch (validationResult.reasonCode) {
          case DenialReasonCode.INTERNSHIP_DRAFT:
            toast({
              title: 'Internship Not Available',
              description: 'This internship is not yet published.',
              variant: 'destructive',
            });
            return;

          case DenialReasonCode.INTERNSHIP_CLOSED:
            toast({
              title: 'Internship Closed',
              description: 'Applications for this internship are closed.',
              variant: 'destructive',
            });
            return;

          case DenialReasonCode.DEADLINE_EXPIRED:
            toast({
              title: 'Deadline Passed',
              description: `Application deadline was ${new Date(internship.applicationDeadline).toLocaleDateString()}.`,
              variant: 'destructive',
            });
            return;

          default:
            toast({
              title: 'Cannot Apply',
              description: validationResult.reason,
              variant: 'destructive',
            });
            return;
        }
      }

      // Submit application
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internshipId: internship.id,
          studentId,
          coverLetter,
          status: validationResult.nextStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully!',
      });

      // Redirect to applications page
      window.location.href = '/student/applications';

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        placeholder="Write your cover letter..."
        className="w-full h-40 p-4 border rounded-lg"
        required
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  );
}
```

---

## Backend Validation Examples

### Example 8: NestJS Controller with Context Validation

```typescript
import { 
  Controller, 
  Post, 
  Param, 
  Body,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { 
  executeIntent, 
  ApplicationIntent, 
  UserRole,
  ApplicationStatus,
  InternshipStatus,
  KYCStatus,
  DenialReasonCode
} from '@/domain/application';

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly internshipsService: InternshipsService,
    private readonly usersService: UsersService,
  ) {}

  @Post(':id/accept')
  async acceptCandidate(
    @Param('id') applicationId: string,
    @CurrentUser() employer: User,
  ) {
    // Fetch related data
    const application = await this.applicationsService.findOne(applicationId);
    const internship = await this.internshipsService.findOne(application.internshipId);
    const acceptedCount = await this.applicationsService.countAccepted(internship.id);

    // Validate with full context
    const result = executeIntent({
      intent: ApplicationIntent.ACCEPT_CANDIDATE,
      actorRole: UserRole.EMPLOYER,
      currentStatus: application.status as ApplicationStatus,
    }, {
      internshipStatus: internship.status as InternshipStatus,
      maxApplicants: internship.maxApplicants,
      acceptedCount,
      kycStatus: employer.kycStatus as KYCStatus,
      ownsInternship: internship.employerId === employer.id,
      isWithdrawn: application.status === ApplicationStatus.WITHDRAWN,
    });

    if (!result.allowed) {
      // Map denial reasons to HTTP exceptions
      switch (result.reasonCode) {
        case DenialReasonCode.INSUFFICIENT_PERMISSIONS:
          throw new ForbiddenException(result.reason);

        case DenialReasonCode.NOT_OWNER:
          throw new ForbiddenException(result.reason);

        case DenialReasonCode.KYC_NOT_APPROVED:
        case DenialReasonCode.KYC_PENDING:
        case DenialReasonCode.KYC_REJECTED:
          throw new UnauthorizedException({
            message: result.reason,
            code: result.reasonCode,
            action: 'COMPLETE_KYC',
          });

        case DenialReasonCode.MAX_APPLICANTS_REACHED:
        case DenialReasonCode.INTERNSHIP_CLOSED:
        case DenialReasonCode.DEADLINE_EXPIRED:
        case DenialReasonCode.ALREADY_WITHDRAWN:
        case DenialReasonCode.TERMINAL_STATUS:
        case DenialReasonCode.INVALID_TRANSITION:
          throw new BadRequestException({
            message: result.reason,
            code: result.reasonCode,
          });

        default:
          throw new BadRequestException(result.reason);
      }
    }

    // Execute state transition
    const updatedApplication = await this.applicationsService.update(
      applicationId,
      { status: result.nextStatus }
    );

    // Side effects
    await this.notificationsService.sendAcceptanceNotification(
      application.studentId,
      internship.title
    );
    await this.auditService.log({
      action: 'APPLICATION_ACCEPTED',
      userId: employer.id,
      resourceId: applicationId,
      metadata: { internshipId: internship.id },
    });

    return updatedApplication;
  }
}
```

---

## Error Handling Patterns

### Example 9: Centralized Error Handler

```typescript
import { 
  DenialReasonCode,
  DENIAL_REASON_MESSAGES,
  IntentResult
} from '@/domain/application';

export class WorkflowErrorHandler {
  /**
   * Convert intent result to user-friendly error
   */
  static toUserError(result: IntentResult): UserError {
    if (result.allowed) {
      return null;
    }

    const { reasonCode, reason } = result;

    // Map to user-friendly errors with actions
    switch (reasonCode) {
      case DenialReasonCode.KYC_NOT_APPROVED:
        return {
          title: 'KYC Verification Required',
          message: DENIAL_REASON_MESSAGES[reasonCode],
          action: {
            label: 'Complete KYC',
            url: '/employer/kyc',
          },
          severity: 'warning',
        };

      case DenialReasonCode.KYC_PENDING:
        return {
          title: 'Verification Pending',
          message: DENIAL_REASON_MESSAGES[reasonCode],
          action: null,
          severity: 'info',
          estimatedTime: '24-48 hours',
        };

      case DenialReasonCode.MAX_APPLICANTS_REACHED:
        return {
          title: 'Position Filled',
          message: DENIAL_REASON_MESSAGES[reasonCode],
          action: null,
          severity: 'error',
        };

      case DenialReasonCode.DEADLINE_EXPIRED:
        return {
          title: 'Applications Closed',
          message: DENIAL_REASON_MESSAGES[reasonCode],
          action: {
            label: 'Browse Other Opportunities',
            url: '/student/internships',
          },
          severity: 'warning',
        };

      case DenialReasonCode.INSUFFICIENT_PERMISSIONS:
        return {
          title: 'Access Denied',
          message: reason,
          action: null,
          severity: 'error',
        };

      default:
        return {
          title: 'Action Not Allowed',
          message: reason || 'Unable to perform this action.',
          action: null,
          severity: 'error',
        };
    }
  }

  /**
   * Show toast notification based on intent result
   */
  static showToast(result: IntentResult, toast: ToastFunction) {
    const error = this.toUserError(result);
    if (!error) return;

    toast({
      title: error.title,
      description: error.message,
      variant: error.severity === 'error' ? 'destructive' : 'default',
      action: error.action ? (
        <Button onClick={() => router.push(error.action.url)}>
          {error.action.label}
        </Button>
      ) : undefined,
    });
  }

  /**
   * Log structured error for monitoring
   */
  static logError(result: IntentResult, context: Record<string, any>) {
    if (result.allowed) return;

    console.error('[Workflow Denial]', {
      reasonCode: result.reasonCode,
      reason: result.reason,
      context,
      timestamp: new Date().toISOString(),
    });

    // Send to error tracking service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureMessage('Workflow action denied', {
        level: 'warning',
        extra: {
          reasonCode: result.reasonCode,
          reason: result.reason,
          ...context,
        },
      });
    }
  }
}
```

---

## Testing Examples

### Example 10: Unit Tests with Context

```typescript
import { 
  executeIntent, 
  ApplicationIntent, 
  UserRole,
  ApplicationStatus,
  InternshipStatus,
  KYCStatus,
  DenialReasonCode
} from '@/domain/application';

describe('Application Workflow - Context Validation', () => {
  describe('Deadline Validation', () => {
    it('should allow submission before deadline', () => {
      const result = executeIntent({
        intent: ApplicationIntent.SUBMIT_APPLICATION,
        actorRole: UserRole.STUDENT,
        currentStatus: ApplicationStatus.SUBMITTED,
      }, {
        internshipStatus: InternshipStatus.PUBLISHED,
        applicationDeadline: new Date('2024-12-31'),
        currentDate: new Date('2024-12-15'),
      });

      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe(ApplicationStatus.SUBMITTED);
    });

    it('should deny submission after deadline', () => {
      const result = executeIntent({
        intent: ApplicationIntent.SUBMIT_APPLICATION,
        actorRole: UserRole.STUDENT,
        currentStatus: ApplicationStatus.SUBMITTED,
      }, {
        internshipStatus: InternshipStatus.PUBLISHED,
        applicationDeadline: new Date('2024-12-15'),
        currentDate: new Date('2024-12-31'),
      });

      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe(DenialReasonCode.DEADLINE_EXPIRED);
    });
  });

  describe('Capacity Validation', () => {
    it('should allow acceptance when capacity available', () => {
      const result = executeIntent({
        intent: ApplicationIntent.ACCEPT_CANDIDATE,
        actorRole: UserRole.EMPLOYER,
        currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
      }, {
        maxApplicants: 10,
        acceptedCount: 5,
        kycStatus: KYCStatus.APPROVED,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny acceptance when capacity reached', () => {
      const result = executeIntent({
        intent: ApplicationIntent.ACCEPT_CANDIDATE,
        actorRole: UserRole.EMPLOYER,
        currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
      }, {
        maxApplicants: 10,
        acceptedCount: 10,
        kycStatus: KYCStatus.APPROVED,
      });

      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe(DenialReasonCode.MAX_APPLICANTS_REACHED);
    });
  });

  describe('KYC Validation', () => {
    it('should allow employer actions with approved KYC', () => {
      const result = executeIntent({
        intent: ApplicationIntent.SHORTLIST_CANDIDATE,
        actorRole: UserRole.EMPLOYER,
        currentStatus: ApplicationStatus.UNDER_REVIEW,
      }, {
        kycStatus: KYCStatus.APPROVED,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny employer actions without KYC', () => {
      const result = executeIntent({
        intent: ApplicationIntent.SHORTLIST_CANDIDATE,
        actorRole: UserRole.EMPLOYER,
        currentStatus: ApplicationStatus.UNDER_REVIEW,
      }, {
        kycStatus: KYCStatus.NOT_SUBMITTED,
      });

      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe(DenialReasonCode.KYC_NOT_APPROVED);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without context parameter', () => {
      const result = executeIntent({
        intent: ApplicationIntent.REVIEW_APPLICATION,
        actorRole: UserRole.EMPLOYER,
        currentStatus: ApplicationStatus.SUBMITTED,
      });

      expect(result.allowed).toBe(true);
      expect(result.nextStatus).toBe(ApplicationStatus.UNDER_REVIEW);
    });
  });
});
```

---

## Summary

These examples demonstrate:

1. **Basic validation** - Role and status transition checks
2. **Context-aware validation** - Business rules (deadline, capacity, KYC)
3. **Structured error handling** - DenialReasonCode with user-friendly messages
4. **React integration** - Components with full validation
5. **Backend validation** - NestJS controllers with HTTP exception mapping
6. **Error handling patterns** - Centralized error conversion
7. **Testing** - Unit tests covering all validation scenarios
8. **Backward compatibility** - Optional context parameter

The workflow engine provides:
- ✅ Type-safe validation
- ✅ Structured error codes
- ✅ User-friendly messages
- ✅ Backward compatibility
- ✅ Business rule enforcement
- ✅ Testable pure functions
