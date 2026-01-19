// ============================================================
// ERROR & RESULT TYPES - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// EXPLICIT ERROR HANDLING: No throwing exceptions.
// Every fallible operation returns Result<T, E>.
// Errors are data, not control flow.
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What could go wrong? → Exhaustive error types for all failure modes
// - What would cause users to abandon? → Rich error context for debugging
// - What would make this unmaintainable? → Consistent error structure
//
// Inversion Insights Applied:
//   • What would make a client NOT book? Complex forms, unclear availability, no reminders
//   • What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   • What would cause double-bookings? Race conditions, timezone bugs, unclear UI
// ============================================================

// ============================================================
// RESULT TYPE
// ============================================================

/**
 * Result type for explicit error handling.
 * Use this for ALL fallible operations.
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// Result constructors
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Result utilities
export const isOk = <T, E>(result: Result<T, E>): result is { ok: true; value: T } =>
  result.ok;

export const isErr = <T, E>(result: Result<T, E>): result is { ok: false; error: E } =>
  !result.ok;

export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.ok) return result.value;
  throw new Error(`Unwrap called on error: ${JSON.stringify(result.error)}`);
};

export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T =>
  result.ok ? result.value : defaultValue;

export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
  result.ok ? ok(fn(result.value)) : result;

export const mapErr = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> =>
  result.ok ? result : err(fn(result.error));

export const andThen = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => (result.ok ? fn(result.value) : result);

// Combine multiple results
export const all = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    values.push(result.value);
  }
  return ok(values);
};

// ============================================================
// ERROR CONTEXT & SEVERITY (Defensive Pattern)
// ============================================================

/**
 * DEFENSIVE: Error context for debugging and tracing.
 * Every error should carry enough context to debug without access to logs.
 */
export interface ErrorContext {
  /** Unique trace ID for distributed tracing */
  readonly traceId?: string;
  /** Request ID for correlating with logs */
  readonly requestId?: string;
  /** When the error occurred */
  readonly timestamp: string;
  /** User ID if authenticated (for audit trail) */
  readonly userId?: string;
  /** Additional context for debugging */
  readonly metadata?: Record<string, unknown>;
}

/**
 * DEFENSIVE: Error severity classification.
 * Use for alerting thresholds and error budgets.
 */
export type ErrorSeverity = "critical" | "error" | "warning" | "info";

/**
 * DEFENSIVE: Whether an error is retriable.
 * Prevents infinite retry loops on permanent failures.
 */
export type ErrorRetryability = "retriable" | "permanent" | "unknown";

/**
 * Create error context with current timestamp.
 * ALWAYS call this when creating errors.
 */
export const createErrorContext = (
  overrides: Partial<ErrorContext> = {}
): ErrorContext => ({
  timestamp: new Date().toISOString(),
  ...overrides,
});

// ============================================================
// DEFENSIVE ERROR BASE TYPES
// ============================================================

/**
 * DEFENSIVE: Precondition failure - caller violated function contract.
 * Use when inputs are technically valid but logically wrong.
 */
export interface PreconditionError {
  readonly type: "precondition_failed";
  readonly precondition: string;
  readonly actualValue?: unknown;
  readonly context?: ErrorContext;
}

/**
 * DEFENSIVE: State machine violation - operation invalid in current state.
 * Use when entity lifecycle rules are violated.
 */
export interface StateViolationError {
  readonly type: "state_violation";
  readonly currentState: string;
  readonly attemptedTransition: string;
  readonly allowedTransitions: readonly string[];
  readonly context?: ErrorContext;
}

/**
 * DEFENSIVE: Invariant violation - internal consistency broken.
 * This should NEVER happen in production. If it does, it's a bug.
 */
export interface InvariantError {
  readonly type: "invariant_violation";
  readonly invariant: string;
  readonly detail: string;
  readonly context?: ErrorContext;
}

/**
 * DEFENSIVE: Circuit breaker open - service temporarily unavailable.
 * Use to prevent cascade failures.
 */
export interface CircuitBreakerError {
  readonly type: "circuit_breaker_open";
  readonly service: string;
  readonly openedAt: string;
  readonly estimatedRecovery?: string;
  readonly context?: ErrorContext;
}

