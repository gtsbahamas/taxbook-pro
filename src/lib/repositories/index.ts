// ============================================================
// DATABASE REPOSITORY - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// TYPE-FIRST DESIGN: Repository functions return Result<T, DbError>.
// No throwing exceptions. All database operations are explicit.
//
// RLS: All queries go through the Supabase client which respects
// Row Level Security policies. User context is handled by Supabase Auth.
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What could go wrong? → Retry transient failures with backoff
// - What would cause cascading failures? → Circuit breaker pattern
// - What would make debugging hard? → Rich error context
//
// Inversion Insights Applied:
//   • What would make a client NOT book? Complex forms, unclear availability, no reminders
//   • What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   • What would cause double-bookings? Race conditions, timezone bugs, unclear UI
//
// SCALABILITY PATTERNS (Second-Order Mental Model):
// - What happens at 10x users? → Pagination prevents memory explosion
// - What cascades from DB slowdown? → Circuit breaker isolates failures
// - What becomes harder to change? → Repository pattern enables swap
// - What dependencies does this create? → Supabase client is abstracted
//
// CONNECTION POOL GUIDANCE:
// - Supabase uses Supavisor connection pooling by default
// - Default pool size: 15 connections per user
// - For serverless (Vercel/Netlify): Use transaction mode
// - For long-running: Use session mode
// - Monitor with: SELECT count(*) FROM pg_stat_activity;
//
// N+1 PREVENTION:
// - Use select("*, relation(*)") for eager loading
// - Use .in() for batch lookups instead of loops
// - Consider caching for frequently accessed relations
//
// Second-Order Insights Applied:
//   • Easy booking → more clients → need capacity management
//   • Document collection → less back-and-forth → faster appointments
//   • Tax season mode → prevents burnout → sustainable practice
// ============================================================

import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import {
  type Result,
  ok,
  err,
} from "@/types/errors";
import type { DbError } from "@/types/errors";
import {
  logger,
  withSpan,
  dbQueryDuration,
  timed,
} from "@/lib/observability";
import type {
  Profile,
  ProfileId,
  CreateProfileInput,
  UpdateProfileInput,
  ProfileFilters,
} from "@/types/domain";
import { profileId } from "@/types/domain";
import type {
  Client,
  ClientId,
  CreateClientInput,
  UpdateClientInput,
  ClientFilters,
} from "@/types/domain";
import { clientId } from "@/types/domain";
import type {
  Service,
  ServiceId,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceFilters,
} from "@/types/domain";
import { serviceId } from "@/types/domain";
import type {
  Appointment,
  AppointmentId,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentFilters,
} from "@/types/domain";
import { appointmentId } from "@/types/domain";
import type {
  Availability,
  AvailabilityId,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
  AvailabilityFilters,
} from "@/types/domain";
import { availabilityId } from "@/types/domain";
import type {
  Document,
  DocumentId,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentFilters,
} from "@/types/domain";
import { documentId } from "@/types/domain";

// ============================================================
// PAGINATION TYPES
// ============================================================

export interface PaginationParams {
  readonly limit?: number;
  readonly offset?: number;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly hasMore: boolean;
}

// Default pagination values
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ============================================================
// ERROR MAPPING
// ============================================================

/**
 * Maps Supabase/Postgres errors to DbError type.
 * IMPORTANT: Never log raw error messages - they may contain sensitive data.
 */
const mapDbError = (error: unknown, operation: string): DbError => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Connection errors
    if (message.includes("connection") || message.includes("network")) {
      return { type: "connection_failed", cause: "Database connection failed" };
    }

    // Constraint violations (unique, foreign key, check)
    if (message.includes("duplicate key") || message.includes("unique constraint")) {
      const match = error.message.match(/constraint "([^"]+)"/);
      return {
        type: "constraint_violation",
        constraint: match?.[1] ?? "unknown",
        detail: "Duplicate value violates unique constraint",
      };
    }

    if (message.includes("foreign key") || message.includes("violates foreign key")) {
      const match = error.message.match(/constraint "([^"]+)"/);
      return {
        type: "constraint_violation",
        constraint: match?.[1] ?? "unknown",
        detail: "Referenced record does not exist",
      };
    }

    if (message.includes("check constraint")) {
      const match = error.message.match(/constraint "([^"]+)"/);
      return {
        type: "constraint_violation",
        constraint: match?.[1] ?? "unknown",
        detail: "Value violates check constraint",
      };
    }

    // Timeout
    if (message.includes("timeout") || message.includes("canceling statement")) {
      return { type: "timeout", operation };
    }

    // Transaction errors
    if (message.includes("transaction") || message.includes("deadlock")) {
      return { type: "transaction_failed", cause: "Transaction failed" };
    }
  }

  // Default to query_failed
  return {
    type: "query_failed",
    query: operation,
    cause: "Database query failed",
  };
};

// ============================================================
// DEFENSIVE: RETRY CONFIGURATION
// ============================================================

/**
 * DEFENSIVE: Configuration for retry behavior.
 * Prevents infinite retries and excessive delays.
 */
interface RetryConfig {
  /** Maximum number of retry attempts */
  readonly maxRetries: number;
  /** Initial delay in milliseconds */
  readonly baseDelayMs: number;
  /** Maximum delay in milliseconds */
  readonly maxDelayMs: number;
  /** Jitter factor (0-1) to prevent thundering herd */
  readonly jitterFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  jitterFactor: 0.2,
};

/**
 * DEFENSIVE: Determines if an error is retriable.
 * Only retry transient failures, never retry permanent ones.
 */
const isRetriableError = (error: DbError): boolean => {
  switch (error.type) {
    case "connection_failed":
    case "timeout":
      return true;
    case "transaction_failed":
      // Deadlocks are retriable, other transaction failures may not be
      return error.cause?.toLowerCase().includes("deadlock") ?? false;
    case "constraint_violation":
    case "query_failed":
    default:
      return false;
  }
};

/**
 * DEFENSIVE: Calculate delay with exponential backoff and jitter.
 * Jitter prevents thundering herd when many clients retry together.
 */
const calculateBackoffDelay = (
  attempt: number,
  config: RetryConfig
): number => {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  const jitter = cappedDelay * config.jitterFactor * Math.random();
  return Math.floor(cappedDelay + jitter);
};

/**
 * DEFENSIVE: Wait for specified milliseconds.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * DEFENSIVE: Execute operation with retry logic.
 * Only retries transient failures with exponential backoff.
 */
export const withRetry = async <T>(
  operation: () => Promise<Result<T, DbError>>,
  operationName: string,
  config: Partial<RetryConfig> = {}
): Promise<Result<T, DbError>> => {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: DbError | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    const result = await operation();

    if (result.ok) {
      return result;
    }

    lastError = result.error;

    // Don't retry permanent failures
    if (!isRetriableError(result.error)) {
      return result;
    }

    // Don't sleep after last attempt
    if (attempt < finalConfig.maxRetries) {
      const delay = calculateBackoffDelay(attempt, finalConfig);
      logger.warn('Repository operation failed, retrying', {
        operation: operationName,
        attempt: attempt + 1,
        maxAttempts: finalConfig.maxRetries + 1,
        retryDelayMs: delay,
        errorType: result.error.type,
      });
      await sleep(delay);
    }
  }

  // All retries exhausted
  return err(lastError ?? { type: "query_failed", query: operationName, cause: "All retries exhausted" });
};

// ============================================================
// DEFENSIVE: CIRCUIT BREAKER
// ============================================================

/**
 * DEFENSIVE: Circuit breaker state.
 * Prevents cascade failures by stopping requests to failing services.
 */
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  openedAt: number;
}

/**
 * DEFENSIVE: Circuit breaker configuration.
 */
interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  readonly failureThreshold: number;
  /** Time in ms before attempting recovery */
  readonly recoveryTimeMs: number;
  /** Time window in ms for counting failures */
  readonly failureWindowMs: number;
}

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeMs: 30_000,
  failureWindowMs: 60_000,
};

// Circuit breaker state per operation type
const circuitBreakers = new Map<string, CircuitBreakerState>();

/**
 * DEFENSIVE: Get or create circuit breaker state.
 */
const getCircuitBreaker = (key: string): CircuitBreakerState => {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
      openedAt: 0,
    });
  }
  return circuitBreakers.get(key)!;
};

/**
 * DEFENSIVE: Check if circuit breaker allows request.
 * Returns error if circuit is open and not ready for recovery.
 */
const checkCircuitBreaker = (
  key: string,
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG
): DbError | null => {
  const state = getCircuitBreaker(key);
  const now = Date.now();

  if (state.isOpen) {
    // Check if recovery time has passed
    if (now - state.openedAt >= config.recoveryTimeMs) {
      // Allow one request through (half-open state)
      state.isOpen = false;
      return null;
    }

    return {
      type: "connection_failed",
      cause: `Circuit breaker open for ${key}. Recovery in ${Math.ceil((config.recoveryTimeMs - (now - state.openedAt)) / 1000)}s`,
    };
  }

  return null;
};

/**
 * DEFENSIVE: Record success - reset failure count.
 */
const recordSuccess = (key: string): void => {
  const state = getCircuitBreaker(key);
  state.failures = 0;
  state.isOpen = false;
};

/**
 * DEFENSIVE: Record failure - potentially open circuit.
 */
const recordFailure = (
  key: string,
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG
): void => {
  const state = getCircuitBreaker(key);
  const now = Date.now();

  // Reset failures if outside window
  if (now - state.lastFailure > config.failureWindowMs) {
    state.failures = 0;
  }

  state.failures++;
  state.lastFailure = now;

  if (state.failures >= config.failureThreshold) {
    state.isOpen = true;
    state.openedAt = now;
    logger.error('Circuit breaker opened', {
      circuitKey: key,
      failures: state.failures,
      recoveryTimeMs: config.recoveryTimeMs,
    });
  }
};

