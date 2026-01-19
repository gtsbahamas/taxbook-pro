# Scaling Runbook - taxbook-pro

> Operational procedures for scaling the application as traffic and data grow.

---

## Traffic Thresholds & Scaling Triggers

| Metric | Normal | Warning | Critical | Action |
|--------|--------|---------|----------|--------|
| Requests/sec | < 100 | 100-500 | > 500 | Enable caching layer |
| DB connections | < 50 | 50-80 | > 80 | Add connection pooling |
| Response time (p95) | < 200ms | 200-500ms | > 500ms | Investigate bottleneck |
| Error rate | < 0.1% | 0.1-1% | > 1% | Immediate investigation |
| CPU usage | < 50% | 50-80% | > 80% | Scale horizontally |
| Memory usage | < 70% | 70-85% | > 85% | Investigate leaks, scale |

---

## Quick Reference: Scaling Actions

| Problem | First Action | If Persists |
|---------|--------------|-------------|
| Slow API responses | Enable caching | Add read replicas |
| Database CPU high | Add indexes | Vertical scale DB |
| Too many connections | Enable PgBouncer | Scale DB |
| High memory usage | Check for leaks | Increase instance size |
| Static asset slow | Enable CDN | Review bundle size |

---

## Database Scaling

### 1. Connection Pooling (First Step)

Supabase includes PgBouncer. Ensure connection string uses pooler:

```env
# Use pooler for application connections (port 6543)
DATABASE_URL=postgres://user:pass@host:6543/db?pgbouncer=true

# Use direct connection for migrations only (port 5432)
DIRECT_URL=postgres://user:pass@host:5432/db
```

### 2. Adding Indexes

Identify slow queries:
```sql
-- Find slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

Add indexes for common patterns:
```sql
-- Profile indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_created_at
ON profile (created_at DESC);

-- Add user_id index if entity has user ownership
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_user_id
-- ON profile (user_id);

-- Add status index if entity has status field
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_status
-- ON profile (status);

-- Client indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_created_at
ON client (created_at DESC);

-- Add user_id index if entity has user ownership
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_user_id
-- ON client (user_id);

-- Add status index if entity has status field
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_status
-- ON client (status);

-- Service indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_created_at
ON service (created_at DESC);

-- Add user_id index if entity has user ownership
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_user_id
-- ON service (user_id);

-- Add status index if entity has status field
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_status
-- ON service (status);

-- Appointment indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_created_at
ON appointment (created_at DESC);

-- Add user_id index if entity has user ownership
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_user_id
-- ON appointment (user_id);

-- Add status index if entity has status field
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_status
-- ON appointment (status);

-- Availability indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_created_at
ON availability (created_at DESC);

-- Add user_id index if entity has user ownership
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_user_id
-- ON availability (user_id);

-- Add status index if entity has status field
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_status
-- ON availability (status);

-- Document indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_created_at
ON document (created_at DESC);

-- Add user_id index if entity has user ownership
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_user_id
-- ON document (user_id);

-- Add status index if entity has status field
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_status
-- ON document (status);

```

### 3. Read Replicas

When to add:
- Read queries > 80% of traffic
- Primary DB CPU consistently > 70%

Setup in Supabase:
1. Dashboard > Database > Read Replicas
2. Create replica in same region
3. Update application to route reads

```typescript
// Example read replica routing
import { createClient } from '@supabase/supabase-js';

const primaryClient = createClient(PRIMARY_URL, KEY);
const replicaClient = createClient(REPLICA_URL, KEY);

// Route reads to replica
export const readClient = replicaClient;
export const writeClient = primaryClient;
```

### 4. Vertical Scaling

Supabase compute upgrade path:
- Starter: 1 CPU, 1GB RAM (shared)
- Pro: 2 CPU, 4GB RAM (dedicated)
- Team: 4 CPU, 8GB RAM (dedicated)
- Enterprise: Custom

Upgrade via: Dashboard > Settings > Compute

---

## Caching Layer Activation

### When to Enable

Enable caching when:
- Same queries repeated > 10x/minute
- Response time degrading
- Database load increasing

### Redis/Upstash Setup

1. Create Upstash Redis instance (if not exists)
2. Add environment variables:
```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

3. Configure cache (`src/lib/cache.ts`):
```typescript
// Already included in scaffolding
import { cache } from '@/lib/cache';

// Cache expensive queries
const data = await cache.get('key', async () => {
  return await expensiveQuery();
}, { ttl: 300 }); // 5 minutes
```

### Cache Strategies by Data Type

| Data Type | TTL | Strategy |
|-----------|-----|----------|
| User profile | 5 min | Cache-aside |
| Entity lists | 1 min | SWR (stale-while-revalidate) |
| Static config | 1 hour | Cache-aside |
| Session data | 0 | No cache (use Supabase) |

---

## CDN Configuration

### Vercel Edge (Default)

Already configured via `next.config.mjs`:
```javascript
// Static assets cached at edge
export const config = {
  runtime: 'edge',
};
```

### Static Asset Optimization

1. **Images**: Use `next/image` for automatic optimization
2. **Fonts**: Use `next/font` for self-hosting
3. **Bundle**: Keep JS < 200KB gzipped

Check bundle size:
```bash
npm run build
# Review .next/analyze output
```

### Custom CDN (If Needed)

For very high traffic (>10M requests/month):
1. Add CloudFlare/Fastly in front of Vercel
2. Configure cache headers
3. Set up origin shield

