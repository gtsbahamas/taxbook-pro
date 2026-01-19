// ============================================================
// BACKGROUND JOBS - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// TYPE-FIRST DESIGN: All jobs have typed payloads and results.
// Jobs return Result<T, JobError> - no throwing exceptions.
//
// PATTERNS:
// - Supabase Edge Functions for async job execution
// - pg_cron for scheduled jobs (cleanup, sync)
// - Exponential backoff with jitter for retries
// - Job status tracking in database
//
// SCALABILITY PATTERNS (Second-Order Mental Model):
// - What happens at 10x users? → Jobs queue instead of timing out
// - What cascades from slow jobs? → Backpressure + priority queues
// - What becomes harder to change? → Job payloads become contracts
// - What if queue grows unbounded? → Dead letter queue + alerts
//
// WHEN TO USE ASYNC JOBS:
// - Operations > 500ms (email, file processing, external APIs)
// - Operations that can fail and need retry
// - Operations that shouldn't block user requests
// - Scheduled/recurring tasks (cleanup, sync)
// - Fan-out operations (notify many users)
//
// QUEUE DEPTH MONITORING:
// - Alert when pending jobs > 1000
// - Alert when avg wait time > 5 minutes
// - Scale workers when queue depth > 100 sustained
// - Add dead letter queue for jobs that fail 3+ times
//
// BACKPRESSURE PATTERNS:
// - Limit concurrent jobs per type
// - Use priority to ensure critical jobs run first
// - Consider rate limiting job creation during spikes
//
// Second-Order Insights Applied:
//   • Easy booking → more clients → need capacity management
//   • Document collection → less back-and-forth → faster appointments
//   • Tax season mode → prevents burnout → sustainable practice
// ============================================================

import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { type Result, ok, err } from "@/types/errors";

// ============================================================
// BRANDED ID TYPES
// ============================================================

declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

export type JobId = Brand<string, "JobId">;
export const jobId = (id: string): JobId => id as JobId;

// ============================================================
// JOB STATUS
// ============================================================

export type JobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export const JOB_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

// ============================================================
// JOB ERROR TYPES
// ============================================================

export type JobErrorCode =
  | "job_not_found"
  | "job_already_running"
  | "job_cancelled"
  | "max_retries_exceeded"
  | "invalid_payload"
  | "execution_failed"
  | "timeout"
  | "database_error"
  | "external_service_error";

export interface JobError {
  readonly code: JobErrorCode;
  readonly message: string;
  readonly cause?: unknown;
  readonly retryable: boolean;
}

// Error constructors
export const jobNotFound = (id: string): JobError => ({
  code: "job_not_found",
  message: `Job ${id} not found`,
  retryable: false,
});

export const jobAlreadyRunning = (id: string): JobError => ({
  code: "job_already_running",
  message: `Job ${id} is already running`,
  retryable: false,
});

export const maxRetriesExceeded = (attempts: number): JobError => ({
  code: "max_retries_exceeded",
  message: `Job failed after ${attempts} attempts`,
  retryable: false,
});

export const invalidPayload = (reason: string): JobError => ({
  code: "invalid_payload",
  message: `Invalid job payload: ${reason}`,
  retryable: false,
});

export const executionFailed = (message: string, cause?: unknown): JobError => ({
  code: "execution_failed",
  message,
  cause,
  retryable: true,
});

export const jobTimeout = (timeoutMs: number): JobError => ({
  code: "timeout",
  message: `Job timed out after ${timeoutMs}ms`,
  retryable: true,
});

// ============================================================
// JOB PAYLOAD TYPES
// ============================================================
// Define typed payloads for each job type

export interface SendEmailPayload {
  readonly type: "send-email";
  readonly to: string;
  readonly subject: string;
  readonly templateId: string;
  readonly variables: Record<string, string>;
}

export interface ProcessUploadPayload {
  readonly type: "process-upload";
  readonly fileId: string;
  readonly filePath: string;
  readonly mimeType: string;
  readonly userId: string;
}

export interface CleanupExpiredPayload {
  readonly type: "cleanup-expired";
  readonly table: string;
  readonly expirationField: string;
  readonly olderThanDays: number;
}

export interface SyncDataPayload {
  readonly type: "sync-data";
  readonly source: string;
  readonly destination: string;
  readonly lastSyncAt?: string;
  readonly fullSync?: boolean;
}

// Union of all job payloads
export type JobPayload =
  | SendEmailPayload
  | ProcessUploadPayload
  | CleanupExpiredPayload
  | SyncDataPayload;

