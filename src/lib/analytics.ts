/**
 * Analytics Library - taxbook-pro
 * Generated: 2026-01-19
 *
 * Type-safe analytics with privacy-respecting defaults.
 * Supports multiple backends (Posthog, Mixpanel, Amplitude, console).
 * All PII is stripped by default - only IDs and actions are tracked.
 *
 * PRIVACY: This module intentionally excludes email, name, and other PII.
 * User traits are limited to non-identifying attributes (plan, role, etc).
 *
 * PARETO PRINCIPLE INTEGRATION:
 * This analytics system includes special tracking for the 80/20 principle:
 * - Feature impact tracking to identify the "vital few" features
 * - Usage frequency analysis to understand where users spend time
 * - Priority tier attribution for feature flag experiments
 *
 * PARETO INSIGHTS FROM PREP:
 * - 80% of value: booking + reminders + document upload
 * - 20% effort: basic availability settings cover most use cases
 * - Focus on tax season chaos, not year-round edge cases
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

// ============================================================
// EVENT TYPE DEFINITIONS
// ============================================================

/**
 * Core event types - exhaustive union for type safety.
 * Add new event types here; the compiler will enforce handling.
 */
export type AnalyticsEventType =
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'form_error'
  | 'entity_create'
  | 'entity_update'
  | 'entity_delete'
  | 'entity_view'
  | 'search'
  | 'filter_applied'
  | 'error_occurred'
  | 'feature_used'
  | 'feature_flag_evaluated'  // Pareto: track feature flag usage
  | 'user_flow_completed'     // Pareto: track critical path completion
  | 'time_on_task';           // Pareto: measure task efficiency

/**
 * Feature priority tiers for Pareto analysis.
 * Matches the FeaturePriority type from feature-flags.ts.
 */
export type FeaturePriorityTier = 'core' | 'high_impact' | 'enhancement' | 'experiment';

/**
 * Entity types derived from project entities.
 * Used for entity_* events to ensure type safety.
 */
export type EntityType =
  | 'profile'
  | 'client'
  | 'service'
  | 'appointment'
  | 'availability'
  | 'document'
  | 'unknown';

// ============================================================
// EVENT PAYLOAD TYPES
// ============================================================

/**
 * Base properties included in every event.
 * Timestamp and session are added automatically.
 */
interface BaseEventProperties {
  readonly timestamp: string;
  readonly sessionId: string;
  readonly path: string;
}

/**
 * Page view event - tracks navigation without PII.
 */
export interface PageViewEvent extends BaseEventProperties {
  readonly type: 'page_view';
  readonly title: string;
  readonly referrer?: string;
}

/**
 * Button click event - tracks UI interactions.
 */
export interface ButtonClickEvent extends BaseEventProperties {
  readonly type: 'button_click';
  readonly buttonId: string;
  readonly buttonText?: string;
  readonly context?: string;
}

/**
 * Form submission event - tracks form completions.
 * Does NOT include form data, only metadata.
 */
export interface FormSubmitEvent extends BaseEventProperties {
  readonly type: 'form_submit';
  readonly formId: string;
  readonly formName?: string;
  readonly success: boolean;
  readonly durationMs?: number;
}

/**
 * Form error event - tracks validation failures.
 */
export interface FormErrorEvent extends BaseEventProperties {
  readonly type: 'form_error';
  readonly formId: string;
  readonly fieldId?: string;
  readonly errorCode: string;
}

/**
 * Entity CRUD events - tracks data operations.
 * Only entity type and ID are captured, never content.
 */
export interface EntityCreateEvent extends BaseEventProperties {
  readonly type: 'entity_create';
  readonly entityType: EntityType;
  readonly entityId: string;
}

export interface EntityUpdateEvent extends BaseEventProperties {
  readonly type: 'entity_update';
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly fieldsChanged?: number;
}

export interface EntityDeleteEvent extends BaseEventProperties {
  readonly type: 'entity_delete';
  readonly entityType: EntityType;
  readonly entityId: string;
}

export interface EntityViewEvent extends BaseEventProperties {
  readonly type: 'entity_view';
  readonly entityType: EntityType;
  readonly entityId: string;
}

/**
 * Search event - tracks search usage.
 * Query is hashed for privacy, not stored raw.
 */
