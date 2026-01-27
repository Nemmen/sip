# Policy Layer & Decision Trace - Quick Reference

## 🚀 Quick Start

### Enable Policies (Automatic)
Policies are **enabled by default**. No code changes needed!

```typescript
import { executeIntent } from '@/domain/application';

// Policies automatically evaluated
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
}, {
  companyAcceptedCount: 45,
  companyHiringLimit: 50,
  kycStatus: KYCStatus.APPROVED,
  currentDate: new Date(), // TIME_RESTRICTION_POLICY checks this
});
```

### Enable Decision Trace
Add `enableTrace: true` for debugging:

```typescript
const result = executeIntent({
  intent: ApplicationIntent.ACCEPT_CANDIDATE,
  actorRole: UserRole.EMPLOYER,
  currentStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
  enableTrace: true, // 👈 Enable trace
}, appContext);

console.log(result.trace); // See all validation steps
```

---

## 📋 Built-In Policies

| Policy | What It Does | When It Blocks |
|--------|--------------|----------------|
| **TIME_RESTRICTION** | Business hours only | Employer actions outside 6 AM - 11 PM |
| **COMPANY_HIRING_LIMIT** | Global hiring cap | Company reached hiring limit |
| **HIGH_RISK_APPLICATION** | Low match warning | Match score < 60% (warning only) |
| **ADMIN_OVERRIDE** | Admin bypass | Never (admins always allowed) |
| **WEEKEND_RESTRICTION** | Weekday only | Weekend acceptance/rejection (disabled by default) |

---

## 💡 Common Use Cases

### 1. Check Business Hours
```typescript
const result = executeIntent(intentContext, {
  currentDate: new Date(), // TIME_RESTRICTION_POLICY checks hour
  kycStatus: KYCStatus.APPROVED,
});
```

### 2. Enforce Company Hiring Limit
```typescript
const result = executeIntent(intentContext, {
  companyAcceptedCount: await getCompanyTotal(employerId),
  companyHiringLimit: company.hiringLimit,
  kycStatus: KYCStatus.APPROVED,
});
```

### 3. Warn on Low Match Score
```typescript
const result = executeIntent(intentContext, {
  matchScore: 55, // Below 60% threshold
  kycStatus: KYCStatus.APPROVED,
});

if (result.allowed && result.reason?.includes('Warning')) {
  showWarning(result.reason); // Display warning to user
}
```

### 4. Debug with Trace
```typescript
const result = executeIntent({
  ...intentContext,
  enableTrace: true,
}, appContext);

if (!result.allowed) {
  const failedLayer = result.trace?.find(t => !t.result);
  console.log('Failed at:', failedLayer?.layer, failedLayer?.reason);
}
```

### 5. Disable Policy Temporarily
```typescript
import { TIME_RESTRICTION_POLICY } from '@/domain/application';

TIME_RESTRICTION_POLICY.enabled = false; // Disable
const result = executeIntent(intentContext, appContext);
TIME_RESTRICTION_POLICY.enabled = true; // Re-enable
```

### 6. Custom Policy
```typescript
const MY_POLICY: Policy = {
  id: 'MY_POLICY',
  description: 'My custom rule',
  enabled: true,
  priority: 85,
  evaluate: (intent, actorRole, status, context) => {
    if (context?.myField === 'blocked') {
      return { allowed: false, reason: 'Custom block' };
    }
    return { allowed: true };
  },
};

const result = executeIntent({
  ...intentContext,
  policies: [...DEFAULT_POLICIES, MY_POLICY],
}, appContext);
```

---

## 🔍 Decision Trace Layers

When `enableTrace: true`, you get:

```javascript
result.trace = [
  { layer: 'permission', result: true },      // 1. Role check
  { layer: 'business_rule', result: true },   // 2. Business rules
  { layer: 'policy', result: true, ruleId: 'TIME_RESTRICTION' }, // 3. Policies
  { layer: 'terminal_check', result: true },  // 4. Terminal status
  { layer: 'transition', result: true },      // 5. State machine
];
```

---

## ⚙️ Configuration

### Disable a Policy
```typescript
import { TIME_RESTRICTION_POLICY } from '@/domain/application';
TIME_RESTRICTION_POLICY.enabled = false;
```

### Change Priority
```typescript
import { HIGH_RISK_APPLICATION_POLICY } from '@/domain/application';
HIGH_RISK_APPLICATION_POLICY.priority = 200; // Higher priority
```

### Conditional Trace (Dev Only)
```typescript
const isDev = process.env.NODE_ENV === 'development';

const result = executeIntent({
  ...intentContext,
  enableTrace: isDev, // Only in development
}, appContext);
```

---

## 📖 Documentation

- **POLICIES.md** - Full policy documentation (700+ lines)
- **POLICY_IMPLEMENTATION.md** - Implementation summary
- **QUICKSTART.md** - General workflow quick start
- **EXAMPLES.md** - Comprehensive examples
- **README.md** - Architecture overview

---

## 🎯 Key Points

✅ Policies run **after** business rules, **before** status transition  
✅ Evaluated in **priority order** (highest first)  
✅ **First blocking policy** stops evaluation  
✅ Warnings (metadata.isWarning) **don't block**  
✅ Admins **bypass all policies** (ADMIN_OVERRIDE_POLICY)  
✅ Trace is **optional** (only included if enableTrace: true)  
✅ **100% backward compatible** (no breaking changes)

---

## 🆘 Troubleshooting

### "Why was my intent denied?"
Enable trace to see which layer failed:
```typescript
const result = executeIntent({ ...intentContext, enableTrace: true }, appContext);
console.log(result.trace?.find(t => !t.result)); // Find failed layer
```

### "How do I bypass time restrictions?"
Either:
1. Disable the policy: `TIME_RESTRICTION_POLICY.enabled = false`
2. Use admin role: `actorRole: UserRole.ADMIN`

### "How do I add a custom policy?"
```typescript
const MY_POLICY: Policy = { /* ... */ };
executeIntent({ ...intentContext, policies: [...DEFAULT_POLICIES, MY_POLICY] }, appContext);
```

### "Trace not showing?"
Make sure `enableTrace: true` in IntentContext:
```typescript
executeIntent({ ...intentContext, enableTrace: true }, appContext);
```

---

## 🚦 Status

- ✅ **Production Ready** - Zero compilation errors
- ✅ **Backward Compatible** - No breaking changes
- ✅ **Fully Documented** - 1,400+ lines of docs
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Tested** - All validation layers working

---

That's it! You now have enterprise-grade policy enforcement and decision tracing. 🎉

For full documentation, see [POLICIES.md](POLICIES.md).
