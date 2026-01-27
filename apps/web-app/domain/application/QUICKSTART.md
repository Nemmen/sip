# Quick Start Guide - Context-Aware Application Workflow

## Installation

The domain module is already set up. Just import what you need:

```typescript
import { 
  // Core types
  ApplicationStatus,
  UserRole,
  
  // Context types
  ApplicationContext,
  InternshipStatus,
  KYCStatus,
  DenialReasonCode,
  DENIAL_REASON_MESSAGES,
  
  // Intent-driven API
  ApplicationIntent,
  executeIntent,
  getAvailableIntents,
  
  // Legacy API (still supported)
  canTransition,
  getAllowedActions,
} from '@/domain/application';
```

---

## 30-Second Example

```typescript
// Check if employer can accept a candidate
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: application.status,
}, {
  maxApplicants: 10,
  acceptedCount: 9, // Still has space
  kycStatus: KYCStatus.APPROVED,
});

if (result.allowed) {
  await updateStatus(appId, result.nextStatus);
} else {
  showToast(result.reason, 'error');
}
```

---

## Common Use Cases

### 1. Accept Candidate with Full Validation

```typescript
async function acceptCandidate(applicationId: string) {
  // Fetch data
  const app = await getApplication(applicationId);
  const internship = await getInternship(app.internshipId);
  const employer = await getCurrentEmployer();
  const acceptedCount = await countAccepted(internship.id);

  // Validate
  const result = executeIntent({
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    actorRole: UserRole.EMPLOYER,
    currentStatus: app.status,
  }, {
    internshipStatus: internship.status,
    maxApplicants: internship.maxApplicants,
    acceptedCount,
    kycStatus: employer.kycStatus,
    ownsInternship: internship.employerId === employer.id,
  });

  // Handle result
  if (!result.allowed) {
    handleError(result.reasonCode, result.reason);
    return;
  }

  // Execute
  await updateStatus(applicationId, result.nextStatus);
}
```

### 2. Submit Application with Deadline Check

```typescript
async function submitApplication(internshipId: string) {
  const internship = await getInternship(internshipId);

  const result = executeIntent({
    intent: ApplicationIntent.SUBMIT_APPLICATION,
    actorRole: UserRole.STUDENT,
    currentStatus: ApplicationStatus.SUBMITTED,
  }, {
    internshipStatus: internship.status,
    applicationDeadline: new Date(internship.applicationDeadline),
    currentDate: new Date(),
  });

  if (!result.allowed) {
    if (result.reasonCode === DenialReasonCode.DEADLINE_EXPIRED) {
      showToast('Applications have closed', 'error');
    } else {
      showToast(result.reason, 'error');
    }
    return;
  }

  await createApplication(internshipId, result.nextStatus);
}
```

### 3. Show Available Actions (UI Buttons)

```typescript
function ApplicationActions({ application, userRole }) {
  const intents = getAvailableIntents(application.status, userRole);

  return (
    <div className="flex gap-2">
      {intents.map(({ intent, label, icon, severity }) => (
        <Button
          key={intent}
          onClick={() => handleAction(intent)}
          variant={severity === 'destructive' ? 'destructive' : 'default'}
        >
          {icon} {label}
        </Button>
      ))}
    </div>
  );
}
```

---

## Error Handling Patterns

### Pattern 1: Switch on Reason Code

```typescript
const result = executeIntent(intentContext, appContext);

if (!result.allowed) {
  switch (result.reasonCode) {
    case DenialReasonCode.MAX_APPLICANTS_REACHED:
      showToast('Position is full', 'warning');
      break;
    
    case DenialReasonCode.KYC_NOT_APPROVED:
      router.push('/employer/kyc');
      break;
    
    case DenialReasonCode.DEADLINE_EXPIRED:
      showToast('Applications closed', 'error');
      break;
    
    default:
      showToast(result.reason, 'error');
  }
}
```

### Pattern 2: Use Pre-Defined Messages

```typescript
if (!result.allowed) {
  const message = result.reasonCode 
    ? DENIAL_REASON_MESSAGES[result.reasonCode]
    : result.reason;
  
  showToast(message, 'error');
}
```

### Pattern 3: Redirect on Specific Errors

```typescript
const errorActions = {
  [DenialReasonCode.KYC_NOT_APPROVED]: () => router.push('/employer/kyc'),
  [DenialReasonCode.KYC_PENDING]: () => router.push('/employer/kyc-status'),
  [DenialReasonCode.NOT_OWNER]: () => router.push('/employer/internships'),
};

if (!result.allowed && result.reasonCode in errorActions) {
  showToast(result.reason, 'error');
  errorActions[result.reasonCode]();
}
```

---

## Backend Validation (NestJS)

```typescript
@Post(':id/accept')
async acceptCandidate(
  @Param('id') id: string,
  @CurrentUser() user: User
) {
  const app = await this.appsService.findOne(id);
  const internship = await this.internshipsService.findOne(app.internshipId);
  const acceptedCount = await this.appsService.countAccepted(internship.id);

  const result = executeIntent({
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    actorRole: UserRole.EMPLOYER,
    currentStatus: app.status,
  }, {
    internshipStatus: internship.status,
    maxApplicants: internship.maxApplicants,
    acceptedCount,
    kycStatus: user.kycStatus,
    ownsInternship: internship.employerId === user.id,
  });

  if (!result.allowed) {
    throw new BadRequestException({
      message: result.reason,
      code: result.reasonCode,
    });
  }

  return this.appsService.update(id, { status: result.nextStatus });
}
```