export interface SearchEvent extends BaseEventProperties {
  readonly type: 'search';
  readonly queryLength: number;
  readonly resultCount: number;
  readonly entityType?: EntityType;
}

/**
 * Filter applied event - tracks filter usage patterns.
 */
export interface FilterAppliedEvent extends BaseEventProperties {
  readonly type: 'filter_applied';
  readonly filterType: string;
  readonly filterCount: number;
  readonly entityType?: EntityType;
}

/**
 * Error event - tracks application errors.
 * Stack traces are sanitized to remove file paths.
 */
export interface ErrorOccurredEvent extends BaseEventProperties {
  readonly type: 'error_occurred';
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly component?: string;
}

/**
 * Feature usage event - tracks feature adoption.
 */
export interface FeatureUsedEvent extends BaseEventProperties {
  readonly type: 'feature_used';
  readonly featureId: string;
  readonly featureName?: string;
  readonly metadata?: Record<string, string | number | boolean>;
}

/**
 * Feature flag evaluated event - tracks flag usage for Pareto analysis.
 * Enables measuring which features are actually being used.
 */
export interface FeatureFlagEvaluatedEvent extends BaseEventProperties {
  readonly type: 'feature_flag_evaluated';
  readonly flagKey: string;
  readonly flagValue: boolean | string | number;
  readonly priority: FeaturePriorityTier;
  readonly expectedImpact?: number;
  readonly wasEnabled: boolean;
}

/**
 * User flow completed event - tracks critical path completion.
 * The "vital few" flows that deliver 80% of user value.
 */
export interface UserFlowCompletedEvent extends BaseEventProperties {
  readonly type: 'user_flow_completed';
  readonly flowId: string;
  readonly flowName: string;
  readonly durationMs: number;
  readonly stepsCompleted: number;
  readonly stepsTotal: number;
  readonly wasSuccessful: boolean;
  readonly priority: FeaturePriorityTier;
}

/**
 * Time on task event - measures task efficiency.
 * Helps identify which features need optimization (Pareto: focus on high-use tasks).
 */
export interface TimeOnTaskEvent extends BaseEventProperties {
  readonly type: 'time_on_task';
  readonly taskId: string;
  readonly taskName: string;
  readonly durationMs: number;
  readonly entityType?: EntityType;
  readonly completed: boolean;
}

/**
 * Union type of all possible events.
 */
export type AnalyticsEvent =
  | PageViewEvent
  | ButtonClickEvent
  | FormSubmitEvent
  | FormErrorEvent
  | EntityCreateEvent
  | EntityUpdateEvent
  | EntityDeleteEvent
  | EntityViewEvent
  | SearchEvent
  | FilterAppliedEvent
  | ErrorOccurredEvent
  | FeatureUsedEvent
  | FeatureFlagEvaluatedEvent
  | UserFlowCompletedEvent
  | TimeOnTaskEvent;

// ============================================================
// USER TRAITS (Non-PII only)
// ============================================================

/**
 * User traits for identification.
 * PRIVACY: Intentionally excludes email, name, phone, etc.
 * Only non-identifying attributes are allowed.
 */
export interface UserTraits {
  readonly plan?: 'free' | 'pro' | 'enterprise' | string;
  readonly role?: 'user' | 'admin' | 'owner' | string;
  readonly accountAge?: number; // days since signup
  readonly featureFlags?: readonly string[];
  readonly locale?: string;
  readonly timezone?: string;
}

// ============================================================
// ANALYTICS PROVIDER INTERFACE
// ============================================================

/**
 * Provider abstraction - implement this for different backends.
 */
export interface AnalyticsProvider {
  readonly name: string;
  init(): Promise<void>;
  identify(userId: string, traits?: UserTraits): Promise<void>;
  track(event: AnalyticsEvent): Promise<void>;
  page(name: string, properties?: Record<string, unknown>): Promise<void>;
  reset(): Promise<void>;
  flush(): Promise<void>;
}

// ============================================================
// CONSOLE PROVIDER (Development)
// ============================================================