/**
 * DEFENSIVE: Execute operation with circuit breaker protection.
 * Prevents cascade failures by failing fast when service is unhealthy.
 */
export const withCircuitBreaker = async <T>(
  operation: () => Promise<Result<T, DbError>>,
  operationKey: string,
  config: Partial<CircuitBreakerConfig> = {}
): Promise<Result<T, DbError>> => {
  const finalConfig = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };

  // Check if circuit is open
  const blocked = checkCircuitBreaker(operationKey, finalConfig);
  if (blocked) {
    return err(blocked);
  }

  // Execute operation
  const result = await operation();

  // Record result
  if (result.ok) {
    recordSuccess(operationKey);
  } else if (isRetriableError(result.error)) {
    // Only count transient failures toward circuit breaker
    recordFailure(operationKey, finalConfig);
  }

  return result;
};

/**
 * DEFENSIVE: Execute with both retry and circuit breaker.
 * Provides maximum resilience for critical operations.
 */
export const withResilience = async <T>(
  operation: () => Promise<Result<T, DbError>>,
  operationKey: string,
  retryConfig?: Partial<RetryConfig>,
  circuitConfig?: Partial<CircuitBreakerConfig>
): Promise<Result<T, DbError>> => {
  return withCircuitBreaker(
    () => withRetry(operation, operationKey, retryConfig),
    operationKey,
    circuitConfig
  );
};

// ============================================================
// DEFENSIVE: QUERY TIMEOUT
// ============================================================

/**
 * DEFENSIVE: Default query timeout in milliseconds.
 * Prevents long-running queries from blocking resources.
 */
const DEFAULT_QUERY_TIMEOUT_MS = 30_000;

/**
 * DEFENSIVE: Execute operation with timeout.
 * Prevents queries from running indefinitely.
 */
export const withTimeout = async <T>(
  operation: () => Promise<Result<T, DbError>>,
  timeoutMs: number = DEFAULT_QUERY_TIMEOUT_MS,
  operationName: string = "query"
): Promise<Result<T, DbError>> => {
  const timeoutPromise = new Promise<Result<T, DbError>>((resolve) => {
    setTimeout(() => {
      resolve(err({ type: "timeout", operation: operationName }));
    }, timeoutMs);
  });

  return Promise.race([operation(), timeoutPromise]);
};

// ============================================================
// SUPABASE CLIENT HELPER
// ============================================================

/**
 * Gets the Supabase client.
 * RLS policies are enforced automatically based on the authenticated user.
 */
const getDbClient = async () => await createClient();

/**
 * Convert empty strings to null for database insertion.
 * Forms often send empty strings for optional fields,
 * but the database should store null for empty values.
 */
const emptyToNull = (value: string | null | undefined): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return value;
};

// ============================================================
// ROW MAPPERS
// ============================================================
// Convert database rows to domain types

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const mapProfileRow = (row: ProfileRow): Profile => ({
  id: profileId(row.id),
  userId: row.user_id,
  email: row.email,
  name: row.name,
  firmName: row.firm_name,
  licenseNumber: row.license_number,
  timezone: row.timezone,
  subscriptionTier: row.subscription_tier,
  bookingSlug: row.booking_slug,
  taxSeasonStart: row.tax_season_start ? new Date(row.tax_season_start) : null,
  taxSeasonEnd: row.tax_season_end ? new Date(row.tax_season_end) : null,
  maxDailyAppointments: row.max_daily_appointments,
  maxDailyAppointmentsTaxSeason: row.max_daily_appointments_tax_season,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

const mapClientRow = (row: ClientRow): Client => ({
  id: clientId(row.id),
  userId: row.user_id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  taxIdLast4: row.tax_id_last4,
  filingStatus: row.filing_status,
  preferredContact: row.preferred_contact,
  notes: row.notes,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];

const mapServiceRow = (row: ServiceRow): Service => ({
  id: serviceId(row.id),
  userId: row.user_id,
  name: row.name,
  description: row.description,
  durationMinutes: row.duration_minutes,
  price: row.price,
  taxSeasonOnly: row.tax_season_only,
  requiresDocuments: row.requires_documents,
  isActive: row.is_active,
  bufferMinutes: row.buffer_minutes,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

const mapAppointmentRow = (row: AppointmentRow): Appointment => ({
  id: appointmentId(row.id),
  userId: row.user_id,
  clientId: row.client_id,
  serviceId: row.service_id,
  startsAt: new Date(row.starts_at),
  endsAt: new Date(row.ends_at),
  status: row.status,
  notes: row.notes,
  meetingLink: row.meeting_link,
  reminderSent24h: row.reminder_sent_24h,
  reminderSent1h: row.reminder_sent_1h,
  cancellationReason: row.cancellation_reason,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

type AvailabilityRow = Database["public"]["Tables"]["availabilities"]["Row"];

const mapAvailabilityRow = (row: AvailabilityRow): Availability => ({
  id: availabilityId(row.id),
  userId: row.user_id,
  dayOfWeek: row.day_of_week,
  startTime: row.start_time,
  endTime: row.end_time,
  isTaxSeason: row.is_tax_season,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

const mapDocumentRow = (row: DocumentRow): Document => ({
  id: documentId(row.id),
  userId: row.user_id,
  clientId: row.client_id,
  appointmentId: row.appointment_id,
  documentType: row.document_type,
  fileUrl: row.file_url,
  fileName: row.file_name,
  status: row.status,
  taxYear: row.tax_year,
  notes: row.notes,
  rejectionReason: row.rejection_reason,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});


// ============================================================
// REPOSITORY FUNCTIONS
// ============================================================

// ------------------------------------------------------------
// Profile Repository
// ------------------------------------------------------------

/**
 * Creates a new Profile.
 */
export const createProfile = async (
  input: CreateProfileInput
): Promise<Result<Profile, DbError>> => {
  return withSpan('db.createProfile', async (span) => {
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'insert', table: 'profiles' },
      async () => client
        .from("profiles")
        .insert({
          user_id: input.userId!, // Always injected by API from session
          email: input.email,
          name: input.name,
          firm_name: emptyToNull(input.firmName),
          license_number: emptyToNull(input.licenseNumber),
          timezone: input.timezone,
          subscription_tier: input.subscriptionTier,
          booking_slug: emptyToNull(input.bookingSlug),
          tax_season_start: input.taxSeasonStart?.toISOString() ?? null,
          tax_season_end: input.taxSeasonEnd?.toISOString() ?? null,
          max_daily_appointments: input.maxDailyAppointments,
          max_daily_appointments_tax_season: input.maxDailyAppointmentsTaxSeason,
        })
        .select()
        .single()
    );

    if (error) {
      span.setStatus('error', 'insert_failed');
      logger.warn('Database insert failed', {
        table: 'profiles',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "createProfile"));
    }

    span.addEvent('created', { id: data.id });
    return ok(mapProfileRow(data));
  });
};

/**
 * Lists Profile with optional filters and pagination.
 * Respects RLS policies - only returns records the user can access.
 */
export const listProfile = async (
  filters?: ProfileFilters,
  pagination?: PaginationParams
): Promise<Result<PaginatedResponse<Profile>, DbError>> => {
  return withSpan('db.listProfile', async (span) => {
    const client = await getDbClient();

    const limit = Math.min(pagination?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = pagination?.offset ?? 0;

    span.addEvent('query_params', { limit, offset, hasFilters: !!filters });

    // Build query
    let query = client
      .from("profiles")
      .select("*", { count: "exact" });


    // Apply filters
    if (filters) {
      if (filters.email !== undefined) {
        if (Array.isArray(filters.email)) {
          query = query.in("email", filters.email);
        } else {
          query = query.eq("email", filters.email);
        }
      }
      if (filters.name !== undefined) {
        if (Array.isArray(filters.name)) {
          query = query.in("name", filters.name);
        } else {
          query = query.eq("name", filters.name);
        }
      }

      // Apply ordering
      if (filters.orderBy) {
        const column = filters.orderBy as string;
        const ascending = filters.orderDir !== "desc";
        query = query.order(column, { ascending });
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await timed(
      dbQueryDuration,
      { operation: 'select', table: 'profiles' },
      async () => query
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'profiles',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "listProfile"));
    }

    const total = count ?? 0;
    span.addEvent('query_complete', { resultCount: data.length, total });

    return ok({
      items: data.map(mapProfileRow),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    });
  });
};

/**
 * Gets a single Profile by ID.
 * Returns null in the value if not found (not an error).
 */
export const getProfile = async (
  id: ProfileId
): Promise<Result<Profile | null, DbError>> => {
  return withSpan('db.getProfile', async (span) => {
    span.addEvent('lookup', { entityId: id });
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'select_one', table: 'profiles' },
      async () => client
        .from("profiles")
        .select()
        .eq("id", id)
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'profiles',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "getProfile"));
    }

    span.addEvent('result', { found: !!data });
    return ok(data ? mapProfileRow(data) : null);
  });
};

/**
 * Updates a Profile by ID.
 * Returns null in the value if not found.
 */
export const updateProfile = async (
  id: ProfileId,
  input: UpdateProfileInput
): Promise<Result<Profile | null, DbError>> => {
  return withSpan('db.updateProfile', async (span) => {
    span.addEvent('update_request', { entityId: id });
    const client = await getDbClient();

    // Build update object, only including provided fields
    const updateData: Record<string, unknown> = {};
    if (input.userId !== undefined) {
      updateData.user_id = input.userId;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.firmName !== undefined) {
      updateData.firm_name = input.firmName;
    }
    if (input.licenseNumber !== undefined) {
      updateData.license_number = input.licenseNumber;
    }
    if (input.timezone !== undefined) {
      updateData.timezone = input.timezone;
    }
    if (input.subscriptionTier !== undefined) {
      updateData.subscription_tier = input.subscriptionTier;
    }
    if (input.bookingSlug !== undefined) {
      updateData.booking_slug = input.bookingSlug;
    }
    if (input.taxSeasonStart !== undefined) {
      updateData.tax_season_start = input.taxSeasonStart?.toISOString() ?? null;
    }
    if (input.taxSeasonEnd !== undefined) {
      updateData.tax_season_end = input.taxSeasonEnd?.toISOString() ?? null;
    }
    if (input.maxDailyAppointments !== undefined) {
      updateData.max_daily_appointments = input.maxDailyAppointments;
    }
    if (input.maxDailyAppointmentsTaxSeason !== undefined) {
      updateData.max_daily_appointments_tax_season = input.maxDailyAppointmentsTaxSeason;
    }

    // Don't update if no fields provided
    if (Object.keys(updateData).length === 0) {
      span.addEvent('no_changes');
      return getProfile(id);
    }

    span.addEvent('fields_to_update', { fieldCount: Object.keys(updateData).length });

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'update', table: 'profiles' },
      async () => client
        .from("profiles")
        .update(updateData)
        .eq("id", id)
        .select()
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'update_failed');
      logger.warn('Database update failed', {
        table: 'profiles',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "updateProfile"));
    }

    span.addEvent('updated', { found: !!data });
    return ok(data ? mapProfileRow(data) : null);
  });
};

/**
 * Deletes a Profile by ID.
 * Performs hard delete - permanently removes the row.
 */
export const deleteProfile = async (
  id: ProfileId
): Promise<Result<void, DbError>> => {
  return withSpan('db.deleteProfile', async (span) => {
    span.addEvent('delete_request', { entityId: id, softDelete: false });
    const client = await getDbClient();

    // Hard delete
    const { error } = await timed(
      dbQueryDuration,
      { operation: 'delete', table: 'profiles' },
      async () => client
        .from("profiles")
        .delete()
        .eq("id", id)
    );

    if (error) {
      span.setStatus('error', 'delete_failed');
      logger.warn('Database delete failed', {
        table: 'profiles',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "deleteProfile"));
    }

    span.addEvent('deleted');
    return ok(undefined);
  });
};


// ------------------------------------------------------------
// Client Repository
// ------------------------------------------------------------

/**
 * Creates a new Client.
 */
export const insertClient = async (
  input: CreateClientInput
): Promise<Result<Client, DbError>> => {
  return withSpan('db.insertClient', async (span) => {
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'insert', table: 'clients' },
      async () => client
        .from("clients")
        .insert({
          user_id: input.userId!, // Always injected by API from session
          name: input.name,
          email: input.email,
          phone: emptyToNull(input.phone),
          tax_id_last4: emptyToNull(input.taxIdLast4),
          filing_status: emptyToNull(input.filingStatus),
          preferred_contact: input.preferredContact,
          notes: emptyToNull(input.notes),
        })
        .select()
        .single()
    );

    if (error) {
      span.setStatus('error', 'insert_failed');
      logger.warn('Database insert failed', {
        table: 'clients',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "insertClient"));
    }

    span.addEvent('created', { id: data.id });
    return ok(mapClientRow(data));
  });
};