---

## Feature Flag Circuit Breakers

Use feature flags to disable features under load (`src/lib/feature-flags.ts`):

```typescript
// Emergency disable
await featureFlags.update('expensive-feature', { enabled: false });

// Percentage rollout for gradual re-enable
await featureFlags.update('expensive-feature', {
  enabled: true,
  percentage: 10, // Only 10% of users
});
```

### Pre-configured Circuit Breakers

| Feature | Disable Trigger | Re-enable Condition |
|---------|----------------|---------------------|
| Real-time updates | Error rate > 5% | Error rate < 1% for 5 min |
| File uploads | Storage > 80% | Storage < 70% |
| Search | Response > 2s | Response < 500ms |

---

## Entity-Specific Scaling

### Profile

**Current indexes:**
- Primary key: `id`
- Foreign key: `user_id` (if applicable)
- Timestamp: `created_at`

**Scaling triggers:**
- Row count > 1M: Add partitioning
- Query time > 100ms: Review indexes
- Frequent full scans: Add covering index

**Archival strategy:**
```sql
-- Archive old profile records
INSERT INTO profile_archive
SELECT * FROM profile
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM profile
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Client

**Current indexes:**
- Primary key: `id`
- Foreign key: `user_id` (if applicable)
- Timestamp: `created_at`

**Scaling triggers:**
- Row count > 1M: Add partitioning
- Query time > 100ms: Review indexes
- Frequent full scans: Add covering index

**Archival strategy:**
```sql
-- Archive old client records
INSERT INTO client_archive
SELECT * FROM client
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM client
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Service

**Current indexes:**
- Primary key: `id`
- Foreign key: `user_id` (if applicable)
- Timestamp: `created_at`

**Scaling triggers:**
- Row count > 1M: Add partitioning
- Query time > 100ms: Review indexes
- Frequent full scans: Add covering index

**Archival strategy:**
```sql
-- Archive old service records
INSERT INTO service_archive
SELECT * FROM service
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM service
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Appointment

**Current indexes:**
- Primary key: `id`
- Foreign key: `user_id` (if applicable)
- Timestamp: `created_at`

**Scaling triggers:**
- Row count > 1M: Add partitioning
- Query time > 100ms: Review indexes
- Frequent full scans: Add covering index

**Archival strategy:**
```sql
-- Archive old appointment records
INSERT INTO appointment_archive
SELECT * FROM appointment
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM appointment
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Availability

**Current indexes:**
- Primary key: `id`
- Foreign key: `user_id` (if applicable)
- Timestamp: `created_at`

**Scaling triggers:**
- Row count > 1M: Add partitioning
- Query time > 100ms: Review indexes
- Frequent full scans: Add covering index

**Archival strategy:**
```sql
-- Archive old availability records
INSERT INTO availability_archive
SELECT * FROM availability
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM availability
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Document

**Current indexes:**
- Primary key: `id`
- Foreign key: `user_id` (if applicable)
- Timestamp: `created_at`

**Scaling triggers:**
- Row count > 1M: Add partitioning
- Query time > 100ms: Review indexes
- Frequent full scans: Add covering index

**Archival strategy:**
```sql
-- Archive old document records
INSERT INTO document_archive
SELECT * FROM document
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM document
WHERE created_at < NOW() - INTERVAL '1 year';
```


---

## Monitoring & Alerts

### Key Metrics Dashboard

Set up in Vercel Analytics or external tool:

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Response time | Vercel Analytics | p95 > 500ms |
| Error rate | Vercel Logs | > 1% |
| DB connections | Supabase Dashboard | > 80% of max |
| API requests | Rate limiter | > 1000/min |

### Alert Configuration

```yaml
# Example: PagerDuty/Opsgenie integration
alerts:
  - name: high_latency
    condition: p95_latency > 500ms for 5m
    severity: warning

  - name: error_spike
    condition: error_rate > 1% for 2m
    severity: critical

  - name: db_connections_high
    condition: db_connections > 80% for 3m
    severity: warning
```

---

## Scaling Playbook

### Level 1: First Signs of Load (< 1 hour to fix)

1. [ ] Enable caching for frequent queries
2. [ ] Review and add missing indexes
3. [ ] Check for N+1 queries in logs
4. [ ] Disable non-critical features via flags

### Level 2: Sustained High Load (< 4 hours to fix)

1. [ ] Upgrade Supabase compute tier
2. [ ] Add read replica for queries
3. [ ] Enable CDN for static assets
4. [ ] Review and optimize bundle size

### Level 3: Emergency Scaling (< 1 hour, accept cost)

1. [ ] Immediately upgrade to highest tier
2. [ ] Disable all non-critical features
3. [ ] Enable aggressive caching (TTL 5 min+)
4. [ ] Contact Supabase/Vercel support

---

## Post-Incident Review

After any scaling event:

1. **Document** what triggered the scaling
2. **Analyze** if it could have been prevented
3. **Update** thresholds based on learnings
4. **Automate** any manual steps taken
5. **Plan** proactive improvements

Template:
```markdown
## Scaling Incident: [Date]

### Trigger
[What caused the scaling need]

### Actions Taken
1. [Action 1]
2. [Action 2]

### Time to Resolution
[Duration]

### Prevention
[How to prevent recurrence]

### Follow-up Tasks
- [ ] Task 1
- [ ] Task 2
```
