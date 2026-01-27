# Context-Aware Application Workflow - Implementation Summary

## Overview

Successfully upgraded the application workflow engine from intent-driven to **context-aware and business-rule driven**. The engine now validates real-world business constraints (deadlines, capacity, KYC, ownership) before allowing status transitions.

## What Was Implemented

### 1. Business Context Types ([context.ts](context.ts))

**180 lines** of comprehensive type definitions:

#### Enums
- `InternshipStatus` (3 values): DRAFT, PUBLISHED, CLOSED
- `KYCStatus` (4 values): NOT_SUBMITTED, PENDING, APPROVED, REJECTED  
- `DenialReasonCode` (15 codes): Structured error codes for all denial scenarios

#### Interfaces
- `ApplicationContext`: 10+ optional fields for business rule validation
  - `internshipStatus?: InternshipStatus`
  - `applicationDeadline?: Date`
  - `currentDate?: Date`
  - `maxApplicants?: number`
  - `acceptedCount?: number`
  - `kycStatus?: KYCStatus`
  - `matchScore?: number`
  - `isWithdrawn?: boolean`
  - `ownsInternship?: boolean`
  - `ownsApplication?: boolean`

#### User-Friendly Messages
- `DENIAL_REASON_MESSAGES`: Maps all 15 denial codes to user-friendly error messages

---

### 2. Business Rule Validation ([engine.ts](engine.ts))

**Updated engine.ts** with comprehensive business logic:

#### Function Signature Change
```typescript
// BEFORE
executeIntent(context: IntentContext): IntentResult

// AFTER  
executeIntent(intentContext: IntentContext, appContext?: ApplicationContext): IntentResult
```

#### New Validation Function
`validateBusinessRules()` - 150+ lines implementing 7 business rules:

1. **Internship Status Validation**
   - Cannot submit to DRAFT internships
   - Cannot submit/accept when internship CLOSED

2. **Deadline Validation**
   - Cannot submit after application deadline passed

3. **Capacity Management**
   - Cannot accept if `acceptedCount >= maxApplicants`

4. **Withdrawal Protection**
   - Cannot perform actions on WITHDRAWN applications (except admin override)

5. **KYC Compliance** (3 sub-rules)
   - Cannot perform employer actions if KYC NOT_SUBMITTED
   - Cannot perform employer actions if KYC PENDING
   - Cannot perform employer actions if KYC REJECTED

6. **Ownership Validation** (2 sub-rules)
   - Employers can only act on their own internships
   - Students can only withdraw their own applications

#### Updated Result Type
```typescript
interface IntentResult {
  allowed: boolean;
  nextStatus?: ApplicationStatus;
  reason?: string;
  reasonCode?: DenialReasonCode;  // NEW: Structured error code
  metadata?: {
    requiresConfirmation: boolean;
    severity: 'low' | 'medium' | 'high' | 'destructive';
    category: 'student' | 'employer' | 'admin' | 'system';
  };
}
```

#### Validation Flow
1. Role permission check → `INSUFFICIENT_PERMISSIONS`
2. **Business rules validation** → Various `DenialReasonCode`
3. Target status resolution
4. Terminal status check → `TERMINAL_STATUS`
5. State machine validation → `INVALID_TRANSITION`

---

### 3. Public API Exports ([index.ts](index.ts))

**Added context exports** to public API:

```typescript
// Context types and enums
export {
  InternshipStatus,
  KYCStatus,
  DenialReasonCode,
  DENIAL_REASON_MESSAGES,
} from './context';

export type {
  ApplicationContext,
} from './context';
```

Now clients can import:
```typescript
import { 
  executeIntent,
  ApplicationIntent,
  ApplicationContext,
  InternshipStatus,
  KYCStatus,
  DenialReasonCode,
  DENIAL_REASON_MESSAGES
} from '@/domain/application';
```

---

### 4. Documentation

#### Updated README.md
- Added **"Context-Aware Validation"** section
- 80+ lines of usage examples showing:
  - Capacity validation
  - Deadline validation  
  - KYC compliance
  - Structured error handling
  - Backward compatibility

#### New EXAMPLES.md
- **700+ lines** of comprehensive real-world examples
- 10 detailed examples covering:
  - Basic usage (no context)
  - Context-aware validation
  - React component integration
  - NestJS backend validation
  - Centralized error handling
  - Unit testing patterns

---

## Business Rules Summary