/**
 * Lists Client with optional filters and pagination.
 * Respects RLS policies - only returns records the user can access.
 */
export const listClient = async (
  filters?: ClientFilters,
  pagination?: PaginationParams
): Promise<Result<PaginatedResponse<Client>, DbError>> => {
  return withSpan('db.listClient', async (span) => {
    const client = await getDbClient();

    const limit = Math.min(pagination?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = pagination?.offset ?? 0;

    span.addEvent('query_params', { limit, offset, hasFilters: !!filters });

    // Build query
    let query = client
      .from("clients")
      .select("*", { count: "exact" });


    // Apply filters
    if (filters) {
      if (filters.name !== undefined) {
        if (Array.isArray(filters.name)) {
          query = query.in("name", filters.name);
        } else {
          query = query.eq("name", filters.name);
        }
      }
      if (filters.email !== undefined) {
        if (Array.isArray(filters.email)) {
          query = query.in("email", filters.email);
        } else {
          query = query.eq("email", filters.email);
        }
      }
      if (filters.phone !== undefined) {
        if (Array.isArray(filters.phone)) {
          query = query.in("phone", filters.phone);
        } else {
          query = query.eq("phone", filters.phone);
        }
      }

      // Apply ordering
      if (filters.orderBy) {
        const column = filters.orderBy as string;
        const ascending = filters.orderDir !== "desc";
        query = query.order(column, { ascending });
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await timed(
      dbQueryDuration,
      { operation: 'select', table: 'clients' },
      async () => query
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'clients',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "listClient"));
    }

    const total = count ?? 0;
    span.addEvent('query_complete', { resultCount: data.length, total });

    return ok({
      items: data.map(mapClientRow),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    });
  });
};

/**
 * Gets a single Client by ID.
 * Returns null in the value if not found (not an error).
 */
export const getClient = async (
  id: ClientId
): Promise<Result<Client | null, DbError>> => {
  return withSpan('db.getClient', async (span) => {
    span.addEvent('lookup', { entityId: id });
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'select_one', table: 'clients' },
      async () => client
        .from("clients")
        .select()
        .eq("id", id)
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'clients',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "getClient"));
    }

    span.addEvent('result', { found: !!data });
    return ok(data ? mapClientRow(data) : null);
  });
};

/**
 * Updates a Client by ID.
 * Returns null in the value if not found.
 */
export const updateClient = async (
  id: ClientId,
  input: UpdateClientInput
): Promise<Result<Client | null, DbError>> => {
  return withSpan('db.updateClient', async (span) => {
    span.addEvent('update_request', { entityId: id });
    const client = await getDbClient();

    // Build update object, only including provided fields
    const updateData: Record<string, unknown> = {};
    if (input.userId !== undefined) {
      updateData.user_id = input.userId;
    }
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.taxIdLast4 !== undefined) {
      updateData.tax_id_last4 = input.taxIdLast4;
    }
    if (input.filingStatus !== undefined) {
      updateData.filing_status = input.filingStatus;
    }
    if (input.preferredContact !== undefined) {
      updateData.preferred_contact = input.preferredContact;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Don't update if no fields provided
    if (Object.keys(updateData).length === 0) {
      span.addEvent('no_changes');
      return getClient(id);
    }

    span.addEvent('fields_to_update', { fieldCount: Object.keys(updateData).length });

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'update', table: 'clients' },
      async () => client
        .from("clients")
        .update(updateData)
        .eq("id", id)
        .select()
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'update_failed');
      logger.warn('Database update failed', {
        table: 'clients',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "updateClient"));
    }

    span.addEvent('updated', { found: !!data });
    return ok(data ? mapClientRow(data) : null);
  });
};

/**
 * Deletes a Client by ID.
 * Performs hard delete - permanently removes the row.
 */
export const deleteClient = async (
  id: ClientId
): Promise<Result<void, DbError>> => {
  return withSpan('db.deleteClient', async (span) => {
    span.addEvent('delete_request', { entityId: id, softDelete: false });
    const client = await getDbClient();

    // Hard delete
    const { error } = await timed(
      dbQueryDuration,
      { operation: 'delete', table: 'clients' },
      async () => client
        .from("clients")
        .delete()
        .eq("id", id)
    );

    if (error) {
      span.setStatus('error', 'delete_failed');
      logger.warn('Database delete failed', {
        table: 'clients',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "deleteClient"));
    }

    span.addEvent('deleted');
    return ok(undefined);
  });
};


// ------------------------------------------------------------
// Service Repository
// ------------------------------------------------------------

/**
 * Creates a new Service.
 */
export const createService = async (
  input: CreateServiceInput
): Promise<Result<Service, DbError>> => {
  return withSpan('db.createService', async (span) => {
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'insert', table: 'services' },
      async () => client
        .from("services")
        .insert({
          user_id: input.userId!, // Always injected by API from session
          name: input.name,
          description: emptyToNull(input.description),
          duration_minutes: input.durationMinutes,
          price: input.price ?? null,
          tax_season_only: input.taxSeasonOnly,
          requires_documents: input.requiresDocuments,
          is_active: input.isActive,
          buffer_minutes: input.bufferMinutes,
        })
        .select()
        .single()
    );

    if (error) {
      span.setStatus('error', 'insert_failed');
      logger.warn('Database insert failed', {
        table: 'services',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "createService"));
    }

    span.addEvent('created', { id: data.id });
    return ok(mapServiceRow(data));
  });
};

/**
 * Lists Service with optional filters and pagination.
 * Respects RLS policies - only returns records the user can access.
 */
