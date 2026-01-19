# Feature Priority Guide - taxbook-pro

> **Pareto Principle (80/20 Rule)**: Focus on the vital few features that deliver 80% of user value, rather than spreading effort across the trivial many.

*Generated: 2026-01-19*

## Priority Tiers

This project uses a four-tier priority system based on expected user impact:

| Tier | Description | Rollout Strategy | Examples |
|------|-------------|------------------|----------|
| **CORE** | Essential features - the 20% that delivers 80% of value | Immediate 100% rollout | Auth, main entity CRUD, dashboard |
| **HIGH_IMPACT** | Important features that significantly improve UX | Staged: 25% → 50% → 100% | Search, notifications, exports |
| **ENHANCEMENT** | Nice-to-have improvements | Gradual: 10% → 25% → 50% → 100% | Dark mode, keyboard shortcuts |
| **EXPERIMENT** | Features being validated for impact | A/B test: 10% → measure → decide | AI suggestions, new workflows |

## Why Priority Matters

### Time Investment by Tier

```
CORE (20% of features)        → 50% of development time
HIGH_IMPACT (30% of features) → 30% of development time
ENHANCEMENT (30% of features) → 15% of development time
EXPERIMENT (20% of features)  → 5% of development time
```

### Impact Distribution (Ideal)

```
CORE        → 80% of user value delivered
HIGH_IMPACT → 15% of user value delivered
ENHANCEMENT → 4% of user value delivered
EXPERIMENT  → 1% (validation phase)
```

## Project-Specific Pareto Insights

From your prep phase analysis, the following insights inform feature prioritization:

- 80% of value: booking + reminders + document upload
- 20% effort: basic availability settings cover most use cases
- Focus on tax season chaos, not year-round edge cases

Use these insights when deciding feature priorities and rollout schedules.

## Feature Flag Integration

Feature flags in this project include priority metadata:

```typescript
// Example from lib/feature-flags.ts
const FLAGS = {
  newDashboard: {
    key: 'new_dashboard',
    description: 'Enable the redesigned dashboard UI',
    enabled: true,
    percentageRollout: 25,
    priority: 'high_impact',           // Priority tier
    expectedImpact: 75,                // 0-100 impact score
    paretoRationale: 'Dashboard is the primary interface...',
  },
};
```

### Useful Functions

```typescript
import {
  getFlagsByPriority,
  getHighImpactFlags,
  getParetoAnalysis,
  suggestRolloutIncreases
} from '@/lib/feature-flags';

// Get flags grouped by tier
const { core, high_impact, enhancement, experiment } = getFlagsByPriority();

// Get top N highest-impact flags
const top5 = getHighImpactFlags(5);

// Analyze the 80/20 distribution
const { vitalFew, trivialMany, recommendations } = getParetoAnalysis();

// Get rollout increase suggestions
const suggestions = suggestRolloutIncreases();
```

## Analytics Integration

Track feature usage to validate your 80/20 assumptions:

```typescript
import { useTrack, useFlowTracker, useTaskTimer } from '@/lib/analytics';

// Track feature flag evaluations
const { trackFlagEvaluated } = useTrack();
trackFlagEvaluated('newDashboard', true, 'high_impact', 75);

// Track critical flow completion
const checkout = useFlowTracker('checkout', 'Checkout Flow', 'core');
checkout.stepCompleted('cart');
checkout.stepCompleted('payment');
checkout.complete(true);

// Measure time on task
const { startTask, endTask } = useTaskTimer();
startTask('edit-profile', 'Edit Profile');
// ... user interaction ...
endTask('edit-profile', true);
```

## Decision Framework

### When to Add a Feature

Ask these questions in order:

1. **Is this CORE?** Does it directly enable the main user goal?
   - If YES → Build it, 100% rollout
   - If NO → Continue...

2. **Is this HIGH_IMPACT?** Will >50% of users benefit significantly?
   - If YES → Build it, staged rollout
   - If NO → Continue...

3. **Is this ENHANCEMENT?** Will it improve UX for power users?
   - If YES → Build it, gradual rollout, lower priority
   - If NO → Continue...

4. **Should this be EXPERIMENT?** Are we uncertain about impact?
   - If YES → Build minimal version, A/B test
   - If NO → Don't build it (yet)

### When to Increase Rollout

| Signal | Action |
|--------|--------|
| No errors, good engagement | Increase rollout by tier's increment |
| Mixed feedback | Hold at current percentage, gather data |
| Negative impact on metrics | Rollback or reduce rollout |
| Experiment validated | Promote to appropriate tier |

### When to Remove a Feature

Consider removal if:
- Usage is <5% of expected after full rollout
- Maintenance cost exceeds value delivered
- Better alternative exists
- User feedback consistently negative

## Core Entity Priorities

Based on your data model, these entities form the CORE of your application:

| Entity | Priority | Rationale |
|--------|----------|-----------|
| Profile | CORE | Tax professional profile extending auth.users |
| Client | CORE | Tax clients belonging to a practitioner |
| Service | CORE | Service offerings by a tax professional |
| Appointment | CORE | Scheduled appointments between practitioners and clients |
| Availability | CORE | Practitioner working hours |
| Document | CORE | Client tax documents |

All CRUD operations for core entities should be prioritized before enhancements.

## Recommended Review Cadence

| Activity | Frequency | Participants |
|----------|-----------|--------------|
| Review rollout suggestions | Weekly | Engineering lead |
| Analyze feature usage | Bi-weekly | Product + Engineering |
| Pareto analysis review | Monthly | Full team |
| Feature priority audit | Quarterly | Product + Engineering |

## Quick Reference

### The 80/20 Checklist

Before building any feature:

- [ ] Have we identified which tier this belongs to?
- [ ] Do we have a hypothesis about expected impact?
- [ ] Is the rollout strategy appropriate for the tier?
- [ ] Are analytics hooks in place to measure actual usage?
- [ ] Do we know what "success" looks like for this feature?

### Signs Your Priorities Are Wrong

- CORE features have low usage (→ wrong features identified as core)
- ENHANCEMENT features have higher usage than HIGH_IMPACT (→ re-tier)
- Experiments run forever without decisions (→ need clearer success criteria)
- Team spends most time on ENHANCEMENT tier (→ priority discipline needed)

---

## Related Resources

- Feature Flags: `src/lib/feature-flags.ts`
- Analytics: `src/lib/analytics.ts`
- Defensive Patterns: `docs/DEFENSIVE_PATTERNS.md`
- Scalability Patterns: `docs/SCALABILITY_PATTERNS.md`

---

*Generated by Mental Models SDLC - Applying the Pareto Principle to software development*