---

## Testing

```typescript
describe('Accept Candidate', () => {
  it('should allow when capacity available', () => {
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

  it('should deny when capacity full', () => {
    const result = executeIntent({
      intent: ApplicationIntent.ACCEPT_CANDIDATE,
      actorRole: UserRole.EMPLOYER,
      currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
    }, {
      maxApplicants: 10,
      acceptedCount: 10, // Full
      kycStatus: KYCStatus.APPROVED,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe(DenialReasonCode.MAX_APPLICANTS_REACHED);
  });
});
```

---

## Business Rules Reference

| Rule | Validated Field | Denial Code |
|------|----------------|-------------|
| Internship must be published | `internshipStatus` | `INTERNSHIP_DRAFT` / `INTERNSHIP_CLOSED` |
| Deadline not passed | `applicationDeadline`, `currentDate` | `DEADLINE_EXPIRED` |
| Capacity not exceeded | `maxApplicants`, `acceptedCount` | `MAX_APPLICANTS_REACHED` |
| Application not withdrawn | `isWithdrawn` | `ALREADY_WITHDRAWN` |
| KYC must be approved | `kycStatus` | `KYC_NOT_APPROVED` / `KYC_PENDING` / `KYC_REJECTED` |
| Must own internship | `ownsInternship` | `NOT_OWNER` |
| Must own application | `ownsApplication` | `NOT_OWNER` |

---

## Optional Context Fields

All context fields are **optional**. Only provide the ones you need:

```typescript
// Minimal context (just check KYC)
const result = executeIntent(intentContext, {
  kycStatus: employer.kycStatus,
});

// Full context (all business rules)
const result = executeIntent(intentContext, {
  internshipStatus: internship.status,
  applicationDeadline: new Date(internship.applicationDeadline),
  currentDate: new Date(),
  maxApplicants: internship.maxApplicants,
  acceptedCount: acceptedCount,
  kycStatus: employer.kycStatus,
  isWithdrawn: application.status === ApplicationStatus.WITHDRAWN,
  ownsInternship: internship.employerId === employer.id,
  ownsApplication: application.studentId === student.id,
});
```

---

## Backward Compatibility

The context parameter is **optional**. Existing code works without changes:

```typescript
// Old code (still works)
const result = executeIntent({
  intent: ApplicationIntent.SHORTLIST_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.SUBMITTED,
});
// Only validates: role + status transition

// New code (context-aware)
const result = executeIntent({
  intent: ApplicationIntent.SHORTLIST_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.SUBMITTED,
}, {
  kycStatus: KYCStatus.APPROVED,
  ownsInternship: true,
});
// Validates: role + business rules + status transition
```

---

## Migration Path

### Step 1: Add Basic Context
Start with just KYC validation:

```typescript
const result = executeIntent(intentContext, {
  kycStatus: employer.kycStatus,
});
```

### Step 2: Add Deadline Validation
For student submissions:

```typescript
const result = executeIntent(intentContext, {
  internshipStatus: internship.status,
  applicationDeadline: new Date(internship.applicationDeadline),
  currentDate: new Date(),
});
```

### Step 3: Add Capacity Validation
For acceptance actions:

```typescript
const result = executeIntent(intentContext, {
  maxApplicants: internship.maxApplicants,
  acceptedCount: acceptedCount,
  kycStatus: employer.kycStatus,
});
```

### Step 4: Full Context
Add all fields for comprehensive validation.

---

## Next Steps

1. **Read the Documentation**
   - [README.md](README.md) - Architecture overview
   - [EXAMPLES.md](EXAMPLES.md) - Real-world usage examples
   - [IMPLEMENTATION.md](IMPLEMENTATION.md) - Technical details

2. **Try It Out**
   - Update one component to use context validation
   - Test with different scenarios (deadline passed, capacity full, etc.)
   - Handle errors with reason codes

3. **Integrate Backend**
   - Use same validation in NestJS controllers
   - Return structured errors with reason codes
   - Track denial reasons in analytics

4. **Extend**
   - Add custom business rules
   - Add new context fields
   - Implement advanced validation

---

## Getting Help

- Check [EXAMPLES.md](EXAMPLES.md) for comprehensive examples
- Read [README.md](README.md) for architecture details
- Review [IMPLEMENTATION.md](IMPLEMENTATION.md) for technical specs
- Look at [types.ts](types.ts), [intents.ts](intents.ts), [context.ts](context.ts) for type definitions

---

## Summary

✅ **Import** from `@/domain/application`  
✅ **Call** `executeIntent(intentContext, appContext?)`  
✅ **Check** `result.allowed`  
✅ **Handle** errors with `result.reasonCode`  
✅ **Execute** with `result.nextStatus`  

That's it! You now have context-aware, business-rule driven workflow validation. 🎉