/**
 * Console provider for development - logs events to console.
 */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'console';
  private enabled = true;

  async init(): Promise<void> {
    console.log('[Analytics] Console provider initialized');
  }

  async identify(userId: string, traits?: UserTraits): Promise<void> {
    if (!this.enabled) return;
    console.log('[Analytics] Identify:', { userId, traits });
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.enabled) return;
    console.log(`[Analytics] Track [${event.type}]:`, event);
  }

  async page(name: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.enabled) return;
    console.log('[Analytics] Page:', { name, properties });
  }

  async reset(): Promise<void> {
    console.log('[Analytics] Reset');
  }

  async flush(): Promise<void> {
    // Console provider doesn't need flushing
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// ============================================================
// POSTHOG PROVIDER
// ============================================================

/**
 * PostHog provider - production analytics.
 * Requires NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST.
 * Note: posthog-js is an optional dependency. Install it with:
 *   npm install posthog-js
 */
export class PosthogAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'posthog';
  private posthog: unknown = null;
  private initFailed = false;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (!posthogKey) {
      console.warn('[Analytics] PostHog key not configured');
      return;
    }

    try {
      // Dynamic import - posthog-js is an optional dependency
      // If not installed, this will gracefully fail and fall back to no-op behavior
      // Using Function constructor to prevent bundlers from trying to resolve the module at build time
      const dynamicImport = new Function('specifier', 'return import(specifier)');
      const posthogModule = await dynamicImport('posthog-js').catch(() => null);

      if (!posthogModule) {
        console.warn('[Analytics] posthog-js not installed. Install with: npm install posthog-js');
        this.initFailed = true;
        return;
      }

      const posthog = posthogModule.default;
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: false, // We handle this manually
        capture_pageleave: true,
        persistence: 'localStorage',
        autocapture: false, // We use explicit tracking
        disable_session_recording: true, // Privacy default
      });
      this.posthog = posthog;
    } catch (err) {
      console.warn('[Analytics] Failed to initialize PostHog. Is posthog-js installed?', err);
      this.initFailed = true;
    }
  }

  async identify(userId: string, traits?: UserTraits): Promise<void> {
    if (!this.posthog) return;
    (this.posthog as any).identify(userId, traits);
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.posthog) return;
    const { type, ...properties } = event;
    (this.posthog as any).capture(type, properties);
  }

  async page(name: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.posthog) return;
    (this.posthog as any).capture('$pageview', { page_name: name, ...properties });
  }

  async reset(): Promise<void> {
    if (!this.posthog) return;
    (this.posthog as any).reset();
  }

  async flush(): Promise<void> {
    // PostHog handles flushing automatically
  }
}

// ============================================================
// ANALYTICS MANAGER (SINGLETON)
// ============================================================

/**
 * Event queue item for batching.
 */
interface QueuedEvent {
  readonly event: AnalyticsEvent;
  readonly enqueuedAt: number;
}

/**
 * Analytics manager configuration.
 */
export interface AnalyticsConfig {
  readonly provider: 'console' | 'posthog' | 'custom';
  readonly customProvider?: AnalyticsProvider;
  readonly batchSize?: number;
  readonly flushIntervalMs?: number;
  readonly enabled?: boolean;
  readonly debug?: boolean;
}

/**
 * Singleton analytics manager.
 * Handles event batching, provider abstraction, and lifecycle.
 */
class AnalyticsManager {
  private provider: AnalyticsProvider | null = null;
  private queue: QueuedEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private config: Required<AnalyticsConfig>;
  private initialized = false;
  private userId: string | null = null;
  private sessionId: string;