export const listService = async (
  filters?: ServiceFilters,
  pagination?: PaginationParams
): Promise<Result<PaginatedResponse<Service>, DbError>> => {
  return withSpan('db.listService', async (span) => {
    const client = await getDbClient();

    const limit = Math.min(pagination?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = pagination?.offset ?? 0;

    span.addEvent('query_params', { limit, offset, hasFilters: !!filters });

    // Build query
    let query = client
      .from("services")
      .select("*", { count: "exact" });


    // Apply filters
    if (filters) {
      if (filters.name !== undefined) {
        if (Array.isArray(filters.name)) {
          query = query.in("name", filters.name);
        } else {
          query = query.eq("name", filters.name);
        }
      }

      // Apply ordering
      if (filters.orderBy) {
        const column = filters.orderBy as string;
        const ascending = filters.orderDir !== "desc";
        query = query.order(column, { ascending });
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await timed(
      dbQueryDuration,
      { operation: 'select', table: 'services' },
      async () => query
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'services',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "listService"));
    }

    const total = count ?? 0;
    span.addEvent('query_complete', { resultCount: data.length, total });

    return ok({
      items: data.map(mapServiceRow),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    });
  });
};

/**
 * Gets a single Service by ID.
 * Returns null in the value if not found (not an error).
 */
export const getService = async (
  id: ServiceId
): Promise<Result<Service | null, DbError>> => {
  return withSpan('db.getService', async (span) => {
    span.addEvent('lookup', { entityId: id });
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'select_one', table: 'services' },
      async () => client
        .from("services")
        .select()
        .eq("id", id)
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'services',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "getService"));
    }

    span.addEvent('result', { found: !!data });
    return ok(data ? mapServiceRow(data) : null);
  });
};

/**
 * Updates a Service by ID.
 * Returns null in the value if not found.
 */
export const updateService = async (
  id: ServiceId,
  input: UpdateServiceInput
): Promise<Result<Service | null, DbError>> => {
  return withSpan('db.updateService', async (span) => {
    span.addEvent('update_request', { entityId: id });
    const client = await getDbClient();

    // Build update object, only including provided fields
    const updateData: Record<string, unknown> = {};
    if (input.userId !== undefined) {
      updateData.user_id = input.userId;
    }
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.durationMinutes !== undefined) {
      updateData.duration_minutes = input.durationMinutes;
    }
    if (input.price !== undefined) {
      updateData.price = input.price;
    }
    if (input.taxSeasonOnly !== undefined) {
      updateData.tax_season_only = input.taxSeasonOnly;
    }
    if (input.requiresDocuments !== undefined) {
      updateData.requires_documents = input.requiresDocuments;
    }
    if (input.isActive !== undefined) {
      updateData.is_active = input.isActive;
    }
    if (input.bufferMinutes !== undefined) {
      updateData.buffer_minutes = input.bufferMinutes;
    }

    // Don't update if no fields provided
    if (Object.keys(updateData).length === 0) {
      span.addEvent('no_changes');
      return getService(id);
    }

    span.addEvent('fields_to_update', { fieldCount: Object.keys(updateData).length });

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'update', table: 'services' },
      async () => client
        .from("services")
        .update(updateData)
        .eq("id", id)
        .select()
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'update_failed');
      logger.warn('Database update failed', {
        table: 'services',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "updateService"));
    }

    span.addEvent('updated', { found: !!data });
    return ok(data ? mapServiceRow(data) : null);
  });
};

/**
 * Deletes a Service by ID.
 * Performs hard delete - permanently removes the row.
 */
export const deleteService = async (
  id: ServiceId
): Promise<Result<void, DbError>> => {
  return withSpan('db.deleteService', async (span) => {
    span.addEvent('delete_request', { entityId: id, softDelete: false });
    const client = await getDbClient();

    // Hard delete
    const { error } = await timed(
      dbQueryDuration,
      { operation: 'delete', table: 'services' },
      async () => client
        .from("services")
        .delete()
        .eq("id", id)
    );

    if (error) {
      span.setStatus('error', 'delete_failed');
      logger.warn('Database delete failed', {
        table: 'services',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "deleteService"));
    }

    span.addEvent('deleted');
    return ok(undefined);
  });
};


// ------------------------------------------------------------
// Appointment Repository
// ------------------------------------------------------------

/**
 * Creates a new Appointment.
 */
export const createAppointment = async (
  input: CreateAppointmentInput
): Promise<Result<Appointment, DbError>> => {
  return withSpan('db.createAppointment', async (span) => {
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'insert', table: 'appointments' },
      async () => client
        .from("appointments")
        .insert({
          user_id: input.userId!, // Always injected by API from session
          client_id: input.clientId,
          service_id: input.serviceId,
          starts_at: input.startsAt.toISOString(),
          ends_at: input.endsAt.toISOString(),
          status: input.status,
          notes: emptyToNull(input.notes),
          meeting_link: emptyToNull(input.meetingLink),
          reminder_sent_24h: input.reminderSent24h,
          reminder_sent_1h: input.reminderSent1h,
          cancellation_reason: emptyToNull(input.cancellationReason),
        })
        .select()
        .single()
    );

    if (error) {
      span.setStatus('error', 'insert_failed');
      logger.warn('Database insert failed', {
        table: 'appointments',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "createAppointment"));
    }

    span.addEvent('created', { id: data.id });
    return ok(mapAppointmentRow(data));
  });
};

/**
 * Lists Appointment with optional filters and pagination.
 * Respects RLS policies - only returns records the user can access.
 */
export const listAppointment = async (
  filters?: AppointmentFilters,
  pagination?: PaginationParams
): Promise<Result<PaginatedResponse<Appointment>, DbError>> => {
  return withSpan('db.listAppointment', async (span) => {
    const client = await getDbClient();

    const limit = Math.min(pagination?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = pagination?.offset ?? 0;

    span.addEvent('query_params', { limit, offset, hasFilters: !!filters });

    // Build query
    let query = client
      .from("appointments")
      .select("*", { count: "exact" });


    // Apply filters
    if (filters) {
      if (filters.startsAt !== undefined) {
        const toISOString = (v: Date | string): string =>
          typeof v === 'string' ? v : v.toISOString();
        if (Array.isArray(filters.startsAt)) {
          query = query.in("starts_at", filters.startsAt.map(toISOString));
        } else {
          query = query.eq("starts_at", toISOString(filters.startsAt));
        }
      }

      // Apply ordering
      if (filters.orderBy) {
        const column = filters.orderBy as string;
        const ascending = filters.orderDir !== "desc";
        query = query.order(column, { ascending });
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await timed(
      dbQueryDuration,
      { operation: 'select', table: 'appointments' },
      async () => query
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'appointments',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "listAppointment"));
    }

    const total = count ?? 0;
    span.addEvent('query_complete', { resultCount: data.length, total });

    return ok({
      items: data.map(mapAppointmentRow),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    });
  });
};

/**
 * Gets a single Appointment by ID.
 * Returns null in the value if not found (not an error).
 */
export const getAppointment = async (
  id: AppointmentId
): Promise<Result<Appointment | null, DbError>> => {
  return withSpan('db.getAppointment', async (span) => {
    span.addEvent('lookup', { entityId: id });
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'select_one', table: 'appointments' },
      async () => client
        .from("appointments")
        .select()
        .eq("id", id)
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'appointments',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "getAppointment"));
    }

    span.addEvent('result', { found: !!data });
    return ok(data ? mapAppointmentRow(data) : null);
  });
};

/**
 * Updates a Appointment by ID.
 * Returns null in the value if not found.
 */
export const updateAppointment = async (
  id: AppointmentId,
  input: UpdateAppointmentInput
): Promise<Result<Appointment | null, DbError>> => {
  return withSpan('db.updateAppointment', async (span) => {
    span.addEvent('update_request', { entityId: id });
    const client = await getDbClient();

    // Build update object, only including provided fields
    const updateData: Record<string, unknown> = {};
    if (input.userId !== undefined) {
      updateData.user_id = input.userId;
    }
    if (input.clientId !== undefined) {
      updateData.client_id = input.clientId;
    }
    if (input.serviceId !== undefined) {
      updateData.service_id = input.serviceId;
    }
    if (input.startsAt !== undefined) {
      updateData.starts_at = input.startsAt?.toISOString() ?? null;
    }
    if (input.endsAt !== undefined) {
      updateData.ends_at = input.endsAt?.toISOString() ?? null;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }
    if (input.meetingLink !== undefined) {
      updateData.meeting_link = input.meetingLink;
    }
    if (input.reminderSent24h !== undefined) {
      updateData.reminder_sent_24h = input.reminderSent24h;
    }
    if (input.reminderSent1h !== undefined) {
      updateData.reminder_sent_1h = input.reminderSent1h;
    }
    if (input.cancellationReason !== undefined) {
      updateData.cancellation_reason = input.cancellationReason;
    }

    // Don't update if no fields provided
    if (Object.keys(updateData).length === 0) {
      span.addEvent('no_changes');
      return getAppointment(id);
    }

    span.addEvent('fields_to_update', { fieldCount: Object.keys(updateData).length });

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'update', table: 'appointments' },
      async () => client
        .from("appointments")
        .update(updateData)
        .eq("id", id)
        .select()
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'update_failed');
      logger.warn('Database update failed', {
        table: 'appointments',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "updateAppointment"));
    }

    span.addEvent('updated', { found: !!data });
    return ok(data ? mapAppointmentRow(data) : null);
  });
};

/**
 * Deletes a Appointment by ID.
 * Performs hard delete - permanently removes the row.
 */
export const deleteAppointment = async (
  id: AppointmentId
): Promise<Result<void, DbError>> => {
  return withSpan('db.deleteAppointment', async (span) => {
    span.addEvent('delete_request', { entityId: id, softDelete: false });
    const client = await getDbClient();

    // Hard delete
    const { error } = await timed(
      dbQueryDuration,
      { operation: 'delete', table: 'appointments' },
      async () => client
        .from("appointments")
        .delete()
        .eq("id", id)
    );

    if (error) {
      span.setStatus('error', 'delete_failed');
      logger.warn('Database delete failed', {
        table: 'appointments',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "deleteAppointment"));
    }

    span.addEvent('deleted');
    return ok(undefined);
  });
};

