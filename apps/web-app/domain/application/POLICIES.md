# Policy Layer & Decision Trace - Documentation

## Overview

Extended the application workflow engine with two powerful new capabilities:

1. **Policy Layer** - Higher-level business rules for strategic constraints
2. **Decision Trace** - Detailed audit trail of all validation steps

Both features are **100% backward compatible** - existing code works without changes.

---

## 1. Policy Layer

### What Are Policies?

Policies are **higher-level business rules** that enforce:
- Strategic decisions (e.g., hiring limits)
- Compliance requirements (e.g., KYC verification)
- Risk mitigation (e.g., low match score warnings)
- Operational constraints (e.g., business hours restrictions)

**Policies vs Business Rules:**

| Aspect | Business Rules | Policies |
|--------|----------------|----------|
| Level | Data validation | Strategic constraints |
| Examples | Deadline passed, capacity full | Time restrictions, company limits |
| Timing | Before policies | After business rules |
| Override | Cannot be bypassed | Can be disabled/configured |

### Built-In Policies

#### 1. TIME_RESTRICTION_POLICY
**What:** Restricts employer actions to business hours (6 AM - 11 PM)

**Why:** 
- Prevents late-night impulsive decisions
- Reduces risk of errors during off-hours
- Ensures important decisions are made during business hours

**Applies to:** All employer intents (except ADMIN_OVERRIDE)

**Example:**
```typescript
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
}, {
  currentDate: new Date('2024-01-15T02:00:00'), // 2 AM
  kycStatus: KYCStatus.APPROVED,
});

// Result:
// {
//   allowed: false,
//   reason: 'Employer actions are only allowed during business hours (6 AM - 11 PM).',
// }
```

#### 2. COMPANY_HIRING_LIMIT_POLICY
**What:** Enforces global hiring limit across all company internships

**Why:**
- Prevents over-hiring beyond company capacity
- Budget management
- Resource allocation control

**Applies to:** ACCEPT_CANDIDATE only

**Context fields needed:**
- `companyAcceptedCount` - Total accepted across all internships
- `companyHiringLimit` - Company-wide limit

**Example:**
```typescript
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
}, {
  companyAcceptedCount: 50,
  companyHiringLimit: 50, // Limit reached!
  kycStatus: KYCStatus.APPROVED,
});

// Result:
// {
//   allowed: false,
//   reason: 'Your company has reached its hiring limit of 50 interns.',
// }
```

#### 3. HIGH_RISK_APPLICATION_POLICY
**What:** Warns when accepting candidates with low match scores (< 60%)

**Why:**
- Reduces risk of poor candidate-internship fit
- Encourages employers to focus on better matches
- Quality over quantity

**Applies to:** ACCEPT_CANDIDATE only