// Error constructors for defensive types
export const preconditionFailed = (
  precondition: string,
  actualValue?: unknown,
  context?: ErrorContext
): PreconditionError => ({
  type: "precondition_failed",
  precondition,
  actualValue,
  context: context ?? createErrorContext(),
});

export const stateViolation = (
  currentState: string,
  attemptedTransition: string,
  allowedTransitions: readonly string[],
  context?: ErrorContext
): StateViolationError => ({
  type: "state_violation",
  currentState,
  attemptedTransition,
  allowedTransitions,
  context: context ?? createErrorContext(),
});

export const invariantViolation = (
  invariant: string,
  detail: string,
  context?: ErrorContext
): InvariantError => ({
  type: "invariant_violation",
  invariant,
  detail,
  context: context ?? createErrorContext(),
});

export const circuitBreakerOpen = (
  service: string,
  openedAt: string,
  estimatedRecovery?: string,
  context?: ErrorContext
): CircuitBreakerError => ({
  type: "circuit_breaker_open",
  service,
  openedAt,
  estimatedRecovery,
  context: context ?? createErrorContext(),
});

// ============================================================
// DOMAIN ERROR TYPES
// ============================================================

/**
 * Errors for Profile operations
 */
export type ProfileError =
  | { readonly type: "profile_not_found"; readonly id: string }
  | { readonly type: "profile_already_exists"; readonly field: string; readonly value: string }
  | { readonly type: "profile_validation_failed"; readonly field: string; readonly message: string }
  | { readonly type: "profile_unauthorized"; readonly action: string };

/**
 * Errors for Client operations
 */
export type ClientError =
  | { readonly type: "client_not_found"; readonly id: string }
  | { readonly type: "client_already_exists"; readonly field: string; readonly value: string }
  | { readonly type: "client_validation_failed"; readonly field: string; readonly message: string }
  | { readonly type: "client_unauthorized"; readonly action: string };

/**
 * Errors for Service operations
 */
export type ServiceError =
  | { readonly type: "service_not_found"; readonly id: string }
  | { readonly type: "service_already_exists"; readonly field: string; readonly value: string }
  | { readonly type: "service_validation_failed"; readonly field: string; readonly message: string }
  | { readonly type: "service_unauthorized"; readonly action: string };

/**
 * Errors for Appointment operations
 */
export type AppointmentError =
  | { readonly type: "appointment_not_found"; readonly id: string }
  | { readonly type: "appointment_already_exists"; readonly field: string; readonly value: string }
  | { readonly type: "appointment_validation_failed"; readonly field: string; readonly message: string }
  | { readonly type: "appointment_appointment_prevent_double_booking_error"; readonly message: string; readonly field: string;  }
  | { readonly type: "appointment_appointment_check_daily_capacity_error"; readonly message: string; readonly field: string;  }
  | { readonly type: "appointment_appointment_check_documents_required_error"; readonly message: string; readonly field: string;  }
  | { readonly type: "appointment_appointment_invalid_transition_error"; readonly currentState: string; readonly attemptedState: string; readonly message: string;  }
  | { readonly type: "appointment_unauthorized"; readonly action: string };

/**
 * Errors for Availability operations
 */
export type AvailabilityError =
  | { readonly type: "availability_not_found"; readonly id: string }
  | { readonly type: "availability_already_exists"; readonly field: string; readonly value: string }
  | { readonly type: "availability_validation_failed"; readonly field: string; readonly message: string }
  | { readonly type: "availability_unauthorized"; readonly action: string };

/**
 * Errors for Document operations
 */
export type DocumentError =
  | { readonly type: "document_not_found"; readonly id: string }
  | { readonly type: "document_already_exists"; readonly field: string; readonly value: string }
  | { readonly type: "document_validation_failed"; readonly field: string; readonly message: string }
  | { readonly type: "document_document_invalid_transition_error"; readonly currentState: string; readonly attemptedState: string; readonly message: string;  }
  | { readonly type: "document_unauthorized"; readonly action: string };


// ============================================================
// VALIDATION ERRORS
// ============================================================

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: ValidationErrorCode;
}

export type ValidationErrorCode =
  | "required"
  | "invalid_format"
  | "too_short"
  | "too_long"
  | "out_of_range"
  | "invalid_reference"
  | "duplicate"
  | "invalid_state";