// ------------------------------------------------------------
// Appointment State Machine Transitions
// ------------------------------------------------------------

/** Valid states for Appointment */
export const appointmentStates = [
  "draft",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentState = typeof appointmentStates[number];

/** Valid transition names for Appointment */
export const appointmentTransitionNames = [
  "confirm",
  "start",
  "complete",
  "cancel",
  "cancelDraft",
  "markNoShow",
] as const;

export type AppointmentTransitionName = typeof appointmentTransitionNames[number];

/** Transition definitions - maps transition name to valid from->to state pairs */
export const appointmentTransitions: Record<AppointmentTransitionName, { fromStates: string[]; toState: (from: string) => string }> = {
  "confirm": {
    fromStates: ["draft"],
    toState: (from: string) => {
      if (from === "draft") return "confirmed";
      return ""; // Invalid from state
    },
  },
  "start": {
    fromStates: ["confirmed"],
    toState: (from: string) => {
      if (from === "confirmed") return "in_progress";
      return ""; // Invalid from state
    },
  },
  "complete": {
    fromStates: ["in_progress"],
    toState: (from: string) => {
      if (from === "in_progress") return "completed";
      return ""; // Invalid from state
    },
  },
  "cancel": {
    fromStates: ["confirmed"],
    toState: (from: string) => {
      if (from === "confirmed") return "cancelled";
      return ""; // Invalid from state
    },
  },
  "cancelDraft": {
    fromStates: ["draft"],
    toState: (from: string) => {
      if (from === "draft") return "cancelled";
      return ""; // Invalid from state
    },
  },
  "markNoShow": {
    fromStates: ["confirmed"],
    toState: (from: string) => {
      if (from === "confirmed") return "no_show";
      return ""; // Invalid from state
    },
  },
};

/** State machine transition error */
export interface AppointmentTransitionError {
  readonly type: "invalid_transition";
  readonly entityId: AppointmentId;
  readonly currentState: string;
  readonly attemptedTransition: string;
  readonly allowedTransitions: readonly string[];
}

/**
 * Gets the allowed transitions for a Appointment in its current state.
 */
export const getAppointmentAllowedTransitions = (
  currentState: string
): readonly AppointmentTransitionName[] => {
  const allowed: AppointmentTransitionName[] = [];
  if (currentState === "draft") {
    allowed.push("confirm");
  }
  if (currentState === "confirmed") {
    allowed.push("start");
  }
  if (currentState === "in_progress") {
    allowed.push("complete");
  }
  if (currentState === "confirmed") {
    allowed.push("cancel");
  }
  if (currentState === "draft") {
    allowed.push("cancelDraft");
  }
  if (currentState === "confirmed") {
    allowed.push("markNoShow");
  }
  return allowed;
};

/**
 * Validates if a transition is allowed for a Appointment.
 */
export const validateAppointmentTransition = (
  currentState: string,
  transition: AppointmentTransitionName
): boolean => {
  const transitionDef = appointmentTransitions[transition];
  return transitionDef?.fromStates.includes(currentState) ?? false;
};

/**
 * Performs the "confirm" transition on a Appointment.
 * Valid from states: "draft"
 * Confirm
 *
 * @param id - The Appointment ID
 * @returns The updated Appointment or an error if the transition is invalid
 */
export const confirmAppointment = async (
  id: AppointmentId
): Promise<Result<Appointment, DbError | AppointmentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("appointments")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "confirmAppointment"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "confirmAppointment", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["draft"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "confirm",
      allowedTransitions: getAppointmentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = appointmentTransitions["confirm"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("appointments")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "confirmAppointment"));
  }

  return ok(mapAppointmentRow(data));
};

/**
 * Performs the "start" transition on a Appointment.
 * Valid from states: "confirmed"
 * Start
 *
 * @param id - The Appointment ID
 * @returns The updated Appointment or an error if the transition is invalid
 */
export const startAppointment = async (
  id: AppointmentId
): Promise<Result<Appointment, DbError | AppointmentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("appointments")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "startAppointment"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "startAppointment", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["confirmed"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "start",
      allowedTransitions: getAppointmentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = appointmentTransitions["start"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("appointments")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "startAppointment"));
  }

  return ok(mapAppointmentRow(data));
};

/**
 * Performs the "complete" transition on a Appointment.
 * Valid from states: "in_progress"
 * Complete
 *
 * @param id - The Appointment ID
 * @returns The updated Appointment or an error if the transition is invalid
 */
export const completeAppointment = async (
  id: AppointmentId
): Promise<Result<Appointment, DbError | AppointmentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("appointments")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "completeAppointment"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "completeAppointment", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["in_progress"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "complete",
      allowedTransitions: getAppointmentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = appointmentTransitions["complete"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("appointments")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "completeAppointment"));
  }

  return ok(mapAppointmentRow(data));
};

/**
 * Performs the "cancel" transition on a Appointment.
 * Valid from states: "confirmed"
 * Cancel
 *
 * @param id - The Appointment ID
 * @returns The updated Appointment or an error if the transition is invalid
 */
export const cancelAppointment = async (
  id: AppointmentId
): Promise<Result<Appointment, DbError | AppointmentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("appointments")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "cancelAppointment"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "cancelAppointment", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["confirmed"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "cancel",
      allowedTransitions: getAppointmentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = appointmentTransitions["cancel"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("appointments")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "cancelAppointment"));
  }

  return ok(mapAppointmentRow(data));
};

/**
 * Performs the "cancel_draft" transition on a Appointment.
 * Valid from states: "draft"
 * Cancel
 *
 * @param id - The Appointment ID
 * @returns The updated Appointment or an error if the transition is invalid
 */
export const cancelDraftAppointment = async (
  id: AppointmentId
): Promise<Result<Appointment, DbError | AppointmentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("appointments")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "cancelDraftAppointment"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "cancelDraftAppointment", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["draft"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "cancel_draft",
      allowedTransitions: getAppointmentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = appointmentTransitions["cancelDraft"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("appointments")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "cancelDraftAppointment"));
  }

  return ok(mapAppointmentRow(data));
};

/**
 * Performs the "mark_no_show" transition on a Appointment.
 * Valid from states: "confirmed"
 * No Show
 *
 * @param id - The Appointment ID
 * @returns The updated Appointment or an error if the transition is invalid
 */
export const markNoShowAppointment = async (
  id: AppointmentId
): Promise<Result<Appointment, DbError | AppointmentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("appointments")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "markNoShowAppointment"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "markNoShowAppointment", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["confirmed"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "mark_no_show",
      allowedTransitions: getAppointmentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = appointmentTransitions["markNoShow"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("appointments")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "markNoShowAppointment"));
  }

  return ok(mapAppointmentRow(data));
};

/**
 * Performs any valid transition on a Appointment.
 * This is a generic transition handler that validates the transition before executing.
 *
 * @param id - The Appointment ID
 * @param transition - The transition name to perform
 * @returns The updated Appointment or an error
 */
export const transitionAppointment = async (
  id: AppointmentId,
  transition: AppointmentTransitionName
): Promise<Result<Appointment, DbError | AppointmentTransitionError>> => {
  switch (transition) {
    case "confirm":
      return confirmAppointment(id);
    case "start":
      return startAppointment(id);
    case "complete":
      return completeAppointment(id);
    case "cancel":
      return cancelAppointment(id);
    case "cancelDraft":
      return cancelDraftAppointment(id);
    case "markNoShow":
      return markNoShowAppointment(id);
    default:
      // TypeScript should catch this, but just in case
      return err({
        type: "invalid_transition",
        entityId: id,
        currentState: "unknown",
        attemptedTransition: transition as string,
        allowedTransitions: [],
      });
  }
};

// ------------------------------------------------------------
// Availability Repository
// ------------------------------------------------------------

/**
 * Creates a new Availability.
 */
export const createAvailability = async (
  input: CreateAvailabilityInput
): Promise<Result<Availability, DbError>> => {
  return withSpan('db.createAvailability', async (span) => {
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'insert', table: 'availabilities' },
      async () => client
        .from("availabilities")
        .insert({
          user_id: input.userId!, // Always injected by API from session
          day_of_week: input.dayOfWeek,
          start_time: input.startTime,
          end_time: input.endTime,
          is_tax_season: input.isTaxSeason,
        })
        .select()
        .single()
    );

    if (error) {
      span.setStatus('error', 'insert_failed');
      logger.warn('Database insert failed', {
        table: 'availabilities',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "createAvailability"));
    }

    span.addEvent('created', { id: data.id });
    return ok(mapAvailabilityRow(data));
  });
};

/**
 * Lists Availability with optional filters and pagination.
 * Respects RLS policies - only returns records the user can access.
 */
export const listAvailability = async (
  filters?: AvailabilityFilters,
  pagination?: PaginationParams
): Promise<Result<PaginatedResponse<Availability>, DbError>> => {
  return withSpan('db.listAvailability', async (span) => {
    const client = await getDbClient();

    const limit = Math.min(pagination?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = pagination?.offset ?? 0;

    span.addEvent('query_params', { limit, offset, hasFilters: !!filters });

    // Build query
    let query = client
      .from("availabilities")
      .select("*", { count: "exact" });


    // Apply filters
    if (filters) {

      // Apply ordering
      if (filters.orderBy) {
        const column = filters.orderBy as string;
        const ascending = filters.orderDir !== "desc";
        query = query.order(column, { ascending });
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await timed(
      dbQueryDuration,
      { operation: 'select', table: 'availabilities' },
      async () => query
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'availabilities',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "listAvailability"));
    }

    const total = count ?? 0;
    span.addEvent('query_complete', { resultCount: data.length, total });

    return ok({
      items: data.map(mapAvailabilityRow),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    });
  });
};

/**
 * Gets a single Availability by ID.
 * Returns null in the value if not found (not an error).
 */
export const getAvailability = async (
  id: AvailabilityId
): Promise<Result<Availability | null, DbError>> => {
  return withSpan('db.getAvailability', async (span) => {
    span.addEvent('lookup', { entityId: id });
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'select_one', table: 'availabilities' },
      async () => client
        .from("availabilities")
        .select()
        .eq("id", id)
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'availabilities',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "getAvailability"));
    }

    span.addEvent('result', { found: !!data });
    return ok(data ? mapAvailabilityRow(data) : null);
  });
};

