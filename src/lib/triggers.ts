// ============================================================
// TRIGGER EXECUTION ENGINE - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// SIDE EFFECT ORCHESTRATION FOR STATE TRANSITIONS AND EVENTS
//
// Triggers execute side effects when business events occur:
// - State machine transitions
// - Entity lifecycle events (create, update, delete)
// - Scheduled events
// - External webhook triggers
//
// Side Effect Types:
// - notification: Push/in-app notifications
// - email: Transactional emails
// - webhook: External service calls
// - job: Background job scheduling
// - audit-log: Compliance audit trail
// - update-field: Cascading field updates
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What if a side effect fails? → Retry with backoff, dead letter queue
// - What if side effects run twice? → Idempotency keys
// - What if order matters? → Priority-based execution
//
// Inversion Insights Applied:
//   • What would make a client NOT book? Complex forms, unclear availability, no reminders
//   • What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   • What would cause double-bookings? Race conditions, timezone bugs, unclear UI
// ============================================================

import { type Result, ok, err } from "@/types/errors";
import { logger } from "@/lib/observability";

// ============================================================
// TRIGGER TYPES
// ============================================================

export type SideEffectType =
  | "notification"
  | "email"
  | "webhook"
  | "job"
  | "audit-log"
  | "update-field"
  | "analytics"
  | "cache-invalidate";

export type TriggerEvent =
  | "create"
  | "update"
  | "delete"
  | "transition"
  | "schedule"
  | "webhook";

export interface SideEffect {
  readonly type: SideEffectType;
  readonly config: Record<string, unknown>;
  readonly priority: number;
  readonly retryPolicy?: RetryPolicy;
  readonly condition?: (context: TriggerContext) => boolean;
}

export interface RetryPolicy {
  readonly maxRetries: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
}

export interface TriggerContext {
  readonly entity: string;
  readonly event: TriggerEvent;
  readonly entityId: string;
  readonly data: Record<string, unknown>;
  readonly previousData?: Record<string, unknown>;
  readonly userId?: string;
  readonly timestamp: Date;
  readonly metadata: Record<string, unknown>;
  readonly idempotencyKey: string;
}

export interface Trigger {
  readonly id: string;
  readonly name: string;
  readonly entity: string;
  readonly event: TriggerEvent;
  readonly description: string;
  readonly enabled: boolean;
  readonly condition?: (context: TriggerContext) => boolean;
  readonly sideEffects: readonly SideEffect[];
}

export interface TriggerResult {
  readonly triggerId: string;
  readonly success: boolean;
  readonly results: readonly SideEffectResult[];
  readonly durationMs: number;
}

export interface SideEffectResult {
  readonly type: SideEffectType;
  readonly success: boolean;
  readonly error?: string;
  readonly retries: number;
  readonly durationMs: number;
}

// ============================================================
// DEFAULT RETRY POLICY
// ============================================================

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

// ============================================================
// SIDE EFFECT EXECUTORS
// ============================================================

type SideEffectExecutor = (
  effect: SideEffect,
  context: TriggerContext
) => Promise<Result<void, string>>;

const executors: Map<SideEffectType, SideEffectExecutor> = new Map();

/**
 * Register a side effect executor for a given type.
 */
export function registerExecutor(type: SideEffectType, executor: SideEffectExecutor): void {
  executors.set(type, executor);
}

/**
 * Get executor for a side effect type.
 */
function getExecutor(type: SideEffectType): SideEffectExecutor | undefined {
  return executors.get(type);
}

// ============================================================
// DEFAULT EXECUTORS
// ============================================================

// Notification executor
registerExecutor("notification", async (effect, context) => {
  const { userId, template, channel } = effect.config as {
    userId?: string;
    template: string;
    channel: "push" | "in-app" | "both";
  };

  const targetUserId = userId || context.userId;
  if (!targetUserId) {
    return err("No target user for notification");
  }

  logger.info("Sending notification", {
    userId: targetUserId,
    template,
    channel,
    entity: context.entity,
    entityId: context.entityId,
  });

  // TODO: Integrate with notification service
  // await notificationService.send({ userId: targetUserId, template, channel, data: context.data });

  return ok(undefined);
});

// Email executor
registerExecutor("email", async (effect, context) => {
  const { to, template, subject } = effect.config as {
    to?: string;
    template: string;
    subject?: string;
  };

  const email = to || (context.data.email as string);
  if (!email) {
    return err("No email address for email trigger");
  }

  logger.info("Sending email", {
    to: email,
    template,
    subject,
    entity: context.entity,
    entityId: context.entityId,
  });

  // TODO: Integrate with email service (Resend, SendGrid, etc.)
  // await emailService.send({ to: email, template, subject, data: context.data });

  return ok(undefined);
});