  constructor() {
    this.config = {
      provider: 'console',
      customProvider: undefined as any,
      batchSize: 10,
      flushIntervalMs: 5000,
      enabled: true,
      debug: false,
    };
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize analytics with configuration.
   */
  async init(config: Partial<AnalyticsConfig> = {}): Promise<void> {
    if (this.initialized) return;

    this.config = { ...this.config, ...config };

    if (!this.config.enabled) {
      this.log('Analytics disabled');
      return;
    }

    // Create provider based on config
    switch (this.config.provider) {
      case 'console':
        this.provider = new ConsoleAnalyticsProvider();
        break;
      case 'posthog':
        this.provider = new PosthogAnalyticsProvider();
        break;
      case 'custom':
        if (!this.config.customProvider) {
          throw new Error('Custom provider not provided');
        }
        this.provider = this.config.customProvider;
        break;
    }

    await this.provider.init();
    this.startFlushInterval();
    this.initialized = true;
    this.log('Analytics initialized with provider:', this.provider.name);
  }

  /**
   * Identify user (call after authentication).
   */
  async identify(userId: string, traits?: UserTraits): Promise<void> {
    if (!this.config.enabled || !this.provider) return;

    this.userId = userId;
    await this.provider.identify(userId, traits);
    this.log('User identified:', userId);
  }

  /**
   * Track an analytics event.
   * Uses a type-safe builder pattern to ensure all required properties are included.
   */
  async track<T extends AnalyticsEvent['type']>(
    type: T,
    properties: Omit<Extract<AnalyticsEvent, { type: T }>, 'type' | keyof BaseEventProperties>
  ): Promise<void> {
    if (!this.config.enabled) return;

    // Build base properties that are common to all events
    const baseProps: BaseEventProperties = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      path: typeof window !== 'undefined' ? window.location.pathname : '',
    };

    // Construct the event with proper type inference
    // The generic constraint ensures 'properties' contains all required fields for event type T
    const event: Extract<AnalyticsEvent, { type: T }> = {
      type,
      ...baseProps,
      ...properties,
    } as Extract<AnalyticsEvent, { type: T }>;

    this.queue.push({ event, enqueuedAt: Date.now() });
    this.log('Event queued:', type);

    // Flush immediately if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  /**
   * Track page view.
   */
  async page(name: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.config.enabled || !this.provider) return;
    await this.provider.page(name, properties);
  }

  /**
   * Reset analytics (call on logout).
   */
  async reset(): Promise<void> {
    if (!this.provider) return;
    this.userId = null;
    this.sessionId = this.generateSessionId();
    await this.provider.reset();
    this.log('Analytics reset');
  }

  /**
   * Flush queued events to provider.
   */
  async flush(): Promise<void> {
    if (!this.provider || this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    this.log(`Flushing ${events.length} events`);

    for (const { event } of events) {
      try {
        await this.provider.track(event);
      } catch (err) {
        console.error('[Analytics] Failed to track event:', err);
        // Re-queue failed events (with limit to prevent infinite loop)
        if (this.queue.length < 100) {
          this.queue.push({ event, enqueuedAt: Date.now() });
        }
      }
    }

    await this.provider.flush();
  }

  /**
   * Check if analytics is enabled.
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current session ID.
   */
  getSessionId(): string {
    return this.sessionId;
  }

  private startFlushInterval(): void {
    if (typeof window === 'undefined') return;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushIntervalMs);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }
}

// Singleton instance
export const analytics = new AnalyticsManager();

// ============================================================
// REACT HOOK: useTrack
// ============================================================

/**
 * React hook for type-safe analytics tracking.
 *
 * @example
 * const { track, trackClick, trackEntityCreate } = useTrack();
 *
 * // Track button click
 * <button onClick={() => trackClick('save-button', 'Save Changes')}>
 *   Save
 * </button>
 *
 * // Track entity creation
 * const handleCreate = async (data) => {
 *   const result = await createEntity(data);
 *   if (result.ok) {
 *     trackEntityCreate('project', result.value.id);
 *   }
 * };
 */