/**
 * Updates a Availability by ID.
 * Returns null in the value if not found.
 */
export const updateAvailability = async (
  id: AvailabilityId,
  input: UpdateAvailabilityInput
): Promise<Result<Availability | null, DbError>> => {
  return withSpan('db.updateAvailability', async (span) => {
    span.addEvent('update_request', { entityId: id });
    const client = await getDbClient();

    // Build update object, only including provided fields
    const updateData: Record<string, unknown> = {};
    if (input.userId !== undefined) {
      updateData.user_id = input.userId;
    }
    if (input.dayOfWeek !== undefined) {
      updateData.day_of_week = input.dayOfWeek;
    }
    if (input.startTime !== undefined) {
      updateData.start_time = input.startTime;
    }
    if (input.endTime !== undefined) {
      updateData.end_time = input.endTime;
    }
    if (input.isTaxSeason !== undefined) {
      updateData.is_tax_season = input.isTaxSeason;
    }

    // Don't update if no fields provided
    if (Object.keys(updateData).length === 0) {
      span.addEvent('no_changes');
      return getAvailability(id);
    }

    span.addEvent('fields_to_update', { fieldCount: Object.keys(updateData).length });

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'update', table: 'availabilities' },
      async () => client
        .from("availabilities")
        .update(updateData)
        .eq("id", id)
        .select()
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'update_failed');
      logger.warn('Database update failed', {
        table: 'availabilities',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "updateAvailability"));
    }

    span.addEvent('updated', { found: !!data });
    return ok(data ? mapAvailabilityRow(data) : null);
  });
};

/**
 * Deletes a Availability by ID.
 * Performs hard delete - permanently removes the row.
 */
export const deleteAvailability = async (
  id: AvailabilityId
): Promise<Result<void, DbError>> => {
  return withSpan('db.deleteAvailability', async (span) => {
    span.addEvent('delete_request', { entityId: id, softDelete: false });
    const client = await getDbClient();

    // Hard delete
    const { error } = await timed(
      dbQueryDuration,
      { operation: 'delete', table: 'availabilities' },
      async () => client
        .from("availabilities")
        .delete()
        .eq("id", id)
    );

    if (error) {
      span.setStatus('error', 'delete_failed');
      logger.warn('Database delete failed', {
        table: 'availabilities',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "deleteAvailability"));
    }

    span.addEvent('deleted');
    return ok(undefined);
  });
};


// ------------------------------------------------------------
// Document Repository
// ------------------------------------------------------------

/**
 * Creates a new Document.
 */
export const createDocument = async (
  input: CreateDocumentInput
): Promise<Result<Document, DbError>> => {
  return withSpan('db.createDocument', async (span) => {
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'insert', table: 'documents' },
      async () => client
        .from("documents")
        .insert({
          user_id: input.userId!, // Always injected by API from session
          client_id: input.clientId,
          appointment_id: input.appointmentId ?? null,
          document_type: input.documentType,
          file_url: emptyToNull(input.fileUrl),
          file_name: emptyToNull(input.fileName),
          status: input.status,
          tax_year: input.taxYear ?? null,
          notes: emptyToNull(input.notes),
          rejection_reason: emptyToNull(input.rejectionReason),
        })
        .select()
        .single()
    );

    if (error) {
      span.setStatus('error', 'insert_failed');
      logger.warn('Database insert failed', {
        table: 'documents',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "createDocument"));
    }

    span.addEvent('created', { id: data.id });
    return ok(mapDocumentRow(data));
  });
};

/**
 * Lists Document with optional filters and pagination.
 * Respects RLS policies - only returns records the user can access.
 */
export const listDocument = async (
  filters?: DocumentFilters,
  pagination?: PaginationParams
): Promise<Result<PaginatedResponse<Document>, DbError>> => {
  return withSpan('db.listDocument', async (span) => {
    const client = await getDbClient();

    const limit = Math.min(pagination?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = pagination?.offset ?? 0;

    span.addEvent('query_params', { limit, offset, hasFilters: !!filters });

    // Build query
    let query = client
      .from("documents")
      .select("*", { count: "exact" });


    // Apply filters
    if (filters) {

      // Apply ordering
      if (filters.orderBy) {
        const column = filters.orderBy as string;
        const ascending = filters.orderDir !== "desc";
        query = query.order(column, { ascending });
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await timed(
      dbQueryDuration,
      { operation: 'select', table: 'documents' },
      async () => query
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'documents',
        errorMessage: error.message,
      });
      return err(mapDbError(error, "listDocument"));
    }

    const total = count ?? 0;
    span.addEvent('query_complete', { resultCount: data.length, total });

    return ok({
      items: data.map(mapDocumentRow),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    });
  });
};

/**
 * Gets a single Document by ID.
 * Returns null in the value if not found (not an error).
 */
export const getDocument = async (
  id: DocumentId
): Promise<Result<Document | null, DbError>> => {
  return withSpan('db.getDocument', async (span) => {
    span.addEvent('lookup', { entityId: id });
    const client = await getDbClient();

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'select_one', table: 'documents' },
      async () => client
        .from("documents")
        .select()
        .eq("id", id)
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'select_failed');
      logger.warn('Database select failed', {
        table: 'documents',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "getDocument"));
    }

    span.addEvent('result', { found: !!data });
    return ok(data ? mapDocumentRow(data) : null);
  });
};

/**
 * Updates a Document by ID.
 * Returns null in the value if not found.
 */
export const updateDocument = async (
  id: DocumentId,
  input: UpdateDocumentInput
): Promise<Result<Document | null, DbError>> => {
  return withSpan('db.updateDocument', async (span) => {
    span.addEvent('update_request', { entityId: id });
    const client = await getDbClient();

    // Build update object, only including provided fields
    const updateData: Record<string, unknown> = {};
    if (input.userId !== undefined) {
      updateData.user_id = input.userId;
    }
    if (input.clientId !== undefined) {
      updateData.client_id = input.clientId;
    }
    if (input.appointmentId !== undefined) {
      updateData.appointment_id = input.appointmentId;
    }
    if (input.documentType !== undefined) {
      updateData.document_type = input.documentType;
    }
    if (input.fileUrl !== undefined) {
      updateData.file_url = input.fileUrl;
    }
    if (input.fileName !== undefined) {
      updateData.file_name = input.fileName;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.taxYear !== undefined) {
      updateData.tax_year = input.taxYear;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }
    if (input.rejectionReason !== undefined) {
      updateData.rejection_reason = input.rejectionReason;
    }

    // Don't update if no fields provided
    if (Object.keys(updateData).length === 0) {
      span.addEvent('no_changes');
      return getDocument(id);
    }

    span.addEvent('fields_to_update', { fieldCount: Object.keys(updateData).length });

    const { data, error } = await timed(
      dbQueryDuration,
      { operation: 'update', table: 'documents' },
      async () => client
        .from("documents")
        .update(updateData)
        .eq("id", id)
        .select()
        .maybeSingle()
    );

    if (error) {
      span.setStatus('error', 'update_failed');
      logger.warn('Database update failed', {
        table: 'documents',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "updateDocument"));
    }

    span.addEvent('updated', { found: !!data });
    return ok(data ? mapDocumentRow(data) : null);
  });
};

/**
 * Deletes a Document by ID.
 * Performs hard delete - permanently removes the row.
 */
export const deleteDocument = async (
  id: DocumentId
): Promise<Result<void, DbError>> => {
  return withSpan('db.deleteDocument', async (span) => {
    span.addEvent('delete_request', { entityId: id, softDelete: false });
    const client = await getDbClient();

    // Hard delete
    const { error } = await timed(
      dbQueryDuration,
      { operation: 'delete', table: 'documents' },
      async () => client
        .from("documents")
        .delete()
        .eq("id", id)
    );

    if (error) {
      span.setStatus('error', 'delete_failed');
      logger.warn('Database delete failed', {
        table: 'documents',
        entityId: id,
        errorMessage: error.message,
      });
      return err(mapDbError(error, "deleteDocument"));
    }

    span.addEvent('deleted');
    return ok(undefined);
  });
};

// ------------------------------------------------------------
// Document State Machine Transitions
// ------------------------------------------------------------

/** Valid states for Document */
export const documentStates = [
  "requested",
  "uploaded",
  "reviewed",
  "accepted",
  "rejected",
] as const;

export type DocumentState = typeof documentStates[number];

/** Valid transition names for Document */
export const documentTransitionNames = [
  "upload",
  "review",
  "accept",
  "reject",
  "reupload",
] as const;

export type DocumentTransitionName = typeof documentTransitionNames[number];