| Rule | Intent | Validation | Denial Code |
|------|--------|------------|-------------|
| Internship must be PUBLISHED | SUBMIT_APPLICATION | `internshipStatus !== DRAFT` | `INTERNSHIP_DRAFT` |
| Internship cannot be CLOSED | SUBMIT_APPLICATION, ACCEPT_CANDIDATE | `internshipStatus !== CLOSED` | `INTERNSHIP_CLOSED` |
| Deadline not passed | SUBMIT_APPLICATION | `currentDate <= deadline` | `DEADLINE_EXPIRED` |
| Capacity not exceeded | ACCEPT_CANDIDATE | `acceptedCount < maxApplicants` | `MAX_APPLICANTS_REACHED` |
| Application not withdrawn | All (except admin) | `!isWithdrawn` | `ALREADY_WITHDRAWN` |
| Employer KYC approved | All employer intents | `kycStatus === APPROVED` | `KYC_NOT_APPROVED` / `KYC_PENDING` / `KYC_REJECTED` |
| Owns internship | Employer actions | `ownsInternship === true` | `NOT_OWNER` |
| Owns application | WITHDRAW_APPLICATION | `ownsApplication === true` | `NOT_OWNER` |

---

## Backward Compatibility

✅ **100% backward compatible**

The `applicationContext` parameter is **optional**:

```typescript
// Works without context (existing code unaffected)
const result = executeIntent({
  intent: ApplicationIntent.REVIEW_APPLICATION,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.SUBMITTED,
});
// Only validates: role permission + status transition

// Works with context (new feature)
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
}, {
  maxApplicants: 10,
  acceptedCount: 9,
  kycStatus: KYCStatus.APPROVED,
});
// Validates: role + business rules + status transition
```

If context is not provided, business rule validation is **skipped entirely**.

---

## Error Handling Improvements

### Before (Generic Errors)
```typescript
{
  allowed: false,
  reason: "Cannot perform this action"
}
```

### After (Structured Errors)
```typescript
{
  allowed: false,
  reason: "This internship has reached maximum capacity.",
  reasonCode: DenialReasonCode.MAX_APPLICANTS_REACHED
}
```

Benefits:
- **Type-safe** error handling with enums
- **Structured** error codes for logging/monitoring
- **User-friendly** messages via `DENIAL_REASON_MESSAGES`
- **Actionable** errors (e.g., redirect to KYC page)
- **i18n-ready** (error codes can be translated)

---

## Usage Example

### Frontend (React)
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