export type ValidationResult<T> = Result<T, ValidationError[]>;

// Validation helpers
export const validationErr = (
  field: string,
  code: ValidationErrorCode,
  message: string
): ValidationError => ({ field, code, message });

export const required = (field: string): ValidationError =>
  validationErr(field, "required", `${field} is required`);

export const invalidFormat = (field: string, expected: string): ValidationError =>
  validationErr(field, "invalid_format", `${field} must be ${expected}`);

export const tooShort = (field: string, min: number): ValidationError =>
  validationErr(field, "too_short", `${field} must be at least ${min} characters`);

export const tooLong = (field: string, max: number): ValidationError =>
  validationErr(field, "too_long", `${field} must be at most ${max} characters`);

// ============================================================
// API ERRORS
// ============================================================

export type ApiError =
  | { readonly type: "bad_request"; readonly message: string; readonly details?: ValidationError[] }
  | { readonly type: "unauthorized"; readonly message: string }
  | { readonly type: "forbidden"; readonly message: string; readonly resource?: string }
  | { readonly type: "not_found"; readonly resource: string; readonly id?: string }
  | { readonly type: "conflict"; readonly message: string; readonly field?: string }
  | { readonly type: "rate_limited"; readonly retryAfter: number }
  | { readonly type: "internal_error"; readonly message: string; readonly requestId?: string };

// HTTP status code mapping
export const apiErrorToStatus = (error: ApiError): number => {
  switch (error.type) {
    case "bad_request": return 400;
    case "unauthorized": return 401;
    case "forbidden": return 403;
    case "not_found": return 404;
    case "conflict": return 409;
    case "rate_limited": return 429;
    case "internal_error": return 500;
  }
};

// Error constructors
export const badRequest = (message: string, details?: ValidationError[]): ApiError =>
  ({ type: "bad_request", message, details });

export const unauthorized = (message = "Authentication required"): ApiError =>
  ({ type: "unauthorized", message });

export const forbidden = (message: string, resource?: string): ApiError =>
  ({ type: "forbidden", message, resource });

export const notFound = (resource: string, id?: string): ApiError =>
  ({ type: "not_found", resource, id });

export const conflict = (message: string, field?: string): ApiError =>
  ({ type: "conflict", message, field });

export const rateLimited = (retryAfter: number): ApiError =>
  ({ type: "rate_limited", retryAfter });

export const internalError = (message: string, requestId?: string): ApiError =>
  ({ type: "internal_error", message, requestId });

// ============================================================
// DATABASE ERRORS
// ============================================================

export type DbError =
  | { readonly type: "connection_failed"; readonly cause: string }
  | { readonly type: "query_failed"; readonly query: string; readonly cause: string }
  | { readonly type: "constraint_violation"; readonly constraint: string; readonly detail: string }
  | { readonly type: "transaction_failed"; readonly cause: string }
  | { readonly type: "timeout"; readonly operation: string };

// ============================================================
// EXTERNAL SERVICE ERRORS
// ============================================================

export type ExternalServiceError =
  | { readonly type: "service_unavailable"; readonly service: string }
  | { readonly type: "service_timeout"; readonly service: string; readonly timeoutMs: number }
  | { readonly type: "service_error"; readonly service: string; readonly statusCode: number; readonly message: string }
  | { readonly type: "invalid_response"; readonly service: string; readonly reason: string };

// ============================================================
// AGGREGATE ERROR TYPE
// ============================================================

/**
 * Union of all possible errors in the system.
 * Use this for top-level error handling.
 *
 * DEFENSIVE: Exhaustive error types ensure every failure mode is handled.
 */
export type AppError =
  | ProfileError
  | ClientError
  | ServiceError
  | AppointmentError
  | AvailabilityError
  | DocumentError
  | ApiError
  | DbError
  | ExternalServiceError
  // Defensive error types
  | PreconditionError
  | StateViolationError
  | InvariantError
  | CircuitBreakerError;

/**
 * DEFENSIVE: Get severity for any error type.
 * Use for alerting and error budgets.
 */