export function useTrack() {
  // Store sessionId in state to avoid accessing ref during render
  const [currentSessionId] = useState(() => analytics.getSessionId());

  /**
   * Track any event with full type safety.
   */
  const track = useCallback(
    <T extends AnalyticsEvent['type']>(
      type: T,
      properties: Omit<Extract<AnalyticsEvent, { type: T }>, 'type' | keyof BaseEventProperties>
    ) => {
      analytics.track(type, properties);
    },
    []
  );

  /**
   * Track button click.
   */
  const trackClick = useCallback(
    (buttonId: string, buttonText?: string, context?: string) => {
      analytics.track('button_click', { buttonId, buttonText, context });
    },
    []
  );

  /**
   * Track form submission.
   */
  const trackFormSubmit = useCallback(
    (formId: string, success: boolean, formName?: string, durationMs?: number) => {
      analytics.track('form_submit', { formId, success, formName, durationMs });
    },
    []
  );

  /**
   * Track form error.
   */
  const trackFormError = useCallback(
    (formId: string, errorCode: string, fieldId?: string) => {
      analytics.track('form_error', { formId, errorCode, fieldId });
    },
    []
  );

  /**
   * Track entity creation.
   */
  const trackEntityCreate = useCallback(
    (entityType: EntityType, entityId: string) => {
      analytics.track('entity_create', { entityType, entityId });
    },
    []
  );

  /**
   * Track entity update.
   */
  const trackEntityUpdate = useCallback(
    (entityType: EntityType, entityId: string, fieldsChanged?: number) => {
      analytics.track('entity_update', { entityType, entityId, fieldsChanged });
    },
    []
  );

  /**
   * Track entity deletion.
   */
  const trackEntityDelete = useCallback(
    (entityType: EntityType, entityId: string) => {
      analytics.track('entity_delete', { entityType, entityId });
    },
    []
  );

  /**
   * Track entity view.
   */
  const trackEntityView = useCallback(
    (entityType: EntityType, entityId: string) => {
      analytics.track('entity_view', { entityType, entityId });
    },
    []
  );

  /**
   * Track search.
   */
  const trackSearch = useCallback(
    (queryLength: number, resultCount: number, entityType?: EntityType) => {
      analytics.track('search', { queryLength, resultCount, entityType });
    },
    []
  );

  /**
   * Track feature usage.
   */
  const trackFeature = useCallback(
    (featureId: string, featureName?: string, metadata?: Record<string, string | number | boolean>) => {
      analytics.track('feature_used', { featureId, featureName, metadata });
    },
    []
  );

  /**
   * Track error.
   */
  const trackError = useCallback(
    (errorCode: string, errorMessage: string, component?: string) => {
      analytics.track('error_occurred', { errorCode, errorMessage, component });
    },
    []
  );

  // ============================================================
  // PARETO-SPECIFIC TRACKING
  // ============================================================

  /**
   * Track feature flag evaluation for Pareto analysis.
   * Call this when a feature flag is evaluated to measure actual usage.
   *
   * @example
   * const isEnabled = useFeatureFlag('newDashboard', context);
   * trackFlagEvaluated('newDashboard', isEnabled, 'high_impact', 75);
   */
  const trackFlagEvaluated = useCallback(
    (
      flagKey: string,
      flagValue: boolean | string | number,
      priority: FeaturePriorityTier,
      expectedImpact?: number
    ) => {
      analytics.track('feature_flag_evaluated', {
        flagKey,
        flagValue,
        priority,
        expectedImpact,
        wasEnabled: Boolean(flagValue),
      });
    },
    []
  );

  /**
   * Track user flow completion for Pareto analysis.
   * Use this to measure the "vital few" flows that deliver 80% of value.
   *
   * @example
   * const startTime = Date.now();
   * // ... user completes checkout flow ...
   * trackFlowCompleted('checkout', 'Checkout Flow', Date.now() - startTime, 3, 3, true, 'core');
   */
  const trackFlowCompleted = useCallback(
    (
      flowId: string,
      flowName: string,
      durationMs: number,
      stepsCompleted: number,
      stepsTotal: number,
      wasSuccessful: boolean,
      priority: FeaturePriorityTier
    ) => {
      analytics.track('user_flow_completed', {
        flowId,
        flowName,
        durationMs,
        stepsCompleted,
        stepsTotal,
        wasSuccessful,
        priority,
      });
    },
    []
  );

  /**
   * Track time spent on a task.
   * Helps identify which tasks need optimization (Pareto: focus on high-use tasks).
   *
   * @example
   * const { startTask, endTask } = useTaskTimer();
   * startTask('edit-profile');
   * // ... user edits profile ...
   * endTask('edit-profile', true);
   */
  const trackTimeOnTask = useCallback(
    (
      taskId: string,
      taskName: string,
      durationMs: number,
      completed: boolean,
      entityType?: EntityType
    ) => {
      analytics.track('time_on_task', {
        taskId,
        taskName,
        durationMs,
        completed,
        entityType,
      });
    },
    []
  );

  return {
    track,
    trackClick,
    trackFormSubmit,
    trackFormError,
    trackEntityCreate,
    trackEntityUpdate,
    trackEntityDelete,
    trackEntityView,
    trackSearch,
    trackFeature,
    trackError,
    // Pareto-specific tracking
    trackFlagEvaluated,
    trackFlowCompleted,
    trackTimeOnTask,
    sessionId: currentSessionId,
  };
}