// Webhook executor
registerExecutor("webhook", async (effect, context) => {
  const { url, method = "POST", headers = {} } = effect.config as {
    url: string;
    method?: string;
    headers?: Record<string, string>;
  };

  logger.info("Calling webhook", {
    url,
    method,
    entity: context.entity,
    entityId: context.entityId,
  });

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": context.idempotencyKey,
        ...headers,
      },
      body: JSON.stringify({
        event: context.event,
        entity: context.entity,
        entityId: context.entityId,
        data: context.data,
        previousData: context.previousData,
        timestamp: context.timestamp.toISOString(),
      }),
    });

    if (!response.ok) {
      return err(`Webhook failed with status ${response.status}`);
    }

    return ok(undefined);
  } catch (error) {
    return err(`Webhook error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
});

// Job executor (background job scheduling)
registerExecutor("job", async (effect, context) => {
  const { jobType, queue = "default", delay = 0 } = effect.config as {
    jobType: string;
    queue?: string;
    delay?: number;
  };

  logger.info("Scheduling job", {
    jobType,
    queue,
    delay,
    entity: context.entity,
    entityId: context.entityId,
  });

  // TODO: Integrate with job queue (BullMQ, Inngest, etc.)
  // await jobQueue.add(queue, jobType, {
  //   entityId: context.entityId,
  //   data: context.data,
  //   idempotencyKey: context.idempotencyKey,
  // }, { delay });

  return ok(undefined);
});

// Audit log executor
registerExecutor("audit-log", async (effect, context) => {
  const { action, resource } = effect.config as {
    action?: string;
    resource?: string;
  };

  logger.info("Audit log entry", {
    action: action || context.event,
    resource: resource || context.entity,
    entityId: context.entityId,
    userId: context.userId,
    data: context.data,
    previousData: context.previousData,
    timestamp: context.timestamp.toISOString(),
  });

  // TODO: Integrate with audit log storage
  // await auditLogRepository.create({
  //   action: action || context.event,
  //   resource: resource || context.entity,
  //   resourceId: context.entityId,
  //   userId: context.userId,
  //   data: context.data,
  //   previousData: context.previousData,
  //   timestamp: context.timestamp,
  // });

  return ok(undefined);
});

// Cache invalidation executor
registerExecutor("cache-invalidate", async (effect, context) => {
  const { keys, patterns } = effect.config as {
    keys?: readonly string[];
    patterns?: readonly string[];
  };

  logger.info("Invalidating cache", {
    keys,
    patterns,
    entity: context.entity,
    entityId: context.entityId,
  });

  // TODO: Integrate with cache service
  // if (keys) await cacheService.deleteMany(keys);
  // if (patterns) await cacheService.deleteByPattern(patterns);

  return ok(undefined);
});

// Field update executor (cascading updates)
registerExecutor("update-field", async (effect, context) => {
  const { targetEntity, targetField, value, filter } = effect.config as {
    targetEntity: string;
    targetField: string;
    value: unknown;
    filter?: Record<string, unknown>;
  };

  logger.info("Cascading field update", {
    targetEntity,
    targetField,
    value,
    filter,
    sourceEntity: context.entity,
    sourceEntityId: context.entityId,
  });

  // TODO: Integrate with repository layer
  // await repositories[targetEntity].updateMany(filter, { [targetField]: value });

  return ok(undefined);
});

// Analytics executor
registerExecutor("analytics", async (effect, context) => {
  const { eventName, properties } = effect.config as {
    eventName: string;
    properties?: Record<string, unknown>;
  };

  logger.info("Analytics event", {
    eventName,
    properties: {
      ...properties,
      entity: context.entity,
      entityId: context.entityId,
      event: context.event,
    },
    userId: context.userId,
  });

  // TODO: Integrate with analytics service (Segment, Mixpanel, etc.)
  // await analytics.track({
  //   userId: context.userId,
  //   event: eventName,
  //   properties: { ...properties, entity: context.entity, entityId: context.entityId },
  // });

  return ok(undefined);
});

// ============================================================
// TRIGGER REGISTRY
// ============================================================

class TriggerRegistry {
  private triggers: Map<string, Trigger> = new Map();
  private entityEventIndex: Map<string, Set<string>> = new Map();

  register(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);

    const key = `${trigger.entity}:${trigger.event}`;
    if (!this.entityEventIndex.has(key)) {
      this.entityEventIndex.set(key, new Set());
    }
    this.entityEventIndex.get(key)!.add(trigger.id);
  }

  get(id: string): Trigger | undefined {
    return this.triggers.get(id);
  }

  getByEntityEvent(entity: string, event: TriggerEvent): readonly Trigger[] {
    const key = `${entity}:${event}`;
    const triggerIds = this.entityEventIndex.get(key) || new Set();
    return Array.from(triggerIds)
      .map((id) => this.triggers.get(id)!)
      .filter((t) => t.enabled);
  }

  all(): readonly Trigger[] {
    return Array.from(this.triggers.values());
  }
}

export const triggerRegistry = new TriggerRegistry();

// ============================================================
// TRIGGER EXECUTION
// ============================================================

/**
 * Execute side effect with retry logic.
 */
async function executeSideEffectWithRetry(
  effect: SideEffect,
  context: TriggerContext
): Promise<SideEffectResult> {
  const executor = getExecutor(effect.type);
  if (!executor) {
    return {
      type: effect.type,
      success: false,
      error: `No executor registered for ${effect.type}`,
      retries: 0,
      durationMs: 0,
    };
  }

  const policy = effect.retryPolicy || DEFAULT_RETRY_POLICY;
  let lastError: string | undefined;
  let retries = 0;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    if (attempt > 0) {
      // Calculate delay with exponential backoff
      const delay = Math.min(
        policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1),
        policy.maxDelayMs
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      retries++;
    }

    const result = await executor(effect, context);
    if (result.ok) {
      return {
        type: effect.type,
        success: true,
        retries,
        durationMs: Date.now() - startTime,
      };
    }

    lastError = result.error;
    logger.warn(`Side effect ${effect.type} failed (attempt ${attempt + 1})`, {
      error: lastError,
      triggerId: context.idempotencyKey,
    });
  }

  return {
    type: effect.type,
    success: false,
    error: lastError,
    retries,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Execute all triggers for an entity event.
 */
export async function executeTriggers(context: TriggerContext): Promise<readonly TriggerResult[]> {
  const triggers = triggerRegistry.getByEntityEvent(context.entity, context.event);

  if (triggers.length === 0) {
    return [];
  }

  const results: TriggerResult[] = [];

  for (const trigger of triggers) {
    // Check trigger condition
    if (trigger.condition && !trigger.condition(context)) {
      logger.debug(`Trigger ${trigger.id} condition not met, skipping`);
      continue;
    }

    const startTime = Date.now();
    const effectResults: SideEffectResult[] = [];

    // Sort side effects by priority
    const sortedEffects = [...trigger.sideEffects].sort((a, b) => b.priority - a.priority);

    for (const effect of sortedEffects) {
      // Check side effect condition
      if (effect.condition && !effect.condition(context)) {
        continue;
      }

      const result = await executeSideEffectWithRetry(effect, context);
      effectResults.push(result);
    }

    const allSucceeded = effectResults.every((r) => r.success);

    results.push({
      triggerId: trigger.id,
      success: allSucceeded,
      results: effectResults,
      durationMs: Date.now() - startTime,
    });

    logger.info(`Trigger ${trigger.id} executed`, {
      success: allSucceeded,
      effectsExecuted: effectResults.length,
      durationMs: Date.now() - startTime,
    });
  }

  return results;
}

/**
 * Create trigger context from entity operation.
 */
export function createTriggerContext(
  entity: string,
  event: TriggerEvent,
  entityId: string,
  data: Record<string, unknown>,
  options: {
    previousData?: Record<string, unknown>;
    userId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): TriggerContext {
  return {
    entity,
    event,
    entityId,
    data,
    previousData: options.previousData,
    userId: options.userId,
    timestamp: new Date(),
    metadata: options.metadata || {},
    idempotencyKey: `${entity}:${entityId}:${event}:${Date.now()}`,
  };
}

// ============================================================
// STATE TRANSITION TRIGGERS
// ============================================================

// ------------------------------------------------------------
// Appointment State Transition Triggers
// ------------------------------------------------------------

triggerRegistry.register({
  id: "Appointment-transition-confirm",
  name: "Confirm",
  entity: "Appointment",
  event: "transition",
  description: "Transition from draft to confirmed",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "draft" && toState === "confirmed";
  },
  sideEffects: [
    {
      type: "email" as SideEffectType,
      priority: 100,
      config: {
        template: "confirm-confirm",
        subject: "Confirm",
      },
    },
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "confirm",
        resource: "Appointment",
      },
    },
  ],
});

triggerRegistry.register({
  id: "Appointment-transition-start",
  name: "Start",
  entity: "Appointment",
  event: "transition",
  description: "Transition from confirmed to in_progress",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "confirmed" && toState === "in_progress";
  },
  sideEffects: [
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "start",
        resource: "Appointment",
      },
    },
  ],
});

triggerRegistry.register({
  id: "Appointment-transition-complete",
  name: "Complete",
  entity: "Appointment",
  event: "transition",
  description: "Transition from in_progress to completed",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "in_progress" && toState === "completed";
  },
  sideEffects: [
    {
      type: "audit-log" as SideEffectType,
      priority: 100,
      config: {
        action: "complete",
        resource: "complete",
      },
    },
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "complete",
        resource: "Appointment",
      },
    },
  ],
});

triggerRegistry.register({
  id: "Appointment-transition-cancel",
  name: "Cancel",
  entity: "Appointment",
  event: "transition",
  description: "Transition from confirmed to cancelled",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "confirmed" && toState === "cancelled";
  },
  sideEffects: [
    {
      type: "email" as SideEffectType,
      priority: 100,
      config: {
        template: "cancel-cancel",
        subject: "Cancel",
      },
    },
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "cancel",
        resource: "Appointment",
      },
    },
  ],
});

triggerRegistry.register({
  id: "Appointment-transition-cancel-draft",
  name: "Cancel",
  entity: "Appointment",
  event: "transition",
  description: "Transition from draft to cancelled",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "draft" && toState === "cancelled";
  },
  sideEffects: [
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "cancel-draft",
        resource: "Appointment",
      },
    },
  ],
});

triggerRegistry.register({
  id: "Appointment-transition-mark-no-show",
  name: "No Show",
  entity: "Appointment",
  event: "transition",
  description: "Transition from confirmed to no_show",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "confirmed" && toState === "no_show";
  },
  sideEffects: [
    {
      type: "audit-log" as SideEffectType,
      priority: 100,
      config: {
        action: "no--show",
        resource: "mark_no_show",
      },
    },
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "mark-no-show",
        resource: "Appointment",
      },
    },
  ],
});

// ------------------------------------------------------------
// Document State Transition Triggers
// ------------------------------------------------------------

triggerRegistry.register({
  id: "Document-transition-upload",
  name: "Upload",
  entity: "Document",
  event: "transition",
  description: "Transition from requested to uploaded",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "requested" && toState === "uploaded";
  },
  sideEffects: [
    {
      type: "notification" as SideEffectType,
      priority: 100,
      config: {
        template: "upload-upload",
        channel: "in-app",
      },
    },
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "upload",
        resource: "Document",
      },
    },
  ],
});

triggerRegistry.register({
  id: "Document-transition-review",
  name: "Review",
  entity: "Document",
  event: "transition",
  description: "Transition from uploaded to reviewed",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "uploaded" && toState === "reviewed";
  },
  sideEffects: [
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "review",
        resource: "Document",
      },
    },
  ],
});

triggerRegistry.register({
  id: "Document-transition-accept",
  name: "Accept",
  entity: "Document",
  event: "transition",
  description: "Transition from reviewed to accepted",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "reviewed" && toState === "accepted";
  },
  sideEffects: [
    {
      type: "email" as SideEffectType,
      priority: 100,
      config: {
        template: "accept-accept",
        subject: "Accept",
      },
    },
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "accept",
        resource: "Document",
      },
    },
  ],
});

triggerRegistry.register({
  id: "Document-transition-reject",
  name: "Reject",
  entity: "Document",
  event: "transition",
  description: "Transition from reviewed to rejected",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "reviewed" && toState === "rejected";
  },
  sideEffects: [
    {
      type: "email" as SideEffectType,
      priority: 100,
      config: {
        template: "reject-reject",
        subject: "Reject",
      },
    },
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "reject",
        resource: "Document",
      },
    },
  ],
});

triggerRegistry.register({
  id: "Document-transition-reupload",
  name: "Reupload",
  entity: "Document",
  event: "transition",
  description: "Transition from rejected to uploaded",
  enabled: true,
  condition: (context) => {
    const fromState = context.previousData?.status as string;
    const toState = context.data.status as string;
    return fromState === "rejected" && toState === "uploaded";
  },
  sideEffects: [
    // Default audit log for all transitions
    {
      type: "audit-log" as SideEffectType,
      priority: 10,
      config: {
        action: "reupload",
        resource: "Document",
      },
    },
  ],
});


// ============================================================
// ENTITY LIFECYCLE TRIGGERS
// ============================================================

// Profile lifecycle triggers
triggerRegistry.register({
  id: "Profile-created",
  name: "Profile Created",
  entity: "Profile",
  event: "create",
  description: "Triggered when a Profile is created",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "create", resource: "Profile" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { patterns: ["Profile:list:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Profile-updated",
  name: "Profile Updated",
  entity: "Profile",
  event: "update",
  description: "Triggered when a Profile is updated",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "update", resource: "Profile" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Profile:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Profile-deleted",
  name: "Profile Deleted",
  entity: "Profile",
  event: "delete",
  description: "Triggered when a Profile is deleted",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "delete", resource: "Profile" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Profile:*"] },
    },
  ],
});

// Client lifecycle triggers
triggerRegistry.register({
  id: "Client-created",
  name: "Client Created",
  entity: "Client",
  event: "create",
  description: "Triggered when a Client is created",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "create", resource: "Client" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { patterns: ["Client:list:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Client-updated",
  name: "Client Updated",
  entity: "Client",
  event: "update",
  description: "Triggered when a Client is updated",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "update", resource: "Client" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Client:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Client-deleted",
  name: "Client Deleted",
  entity: "Client",
  event: "delete",
  description: "Triggered when a Client is deleted",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "delete", resource: "Client" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Client:*"] },
    },
  ],
});

// Service lifecycle triggers
triggerRegistry.register({
  id: "Service-created",
  name: "Service Created",
  entity: "Service",
  event: "create",
  description: "Triggered when a Service is created",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "create", resource: "Service" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { patterns: ["Service:list:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Service-updated",
  name: "Service Updated",
  entity: "Service",
  event: "update",
  description: "Triggered when a Service is updated",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "update", resource: "Service" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Service:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Service-deleted",
  name: "Service Deleted",
  entity: "Service",
  event: "delete",
  description: "Triggered when a Service is deleted",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "delete", resource: "Service" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Service:*"] },
    },
  ],
});

// Appointment lifecycle triggers
triggerRegistry.register({
  id: "Appointment-created",
  name: "Appointment Created",
  entity: "Appointment",
  event: "create",
  description: "Triggered when a Appointment is created",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "create", resource: "Appointment" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { patterns: ["Appointment:list:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Appointment-updated",
  name: "Appointment Updated",
  entity: "Appointment",
  event: "update",
  description: "Triggered when a Appointment is updated",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "update", resource: "Appointment" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Appointment:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Appointment-deleted",
  name: "Appointment Deleted",
  entity: "Appointment",
  event: "delete",
  description: "Triggered when a Appointment is deleted",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "delete", resource: "Appointment" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Appointment:*"] },
    },
  ],
});

// Availability lifecycle triggers
triggerRegistry.register({
  id: "Availability-created",
  name: "Availability Created",
  entity: "Availability",
  event: "create",
  description: "Triggered when a Availability is created",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "create", resource: "Availability" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { patterns: ["Availability:list:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Availability-updated",
  name: "Availability Updated",
  entity: "Availability",
  event: "update",
  description: "Triggered when a Availability is updated",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "update", resource: "Availability" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Availability:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Availability-deleted",
  name: "Availability Deleted",
  entity: "Availability",
  event: "delete",
  description: "Triggered when a Availability is deleted",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "delete", resource: "Availability" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Availability:*"] },
    },
  ],
});

// Document lifecycle triggers
triggerRegistry.register({
  id: "Document-created",
  name: "Document Created",
  entity: "Document",
  event: "create",
  description: "Triggered when a Document is created",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "create", resource: "Document" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { patterns: ["Document:list:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Document-updated",
  name: "Document Updated",
  entity: "Document",
  event: "update",
  description: "Triggered when a Document is updated",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "update", resource: "Document" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Document:*"] },
    },
  ],
});

triggerRegistry.register({
  id: "Document-deleted",
  name: "Document Deleted",
  entity: "Document",
  event: "delete",
  description: "Triggered when a Document is deleted",
  enabled: true,
  sideEffects: [
    {
      type: "audit-log",
      priority: 100,
      config: { action: "delete", resource: "Document" },
    },
    {
      type: "cache-invalidate",
      priority: 50,
      config: { keys: [], patterns: ["Document:*"] },
    },
  ],
});


// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