**Type:** Soft policy (warns but doesn't block)

**Example:**
```typescript
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
}, {
  matchScore: 45, // Low match score
  kycStatus: KYCStatus.APPROVED,
});

// Result:
// {
//   allowed: true, // Still allowed!
//   reason: 'Warning: Low match score (45%). This candidate may not be an ideal fit.',
//   metadata: {
//     isWarning: true,
//     matchScore: 45,
//     threshold: 60,
//     recommendation: 'Consider reviewing candidate qualifications before accepting.'
//   }
// }
```

#### 4. ADMIN_OVERRIDE_POLICY
**What:** Allows admins to bypass all policy restrictions

**Why:**
- Emergency override capability
- Handle exceptional cases
- Support and customer service scenarios

**Applies to:** All intents when actor is ADMIN

**Priority:** 1000 (highest - evaluated first)

**Example:**
```typescript
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.ADMIN, // Admin!
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
}, {
  currentDate: new Date('2024-01-15T02:00:00'), // 2 AM (normally blocked)
  kycStatus: KYCStatus.NOT_SUBMITTED, // No KYC (normally blocked)
});

// Result:
// {
//   allowed: true, // Admin bypasses all policies!
//   nextStatus: ApplicationStatus.ACCEPTED,
// }
```

#### 5. WEEKEND_RESTRICTION_POLICY (Disabled by Default)
**What:** Restricts acceptance/rejection on weekends

**Why:**
- Ensures important decisions are made during weekdays
- Prevents weekend impulsive decisions
- Aligns with support team availability

**Enabled:** `false` (must be enabled manually)

**Example:**
```typescript
import { WEEKEND_RESTRICTION_POLICY } from '@/domain/application';

// Enable the policy
WEEKEND_RESTRICTION_POLICY.enabled = true;

const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
}, {
  currentDate: new Date('2024-01-20'), // Saturday
  kycStatus: KYCStatus.APPROVED,
});

// Result:
// {
//   allowed: false,
//   reason: 'Candidate acceptance and rejection actions are not allowed on weekends. Please try again on a weekday.',
// }
```

---

## 2. Decision Trace

### What Is Decision Trace?

Decision trace is a **detailed audit trail** showing all validation layers evaluated during intent execution.

**Use cases:**
- 🐛 **Debugging** - Understand why an intent was denied
- 📊 **Audit logging** - Track decision-making process
- 🧪 **Testing** - Verify all validation layers work correctly
- 📈 **Analytics** - Analyze common denial reasons

### How to Enable

Add `enableTrace: true` to the intent context:

```typescript
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
  enableTrace: true, // 👈 Enable trace
}, {
  internshipStatus: InternshipStatus.CLOSED,
  kycStatus: KYCStatus.APPROVED,
});

console.log(result.trace);
// [
//   { layer: 'permission', result: true },
//   { layer: 'business_rule', result: false, ruleId: 'INTERNSHIP_CLOSED', reason: '...' },
//   { layer: 'policy', result: true, ruleId: 'TIME_RESTRICTION' },
//   ...
// ]
```

### Trace Layers

Decision trace includes 5 validation layers:

1. **permission** - Role has permission to perform intent
2. **business_rule** - Business rules (deadline, capacity, KYC)
3. **policy** - Policy evaluation (time restrictions, company limits)
4. **terminal_check** - Application not in terminal status
5. **transition** - State machine transition is valid

### Trace Entry Structure

```typescript
interface TraceEntry {
  /** Validation layer name */
  layer: 'permission' | 'business_rule' | 'policy' | 'terminal_check' | 'transition';
  
  /** Result of this validation layer */
  result: boolean;
  
  /** Rule or policy ID (if applicable) */
  ruleId?: string;
  
  /** Reason for failure (if result is false) */
  reason?: string;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}
```

### Example: Complete Trace

```typescript
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
  enableTrace: true,
}, {
  internshipStatus: InternshipStatus.PUBLISHED,
  maxApplicants: 10,
  acceptedCount: 5,
  kycStatus: KYCStatus.APPROVED,
  currentDate: new Date('2024-01-15T14:00:00'), // 2 PM
});

// result.trace:
[
  {
    layer: 'permission',
    result: true,
    metadata: {
      allowedRoles: ['EMPLOYER', 'ADMIN'],
      actorRole: 'EMPLOYER'
    }
  },
  {
    layer: 'business_rule',
    result: true, // All business rules passed
  },
  {
    layer: 'policy',
    result: true,
    ruleId: 'ADMIN_OVERRIDE',
    metadata: { adminOverride: false }
  },
  {
    layer: 'policy',
    result: true,
    ruleId: 'TIME_RESTRICTION',
    metadata: { currentHour: 14, businessHoursStart: 6, businessHoursEnd: 23 }
  },
  {
    layer: 'policy',
    result: true,
    ruleId: 'COMPANY_HIRING_LIMIT',
  },
  {
    layer: 'policy',
    result: true,
    ruleId: 'HIGH_RISK_APPLICATION',
  },
  {
    layer: 'terminal_check',
    result: true,
    metadata: { currentStatus: 'INTERVIEW_SCHEDULED', isTerminal: false }
  },
  {
    layer: 'transition',
    result: true,
    metadata: {
      currentStatus: 'INTERVIEW_SCHEDULED',
      nextStatus: 'ACCEPTED',
      allowedTransitions: ['ACCEPTED', 'REJECTED']
    }
  }
]
```

### Trace on Denial

When an intent is denied, the trace shows which layer failed:

```typescript
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
  enableTrace: true,
}, {
  currentDate: new Date('2024-01-15T02:00:00'), // 2 AM - outside business hours
  kycStatus: KYCStatus.APPROVED,
});

// result.trace:
[
  { layer: 'permission', result: true },
  { layer: 'business_rule', result: true },
  {
    layer: 'policy',
    result: false, // ❌ Failed here!
    ruleId: 'TIME_RESTRICTION',
    reason: 'Employer actions are only allowed during business hours (6 AM - 11 PM).',
    metadata: { currentHour: 2, businessHoursStart: 6, businessHoursEnd: 23 }
  }
  // Evaluation stops after first failure
]
```

---

## 3. Usage Examples

### Example 1: Basic Policy Usage (No Trace)

```typescript
import { executeIntent, ApplicationIntent, UserRole } from '@/domain/application';

const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
}, {
  companyAcceptedCount: 45,
  companyHiringLimit: 50,
  kycStatus: KYCStatus.APPROVED,
});

if (result.allowed) {
  await updateApplicationStatus(appId, result.nextStatus);
} else {
  showToast(result.reason, 'error');
}
```

### Example 2: With Decision Trace (Debugging)

```typescript
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
  enableTrace: true, // 👈 Enable trace for debugging
}, {
  currentDate: new Date(),
  kycStatus: KYCStatus.APPROVED,
});

if (!result.allowed) {
  console.error('Intent denied:', result.reason);
  console.log('Validation trace:');
  result.trace?.forEach((entry, i) => {
    const status = entry.result ? '✅' : '❌';
    console.log(`  ${i + 1}. ${status} ${entry.layer}${entry.ruleId ? ` (${entry.ruleId})` : ''}`);
    if (entry.reason) {
      console.log(`     Reason: ${entry.reason}`);
    }
  });
}
```

### Example 3: Custom Policies

```typescript
import { Policy, executeIntent, DEFAULT_POLICIES } from '@/domain/application';

// Define custom policy
const CUSTOM_POLICY: Policy = {
  id: 'CUSTOM_POLICY',
  description: 'Custom business rule',
  appliesToIntent: [ApplicationIntent.ACCEPT_CANDIDATE],
  enabled: true,
  priority: 85,
  
  evaluate(intent, actorRole, currentStatus, context) {
    // Your custom logic here
    if (context?.customField === 'blocked') {
      return {
        allowed: false,
        reason: 'Custom policy violation',
      };
    }
    return { allowed: true };
  },
};

// Use custom policies
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
  policies: [...DEFAULT_POLICIES, CUSTOM_POLICY], // Add custom policy
}, {
  customField: 'allowed',
  kycStatus: KYCStatus.APPROVED,
});
```

### Example 4: Disable Specific Policies

```typescript
import { DEFAULT_POLICIES, TIME_RESTRICTION_POLICY } from '@/domain/application';

// Disable time restriction policy
TIME_RESTRICTION_POLICY.enabled = false;

const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
}, {
  currentDate: new Date('2024-01-15T02:00:00'), // 2 AM - now allowed!
  kycStatus: KYCStatus.APPROVED,
});
```

### Example 5: Production Logging with Trace

```typescript
async function acceptCandidate(applicationId: string) {
  const isDev = process.env.NODE_ENV === 'development';
  
  const result = executeIntent({
    intent: ApplicationIntent.ACCEPT_CANDIDATE,
    actorRole: UserRole.EMPLOYER,
    currentStatus: application.status,
    enableTrace: isDev, // Only in development
  }, {
    companyAcceptedCount: await getCompanyAcceptedCount(),
    companyHiringLimit: company.hiringLimit,
    kycStatus: employer.kycStatus,
    currentDate: new Date(),
  });

  // Log to monitoring service
  if (!result.allowed) {
    logger.warn('Intent denied', {
      intent: 'ACCEPT_CANDIDATE',
      reason: result.reason,
      reasonCode: result.reasonCode,
      trace: isDev ? result.trace : undefined, // Include trace in dev
    });
  }

  return result;
}
```

---

## 4. API Reference

### Policy Interface

```typescript
interface Policy {
  id: string;
  description: string;
  appliesToIntent?: ApplicationIntent[];
  appliesToRole?: UserRole[];
  enabled: boolean;
  priority: number;
  
  evaluate(
    intent: ApplicationIntent,
    actorRole: UserRole,
    currentStatus: ApplicationStatus,
    context?: ApplicationContext,
    currentDate?: Date
  ): PolicyResult;
}
```

### Policy Result

```typescript
interface PolicyResult {
  allowed: boolean;
  reason?: string;
  reasonCode?: DenialReasonCode;
  metadata?: Record<string, unknown>;
}
```

### Intent Context (Extended)

```typescript
interface IntentContext {
  intent: ApplicationIntent;
  actorRole: UserRole;
  currentStatus: ApplicationStatus;
  targetStatus?: ApplicationStatus;
  enableTrace?: boolean; // 👈 NEW: Enable decision trace
  policies?: Policy[];   // 👈 NEW: Custom policies
}
```

### Intent Result (Extended)

```typescript
interface IntentResult {
  allowed: boolean;
  nextStatus?: ApplicationStatus;
  reason?: string;
  reasonCode?: DenialReasonCode;
  metadata?: { ... };
  trace?: TraceEntry[]; // 👈 NEW: Decision trace
}
```

### Application Context (Extended)

```typescript
interface ApplicationContext {
  // ... existing fields ...
  companyAcceptedCount?: number; // 👈 NEW: For COMPANY_HIRING_LIMIT_POLICY
  companyHiringLimit?: number;   // 👈 NEW: For COMPANY_HIRING_LIMIT_POLICY
}
```

---

## 5. Backward Compatibility

✅ **100% backward compatible**

All existing code works without changes:

```typescript
// Old code (still works perfectly)
const result = executeIntent({
  intent: ApplicationIntent.SHORTLIST_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.SUBMITTED,
});

// Result: { allowed: true, nextStatus: 'SHORTLISTED' }
// No trace field (unless enableTrace: true)
// Uses DEFAULT_POLICIES (unless custom policies provided)
```

---

## 6. Best Practices

### When to Enable Trace

✅ **Enable trace when:**
- Debugging workflow issues
- Writing tests
- Development environment
- Audit logging requirements

❌ **Don't enable trace when:**
- Production (unless needed for specific audit)
- High-volume API endpoints
- Performance-critical paths

### Policy Priority

Policies are evaluated in priority order (highest first):

- **1000+** - Override policies (e.g., ADMIN_OVERRIDE)
- **100-900** - Operational policies (e.g., TIME_RESTRICTION)
- **50-99** - Warning policies (e.g., HIGH_RISK_APPLICATION)
- **1-49** - Low priority policies

### Custom Policies

When creating custom policies:

1. Choose appropriate priority
2. Set clear `appliesToIntent` and `appliesToRole`
3. Return user-friendly error messages
4. Include metadata for debugging
5. Make it toggleable with `enabled` flag

---

## 7. Migration Guide

### Step 1: Start Using Policies (No Code Changes)

Policies are enabled by default. No changes needed!

### Step 2: Add Company Hiring Limit

Update your application context to include company-wide counts:

```typescript
const result = executeIntent(intentContext, {
  // ... existing fields ...
  companyAcceptedCount: await getCompanyAcceptedCount(employerId),
  companyHiringLimit: company.hiringLimit,
});
```

### Step 3: Enable Trace for Debugging

Add `enableTrace: true` when debugging issues:

```typescript
const result = executeIntent({
  ...intentContext,
  enableTrace: true, // 👈 Add this
}, appContext);

console.log(result.trace); // See all validation steps
```

### Step 4: Customize Policies (Optional)

Disable/enable policies as needed:

```typescript
import { TIME_RESTRICTION_POLICY } from '@/domain/application';

// Disable time restrictions (e.g., for 24/7 operations)
TIME_RESTRICTION_POLICY.enabled = false;
```

---

## Summary

✅ **Policy Layer** - 5 built-in policies enforcing strategic constraints  
✅ **Decision Trace** - Detailed audit trail of all validation steps  
✅ **Backward Compatible** - Existing code works without changes  
✅ **Configurable** - Enable/disable policies as needed  
✅ **Extensible** - Add custom policies easily  
✅ **Production Ready** - Zero compilation errors

The workflow engine now has enterprise-grade policy enforcement and comprehensive decision tracing! 🎉
