# Defensive Patterns - taxbook-pro

*Generated: 2026-01-19*

This document describes the defensive programming patterns implemented in this codebase, derived from **Inversion thinking** ("What could go wrong?").

## Inversion Insights Applied

The following failure scenarios were identified during planning and informed these defensive patterns:

- What would make a client NOT book? Complex forms, unclear availability, no reminders
- What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
- What would cause double-bookings? Race conditions, timezone bugs, unclear UI

---

## Table of Contents

1. [Error Handling](#error-handling)
2. [Input Validation](#input-validation)
3. [Database Resilience](#database-resilience)
4. [API Security](#api-security)
5. [Testing Checklist](#testing-checklist)

---

## 1. Error Handling

**Location:** `src/types/errors.ts`

### Result<T, E> Pattern

Every fallible operation returns a `Result<T, E>` type instead of throwing exceptions:

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

**Why?** Exceptions are invisible control flow. Result types make errors explicit and force callers to handle them.

### Exhaustive Error Types

All possible failure modes have explicit error types:

| Error Type | When It Occurs | Retriable? |
|------------|----------------|------------|
| `precondition_failed` | Caller violated function contract | No |
| `state_violation` | Invalid state transition | No |
| `invariant_violation` | Internal consistency broken (bug) | No |
| `circuit_breaker_open` | Service temporarily unavailable | Yes (after recovery) |
| `connection_failed` | Database connection lost | Yes |
| `timeout` | Operation exceeded time limit | Yes |
| `constraint_violation` | Database constraint violated | No |

### Error Context

All errors carry context for debugging:

```typescript
interface ErrorContext {
  traceId?: string;    // Distributed tracing
  requestId?: string;  // Request correlation
  timestamp: string;   // When it occurred
  userId?: string;     // Who triggered it
}
```

### Sensitive Data Redaction

Before logging, all errors are sanitized:

- Email addresses → `[EMAIL]`
- Phone numbers → `[PHONE]`
- Credit cards → `[CARD]`
- JWT tokens → `[JWT]`
- API keys → `[API_KEY]`
- IP addresses → `[IP]`

---

## 2. Input Validation

**Location:** `src/lib/validation.ts`

### Defensive Limits

All inputs have explicit bounds to prevent resource exhaustion:

| Limit | Value | Purpose |
|-------|-------|---------|
| `MAX_OBJECT_DEPTH` | 10 | Prevents stack overflow from nested payloads |
| `MAX_BATCH_SIZE` | 100 | Prevents array bomb attacks |
| `MAX_STRING_LENGTH` | 10,000 | Prevents memory exhaustion |
| `MAX_FIELD_NAME_LENGTH` | 64 | Prevents injection via field names |

### Injection Prevention

- Field names validated against pattern: `/^[a-zA-Z_][a-zA-Z0-9_.]*$/`
- URLs restricted to `http://` and `https://` protocols (no `javascript:`, `data:`)
- Email addresses normalized (lowercase, trimmed)
- Sort fields validated against allowlist (no SQL injection via ORDER BY)

### Pagination Bounds

```typescript
const maxLimit = 100;        // Maximum items per page
const maxOffset = 1_000_000; // Maximum skip depth
```

---

## 3. Database Resilience

**Location:** `src/lib/repositories.ts`

### Retry with Exponential Backoff

Transient failures are retried automatically:

```typescript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  jitterFactor: 0.2, // Prevents thundering herd
};
```

Only these error types are retried:
- `connection_failed`
- `timeout`
- `transaction_failed` (only deadlocks)

### Circuit Breaker

Prevents cascade failures when a service is unhealthy:

```typescript
const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,      // Opens after 5 failures
  recoveryTimeMs: 30_000,   // Tries recovery after 30s
  failureWindowMs: 60_000,  // Failures expire after 60s
};
```

States:
1. **Closed**: Normal operation
2. **Open**: Failing fast, rejecting requests
3. **Half-Open**: Allowing one request to test recovery

### Query Timeout

All database queries have a timeout (default: 30 seconds):

```typescript
export const withTimeout = async <T>(
  operation: () => Promise<Result<T, DbError>>,
  timeoutMs: number = 30_000
): Promise<Result<T, DbError>>
```

---

## 4. API Security

**Location:** `src/app/api/*/route.ts`

### Request Tracing

Every request gets a unique ID for debugging:

```typescript
const requestId = generateRequestId(); // e.g., "req_lz5xq_a8b3c2d1"
```

Returned in `X-Request-ID` header for client-side correlation.

### Body Size Limit

JSON bodies are limited to 1MB to prevent resource exhaustion.

### Content-Type Validation

POST/PUT/PATCH requests must have `Content-Type: application/json`.

### Standard Response Headers

All responses include:

```
X-Request-ID: req_...
Cache-Control: no-store, max-age=0
Content-Type: application/json
```

---

## 5. Testing Checklist

Use this checklist to verify defensive patterns are working:

### Error Handling
- [ ] All repository functions return `Result<T, E>`
- [ ] No unhandled promise rejections
- [ ] Error logs contain `requestId` and `userId`
- [ ] No sensitive data in error messages

### Input Validation
- [ ] Oversized arrays are rejected (> 100 items)
- [ ] Deep nested objects are rejected (> 10 levels)
- [ ] Invalid field names are rejected
- [ ] Pagination bounds are enforced

### Database Resilience
- [ ] Connection drops trigger retry logic
- [ ] Timeouts are handled gracefully
- [ ] Circuit breaker opens after repeated failures
- [ ] Circuit breaker recovers automatically

### API Security
- [ ] Requests without auth return 401
- [ ] Large payloads (> 1MB) are rejected
- [ ] Invalid Content-Type is rejected
- [ ] X-Request-ID header is present

---

## Implementation Notes

### Scalability Considerations (Second-Order)

- Easy booking → more clients → need capacity management
- Document collection → less back-and-forth → faster appointments
- Tax season mode → prevents burnout → sustainable practice

### Priority Focus (Pareto 80/20)

- 80% of value: booking + reminders + document upload
- 20% effort: basic availability settings cover most use cases
- Focus on tax season chaos, not year-round edge cases

---

*Generated by Mental Models SDLC*