/** Transition definitions - maps transition name to valid from->to state pairs */
export const documentTransitions: Record<DocumentTransitionName, { fromStates: string[]; toState: (from: string) => string }> = {
  "upload": {
    fromStates: ["requested"],
    toState: (from: string) => {
      if (from === "requested") return "uploaded";
      return ""; // Invalid from state
    },
  },
  "review": {
    fromStates: ["uploaded"],
    toState: (from: string) => {
      if (from === "uploaded") return "reviewed";
      return ""; // Invalid from state
    },
  },
  "accept": {
    fromStates: ["reviewed"],
    toState: (from: string) => {
      if (from === "reviewed") return "accepted";
      return ""; // Invalid from state
    },
  },
  "reject": {
    fromStates: ["reviewed"],
    toState: (from: string) => {
      if (from === "reviewed") return "rejected";
      return ""; // Invalid from state
    },
  },
  "reupload": {
    fromStates: ["rejected"],
    toState: (from: string) => {
      if (from === "rejected") return "uploaded";
      return ""; // Invalid from state
    },
  },
};

/** State machine transition error */
export interface DocumentTransitionError {
  readonly type: "invalid_transition";
  readonly entityId: DocumentId;
  readonly currentState: string;
  readonly attemptedTransition: string;
  readonly allowedTransitions: readonly string[];
}

/**
 * Gets the allowed transitions for a Document in its current state.
 */
export const getDocumentAllowedTransitions = (
  currentState: string
): readonly DocumentTransitionName[] => {
  const allowed: DocumentTransitionName[] = [];
  if (currentState === "requested") {
    allowed.push("upload");
  }
  if (currentState === "uploaded") {
    allowed.push("review");
  }
  if (currentState === "reviewed") {
    allowed.push("accept");
  }
  if (currentState === "reviewed") {
    allowed.push("reject");
  }
  if (currentState === "rejected") {
    allowed.push("reupload");
  }
  return allowed;
};

/**
 * Validates if a transition is allowed for a Document.
 */
export const validateDocumentTransition = (
  currentState: string,
  transition: DocumentTransitionName
): boolean => {
  const transitionDef = documentTransitions[transition];
  return transitionDef?.fromStates.includes(currentState) ?? false;
};

/**
 * Performs the "upload" transition on a Document.
 * Valid from states: "requested"
 * Upload
 *
 * @param id - The Document ID
 * @returns The updated Document or an error if the transition is invalid
 */
export const uploadDocument = async (
  id: DocumentId
): Promise<Result<Document, DbError | DocumentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("documents")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "uploadDocument"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "uploadDocument", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["requested"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "upload",
      allowedTransitions: getDocumentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = documentTransitions["upload"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("documents")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "uploadDocument"));
  }

  return ok(mapDocumentRow(data));
};

/**
 * Performs the "review" transition on a Document.
 * Valid from states: "uploaded"
 * Review
 *
 * @param id - The Document ID
 * @returns The updated Document or an error if the transition is invalid
 */
export const reviewDocument = async (
  id: DocumentId
): Promise<Result<Document, DbError | DocumentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("documents")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "reviewDocument"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "reviewDocument", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["uploaded"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "review",
      allowedTransitions: getDocumentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = documentTransitions["review"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("documents")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "reviewDocument"));
  }

  return ok(mapDocumentRow(data));
};

/**
 * Performs the "accept" transition on a Document.
 * Valid from states: "reviewed"
 * Accept
 *
 * @param id - The Document ID
 * @returns The updated Document or an error if the transition is invalid
 */
export const acceptDocument = async (
  id: DocumentId
): Promise<Result<Document, DbError | DocumentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("documents")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "acceptDocument"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "acceptDocument", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["reviewed"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "accept",
      allowedTransitions: getDocumentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = documentTransitions["accept"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("documents")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "acceptDocument"));
  }

  return ok(mapDocumentRow(data));
};

/**
 * Performs the "reject" transition on a Document.
 * Valid from states: "reviewed"
 * Reject
 *
 * @param id - The Document ID
 * @returns The updated Document or an error if the transition is invalid
 */
export const rejectDocument = async (
  id: DocumentId
): Promise<Result<Document, DbError | DocumentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("documents")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "rejectDocument"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "rejectDocument", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["reviewed"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "reject",
      allowedTransitions: getDocumentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = documentTransitions["reject"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("documents")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "rejectDocument"));
  }

  return ok(mapDocumentRow(data));
};

/**
 * Performs the "reupload" transition on a Document.
 * Valid from states: "rejected"
 * Reupload
 *
 * @param id - The Document ID
 * @returns The updated Document or an error if the transition is invalid
 */
export const reuploadDocument = async (
  id: DocumentId
): Promise<Result<Document, DbError | DocumentTransitionError>> => {
  const client = await getDbClient();

  // Get current state
  const { data: current, error: fetchError } = await client
    .from("documents")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    return err(mapDbError(fetchError, "reuploadDocument"));
  }

  if (!current) {
    return err({ type: "query_failed", query: "reuploadDocument", cause: "Record not found" });
  }

  const currentState = current.status as string;

  // Validate transition - check if current state is one of the valid source states
  const validFromStates = ["rejected"];
  if (!validFromStates.includes(currentState)) {
    return err({
      type: "invalid_transition",
      entityId: id,
      currentState,
      attemptedTransition: "reupload",
      allowedTransitions: getDocumentAllowedTransitions(currentState),
    });
  }

  // Determine target state based on the transition definition for this source state
  const transitionDef = documentTransitions["reupload"];
  const targetState = transitionDef.toState(currentState);

  // Perform transition
  const { data, error } = await client
    .from("documents")
    .update({ status: targetState })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return err(mapDbError(error, "reuploadDocument"));
  }

  return ok(mapDocumentRow(data));
};

/**
 * Performs any valid transition on a Document.
 * This is a generic transition handler that validates the transition before executing.
 *
 * @param id - The Document ID
 * @param transition - The transition name to perform
 * @returns The updated Document or an error
 */
export const transitionDocument = async (
  id: DocumentId,
  transition: DocumentTransitionName
): Promise<Result<Document, DbError | DocumentTransitionError>> => {
  switch (transition) {
    case "upload":
      return uploadDocument(id);
    case "review":
      return reviewDocument(id);
    case "accept":
      return acceptDocument(id);
    case "reject":
      return rejectDocument(id);
    case "reupload":
      return reuploadDocument(id);
    default:
      // TypeScript should catch this, but just in case
      return err({
        type: "invalid_transition",
        entityId: id,
        currentState: "unknown",
        attemptedTransition: transition as string,
        allowedTransitions: [],
      });
  }
};


// ============================================================
// BATCH OPERATIONS (Use with caution - can be slow for large sets)
// ============================================================

/**
 * Creates multiple Profile in a single operation.
 * Note: This is NOT atomic - partial failures are possible.
 * For atomic operations, use a database transaction.
 */
export const batchCreateProfile = async (
  inputs: readonly CreateProfileInput[]
): Promise<Result<readonly Profile[], DbError>> => {
  const client = await getDbClient();

  const rows = inputs.map((input) => ({
    user_id: input.userId!, // Always injected by API from session
    email: input.email,
    name: input.name,
    firm_name: emptyToNull(input.firmName),
    license_number: emptyToNull(input.licenseNumber),
    timezone: input.timezone,
    subscription_tier: input.subscriptionTier,
    booking_slug: emptyToNull(input.bookingSlug),
    tax_season_start: input.taxSeasonStart?.toISOString() ?? null,
    tax_season_end: input.taxSeasonEnd?.toISOString() ?? null,
    max_daily_appointments: input.maxDailyAppointments,
    max_daily_appointments_tax_season: input.maxDailyAppointmentsTaxSeason,
  }));

  const { data, error } = await client
    .from("profiles")
    .insert(rows)
    .select();

  if (error) {
    return err(mapDbError(error, "batchCreateProfile"));
  }

  return ok(data.map(mapProfileRow));
};

/**
 * Creates multiple Client in a single operation.
 * Note: This is NOT atomic - partial failures are possible.
 * For atomic operations, use a database transaction.
 */
export const batchCreateClient = async (
  inputs: readonly CreateClientInput[]
): Promise<Result<readonly Client[], DbError>> => {
  const client = await getDbClient();

  const rows = inputs.map((input) => ({
    user_id: input.userId!, // Always injected by API from session
    name: input.name,
    email: input.email,
    phone: emptyToNull(input.phone),
    tax_id_last4: emptyToNull(input.taxIdLast4),
    filing_status: emptyToNull(input.filingStatus),
    preferred_contact: input.preferredContact,
    notes: emptyToNull(input.notes),
  }));

  const { data, error } = await client
    .from("clients")
    .insert(rows)
    .select();

  if (error) {
    return err(mapDbError(error, "batchCreateClient"));
  }

  return ok(data.map(mapClientRow));
};

/**
 * Creates multiple Service in a single operation.
 * Note: This is NOT atomic - partial failures are possible.
 * For atomic operations, use a database transaction.
 */
export const batchCreateService = async (
  inputs: readonly CreateServiceInput[]
): Promise<Result<readonly Service[], DbError>> => {
  const client = await getDbClient();

  const rows = inputs.map((input) => ({
    user_id: input.userId!, // Always injected by API from session
    name: input.name,
    description: emptyToNull(input.description),
    duration_minutes: input.durationMinutes,
    price: input.price ?? null,
    tax_season_only: input.taxSeasonOnly,
    requires_documents: input.requiresDocuments,
    is_active: input.isActive,
    buffer_minutes: input.bufferMinutes,
  }));

  const { data, error } = await client
    .from("services")
    .insert(rows)
    .select();

  if (error) {
    return err(mapDbError(error, "batchCreateService"));
  }

  return ok(data.map(mapServiceRow));
};

/**
 * Creates multiple Appointment in a single operation.
 * Note: This is NOT atomic - partial failures are possible.
 * For atomic operations, use a database transaction.
 */