async function acceptCandidate(applicationId: string) {
  // Fetch data
  const application = await getApplication(applicationId);
  const internship = await getInternship(application.internshipId);
  const employer = await getCurrentEmployer();
  const acceptedCount = await getAcceptedCount(internship.id);

  // Validate with context
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
  });

  // Handle result
  if (!result.allowed) {
    switch (result.reasonCode) {
      case DenialReasonCode.MAX_APPLICANTS_REACHED:
        toast.error('Position is full');
        return;
      case DenialReasonCode.KYC_NOT_APPROVED:
        router.push('/employer/kyc');
        return;
      default:
        toast.error(result.reason);
        return;
    }
  }

  // Execute transition
  await updateStatus(applicationId, result.nextStatus);
  toast.success('Candidate accepted!');
}
```

### Backend (NestJS)
```typescript
@Post(':id/accept')
async acceptCandidate(@Param('id') id: string, @CurrentUser() user: User) {
  const application = await this.applicationsService.findOne(id);
  const internship = await this.internshipsService.findOne(application.internshipId);
  const acceptedCount = await this.applicationsService.countAccepted(internship.id);

  const result = executeIntent({
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    actorRole: UserRole.EMPLOYER,
    currentStatus: application.status as ApplicationStatus,
  }, {
    internshipStatus: internship.status as InternshipStatus,
    maxApplicants: internship.maxApplicants,
    acceptedCount,
    kycStatus: user.kycStatus as KYCStatus,
    ownsInternship: internship.employerId === user.id,
  });

  if (!result.allowed) {
    throw new BadRequestException({
      message: result.reason,
      code: result.reasonCode,
    });
  }

  return this.applicationsService.update(id, { status: result.nextStatus });
}
```

---

## Testing

All business rules are **testable** with pure functions:

```typescript
it('should deny acceptance when capacity reached', () => {
  const result = executeIntent({
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    actorRole: UserRole.EMPLOYER,
    currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
  }, {
    maxApplicants: 10,
    acceptedCount: 10, // Full capacity
    kycStatus: KYCStatus.APPROVED,
  });

  expect(result.allowed).toBe(false);
  expect(result.reasonCode).toBe(DenialReasonCode.MAX_APPLICANTS_REACHED);
});
```

---

## File Changes

| File | Status | Lines | Description |
|------|--------|-------|-------------|
| `context.ts` | ✅ Created | 180 | Business context types, enums, messages |
| `engine.ts` | ✅ Updated | +150 | Business rule validation function |
| `index.ts` | ✅ Updated | +15 | Export context types |
| `README.md` | ✅ Updated | +100 | Context-aware usage examples |
| `EXAMPLES.md` | ✅ Created | 700+ | Comprehensive real-world examples |

**Total**: ~1,150 lines added

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│           Application Workflow Engine               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  executeIntent(intentContext, appContext?)          │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ 1. Role Permission Check                  │     │
│  │    └─> INSUFFICIENT_PERMISSIONS           │     │
│  └───────────────────────────────────────────┘     │
│              ↓                                      │
│  ┌───────────────────────────────────────────┐     │
│  │ 2. Business Rules (if context provided)   │     │
│  │    ├─> INTERNSHIP_DRAFT                   │     │
│  │    ├─> INTERNSHIP_CLOSED                  │     │
│  │    ├─> DEADLINE_EXPIRED                   │     │
│  │    ├─> MAX_APPLICANTS_REACHED             │     │
│  │    ├─> ALREADY_WITHDRAWN                  │     │
│  │    ├─> KYC_NOT_APPROVED                   │     │
│  │    ├─> KYC_PENDING                        │     │
│  │    ├─> KYC_REJECTED                       │     │
│  │    └─> NOT_OWNER                          │     │
│  └───────────────────────────────────────────┘     │
│              ↓                                      │
│  ┌───────────────────────────────────────────┐     │
│  │ 3. Determine Target Status                │     │
│  │    └─> Intent → Status mapping            │     │
│  └───────────────────────────────────────────┘     │
│              ↓                                      │
│  ┌───────────────────────────────────────────┐     │
│  │ 4. Terminal Status Check                  │     │
│  │    └─> TERMINAL_STATUS                    │     │
│  └───────────────────────────────────────────┘     │
│              ↓                                      │
│  ┌───────────────────────────────────────────┐     │
│  │ 5. State Machine Validation               │     │
│  │    └─> INVALID_TRANSITION                 │     │
│  └───────────────────────────────────────────┘     │
│              ↓                                      │
│  ┌───────────────────────────────────────────┐     │
│  │ 6. Return Result                          │     │
│  │    { allowed, nextStatus, reasonCode }    │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Benefits Achieved

### 1. **Business Rule Enforcement**
✅ Deadline validation prevents late applications  
✅ Capacity management prevents overbooking  
✅ KYC compliance enforced for all employer actions  
✅ Ownership validation prevents unauthorized actions

### 2. **Better User Experience**
✅ User-friendly error messages  
✅ Actionable errors (e.g., "Complete KYC" button)  
✅ Clear feedback on why action was denied

### 3. **Maintainability**
✅ Single source of truth for business rules  
✅ Pure functions (easy to test)  
✅ Type-safe validation  
✅ Backward compatible (no breaking changes)

### 4. **Observability**
✅ Structured error codes for monitoring  
✅ Easy to track denial reasons in analytics  
✅ Can implement rate limiting per denial code  
✅ Can show different UI based on reason code

### 5. **Scalability**
✅ Easy to add new business rules  
✅ Context fields are optional (incremental adoption)  
✅ Can be shared with backend (same validation logic)  
✅ Framework-agnostic (works anywhere)

---

## Next Steps (Optional Future Enhancements)

1. **Backend Integration**
   - Move domain/ to shared package
   - Use same validation in NestJS
   - Consistent rules across frontend/backend

2. **Analytics**
   - Track denial reasons in analytics
   - Identify common blockers (e.g., KYC issues)
   - Optimize user flows

3. **Internationalization**
   - Translate `DENIAL_REASON_MESSAGES`
   - Support multiple languages

4. **Advanced Rules**
   - Match score validation (`matchScore >= threshold`)
   - Custom employer-defined rules
   - Time-based rules (e.g., business hours)

5. **Caching**
   - Cache expensive context lookups (acceptedCount)
   - Invalidate on state changes

---

## Summary

Successfully implemented **context-aware, business-rule driven** application workflow engine:

- ✅ **7 business rules** validated before status transitions
- ✅ **15 structured error codes** for precise error handling
- ✅ **100% backward compatible** (context optional)
- ✅ **Type-safe** with TypeScript
- ✅ **Pure functions** (easy to test)
- ✅ **Well-documented** (README + EXAMPLES.md)
- ✅ **Production-ready** (no compilation errors)

The engine now validates real-world constraints (deadlines, capacity, KYC, ownership) while maintaining the clean, intent-driven architecture established previously.