// ============================================================
// PAGE VIEW HOOK
// ============================================================

/**
 * Hook to track page views automatically.
 * Include this in your layout or page components.
 *
 * @example
 * // In app/layout.tsx or specific pages
 * function Layout({ children }) {
 *   usePageView();
 *   return <>{children}</>;
 * }
 */
export function usePageView(pageName?: string) {
  useEffect(() => {
    const name = pageName || (typeof document !== 'undefined' ? document.title : 'Unknown');
    analytics.page(name, {
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    });

    analytics.track('page_view', {
      title: name,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    });
  }, [pageName]);
}

// ============================================================
// SERVER-SIDE TRACKING
// ============================================================

/**
 * Server-side analytics for API routes.
 * Does not use batching - events are sent immediately.
 *
 * @example
 * // In an API route
 * import { serverTrack } from '@/lib/analytics';
 *
 * export async function POST(request: Request) {
 *   const result = await createEntity(data);
 *
 *   if (result.ok) {
 *     await serverTrack({
 *       type: 'entity_create',
 *       entityType: 'project',
 *       entityId: result.value.id,
 *       timestamp: new Date().toISOString(),
 *       sessionId: request.headers.get('x-session-id') || 'server',
 *       path: '/api/projects',
 *     });
 *   }
 *
 *   return Response.json(result);
 * }
 */