// Extract job type string
export type JobType = JobPayload["type"];

// ============================================================
// JOB RESULT TYPES
// ============================================================
// Define typed results for each job type

export interface SendEmailResult {
  readonly messageId: string;
  readonly sentAt: Date;
}

export interface ProcessUploadResult {
  readonly processedFileId: string;
  readonly thumbnailUrl?: string;
  readonly metadata: Record<string, unknown>;
}

export interface CleanupExpiredResult {
  readonly deletedCount: number;
  readonly freedBytes?: number;
}

export interface SyncDataResult {
  readonly recordsSynced: number;
  readonly recordsFailed: number;
  readonly syncedAt: Date;
}

// Type mapping from job type to result type
export type JobResultMap = {
  "send-email": SendEmailResult;
  "process-upload": ProcessUploadResult;
  "cleanup-expired": CleanupExpiredResult;
  "sync-data": SyncDataResult;
};

export type JobResult<T extends JobType> = JobResultMap[T];

// ============================================================
// JOB RECORD
// ============================================================

export interface Job<T extends JobType = JobType> {
  readonly id: JobId;
  readonly type: T;
  readonly payload: Extract<JobPayload, { type: T }>;
  readonly status: JobStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly result?: JobResultMap[T];
  readonly error?: JobError;
  readonly priority: number;
  readonly scheduledFor: Date;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ============================================================
// RETRY CONFIGURATION
// ============================================================

export interface RetryConfig {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
  readonly jitterFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 300000, // 5 minutes
  backoffMultiplier: 2,
  jitterFactor: 0.2,
};

// Job-specific retry configs
export const RETRY_CONFIGS: Record<JobType, RetryConfig> = {
  "send-email": {
    maxAttempts: 3,
    baseDelayMs: 5000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  },
  "process-upload": {
    maxAttempts: 3,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitterFactor: 0.2,
  },
  "cleanup-expired": {
    maxAttempts: 2,
    baseDelayMs: 60000,
    maxDelayMs: 300000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  },
  "sync-data": {
    maxAttempts: 5,
    baseDelayMs: 10000,
    maxDelayMs: 600000,
    backoffMultiplier: 2,
    jitterFactor: 0.3,
  },
};

/**
 * Calculate delay with exponential backoff and jitter.
 * Jitter prevents thundering herd when many jobs retry simultaneously.
 */
export const calculateRetryDelay = (
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number => {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter: random factor between (1 - jitter) and (1 + jitter)
  const jitterMultiplier = 1 + (Math.random() * 2 - 1) * config.jitterFactor;

  return Math.round(cappedDelay * jitterMultiplier);
};

// ============================================================
// JOB QUEUE INTERFACE
// ============================================================

export interface JobQueueOptions {
  readonly priority?: number;
  readonly delay?: number;
  readonly scheduledFor?: Date;
  readonly maxAttempts?: number;
}

export interface JobQueue {
  /**
   * Enqueue a new job.
   */
  enqueue<T extends JobType>(
    payload: Extract<JobPayload, { type: T }>,
    options?: JobQueueOptions
  ): Promise<Result<Job<T>, JobError>>;

  /**
   * Get a job by ID.
   */
  get<T extends JobType>(id: JobId): Promise<Result<Job<T> | null, JobError>>;

  /**
   * Cancel a pending job.
   */
  cancel(id: JobId): Promise<Result<void, JobError>>;

  /**
   * Retry a failed job.
   */
  retry(id: JobId): Promise<Result<Job, JobError>>;

  /**
   * List jobs with optional filters.
   */
  list(filters?: JobFilters): Promise<Result<readonly Job[], JobError>>;
}

export interface JobFilters {
  readonly status?: JobStatus | JobStatus[];
  readonly type?: JobType | JobType[];
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: "created_at" | "scheduled_for" | "priority";
  readonly orderDir?: "asc" | "desc";
}

// ============================================================
// SUPABASE JOB QUEUE IMPLEMENTATION
// ============================================================

// Job row type for database operations
// Uses explicit type since jobs table may not be in generated Database type
interface JobRow {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  max_attempts: number;
  result: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
  priority: number;
  scheduled_for: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const getClient = () => createClient() as unknown as {
  from: (table: string) => any;
  storage: {
    from: (bucket: string) => {
      download: (path: string) => Promise<{ data: Blob | null; error: Error | null }>;
      upload: (path: string, file: Blob | Buffer, options?: { contentType?: string; upsert?: boolean }) => Promise<{ data: { path: string } | null; error: Error | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
};

const mapJobRow = <T extends JobType>(row: JobRow): Job<T> => ({
  id: jobId(row.id),
  type: row.type as T,
  payload: row.payload as unknown as Extract<JobPayload, { type: T }>,
  status: row.status as JobStatus,
  attempts: row.attempts,
  maxAttempts: row.max_attempts,
  result: row.result as unknown as JobResultMap[T] | undefined,
  error: row.error as unknown as JobError | undefined,
  priority: row.priority,
  scheduledFor: new Date(row.scheduled_for),
  startedAt: row.started_at ? new Date(row.started_at) : undefined,
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

const mapDbError = (error: unknown): JobError => ({
  code: "database_error",
  message: error instanceof Error ? error.message : "Database operation failed",
  cause: error,
  retryable: true,
});

/**
 * Create a Supabase-backed job queue.
 */
export const createJobQueue = (): JobQueue => {
  const enqueue = async <T extends JobType>(
    payload: Extract<JobPayload, { type: T }>,
    options?: JobQueueOptions
  ): Promise<Result<Job<T>, JobError>> => {
    const client = getClient();
    const config = RETRY_CONFIGS[payload.type] ?? DEFAULT_RETRY_CONFIG;

    const scheduledFor = options?.scheduledFor
      ?? (options?.delay ? new Date(Date.now() + options.delay) : new Date());

    const { data, error } = await client
      .from("jobs")
      .insert({
        type: payload.type,
        payload: payload as unknown as Record<string, unknown>,
        status: JOB_STATUS.PENDING,
        attempts: 0,
        max_attempts: options?.maxAttempts ?? config.maxAttempts,
        priority: options?.priority ?? 0,
        scheduled_for: scheduledFor.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return err(mapDbError(error));
    }

    return ok(mapJobRow<T>(data));
  };

  const get = async <T extends JobType>(
    id: JobId
  ): Promise<Result<Job<T> | null, JobError>> => {
    const client = getClient();

    const { data, error } = await client
      .from("jobs")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return err(mapDbError(error));
    }

    return ok(data ? mapJobRow<T>(data) : null);
  };

  const cancel = async (id: JobId): Promise<Result<void, JobError>> => {
    const client = getClient();

    const { data: job, error: fetchError } = await client
      .from("jobs")
      .select()
      .eq("id", id)
      .single();

    if (fetchError) {
      return err(mapDbError(fetchError));
    }

    if (!job) {
      return err(jobNotFound(id));
    }

    if (job.status === JOB_STATUS.RUNNING) {
      return err(jobAlreadyRunning(id));
    }

    if (job.status === JOB_STATUS.COMPLETED || job.status === JOB_STATUS.CANCELLED) {
      return ok(undefined); // Already in terminal state
    }

    const { error: updateError } = await client
      .from("jobs")
      .update({ status: JOB_STATUS.CANCELLED })
      .eq("id", id);

    if (updateError) {
      return err(mapDbError(updateError));
    }

    return ok(undefined);
  };

  const retry = async (id: JobId): Promise<Result<Job, JobError>> => {
    const client = getClient();

    const { data: job, error: fetchError } = await client
      .from("jobs")
      .select()
      .eq("id", id)
      .single();

    if (fetchError) {
      return err(mapDbError(fetchError));
    }

    if (!job) {
      return err(jobNotFound(id));
    }

    if (job.status !== JOB_STATUS.FAILED) {
      return err({
        code: "execution_failed",
        message: "Can only retry failed jobs",
        retryable: false,
      });
    }

    const { data, error: updateError } = await client
      .from("jobs")
      .update({
        status: JOB_STATUS.PENDING,
        error: null,
        scheduled_for: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return err(mapDbError(updateError));
    }

    return ok(mapJobRow(data));
  };

  const list = async (
    filters?: JobFilters
  ): Promise<Result<readonly Job[], JobError>> => {
    const client = getClient();

    let query = client.from("jobs").select();

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      query = query.in("status", statuses);
    }

    if (filters?.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      query = query.in("type", types);
    }

    const orderBy = filters?.orderBy ?? "created_at";
    const ascending = filters?.orderDir !== "desc";
    query = query.order(orderBy, { ascending });

    if (filters?.limit) {
      const offset = filters.offset ?? 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      return err(mapDbError(error));
    }

    return ok(data.map(mapJobRow));
  };

  return { enqueue, get, cancel, retry, list };
};

// ============================================================
// JOB WORKER
// ============================================================

export interface JobHandler<T extends JobType> {
  (payload: Extract<JobPayload, { type: T }>): Promise<Result<JobResultMap[T], JobError>>;
}

export type JobHandlers = {
  [K in JobType]: JobHandler<K>;
};

export interface WorkerConfig {
  readonly pollIntervalMs: number;
  readonly batchSize: number;
  readonly handlers: Partial<JobHandlers>;
}

const DEFAULT_WORKER_CONFIG: Omit<WorkerConfig, "handlers"> = {
  pollIntervalMs: 5000,
  batchSize: 10,
};

/**
 * Worker implementation for processing jobs.
 * Use in Supabase Edge Functions or background process.
 */
export const createJobWorker = (config: WorkerConfig) => {
  const { handlers, pollIntervalMs, batchSize } = {
    ...DEFAULT_WORKER_CONFIG,
    ...config
  };

  let isRunning = false;
  let pollTimeout: ReturnType<typeof setTimeout> | null = null;

  const processJob = async <T extends JobType>(
    job: Job<T>
  ): Promise<Result<Job<T>, JobError>> => {
    const client = getClient();
    const handler = handlers[job.type] as JobHandler<T> | undefined;

    if (!handler) {
      return err({
        code: "execution_failed",
        message: `No handler registered for job type: ${job.type}`,
        retryable: false,
      });
    }

    // Mark job as running
    const { error: startError } = await client
      .from("jobs")
      .update({
        status: JOB_STATUS.RUNNING,
        started_at: new Date().toISOString(),
        attempts: job.attempts + 1,
      })
      .eq("id", job.id);

    if (startError) {
      return err(mapDbError(startError));
    }

    // Execute handler
    const result = await handler(job.payload);

    if (result.ok) {
      // Mark as completed
      const { data, error: completeError } = await client
        .from("jobs")
        .update({
          status: JOB_STATUS.COMPLETED,
          result: result.value as unknown as Record<string, unknown>,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .select()
        .single();

      if (completeError) {
        return err(mapDbError(completeError));
      }

      return ok(mapJobRow<T>(data));
    }

    // Handle failure
    const retryConfig = RETRY_CONFIGS[job.type] ?? DEFAULT_RETRY_CONFIG;
    const newAttempts = job.attempts + 1;
    const shouldRetry = result.error.retryable && newAttempts < job.maxAttempts;

    if (shouldRetry) {
      // Schedule retry with exponential backoff
      const delay = calculateRetryDelay(newAttempts, retryConfig);
      const scheduledFor = new Date(Date.now() + delay);

      const { data, error: retryError } = await client
        .from("jobs")
        .update({
          status: JOB_STATUS.PENDING,
          error: result.error as unknown as Record<string, unknown>,
          scheduled_for: scheduledFor.toISOString(),
        })
        .eq("id", job.id)
        .select()
        .single();

      if (retryError) {
        return err(mapDbError(retryError));
      }

      return ok(mapJobRow<T>(data));
    }

    // Max retries exceeded - mark as failed
    const { data, error: failError } = await client
      .from("jobs")
      .update({
        status: JOB_STATUS.FAILED,
        error: (newAttempts >= job.maxAttempts
          ? maxRetriesExceeded(newAttempts)
          : result.error) as unknown as Record<string, unknown>,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .select()
      .single();

    if (failError) {
      return err(mapDbError(failError));
    }

    return ok(mapJobRow<T>(data));
  };

  const pollForJobs = async (): Promise<void> => {
    if (!isRunning) return;

    const client = getClient();

    // Fetch pending jobs ready for processing
    const { data: jobs, error } = await client
      .from("jobs")
      .select()
      .eq("status", JOB_STATUS.PENDING)
      .lte("scheduled_for", new Date().toISOString())
      .order("priority", { ascending: false })
      .order("scheduled_for", { ascending: true })
      .limit(batchSize);

    if (error) {
      console.error("[JobWorker] Failed to fetch jobs:", error);
    } else if (jobs && jobs.length > 0) {
      // Process jobs concurrently
      await Promise.all(
        jobs.map((row: JobRow) => processJob(mapJobRow(row)))
      );
    }

    // Schedule next poll
    if (isRunning) {
      pollTimeout = setTimeout(pollForJobs, pollIntervalMs);
    }
  };

  const start = (): void => {
    if (isRunning) return;
    isRunning = true;
    console.log("[JobWorker] Starting worker...");
    pollForJobs();
  };

  const stop = (): void => {
    isRunning = false;
    if (pollTimeout) {
      clearTimeout(pollTimeout);
      pollTimeout = null;
    }
    console.log("[JobWorker] Worker stopped.");
  };

  return { start, stop, processJob };
};

// ============================================================
// EDGE FUNCTION HANDLER
// ============================================================
// Use this in a Supabase Edge Function to process a single job

/**
 * Process a single job in an Edge Function context.
 * Call this from your Edge Function with the job ID.
 */
export const processJobById = async <T extends JobType>(
  jobId: JobId,
  handlers: Partial<JobHandlers>
): Promise<Result<Job<T>, JobError>> => {
  const queue = createJobQueue();
  const getResult = await queue.get<T>(jobId);

  if (!getResult.ok) {
    return getResult;
  }

  if (!getResult.value) {
    return err(jobNotFound(jobId));
  }

  const job = getResult.value;
  const worker = createJobWorker({
    handlers,
    pollIntervalMs: 0,
    batchSize: 1
  });

  return worker.processJob(job);
};

// ============================================================
// SCHEDULED JOB HELPERS
// ============================================================
// Use these with pg_cron for recurring jobs

/**
 * Enqueue a cleanup job for expired records.
 * Call this from pg_cron or a scheduled Edge Function.
 */
export const scheduleCleanup = async (
  table: string,
  expirationField: string,
  olderThanDays: number
): Promise<Result<Job<"cleanup-expired">, JobError>> => {
  const queue = createJobQueue();
  return queue.enqueue({
    type: "cleanup-expired",
    table,
    expirationField,
    olderThanDays,
  });
};

/**
 * Enqueue a data sync job.
 * Call this from pg_cron or a scheduled Edge Function.
 */
export const scheduleSync = async (
  source: string,
  destination: string,
  options?: { lastSyncAt?: string; fullSync?: boolean }
): Promise<Result<Job<"sync-data">, JobError>> => {
  const queue = createJobQueue();
  return queue.enqueue({
    type: "sync-data",
    source,
    destination,
    lastSyncAt: options?.lastSyncAt,
    fullSync: options?.fullSync,
  });
};

// ============================================================
// JOB STATISTICS
// ============================================================

export interface JobStats {
  readonly pending: number;
  readonly running: number;
  readonly completed: number;
  readonly failed: number;
  readonly cancelled: number;
  readonly total: number;
  readonly averageProcessingTimeMs?: number;
}

/**
 * Get job statistics for monitoring.
 */
export const getJobStats = async (): Promise<Result<JobStats, JobError>> => {
  const client = getClient();

  const { data, error } = await client
    .from("jobs")
    .select("status, started_at, completed_at");

  if (error) {
    return err(mapDbError(error));
  }

  const stats = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    total: data.length,
  };

  let totalProcessingTime = 0;
  let completedWithTime = 0;

  for (const job of data) {
    stats[job.status as keyof typeof stats]++;

    if (job.status === "completed" && job.started_at && job.completed_at) {
      const processingTime =
        new Date(job.completed_at).getTime() - new Date(job.started_at).getTime();
      totalProcessingTime += processingTime;
      completedWithTime++;
    }
  }

  return ok({
    ...stats,
    averageProcessingTimeMs: completedWithTime > 0
      ? Math.round(totalProcessingTime / completedWithTime)
      : undefined,
  });
};

// ============================================================
// DATABASE MIGRATION (run once)
// ============================================================
// Include this SQL in your Supabase migrations

export const JOBS_TABLE_MIGRATION = `
-- Jobs table for background job processing
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  result JSONB,
  error JSONB,
  priority INTEGER NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient job queries
CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled
  ON jobs (status, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_jobs_type
  ON jobs (type);

CREATE INDEX IF NOT EXISTS idx_jobs_created_at
  ON jobs (created_at DESC);

-- Update updated_at on every change
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_updated_at();

-- RLS policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view their own jobs (if you add a user_id column)
-- CREATE POLICY "Users can view own jobs" ON jobs
--   FOR SELECT
--   TO authenticated
--   USING (user_id = auth.uid());

-- pg_cron example for cleanup (run in Supabase SQL Editor)
-- SELECT cron.schedule(
--   'cleanup-old-jobs',
--   '0 3 * * *',  -- Daily at 3 AM
--   $$DELETE FROM jobs WHERE status IN ('completed', 'cancelled') AND created_at < NOW() - INTERVAL '30 days'$$
-- );
`;

// ============================================================
// EXAMPLE HANDLERS
// ============================================================
// Implement these in your application

export const exampleHandlers: Partial<JobHandlers> = {
  "send-email": async (payload) => {
    // Validate environment configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return err({
        code: "external_service_error",
        message: "RESEND_API_KEY environment variable is not configured",
        retryable: false,
      });
    }

    const fromEmail = process.env.EMAIL_FROM_ADDRESS ?? "noreply@";

    // Dynamically import Resend to avoid build-time issues
    const { Resend } = await import("resend");
    const resend = new Resend(resendApiKey);

    // Load email template
    const client = getClient();
    const { data: template, error: templateError } = await client
      .from("email_templates")
      .select("subject_template, body_template, body_html_template")
      .eq("id", payload.templateId)
      .single();

    // Fallback to direct subject/body if no template found
    let subject = payload.subject;
    let htmlBody = "";
    let textBody = "";

    if (!templateError && template) {
      // Interpolate variables into template
      subject = interpolateTemplate(template.subject_template ?? payload.subject, payload.variables);
      htmlBody = interpolateTemplate(template.body_html_template ?? "", payload.variables);
      textBody = interpolateTemplate(template.body_template ?? "", payload.variables);
    } else {
      // Build basic email without template
      htmlBody = `<p>${Object.entries(payload.variables)
        .map(([key, value]) => `${key}: ${value}`)
        .join("<br/>")}</p>`;
      textBody = Object.entries(payload.variables)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
    }

    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.to)) {
      return err(invalidPayload(`Invalid email address: ${payload.to}`));
    }

    // Send email via Resend
    const { data: emailResponse, error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: payload.to,
      subject,
      html: htmlBody,
      text: textBody || undefined,
    });

    if (sendError) {
      // Determine if error is retryable based on error type
      const isRateLimited = sendError.message?.toLowerCase().includes("rate limit");
      const isServerError = sendError.message?.toLowerCase().includes("server error");

      return err({
        code: "external_service_error",
        message: `Email send failed: ${sendError.message}`,
        cause: sendError,
        retryable: isRateLimited || isServerError,
      });
    }

    return ok({
      messageId: emailResponse?.id ?? `msg_${Date.now()}`,
      sentAt: new Date(),
    });
  },

  "process-upload": async (payload) => {
    const client = getClient();

    // Validate payload
    if (!payload.fileId || !payload.filePath) {
      return err(invalidPayload("fileId and filePath are required"));
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await client.storage
      .from("uploads")
      .download(payload.filePath);

    if (downloadError || !fileData) {
      return err({
        code: "external_service_error",
        message: `Failed to download file: ${downloadError?.message ?? "File not found"}`,
        cause: downloadError,
        retryable: true,
      });
    }

    const metadata: Record<string, unknown> = {
      originalMimeType: payload.mimeType,
      processedAt: new Date().toISOString(),
      fileSize: fileData.size,
    };

    let thumbnailUrl: string | undefined;

    // Process based on mime type
    const isImage = payload.mimeType.startsWith("image/");
    const isPdf = payload.mimeType === "application/pdf";
    const isVideo = payload.mimeType.startsWith("video/");

    if (isImage) {
      // Process image with Sharp
      const sharp = (await import("sharp")).default;
      const buffer = Buffer.from(await fileData.arrayBuffer());

      // Extract image metadata
      const imageMetadata = await sharp(buffer).metadata();
      metadata.width = imageMetadata.width;
      metadata.height = imageMetadata.height;
      metadata.format = imageMetadata.format;
      metadata.hasAlpha = imageMetadata.hasAlpha;
      metadata.colorSpace = imageMetadata.space;

      // Generate thumbnail (max 300x300, preserving aspect ratio)
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload thumbnail to storage
      const thumbnailPath = `thumbnails/${payload.fileId}_thumb.jpg`;
      const { error: uploadError } = await client.storage
        .from("uploads")
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrl } = client.storage
          .from("uploads")
          .getPublicUrl(thumbnailPath);
        thumbnailUrl = publicUrl.publicUrl;
        metadata.thumbnailPath = thumbnailPath;
      } else {
        // Log but don't fail - thumbnail is optional
        console.warn(`[Job] Thumbnail upload failed: ${uploadError.message}`);
      }

      // Generate additional sizes if image is large enough
      if ((imageMetadata.width ?? 0) > 1200 || (imageMetadata.height ?? 0) > 1200) {
        const mediumBuffer = await sharp(buffer)
          .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();

        const mediumPath = `processed/${payload.fileId}_medium.jpg`;
        await client.storage
          .from("uploads")
          .upload(mediumPath, mediumBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });
        metadata.mediumPath = mediumPath;
      }
    } else if (isPdf) {
      // Extract PDF metadata
      metadata.documentType = "pdf";
      metadata.pageCount = null; // Would require pdf-lib or similar

      // Generate PDF thumbnail using first page (requires external service or pdf-lib)
      // For now, mark as needing thumbnail generation
      metadata.thumbnailPending = true;
    } else if (isVideo) {
      // Video processing would typically use ffmpeg
      metadata.documentType = "video";
      metadata.processingNote = "Video transcoding queued separately";

      // Queue a separate transcoding job if needed
      const queue = createJobQueue();
      // Note: This would need a separate video processing job type
      metadata.transcodingQueued = false;
    } else {
      // Generic file - just record metadata
      metadata.documentType = "file";
    }

    // Update file record in database with processed metadata
    const { error: updateError } = await client
      .from("files")
      .update({
        metadata,
        thumbnail_url: thumbnailUrl,
        processed_at: new Date().toISOString(),
        status: "processed",
      })
      .eq("id", payload.fileId);

    if (updateError) {
      return err({
        code: "database_error",
        message: `Failed to update file record: ${updateError.message}`,
        cause: updateError,
        retryable: true,
      });
    }

    return ok({
      processedFileId: payload.fileId,
      thumbnailUrl,
      metadata,
    });
  },

  "cleanup-expired": async (payload) => {
    const client = getClient();

    // Validate table name to prevent SQL injection (only alphanumeric and underscores)
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(payload.table)) {
      return err(invalidPayload(`Invalid table name: ${payload.table}`));
    }

    // Validate expiration field name
    if (!tableNameRegex.test(payload.expirationField)) {
      return err(invalidPayload(`Invalid field name: ${payload.expirationField}`));
    }

    // Validate olderThanDays is a reasonable value
    if (payload.olderThanDays < 0 || payload.olderThanDays > 3650) {
      return err(invalidPayload(`olderThanDays must be between 0 and 3650, got: ${payload.olderThanDays}`));
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - payload.olderThanDays);

    // First, check if table exists and get count of records to delete
    const { count: preCount, error: countError } = await client
      .from(payload.table)
      .select("*", { count: "exact", head: true })
      .lt(payload.expirationField, cutoffDate.toISOString());

    if (countError) {
      // Check for common error types
      const errorMessage = countError.message.toLowerCase();
      if (errorMessage.includes("does not exist") || errorMessage.includes("relation")) {
        return err({
          code: "invalid_payload",
          message: `Table '${payload.table}' does not exist`,
          retryable: false,
        });
      }
      if (errorMessage.includes("column")) {
        return err({
          code: "invalid_payload",
          message: `Column '${payload.expirationField}' does not exist in table '${payload.table}'`,
          retryable: false,
        });
      }
      return err(executionFailed(`Failed to count expired records: ${countError.message}`, countError));
    }

    // If no records to delete, return early
    if (!preCount || preCount === 0) {
      return ok({
        deletedCount: 0,
        freedBytes: 0,
      });
    }

    // Log before deletion for audit purposes
    console.log(`[Job:cleanup-expired] Deleting ${preCount} expired records from ${payload.table} older than ${cutoffDate.toISOString()}`);

    // Perform deletion in batches if count is large to avoid timeouts
    const BATCH_SIZE = 1000;
    let totalDeleted = 0;

    if (preCount > BATCH_SIZE) {
      // Delete in batches for large datasets
      while (totalDeleted < preCount) {
        const { count: batchCount, error: batchError } = await client
          .from(payload.table)
          .delete({ count: "exact" })
          .lt(payload.expirationField, cutoffDate.toISOString())
          .limit(BATCH_SIZE);

        if (batchError) {
          // Partial failure - some records deleted
          return err({
            code: "execution_failed",
            message: `Cleanup partially failed after deleting ${totalDeleted} records: ${batchError.message}`,
            cause: { batchError, deletedSoFar: totalDeleted },
            retryable: true,
          });
        }

        totalDeleted += batchCount ?? 0;

        // If no more records deleted, we're done
        if (!batchCount || batchCount === 0) {
          break;
        }
      }
    } else {
      // Single deletion for smaller datasets
      const { count, error } = await client
        .from(payload.table)
        .delete({ count: "exact" })
        .lt(payload.expirationField, cutoffDate.toISOString());

      if (error) {
        return err(executionFailed(`Cleanup failed: ${error.message}`, error));
      }

      totalDeleted = count ?? 0;
    }

    console.log(`[Job:cleanup-expired] Successfully deleted ${totalDeleted} records from ${payload.table}`);

    return ok({
      deletedCount: totalDeleted,
      freedBytes: undefined, // Postgres doesn't report this directly; would need VACUUM FULL
    });
  },

  "sync-data": async (payload) => {
    const client = getClient();

    // Validate source and destination table names
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(payload.source)) {
      return err(invalidPayload(`Invalid source table name: ${payload.source}`));
    }
    if (!tableNameRegex.test(payload.destination)) {
      return err(invalidPayload(`Invalid destination table name: ${payload.destination}`));
    }

    // Prevent syncing to the same table
    if (payload.source === payload.destination) {
      return err(invalidPayload("Source and destination tables cannot be the same"));
    }

    let recordsSynced = 0;
    let recordsFailed = 0;
    const errors: Array<{ recordId: unknown; error: string }> = [];

    // Build query for source records
    let sourceQuery = client.from(payload.source).select("*");

    // Apply incremental sync filter if not full sync
    if (!payload.fullSync && payload.lastSyncAt) {
      const lastSync = new Date(payload.lastSyncAt);
      if (isNaN(lastSync.getTime())) {
        return err(invalidPayload(`Invalid lastSyncAt date: ${payload.lastSyncAt}`));
      }
      // Assume updated_at column exists for incremental sync
      sourceQuery = sourceQuery.gte("updated_at", payload.lastSyncAt);
    }

    // Fetch source records with pagination for large datasets
    const PAGE_SIZE = 500;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: sourceRecords, error: fetchError } = await sourceQuery
        .range(offset, offset + PAGE_SIZE - 1)
        .order("id", { ascending: true });

      if (fetchError) {
        return err({
          code: "database_error",
          message: `Failed to fetch source records: ${fetchError.message}`,
          cause: fetchError,
          retryable: true,
        });
      }

      if (!sourceRecords || sourceRecords.length === 0) {
        hasMore = false;
        break;
      }

      // Process each record
      for (const record of sourceRecords) {
        // Transform record for destination if needed
        // Remove source-specific fields that shouldn't be copied
        const { created_at, ...syncRecord } = record;

        // Add sync metadata
        const destinationRecord = {
          ...syncRecord,
          synced_at: new Date().toISOString(),
          sync_source: payload.source,
        };

        // Upsert to destination table
        const { error: upsertError } = await client
          .from(payload.destination)
          .upsert(destinationRecord, {
            onConflict: "id",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          recordsFailed++;
          errors.push({
            recordId: record.id,
            error: upsertError.message,
          });

          // Log but continue processing
          console.warn(`[Job:sync-data] Failed to sync record ${record.id}: ${upsertError.message}`);

          // If too many failures, abort
          if (recordsFailed > 100 || (recordsFailed / (recordsSynced + recordsFailed)) > 0.1) {
            return err({
              code: "execution_failed",
              message: `Sync aborted due to high failure rate: ${recordsFailed} failures out of ${recordsSynced + recordsFailed} records`,
              cause: { errors: errors.slice(0, 10) }, // Include first 10 errors
              retryable: false,
            });
          }
        } else {
          recordsSynced++;
        }
      }

      // Check if we need to fetch more
      if (sourceRecords.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        offset += PAGE_SIZE;
      }
    }

    // Update sync metadata table if it exists
    const { error: metaError } = await client
      .from("sync_metadata")
      .upsert({
        source_table: payload.source,
        destination_table: payload.destination,
        last_sync_at: new Date().toISOString(),
        records_synced: recordsSynced,
        records_failed: recordsFailed,
        full_sync: payload.fullSync ?? false,
      }, {
        onConflict: "source_table,destination_table",
      });

    // Log any metadata update error but don't fail the job
    if (metaError) {
      console.warn(`[Job:sync-data] Failed to update sync_metadata: ${metaError.message}`);
    }

    console.log(`[Job:sync-data] Sync completed: ${recordsSynced} synced, ${recordsFailed} failed from ${payload.source} to ${payload.destination}`);

    return ok({
      recordsSynced,
      recordsFailed,
      syncedAt: new Date(),
    });
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Interpolate variables into a template string.
 * Replaces {{variableName}} with the corresponding value.
 */
const interpolateTemplate = (
  template: string,
  variables: Record<string, string>
): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}`;
  });
};

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