export const getErrorSeverity = (error: AppError): ErrorSeverity => {
  switch (error.type) {
    // Critical: Requires immediate attention
    case "invariant_violation":
    case "connection_failed":
      return "critical";

    // Error: Needs investigation
    case "internal_error":
    case "transaction_failed":
    case "service_error":
      return "error";

    // Warning: Operational issues
    case "timeout":
    case "circuit_breaker_open":
    case "rate_limited":
    case "service_timeout":
      return "warning";

    // Info: Expected failures
    case "unauthorized":
    case "forbidden":
    case "not_found":
    case "bad_request":
    case "conflict":
    case "precondition_failed":
    case "state_violation":
    default:
      return "info";
  }
};

/**
 * DEFENSIVE: Determine if error is retriable.
 * Prevents infinite retry loops on permanent failures.
 */
export const isRetriable = (error: AppError): ErrorRetryability => {
  switch (error.type) {
    // Retriable: Temporary failures
    case "timeout":
    case "service_timeout":
    case "service_unavailable":
    case "circuit_breaker_open":
    case "connection_failed":
    case "rate_limited":
      return "retriable";

    // Permanent: Will never succeed without changes
    case "unauthorized":
    case "forbidden":
    case "not_found":
    case "bad_request":
    case "conflict":
    case "constraint_violation":
    case "precondition_failed":
    case "state_violation":
    case "invariant_violation":
      return "permanent";

    default:
      return "unknown";
  }
};

// ============================================================
// ERROR LOGGING (safe for sensitive data)
// ============================================================

import { SENSITIVE_FIELDS, type SensitiveField } from "./domain";

/**
 * DEFENSIVE: Extended sensitive patterns for automatic redaction.
 * These patterns detect sensitive data even in unexpected fields.
 */
const SENSITIVE_PATTERNS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL]" },
  // Phone numbers (various formats)
  { pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: "[PHONE]" },
  // Credit card numbers
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: "[CARD]" },
  // SSN
  { pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, replacement: "[SSN]" },
  // JWT tokens
  { pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, replacement: "[JWT]" },
  // API keys (common formats)
  { pattern: /\b(sk_|pk_|api_|key_)[a-zA-Z0-9]{20,}/g, replacement: "[API_KEY]" },
  // Bearer tokens
  { pattern: /Bearer\s+[a-zA-Z0-9._-]+/g, replacement: "Bearer [TOKEN]" },
  // IP addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: "[IP]" },
];

/**
 * Redact sensitive fields before logging errors.
 * ALWAYS use this before logging.
 */
export const redactSensitiveData = <T extends Record<string, unknown>>(
  data: T,
  fieldsToRedact: readonly SensitiveField[] = SENSITIVE_FIELDS
): T => {
  const redacted = { ...data };
  for (const field of fieldsToRedact) {
    if (field in redacted) {
      (redacted as Record<string, unknown>)[field] = "[REDACTED]";
    }
  }
  return redacted;
};

/**
 * DEFENSIVE: Deep redaction of sensitive patterns in any string value.
 * Use when logging errors that may contain user data.
 */
export const redactSensitivePatterns = (value: unknown): unknown => {
  if (typeof value === "string") {
    let result = value;
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  if (Array.isArray(value)) {
    return value.map(redactSensitivePatterns);
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = redactSensitivePatterns(val);
    }
    return result;
  }

  return value;
};

/**
 * DEFENSIVE: Safe error serialization for logging.
 * Prevents circular references and ensures JSON compatibility.
 */
export const safeSerializeError = (error: unknown): string => {
  try {
    const seen = new WeakSet();
    return JSON.stringify(
      error,
      (key, value) => {
        // Skip circular references
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[Circular]";
          seen.add(value);
        }
        // Convert Error objects
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: process.env.NODE_ENV === "production" ? "[REDACTED]" : value.stack,
          };
        }
        return value;
      },
      2
    );
  } catch {
    return `[Unserializable: ${String(error)}]`;
  }
};

/**
 * DEFENSIVE: Create a loggable error object.
 * Combines redaction, serialization, and context.
 */
export const toLoggableError = (
  error: AppError,
  context?: ErrorContext
): Record<string, unknown> => {
  const loggable = {
    type: error.type,
    severity: getErrorSeverity(error),
    retriable: isRetriable(error),
    context: context ?? ("context" in error ? error.context : undefined),
    ...redactSensitivePatterns(error) as Record<string, unknown>,
  };
  return loggable;
};

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