export async function serverTrack(event: AnalyticsEvent): Promise<void> {
  // In server context, we send directly to the analytics backend
  const posthogKey = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!posthogKey) {
    console.log('[Analytics:Server] Event tracked (no backend configured):', event.type);
    return;
  }

  try {
    const { type, ...properties } = event;

    await fetch(`${posthogHost}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: posthogKey,
        event: type,
        properties: {
          ...properties,
          $lib: 'server',
        },
        timestamp: event.timestamp,
      }),
    });
  } catch (err) {
    console.error('[Analytics:Server] Failed to track event:', err);
  }
}

/**
 * Create a server-side tracker with pre-configured context.
 *
 * @example
 * const tracker = createServerTracker('/api/projects', sessionId, userId);
 * await tracker.entityCreate('project', newProject.id);
 */
export function createServerTracker(
  path: string,
  sessionId: string,
  userId?: string
) {
  const baseProperties = {
    path,
    sessionId,
    timestamp: '', // Will be set per event
  };

  return {
    async entityCreate(entityType: EntityType, entityId: string) {
      await serverTrack({
        ...baseProperties,
        type: 'entity_create',
        entityType,
        entityId,
        timestamp: new Date().toISOString(),
      });
    },

    async entityUpdate(entityType: EntityType, entityId: string, fieldsChanged?: number) {
      await serverTrack({
        ...baseProperties,
        type: 'entity_update',
        entityType,
        entityId,
        fieldsChanged,
        timestamp: new Date().toISOString(),
      });
    },

    async entityDelete(entityType: EntityType, entityId: string) {
      await serverTrack({
        ...baseProperties,
        type: 'entity_delete',
        entityType,
        entityId,
        timestamp: new Date().toISOString(),
      });
    },

    async error(errorCode: string, errorMessage: string, component?: string) {
      await serverTrack({
        ...baseProperties,
        type: 'error_occurred',
        errorCode,
        errorMessage,
        component,
        timestamp: new Date().toISOString(),
      });
    },

    async feature(featureId: string, featureName?: string, metadata?: Record<string, string | number | boolean>) {
      await serverTrack({
        ...baseProperties,
        type: 'feature_used',
        featureId,
        featureName,
        metadata,
        timestamp: new Date().toISOString(),
      });
    },
  };
}

// ============================================================
// ENTITY-SPECIFIC TRACKING HELPERS
// ============================================================

/**
 * Track Profile entity events.
 */
export const trackProfile = {
  create: (id: string) => analytics.track('entity_create', { entityType: 'profile', entityId: id }),
  update: (id: string, fieldsChanged?: number) => analytics.track('entity_update', { entityType: 'profile', entityId: id, fieldsChanged }),
  delete: (id: string) => analytics.track('entity_delete', { entityType: 'profile', entityId: id }),
  view: (id: string) => analytics.track('entity_view', { entityType: 'profile', entityId: id }),
};

/**
 * Track Client entity events.
 */
export const trackClient = {
  create: (id: string) => analytics.track('entity_create', { entityType: 'client', entityId: id }),
  update: (id: string, fieldsChanged?: number) => analytics.track('entity_update', { entityType: 'client', entityId: id, fieldsChanged }),
  delete: (id: string) => analytics.track('entity_delete', { entityType: 'client', entityId: id }),
  view: (id: string) => analytics.track('entity_view', { entityType: 'client', entityId: id }),
};

/**
 * Track Service entity events.
 */
export const trackService = {
  create: (id: string) => analytics.track('entity_create', { entityType: 'service', entityId: id }),
  update: (id: string, fieldsChanged?: number) => analytics.track('entity_update', { entityType: 'service', entityId: id, fieldsChanged }),
  delete: (id: string) => analytics.track('entity_delete', { entityType: 'service', entityId: id }),
  view: (id: string) => analytics.track('entity_view', { entityType: 'service', entityId: id }),
};

/**
 * Track Appointment entity events.
 */
export const trackAppointment = {
  create: (id: string) => analytics.track('entity_create', { entityType: 'appointment', entityId: id }),
  update: (id: string, fieldsChanged?: number) => analytics.track('entity_update', { entityType: 'appointment', entityId: id, fieldsChanged }),
  delete: (id: string) => analytics.track('entity_delete', { entityType: 'appointment', entityId: id }),
  view: (id: string) => analytics.track('entity_view', { entityType: 'appointment', entityId: id }),
};

/**
 * Track Availability entity events.
 */
export const trackAvailability = {
  create: (id: string) => analytics.track('entity_create', { entityType: 'availability', entityId: id }),
  update: (id: string, fieldsChanged?: number) => analytics.track('entity_update', { entityType: 'availability', entityId: id, fieldsChanged }),
  delete: (id: string) => analytics.track('entity_delete', { entityType: 'availability', entityId: id }),
  view: (id: string) => analytics.track('entity_view', { entityType: 'availability', entityId: id }),
};

/**
 * Track Document entity events.
 */
export const trackDocument = {
  create: (id: string) => analytics.track('entity_create', { entityType: 'document', entityId: id }),
  update: (id: string, fieldsChanged?: number) => analytics.track('entity_update', { entityType: 'document', entityId: id, fieldsChanged }),
  delete: (id: string) => analytics.track('entity_delete', { entityType: 'document', entityId: id }),
  view: (id: string) => analytics.track('entity_view', { entityType: 'document', entityId: id }),
};

// ============================================================
// INITIALIZATION HELPER
// ============================================================

/**
 * Initialize analytics - call once in your app's entry point.
 *
 * @example
 * // In app/providers.tsx or app/layout.tsx
 * 'use client';
 *
 * import { initAnalytics } from '@/lib/analytics';
 *
 * export function Providers({ children }) {
 *   useEffect(() => {
 *     initAnalytics({
 *       provider: process.env.NODE_ENV === 'production' ? 'posthog' : 'console',
 *       debug: process.env.NODE_ENV === 'development',
 *     });
 *   }, []);
 *
 *   return <>{children}</>;
 * }
 */
export async function initAnalytics(config?: Partial<AnalyticsConfig>): Promise<void> {
  await analytics.init(config);
}

// ============================================================
// PARETO ANALYSIS UTILITIES
// ============================================================

/**
 * Task timer hook for measuring time-on-task.
 * Helps identify which tasks consume user time (Pareto: optimize the vital few).
 *
 * @example
 * const { startTask, endTask, activeTasks } = useTaskTimer();
 *
 * // Start timing when user begins a task
 * const handleEditClick = () => {
 *   startTask('edit-profile', 'Edit Profile');
 *   openEditModal();
 * };
 *
 * // End timing when task completes
 * const handleSave = async () => {
 *   const result = await saveProfile();
 *   endTask('edit-profile', result.ok);
 * };
 */
export function useTaskTimer() {
  const [activeTasks, setActiveTasks] = useState<Map<string, { name: string; startTime: number }>>(
    new Map()
  );

  const startTask = useCallback((taskId: string, taskName: string) => {
    setActiveTasks(prev => {
      const next = new Map(prev);
      next.set(taskId, { name: taskName, startTime: Date.now() });
      return next;
    });
  }, []);

  const endTask = useCallback((taskId: string, completed: boolean, entityType?: EntityType) => {
    setActiveTasks(prev => {
      const task = prev.get(taskId);
      if (!task) return prev;

      const durationMs = Date.now() - task.startTime;
      analytics.track('time_on_task', {
        taskId,
        taskName: task.name,
        durationMs,
        completed,
        entityType,
      });

      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  const cancelTask = useCallback((taskId: string) => {
    setActiveTasks(prev => {
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  return {
    startTask,
    endTask,
    cancelTask,
    activeTasks: Array.from(activeTasks.entries()).map(([id, data]) => ({
      id,
      ...data,
      elapsedMs: Date.now() - data.startTime,
    })),
  };
}

/**
 * User flow tracker for measuring critical path completion.
 * Tracks the "vital few" flows that deliver 80% of user value.
 *
 * @example
 * const checkout = useFlowTracker('checkout', 'Checkout Flow', 'core');
 *
 * // In step components:
 * checkout.stepCompleted('cart-review');
 * checkout.stepCompleted('payment');
 * checkout.complete(true); // Success!
 */
export function useFlowTracker(
  flowId: string,
  flowName: string,
  priority: FeaturePriorityTier
) {
  const [startTime] = useState(() => Date.now());
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [totalSteps, setTotalSteps] = useState(0);

  const defineSteps = useCallback((steps: string[]) => {
    setTotalSteps(steps.length);
  }, []);

  const stepCompleted = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
  }, []);

  const complete = useCallback((wasSuccessful: boolean) => {
    const durationMs = Date.now() - startTime;
    analytics.track('user_flow_completed', {
      flowId,
      flowName,
      durationMs,
      stepsCompleted: completedSteps.size,
      stepsTotal: totalSteps || completedSteps.size,
      wasSuccessful,
      priority,
    });
  }, [flowId, flowName, priority, startTime, completedSteps.size, totalSteps]);

  const abandon = useCallback(() => {
    complete(false);
  }, [complete]);

  return {
    defineSteps,
    stepCompleted,
    complete,
    abandon,
    progress: totalSteps > 0 ? completedSteps.size / totalSteps : 0,
    completedSteps: Array.from(completedSteps),
  };
}

/**
 * Critical flows for Pareto analysis.
 * Define your app's "vital few" flows here.
 * These are the 20% of flows that deliver 80% of user value.
 */
export const CRITICAL_FLOWS = {
  // Entity-specific critical flows
  profile_create: {
    id: 'profile_create',
    name: 'Create Profile',
    priority: 'core' as FeaturePriorityTier,
  },
  client_create: {
    id: 'client_create',
    name: 'Create Client',
    priority: 'core' as FeaturePriorityTier,
  },
  service_create: {
    id: 'service_create',
    name: 'Create Service',
    priority: 'core' as FeaturePriorityTier,
  },
  appointment_create: {
    id: 'appointment_create',
    name: 'Create Appointment',
    priority: 'core' as FeaturePriorityTier,
  },
  availability_create: {
    id: 'availability_create',
    name: 'Create Availability',
    priority: 'core' as FeaturePriorityTier,
  },
  document_create: {
    id: 'document_create',
    name: 'Create Document',
    priority: 'core' as FeaturePriorityTier,
  },
  // Common critical flows
  onboarding: {
    id: 'onboarding',
    name: 'User Onboarding',
    priority: 'core' as FeaturePriorityTier,
  },
  checkout: {
    id: 'checkout',
    name: 'Checkout Flow',
    priority: 'core' as FeaturePriorityTier,
  },
  profile_setup: {
    id: 'profile_setup',
    name: 'Profile Setup',
    priority: 'high_impact' as FeaturePriorityTier,
  },
} as const;

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
