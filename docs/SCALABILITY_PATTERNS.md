# Scalability Patterns - taxbook-pro

*Generated: 2026-01-19*

This document describes the scalability patterns implemented in this codebase, derived from **Second-Order thinking** ("What happens at 10x? 100x?").

## Second-Order Insights Applied

The following scale considerations were identified during planning and informed these patterns:

- Easy booking → more clients → need capacity management
- Document collection → less back-and-forth → faster appointments
- Tax season mode → prevents burnout → sustainable practice

---

## Table of Contents

1. [Caching](#caching)
2. [Database](#database)
3. [Background Jobs](#background-jobs)
4. [Rate Limiting](#rate-limiting)
5. [Observability](#observability)
6. [Scaling Checklist](#scaling-checklist)
7. [Load Testing](#load-testing)

---

## 1. Caching

**Location:** `src/lib/cache.ts`

### Cache Strategies

| Strategy | When to Use | Pattern |
|----------|-------------|---------|
| **Cache-Aside** | Most read operations | Check cache → miss → fetch → write cache |
| **Write-Through** | Write-heavy with read consistency | Write to DB + cache simultaneously |
| **Stale-While-Revalidate** | Tolerate slight staleness for speed | Return stale, refresh in background |

### Default TTL Values

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| User profile | 5 min | Balance freshness with read load |
| Entity lists | 2 min | Frequently changing data |
| Static config | 1 hour | Rarely changes |
| Session data | 30 min | Security balance |

### Cache Invalidation

```typescript
// Single entity
await invalidateCache('user:123');

// Pattern-based
await invalidateCachePattern('user:*');

// Tag-based
await invalidateCacheTag('users');
```

### When to Cache

✅ **DO cache:**
- Frequently read, rarely written data
- Expensive computations
- External API responses
- User preferences

❌ **DON'T cache:**
- Sensitive data without encryption
- Real-time data (< 1 second freshness)
- Data with complex invalidation

---

## 2. Database

**Location:** `src/lib/repositories.ts`

### Connection Pooling

Supabase uses Supavisor for connection pooling. Default configuration:

| Setting | Value | Notes |
|---------|-------|-------|
| Pool size | 15 per user | Shared across all instances |
| Mode | Transaction | Best for serverless |
| Timeout | 30 seconds | Query timeout |

**For serverless (Vercel/Netlify):**
- Use transaction mode (default)
- Keep connections short-lived
- Don't hold connections across await

**For long-running processes:**
- Consider session mode
- Implement connection health checks

### N+1 Prevention

❌ **Bad - N+1 queries:**
```typescript
const orders = await listOrders();
for (const order of orders) {
  const items = await getOrderItems(order.id); // N queries!
}
```

✅ **Good - Eager loading:**
```typescript
const { data } = await supabase
  .from('orders')
  .select('*, order_items(*)');  // Single query
```

✅ **Good - Batch lookup:**
```typescript
const orderIds = orders.map(o => o.id);
const { data } = await supabase
  .from('order_items')
  .select('*')
  .in('order_id', orderIds);  // Single query
```

### Pagination

All list operations use offset-based pagination:

| Parameter | Default | Maximum |
|-----------|---------|---------|
| limit | 20 | 100 |
| offset | 0 | 1,000,000 |

For large datasets, consider cursor-based pagination.

### Circuit Breaker

Prevents cascade failures when database is unhealthy:

```
[Normal] → 5 failures → [Open/Failing Fast] → 30s → [Half-Open/Testing] → Success → [Normal]
```

Configuration in `lib-repository.ts`:
- Failure threshold: 5
- Recovery time: 30 seconds
- Failure window: 60 seconds

---

## 3. Background Jobs

**Location:** `src/lib/jobs.ts`

### When to Use Jobs

| Operation Type | Sync/Async | Reason |
|----------------|------------|--------|
| < 100ms | Sync | Fast enough for request |
| 100-500ms | Consider async | User might notice |
| > 500ms | Async | Block would frustrate user |
| External API | Async | Unpredictable latency |
| Can fail | Async | Needs retry capability |

### Queue Depth Monitoring

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Pending jobs | > 100 | > 1000 | Scale workers |
| Avg wait time | > 1 min | > 5 min | Scale workers |
| Failed jobs/hour | > 10 | > 100 | Investigate |

### Priority Levels

| Priority | Use Case | Example |
|----------|----------|---------|
| 10 (High) | User-facing | Password reset email |
| 5 (Normal) | Background | File processing |
| 1 (Low) | Maintenance | Cleanup jobs |

### Retry Strategy

All jobs use exponential backoff with jitter:

```
Delay = min(baseDelay * 2^attempt + random_jitter, maxDelay)
```

Default config:
- Base delay: 1 second
- Max delay: 5 minutes
- Max attempts: 5
- Jitter factor: 20%

---

## 4. Rate Limiting

**Location:** `src/lib/rate-limit.ts`

### Default Limits

| Tier | Limit | Window | Use Case |
|------|-------|--------|----------|
| API | 100 req | 60s | General endpoints |
| Auth | 10 req | 60s | Login/register |
| Upload | 20 req | 60s | File uploads |
| Webhook | 1000 req | 60s | External integrations |
| Premium | 500 req | 60s | Paid users |

### Headers Returned

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
Retry-After: 30  (only on 429)
```

---

## 5. Observability

**Location:** `src/lib/observability.ts`

### Key Metrics

| Metric | Type | Alert Threshold |
|--------|------|-----------------|
| `http_request_duration_ms` | Histogram | P99 > 2000ms |
| `http_requests_total` | Counter | Error rate > 5% |
| `db_query_duration_ms` | Histogram | P95 > 500ms |
| `cache_hit_rate` | Gauge | < 50% |
| `job_queue_depth` | Gauge | > 100 |
| `active_users` | Gauge | Trend analysis |

### Tracing

All requests include:
- `X-Request-ID`: Unique per request
- `X-Trace-ID`: Propagated across services
- `X-Span-ID`: Per operation

---

## 6. Scaling Checklist

Use this checklist before launch and when scaling:

### Database
- [ ] All frequent queries have indexes
- [ ] N+1 queries eliminated
- [ ] Connection pooling configured
- [ ] Query timeouts set (30s default)
- [ ] RLS policies efficient (no recursive lookups)

### Caching
- [ ] Cache layer configured (Redis/Upstash)
- [ ] TTLs set appropriately for each data type
- [ ] Invalidation triggers on writes
- [ ] Cache hit rate monitored (target > 80%)

### Background Jobs
- [ ] Long operations moved to jobs
- [ ] Retry configuration reviewed
- [ ] Dead letter queue configured
- [ ] Queue depth alerting set up

### Rate Limiting
- [ ] Per-route limits configured
- [ ] Auth endpoints have stricter limits
- [ ] Premium tier limits higher
- [ ] Retry-After header implemented

### Observability
- [ ] Request tracing enabled
- [ ] Key metrics exported
- [ ] Alert thresholds configured
- [ ] Dashboard for monitoring

---

## 7. Load Testing

### Pre-Launch Test Plan

Run these tests before production launch:

#### Baseline Test
```bash
# 10 concurrent users, 5 minutes
k6 run --vus 10 --duration 5m load-test.js
```

Expected: P99 latency < 500ms

#### Stress Test
```bash
# Ramp to 100 users over 10 minutes
k6 run --vus 100 --duration 10m --rps 1000 stress-test.js
```

Expected: No errors, P99 < 2000ms

#### Spike Test
```bash
# Sudden 10x traffic spike
k6 run spike-test.js
```

Expected: Rate limiting kicks in, system recovers

### Key Scenarios to Test

1. **User signup flow** - Auth rate limits, welcome email job
2. **Heavy read load** - Cache effectiveness
3. **File upload burst** - Job queue depth
4. **Concurrent writes** - Database connection limits
5. **Failed external service** - Circuit breaker triggers

### Performance Budgets

| Metric | Target | Maximum |
|--------|--------|---------|
| Homepage load | 1.5s | 3s |
| API response (P50) | 100ms | 200ms |
| API response (P99) | 500ms | 2000ms |
| Time to Interactive | 2s | 4s |

---

## Index Recommendations

Based on entity queries, consider these indexes:

### Profile

```sql
-- Primary lookup by ID (automatic via PK)
-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_profile_status
  ON profile (status)
  WHERE status IN ('active', 'pending');

-- User-scoped queries
CREATE INDEX IF NOT EXISTS idx_profile_user_id
  ON profile (user_id);

-- Date-range queries
CREATE INDEX IF NOT EXISTS idx_profile_created_at
  ON profile (created_at DESC);

```

### Client

```sql
-- Primary lookup by ID (automatic via PK)
-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_client_status
  ON client (status)
  WHERE status IN ('active', 'pending');

-- User-scoped queries
CREATE INDEX IF NOT EXISTS idx_client_user_id
  ON client (user_id);

-- Date-range queries
CREATE INDEX IF NOT EXISTS idx_client_created_at
  ON client (created_at DESC);

```

### Service

```sql
-- Primary lookup by ID (automatic via PK)
-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_service_status
  ON service (status)
  WHERE status IN ('active', 'pending');

-- User-scoped queries
CREATE INDEX IF NOT EXISTS idx_service_user_id
  ON service (user_id);

-- Date-range queries
CREATE INDEX IF NOT EXISTS idx_service_created_at
  ON service (created_at DESC);

```

### Appointment

```sql
-- Primary lookup by ID (automatic via PK)
-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_appointment_status
  ON appointment (status)
  WHERE status IN ('active', 'pending');

-- User-scoped queries
CREATE INDEX IF NOT EXISTS idx_appointment_user_id
  ON appointment (user_id);

-- Date-range queries
CREATE INDEX IF NOT EXISTS idx_appointment_created_at
  ON appointment (created_at DESC);

```

### Availability

```sql
-- Primary lookup by ID (automatic via PK)
-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_availability_status
  ON availability (status)
  WHERE status IN ('active', 'pending');

-- User-scoped queries
CREATE INDEX IF NOT EXISTS idx_availability_user_id
  ON availability (user_id);

-- Date-range queries
CREATE INDEX IF NOT EXISTS idx_availability_created_at
  ON availability (created_at DESC);

```

### Document

```sql
-- Primary lookup by ID (automatic via PK)
-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_document_status
  ON document (status)
  WHERE status IN ('active', 'pending');

-- User-scoped queries
CREATE INDEX IF NOT EXISTS idx_document_user_id
  ON document (user_id);

-- Date-range queries
CREATE INDEX IF NOT EXISTS idx_document_created_at
  ON document (created_at DESC);

```


---

## Scaling Runbook

### Symptom: High Latency

1. Check cache hit rate (`cache.stats()`)
2. Check database query times
3. Check job queue depth
4. Check external service latency

### Symptom: Rate Limit Errors

1. Identify which tier is limited
2. Check for abuse patterns
3. Consider raising limits for legitimate traffic
4. Implement request queuing client-side

### Symptom: Job Queue Growing

1. Check worker health
2. Increase worker count
3. Check for failing jobs
4. Review job priorities

### Symptom: Database Connection Errors

1. Check active connection count
2. Review long-running queries
3. Check for connection leaks
4. Increase pool size if needed

---

## Defensive Patterns (Inversion)

- What would make a client NOT book? Complex forms, unclear availability, no reminders
- What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
- What would cause double-bookings? Race conditions, timezone bugs, unclear UI

## Priority Focus (Pareto 80/20)

- 80% of value: booking + reminders + document upload
- 20% effort: basic availability settings cover most use cases
- Focus on tax season chaos, not year-round edge cases

---

*Generated by Mental Models SDLC*