export const batchCreateAppointment = async (
  inputs: readonly CreateAppointmentInput[]
): Promise<Result<readonly Appointment[], DbError>> => {
  const client = await getDbClient();

  const rows = inputs.map((input) => ({
    user_id: input.userId!, // Always injected by API from session
    client_id: input.clientId,
    service_id: input.serviceId,
    starts_at: input.startsAt.toISOString(),
    ends_at: input.endsAt.toISOString(),
    status: input.status,
    notes: emptyToNull(input.notes),
    meeting_link: emptyToNull(input.meetingLink),
    reminder_sent_24h: input.reminderSent24h,
    reminder_sent_1h: input.reminderSent1h,
    cancellation_reason: emptyToNull(input.cancellationReason),
  }));

  const { data, error } = await client
    .from("appointments")
    .insert(rows)
    .select();

  if (error) {
    return err(mapDbError(error, "batchCreateAppointment"));
  }

  return ok(data.map(mapAppointmentRow));
};

/**
 * Creates multiple Availability in a single operation.
 * Note: This is NOT atomic - partial failures are possible.
 * For atomic operations, use a database transaction.
 */
export const batchCreateAvailability = async (
  inputs: readonly CreateAvailabilityInput[]
): Promise<Result<readonly Availability[], DbError>> => {
  const client = await getDbClient();

  const rows = inputs.map((input) => ({
    user_id: input.userId!, // Always injected by API from session
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    is_tax_season: input.isTaxSeason,
  }));

  const { data, error } = await client
    .from("availabilities")
    .insert(rows)
    .select();

  if (error) {
    return err(mapDbError(error, "batchCreateAvailability"));
  }

  return ok(data.map(mapAvailabilityRow));
};

/**
 * Creates multiple Document in a single operation.
 * Note: This is NOT atomic - partial failures are possible.
 * For atomic operations, use a database transaction.
 */
export const batchCreateDocument = async (
  inputs: readonly CreateDocumentInput[]
): Promise<Result<readonly Document[], DbError>> => {
  const client = await getDbClient();

  const rows = inputs.map((input) => ({
    user_id: input.userId!, // Always injected by API from session
    client_id: input.clientId,
    appointment_id: input.appointmentId ?? null,
    document_type: input.documentType,
    file_url: emptyToNull(input.fileUrl),
    file_name: emptyToNull(input.fileName),
    status: input.status,
    tax_year: input.taxYear ?? null,
    notes: emptyToNull(input.notes),
    rejection_reason: emptyToNull(input.rejectionReason),
  }));

  const { data, error } = await client
    .from("documents")
    .insert(rows)
    .select();

  if (error) {
    return err(mapDbError(error, "batchCreateDocument"));
  }

  return ok(data.map(mapDocumentRow));
};


// ============================================================
// TRANSACTION HELPER
// ============================================================
//
// REQUIRED MIGRATION: Run this SQL to enable transaction support.
// This creates a generic transaction wrapper function that executes
// arbitrary SQL statements within a single ACID transaction.
//
// -- Migration: create_execute_transaction_function
// CREATE OR REPLACE FUNCTION execute_transaction(statements jsonb)
// RETURNS jsonb
// LANGUAGE plpgsql
// SECURITY DEFINER
// SET search_path = public
// AS $$
// DECLARE
//   stmt jsonb;
//   stmt_sql text;
//   stmt_params jsonb;
//   result jsonb := '[]'::jsonb;
//   stmt_result jsonb;
//   row_count integer;
// BEGIN
//   -- Validate input
//   IF statements IS NULL OR jsonb_typeof(statements) != 'array' THEN
//     RAISE EXCEPTION 'statements must be a JSON array';
//   END IF;
//
//   -- Execute each statement in order
//   FOR stmt IN SELECT * FROM jsonb_array_elements(statements)
//   LOOP
//     stmt_sql := stmt->>'sql';
//     stmt_params := COALESCE(stmt->'params', '[]'::jsonb);
//
//     IF stmt_sql IS NULL THEN
//       RAISE EXCEPTION 'Each statement must have a sql field';
//     END IF;
//
//     -- Execute the statement and capture result
//     EXECUTE format(
//       'WITH result AS (%s) SELECT jsonb_agg(row_to_json(result)) FROM result',
//       stmt_sql
//     ) USING stmt_params INTO stmt_result;
//
//     -- Handle NULL result (for INSERT/UPDATE/DELETE without RETURNING)
//     IF stmt_result IS NULL THEN
//       GET DIAGNOSTICS row_count = ROW_COUNT;
//       stmt_result := jsonb_build_object('affected_rows', row_count);
//     END IF;
//
//     result := result || jsonb_build_array(stmt_result);
//   END LOOP;
//
//   RETURN result;
// EXCEPTION
//   WHEN OTHERS THEN
//     -- Transaction is automatically rolled back on exception
//     RAISE;
// END;
// $$;
//
// -- Grant execute permission to authenticated users
// GRANT EXECUTE ON FUNCTION execute_transaction(jsonb) TO authenticated;
// GRANT EXECUTE ON FUNCTION execute_transaction(jsonb) TO service_role;
//
// ============================================================

/**
 * Represents a SQL statement to execute within a transaction.
 */
export interface TransactionStatement {
  readonly sql: string;
  readonly params?: readonly unknown[];
}

/**
 * Result of a single statement within a transaction.
 */
export type TransactionStatementResult =
  | readonly Record<string, unknown>[]  // SELECT or RETURNING result
  | { readonly affected_rows: number }; // INSERT/UPDATE/DELETE without RETURNING

/**
 * Executes multiple SQL statements within a database transaction.
 * All statements succeed atomically or all are rolled back.
 *
 * Uses the execute_transaction PostgreSQL function which provides
 * full ACID transaction guarantees including automatic rollback on error.
 *
 * @param statements - Array of SQL statements to execute in order
 * @returns Array of results for each statement, or a DbError
 *
 * @example
 * ```typescript
 * const result = await executeTransaction([
 *   { sql: "INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *", params: [userId, 100] },
 *   { sql: "INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)", params: ["(SELECT id FROM orders ORDER BY created_at DESC LIMIT 1)", productId, 2] },
 *   { sql: "UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2", params: [2, productId] },
 * ]);
 *
 * if (result.ok) {
 *   const [orderResult] = result.value;
 *   console.log("Order created:", orderResult);
 * }
 * ```
 */
export const executeTransaction = async (
  statements: readonly TransactionStatement[]
): Promise<Result<readonly TransactionStatementResult[], DbError>> => {
  if (statements.length === 0) {
    return ok([]);
  }

  const client = await getDbClient();

  // Cast to bypass strict typing - execute_transaction is a custom Postgres function
  const { data, error } = await (client as unknown as { rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }> })
    .rpc("execute_transaction", {
      statements: statements.map((stmt) => ({
        sql: stmt.sql,
        params: stmt.params ?? [],
      })),
    });

  if (error) {
    return err(mapDbError(error, "executeTransaction"));
  }

  return ok(data as readonly TransactionStatementResult[]);
};

/**
 * Builder for constructing transactions with a fluent API.
 * Collects statements and executes them atomically.
 *
 * @example
 * ```typescript
 * const result = await transaction()
 *   .add("INSERT INTO users (name) VALUES ($1) RETURNING id", ["Alice"])
 *   .add("INSERT INTO profiles (user_id, bio) VALUES ($1, $2)", ["(SELECT id FROM users ORDER BY id DESC LIMIT 1)", "Hello!"])
 *   .execute();
 * ```
 */
export const transaction = () => {
  const statements: TransactionStatement[] = [];

  const builder = {
    /**
     * Adds a SQL statement to the transaction.
     * Statements are executed in the order they are added.
     */
    add(sql: string, params?: readonly unknown[]) {
      statements.push({ sql, params });
      return builder;
    },

    /**
     * Executes all added statements within a single transaction.
     * Returns results for each statement or rolls back on any error.
     */
    execute(): Promise<Result<readonly TransactionStatementResult[], DbError>> {
      return executeTransaction(statements);
    },
  };

  return builder;
};

/**
 * Executes a function that may perform multiple database operations.
 * If any operation fails (returns an error Result), this helper
 * immediately returns that error.
 *
 * IMPORTANT: This does NOT provide transaction guarantees by itself.
 * For true ACID transactions, use executeTransaction() or transaction().
 *
 * This helper is useful for:
 * - Chaining multiple repository calls with early-exit on error
 * - Validation sequences before committing
 * - Read-only operations that don't need atomicity
 *
 * For operations that MUST be atomic, structure your operations as
 * SQL statements and use executeTransaction() instead.
 *
 * @example
 * ```typescript
 * // For read operations or validation (no atomicity needed):
 * const result = await withOperations(async () => {
 *   const user = await getUser(userId);
 *   if (!user.ok) return user;
 *   if (!user.value) return err({ type: "not_found" });
 *
 *   const profile = await getProfile(user.value.id);
 *   if (!profile.ok) return profile;
 *
 *   return ok({ user: user.value, profile: profile.value });
 * });
 *
 * // For atomic operations, use executeTransaction() instead:
 * const atomicResult = await executeTransaction([
 *   { sql: "UPDATE accounts SET balance = balance - $1 WHERE id = $2", params: [amount, fromAccount] },
 *   { sql: "UPDATE accounts SET balance = balance + $1 WHERE id = $2", params: [amount, toAccount] },
 * ]);
 * ```
 */
export const withOperations = async <T>(
  fn: () => Promise<Result<T, DbError>>
): Promise<Result<T, DbError>> => {
  try {
    return await fn();
  } catch (error) {
    return err(mapDbError(error, "withOperations"));
  }
};

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
