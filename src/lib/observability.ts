/**
 * Observability Library - taxbook-pro
 * Generated: 2026-01-19
 *
 * Production-grade observability with OpenTelemetry integration.
 * Provides tracing, structured logging, metrics, and health checks.
 *
 * Features:
 * - Distributed tracing with context propagation
 * - Structured JSON logging with correlation IDs
 * - Prometheus-compatible metrics
 * - Health check endpoints with dependency status
 * - SLI/SLO helpers for reliability tracking
 */

// ============================================================
// RESULT TYPE (for explicit error handling)
// ============================================================

/**
 * Result type for operations that can fail.
 * Prefer this over throwing exceptions.
 */
export type Result<T, E = ObservabilityError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ============================================================
// ERROR TYPES
// ============================================================

/**
 * Observability-specific error types.
 */
export type ObservabilityError =
  | { type: 'tracer_init_failed'; reason: string }
  | { type: 'span_not_found'; spanId: string }
  | { type: 'metric_registration_failed'; metricName: string; reason: string }
  | { type: 'health_check_failed'; dependency: string; reason: string }
  | { type: 'config_invalid'; field: string; reason: string };

// ============================================================
// LOG LEVEL TYPES
// ============================================================

/**
 * Log levels following standard severity ordering.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Numeric severity for log level comparison.
 */
const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ============================================================
// CONTEXT TYPES
// ============================================================

/**
 * Request context for correlation.
 * Propagated through async operations.
 */
export interface RequestContext {
  readonly traceId: string;
  readonly spanId: string;
  readonly correlationId: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly requestPath?: string;
  readonly requestMethod?: string;
  readonly userAgent?: string;
}

/**
 * Span attributes for tracing.
 */
export interface SpanAttributes {
  readonly [key: string]: string | number | boolean | undefined;
}

/**
 * Span status codes.
 */
export type SpanStatus = 'ok' | 'error' | 'unset';

/**
 * Active span information.
 */
export interface ActiveSpan {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly startTime: number;
  readonly attributes: SpanAttributes;
  setStatus(status: SpanStatus, message?: string): void;
  addEvent(name: string, attributes?: SpanAttributes): void;
  end(): void;
}

// ============================================================
// METRIC TYPES
// ============================================================

/**
 * Metric label key-value pairs.
 */
export interface MetricLabels {
  readonly [key: string]: string;
}

/**
 * Counter metric - monotonically increasing value.
 */
export interface Counter {
  readonly name: string;
  inc(labels?: MetricLabels, value?: number): void;
}

/**
 * Gauge metric - value that can go up or down.
 */
export interface Gauge {
  readonly name: string;
  set(value: number, labels?: MetricLabels): void;
  inc(labels?: MetricLabels, value?: number): void;
  dec(labels?: MetricLabels, value?: number): void;
}

/**
 * Histogram metric - distribution of values.
 */
export interface Histogram {
  readonly name: string;
  observe(value: number, labels?: MetricLabels): void;
}

// ============================================================
// HEALTH CHECK TYPES
// ============================================================

/**
 * Health status of a dependency.
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Individual dependency health result.
 */
export interface DependencyHealth {
  readonly name: string;
  readonly status: HealthStatus;
  readonly latencyMs?: number;
  readonly message?: string;
  readonly lastChecked: string;
}

/**
 * Overall system health result.
 */
export interface SystemHealth {
  readonly status: HealthStatus;
  readonly version: string;
  readonly uptime: number;
  readonly timestamp: string;
  readonly dependencies: readonly DependencyHealth[];
}

/**
 * Health check function type.
 */
export type HealthCheckFn = () => Promise<DependencyHealth>;

// ============================================================
// SLI/SLO TYPES
// ============================================================

/**
 * Service Level Indicator measurement.
 */
export interface SLIMeasurement {
  readonly name: string;
  readonly value: number;
  readonly timestamp: string;
  readonly window: '1m' | '5m' | '1h' | '1d' | '7d' | '30d';
}

/**
 * Service Level Objective definition.
 */
export interface SLODefinition {
  readonly name: string;
  readonly description: string;
  readonly target: number; // e.g., 0.999 for 99.9%
  readonly window: '1h' | '1d' | '7d' | '30d';
  readonly indicator: 'availability' | 'latency_p99' | 'latency_p95' | 'error_rate';
}

/**
 * Error budget status.
 */
export interface ErrorBudgetStatus {
  readonly sloName: string;
  readonly budgetTotal: number;
  readonly budgetConsumed: number;
  readonly budgetRemaining: number;
  readonly percentRemaining: number;
  readonly isBurning: boolean;
  readonly burnRate: number;
  readonly projectedExhaustion?: string;
}

// ============================================================
// STRUCTURED LOGGER
// ============================================================

/**
 * Log entry with structured fields.
 */
export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly correlationId?: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly userId?: string;
  readonly service: string;
  readonly environment: string;
  readonly [key: string]: unknown;
}

/**
 * Logger configuration.
 */
export interface LoggerConfig {
  readonly service: string;
  readonly environment: string;
  readonly minLevel: LogLevel;
  readonly pretty: boolean;
}

/**
 * Structured logger with context support.
 */
class StructuredLogger {
  private config: LoggerConfig;
  private contextStack: RequestContext[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      service: config.service || 'taxbook-pro',
      environment: config.environment || process.env.NODE_ENV || 'development',
      minLevel: config.minLevel || 'info',
      pretty: config.pretty ?? (process.env.NODE_ENV === 'development'),
    };
  }

  /**
   * Push request context onto the stack.
   */
  pushContext(context: RequestContext): void {
    this.contextStack.push(context);
  }

  /**
   * Pop request context from the stack.
   */
  popContext(): RequestContext | undefined {
    return this.contextStack.pop();
  }

  /**
   * Get current request context.
   */
  getCurrentContext(): RequestContext | undefined {
    return this.contextStack[this.contextStack.length - 1];
  }

  /**
   * Create a child logger with additional fields.
   */
  child(fields: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, fields);
  }

  /**
   * Log at debug level.
   */
  debug(message: string, fields?: Record<string, unknown>): void {
    this.log('debug', message, fields);
  }

  /**
   * Log at info level.
   */
  info(message: string, fields?: Record<string, unknown>): void {
    this.log('info', message, fields);
  }

  /**
   * Log at warn level.
   */
  warn(message: string, fields?: Record<string, unknown>): void {
    this.log('warn', message, fields);
  }

  /**
   * Log at error level.
   */
  error(message: string, fields?: Record<string, unknown>): void {
    this.log('error', message, fields);
  }

  /**
   * Log with explicit level.
   */
  log(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
    if (LOG_LEVEL_SEVERITY[level] < LOG_LEVEL_SEVERITY[this.config.minLevel]) {
      return;
    }

    const context = this.getCurrentContext();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.service,
      environment: this.config.environment,
      correlationId: context?.correlationId,
      traceId: context?.traceId,
      spanId: context?.spanId,
      userId: context?.userId,
      ...fields,
    };

    this.output(entry);
  }

  private output(entry: LogEntry): void {
    const output = this.config.pretty
      ? this.formatPretty(entry)
      : JSON.stringify(entry);

    switch (entry.level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  private formatPretty(entry: LogEntry): string {
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    const dim = '\x1b[2m';

    const { timestamp, level, message, correlationId, ...rest } = entry;
    const time = timestamp.split('T')[1]?.replace('Z', '') || timestamp;
    const corrId = correlationId ? ` ${dim}[${correlationId.slice(0, 8)}]${reset}` : '';
    const extra = Object.keys(rest).length > 2
      ? ` ${dim}${JSON.stringify(rest)}${reset}`
      : '';

    return `${dim}${time}${reset} ${levelColors[level]}${level.toUpperCase().padEnd(5)}${reset}${corrId} ${message}${extra}`;
  }
}

/**
 * Child logger with inherited fields.
 */
class ChildLogger {
  constructor(
    private parent: StructuredLogger,
    private fields: Record<string, unknown>
  ) {}

  debug(message: string, fields?: Record<string, unknown>): void {
    this.parent.debug(message, { ...this.fields, ...fields });
  }

  info(message: string, fields?: Record<string, unknown>): void {
    this.parent.info(message, { ...this.fields, ...fields });
  }

  warn(message: string, fields?: Record<string, unknown>): void {
    this.parent.warn(message, { ...this.fields, ...fields });
  }

  error(message: string, fields?: Record<string, unknown>): void {
    this.parent.error(message, { ...this.fields, ...fields });
  }
}

// ============================================================
// TRACER IMPLEMENTATION
// ============================================================

/**
 * Lightweight tracer for distributed tracing.
 * Compatible with OpenTelemetry trace format.
 */
class Tracer {
  private activeSpans: Map<string, InternalSpan> = new Map();
  private config: TracerConfig;

  constructor(config: Partial<TracerConfig> = {}) {
    this.config = {
      serviceName: config.serviceName || 'taxbook-pro',
      enabled: config.enabled ?? true,
      samplingRate: config.samplingRate ?? 1.0,
      exportEndpoint: config.exportEndpoint,
    };
  }

  /**
   * Start a new span.
   */
  startSpan(name: string, options?: StartSpanOptions): ActiveSpan {
    if (!this.config.enabled || Math.random() > this.config.samplingRate) {
      return this.createNoOpSpan(name);
    }

    const parentSpan = options?.parentSpan
      ? this.activeSpans.get(options.parentSpan)
      : undefined;

    const span = new InternalSpan(
      name,
      parentSpan?.traceId || this.generateTraceId(),
      this.generateSpanId(),
      parentSpan?.spanId,
      options?.attributes
    );

    this.activeSpans.set(span.spanId, span);

    return {
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      name: span.name,
      startTime: span.startTime,
      attributes: span.attributes,
      setStatus: (status, message) => span.setStatus(status, message),
      addEvent: (eventName, attrs) => span.addEvent(eventName, attrs),
      end: () => this.endSpan(span),
    };
  }

  /**
   * Get current active span.
   */
  getCurrentSpan(): ActiveSpan | undefined {
    const spans = Array.from(this.activeSpans.values());
    const span = spans[spans.length - 1];
    if (!span) return undefined;

    return {
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      name: span.name,
      startTime: span.startTime,
      attributes: span.attributes,
      setStatus: (status, message) => span.setStatus(status, message),
      addEvent: (eventName, attrs) => span.addEvent(eventName, attrs),
      end: () => this.endSpan(span),
    };
  }

  /**
   * Create request context from span.
   */
  createContext(span: ActiveSpan, userId?: string): RequestContext {
    return {
      traceId: span.traceId,
      spanId: span.spanId,
      correlationId: this.generateCorrelationId(),
      userId,
    };
  }

  private endSpan(span: InternalSpan): void {
    span.endTime = Date.now();
    this.activeSpans.delete(span.spanId);

    if (this.config.exportEndpoint) {
      this.exportSpan(span);
    } else {
      // Log span for local development
      logger.debug('Span completed', {
        traceId: span.traceId,
        spanId: span.spanId,
        name: span.name,
        duration: span.endTime - span.startTime,
        status: span.status,
        events: span.events,
      });
    }
  }

  private exportSpan(span: InternalSpan): void {
    // Export in OTLP format
    const exportData = {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: this.config.serviceName } },
          ],
        },
        scopeSpans: [{
          spans: [{
            traceId: span.traceId,
            spanId: span.spanId,
            parentSpanId: span.parentSpanId,
            name: span.name,
            kind: 1, // INTERNAL
            startTimeUnixNano: span.startTime * 1e6,
            endTimeUnixNano: (span.endTime || Date.now()) * 1e6,
            attributes: Object.entries(span.attributes).map(([key, value]) => ({
              key,
              value: typeof value === 'string'
                ? { stringValue: value }
                : typeof value === 'number'
                  ? { intValue: value }
                  : { boolValue: value },
            })),
            events: span.events.map(e => ({
              name: e.name,
              timeUnixNano: e.timestamp * 1e6,
              attributes: Object.entries(e.attributes || {}).map(([key, value]) => ({
                key,
                value: { stringValue: String(value) },
              })),
            })),
            status: {
              code: span.status === 'error' ? 2 : span.status === 'ok' ? 1 : 0,
              message: span.statusMessage,
            },
          }],
        }],
      }],
    };

    // Fire and forget export
    fetch(this.config.exportEndpoint!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportData),
    }).catch(err => {
      logger.warn('Failed to export span', { error: String(err) });
    });
  }

  private createNoOpSpan(name: string): ActiveSpan {
    return {
      traceId: 'noop',
      spanId: 'noop',
      parentSpanId: undefined,
      name,
      startTime: Date.now(),
      attributes: {},
      setStatus: () => {},
      addEvent: () => {},
      end: () => {},
    };
  }

  private generateTraceId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateSpanId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Internal span implementation.
 */
class InternalSpan {
  status: SpanStatus = 'unset';
  statusMessage?: string;
  endTime?: number;
  events: Array<{ name: string; timestamp: number; attributes?: SpanAttributes }> = [];

  constructor(
    readonly name: string,
    readonly traceId: string,
    readonly spanId: string,
    readonly parentSpanId: string | undefined,
    public attributes: SpanAttributes = {},
    readonly startTime: number = Date.now()
  ) {}

  setStatus(status: SpanStatus, message?: string): void {
    this.status = status;
    this.statusMessage = message;
  }

  addEvent(name: string, attributes?: SpanAttributes): void {
    this.events.push({ name, timestamp: Date.now(), attributes });
  }
}

/**
 * Tracer configuration.
 */
export interface TracerConfig {
  readonly serviceName: string;
  readonly enabled: boolean;
  readonly samplingRate: number;
  readonly exportEndpoint?: string;
}

/**
 * Options for starting a span.
 */
export interface StartSpanOptions {
  readonly parentSpan?: string;
  readonly attributes?: SpanAttributes;
}

// ============================================================
// METRICS IMPLEMENTATION
// ============================================================

/**
 * Metrics registry for collecting and exporting metrics.
 */
class MetricsRegistry {
  private counters: Map<string, CounterImpl> = new Map();
  private gauges: Map<string, GaugeImpl> = new Map();
  private histograms: Map<string, HistogramImpl> = new Map();

  /**
   * Create or get a counter.
   */
  counter(name: string, help?: string): Counter {
    if (!this.counters.has(name)) {
      this.counters.set(name, new CounterImpl(name, help));
    }
    return this.counters.get(name)!;
  }

  /**
   * Create or get a gauge.
   */
  gauge(name: string, help?: string): Gauge {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new GaugeImpl(name, help));
    }
    return this.gauges.get(name)!;
  }

  /**
   * Create or get a histogram.
   */
  histogram(name: string, help?: string, buckets?: number[]): Histogram {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new HistogramImpl(name, help, buckets));
    }
    return this.histograms.get(name)!;
  }

  /**
   * Export all metrics in Prometheus format.
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    for (const counter of this.counters.values()) {
      lines.push(counter.toPrometheus());
    }

    for (const gauge of this.gauges.values()) {
      lines.push(gauge.toPrometheus());
    }

    for (const histogram of this.histograms.values()) {
      lines.push(histogram.toPrometheus());
    }

    return lines.join('\n');
  }

  /**
   * Reset all metrics (useful for testing).
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

/**
 * Counter implementation.
 */
class CounterImpl implements Counter {
  private values: Map<string, number> = new Map();

  constructor(
    readonly name: string,
    private help?: string
  ) {}

  inc(labels?: MetricLabels, value: number = 1): void {
    const key = this.labelsToKey(labels);
    this.values.set(key, (this.values.get(key) || 0) + value);
  }

  toPrometheus(): string {
    const lines: string[] = [];
    if (this.help) {
      lines.push(`# HELP ${this.name} ${this.help}`);
    }
    lines.push(`# TYPE ${this.name} counter`);

    for (const [key, value] of this.values) {
      const labelStr = key ? `{${key}}` : '';
      lines.push(`${this.name}${labelStr} ${value}`);
    }

    return lines.join('\n');
  }

  private labelsToKey(labels?: MetricLabels): string {
    if (!labels) return '';
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }
}

/**
 * Gauge implementation.
 */
class GaugeImpl implements Gauge {
  private values: Map<string, number> = new Map();

  constructor(
    readonly name: string,
    private help?: string
  ) {}

  set(value: number, labels?: MetricLabels): void {
    const key = this.labelsToKey(labels);
    this.values.set(key, value);
  }

  inc(labels?: MetricLabels, value: number = 1): void {
    const key = this.labelsToKey(labels);
    this.values.set(key, (this.values.get(key) || 0) + value);
  }

  dec(labels?: MetricLabels, value: number = 1): void {
    const key = this.labelsToKey(labels);
    this.values.set(key, (this.values.get(key) || 0) - value);
  }

  toPrometheus(): string {
    const lines: string[] = [];
    if (this.help) {
      lines.push(`# HELP ${this.name} ${this.help}`);
    }
    lines.push(`# TYPE ${this.name} gauge`);

    for (const [key, value] of this.values) {
      const labelStr = key ? `{${key}}` : '';
      lines.push(`${this.name}${labelStr} ${value}`);
    }

    return lines.join('\n');
  }

  private labelsToKey(labels?: MetricLabels): string {
    if (!labels) return '';
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }
}

/**
 * Histogram implementation with buckets.
 */
class HistogramImpl implements Histogram {
  private buckets: number[];
  private counts: Map<string, number[]> = new Map();
  private sums: Map<string, number> = new Map();
  private totals: Map<string, number> = new Map();

  constructor(
    readonly name: string,
    private help?: string,
    buckets?: number[]
  ) {
    // Default buckets for request duration in ms
    this.buckets = buckets || [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  }

  observe(value: number, labels?: MetricLabels): void {
    const key = this.labelsToKey(labels);

    if (!this.counts.has(key)) {
      this.counts.set(key, new Array(this.buckets.length + 1).fill(0));
      this.sums.set(key, 0);
      this.totals.set(key, 0);
    }

    const bucketCounts = this.counts.get(key)!;
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) {
        bucketCounts[i]++;
      }
    }
    bucketCounts[this.buckets.length]++; // +Inf bucket

    this.sums.set(key, this.sums.get(key)! + value);
    this.totals.set(key, this.totals.get(key)! + 1);
  }

  toPrometheus(): string {
    const lines: string[] = [];
    if (this.help) {
      lines.push(`# HELP ${this.name} ${this.help}`);
    }
    lines.push(`# TYPE ${this.name} histogram`);

    for (const [key, bucketCounts] of this.counts) {
      const baseLabels = key ? `,${key}` : '';

      for (let i = 0; i < this.buckets.length; i++) {
        lines.push(`${this.name}_bucket{le="${this.buckets[i]}"${baseLabels}} ${bucketCounts[i]}`);
      }
      lines.push(`${this.name}_bucket{le="+Inf"${baseLabels}} ${bucketCounts[this.buckets.length]}`);
      lines.push(`${this.name}_sum{${key || ''}} ${this.sums.get(key)}`);
      lines.push(`${this.name}_count{${key || ''}} ${this.totals.get(key)}`);
    }

    return lines.join('\n');
  }

  private labelsToKey(labels?: MetricLabels): string {
    if (!labels) return '';
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }
}

// ============================================================
// HEALTH CHECK REGISTRY
// ============================================================

/**
 * Health check registry for dependency monitoring.
 */
class HealthCheckRegistry {
  private checks: Map<string, HealthCheckFn> = new Map();
  private startTime = Date.now();
  private version: string;

  constructor(version?: string) {
    this.version = version || process.env.APP_VERSION || '0.0.0';
  }

  /**
   * Register a health check.
   */
  register(name: string, check: HealthCheckFn): void {
    this.checks.set(name, check);
  }

  /**
   * Remove a health check.
   */
  unregister(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Run all health checks and return system health.
   */
  async getHealth(): Promise<SystemHealth> {
    const results: DependencyHealth[] = [];

    for (const [name, check] of this.checks) {
      try {
        const result = await Promise.race([
          check(),
          new Promise<DependencyHealth>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          ),
        ]);
        results.push(result);
      } catch (error) {
        results.push({
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString(),
        });
      }
    }

    // Determine overall status
    const hasUnhealthy = results.some(r => r.status === 'unhealthy');
    const hasDegraded = results.some(r => r.status === 'degraded');

    return {
      status: hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy',
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      dependencies: results,
    };
  }

  /**
   * Quick liveness check (just returns ok if process is running).
   */
  getLiveness(): { status: 'ok'; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness check (includes dependency health).
   */
  async getReadiness(): Promise<{ ready: boolean; timestamp: string; reason?: string }> {
    const health = await this.getHealth();
    return {
      ready: health.status !== 'unhealthy',
      timestamp: new Date().toISOString(),
      reason: health.status === 'unhealthy'
        ? `Unhealthy dependencies: ${health.dependencies
            .filter(d => d.status === 'unhealthy')
            .map(d => d.name)
            .join(', ')}`
        : undefined,
    };
  }
}

// ============================================================
// SLI/SLO TRACKER
// ============================================================

/**
 * SLI/SLO tracker for reliability monitoring.
 */
class SLOTracker {
  private slos: Map<string, SLODefinition> = new Map();
  private measurements: Map<string, SLIMeasurement[]> = new Map();

  /**
   * Register an SLO.
   */
  registerSLO(slo: SLODefinition): void {
    this.slos.set(slo.name, slo);
    this.measurements.set(slo.name, []);
  }

  /**
   * Record an SLI measurement.
   */
  recordMeasurement(sloName: string, value: number, window: SLIMeasurement['window'] = '1m'): void {
    const measurements = this.measurements.get(sloName);
    if (!measurements) return;

    measurements.push({
      name: sloName,
      value,
      timestamp: new Date().toISOString(),
      window,
    });

    // Keep only last 24 hours of measurements
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = measurements.filter(m =>
      new Date(m.timestamp).getTime() > cutoff
    );
    this.measurements.set(sloName, filtered);
  }

  /**
   * Get error budget status for an SLO.
   */
  getErrorBudget(sloName: string): Result<ErrorBudgetStatus> {
    const slo = this.slos.get(sloName);
    if (!slo) {
      return err({ type: 'config_invalid', field: 'sloName', reason: `SLO not found: ${sloName}` });
    }

    const measurements = this.measurements.get(sloName) || [];
    if (measurements.length === 0) {
      return ok({
        sloName,
        budgetTotal: 1 - slo.target,
        budgetConsumed: 0,
        budgetRemaining: 1 - slo.target,
        percentRemaining: 100,
        isBurning: false,
        burnRate: 0,
      });
    }

    // Calculate average from recent measurements
    const windowMs = this.windowToMs(slo.window);
    const cutoff = Date.now() - windowMs;
    const windowMeasurements = measurements.filter(m =>
      new Date(m.timestamp).getTime() > cutoff
    );

    const avgValue = windowMeasurements.length > 0
      ? windowMeasurements.reduce((sum, m) => sum + m.value, 0) / windowMeasurements.length
      : 1;

    const budgetTotal = 1 - slo.target;
    const budgetConsumed = Math.max(0, 1 - avgValue);
    const budgetRemaining = Math.max(0, budgetTotal - budgetConsumed);
    const percentRemaining = budgetTotal > 0 ? (budgetRemaining / budgetTotal) * 100 : 100;

    // Calculate burn rate (how fast we're consuming budget)
    const recentWindow = windowMs / 4; // Look at last quarter of the window
    const recentCutoff = Date.now() - recentWindow;
    const recentMeasurements = measurements.filter(m =>
      new Date(m.timestamp).getTime() > recentCutoff
    );
    const recentAvg = recentMeasurements.length > 0
      ? recentMeasurements.reduce((sum, m) => sum + m.value, 0) / recentMeasurements.length
      : avgValue;
    const burnRate = avgValue > 0 ? (1 - recentAvg) / (1 - avgValue) : 0;

    // Project exhaustion
    let projectedExhaustion: string | undefined;
    if (burnRate > 1 && budgetRemaining > 0) {
      const hoursRemaining = budgetRemaining / (budgetConsumed * burnRate / (windowMs / 3600000));
      const exhaustionDate = new Date(Date.now() + hoursRemaining * 3600000);
      projectedExhaustion = exhaustionDate.toISOString();
    }

    return ok({
      sloName,
      budgetTotal,
      budgetConsumed,
      budgetRemaining,
      percentRemaining,
      isBurning: burnRate > 1,
      burnRate,
      projectedExhaustion,
    });
  }

  /**
   * Get latency percentile from histogram data.
   */
  calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private windowToMs(window: SLODefinition['window']): number {
    const windows: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return windows[window] || windows['1d'];
  }
}

// ============================================================
// SINGLETON INSTANCES
// ============================================================

/** Global logger instance */
export const logger = new StructuredLogger();

/** Global tracer instance */
export const tracer = new Tracer();

/** Global metrics registry */
export const metrics = new MetricsRegistry();

/** Global health check registry */
export const healthChecks = new HealthCheckRegistry();

/** Global SLO tracker */
export const sloTracker = new SLOTracker();

// ============================================================
// COMMON METRICS (pre-registered)
// ============================================================

/** HTTP request duration histogram */
export const httpRequestDuration = metrics.histogram(
  'http_request_duration_ms',
  'HTTP request duration in milliseconds'
);

/** HTTP request total counter */
export const httpRequestTotal = metrics.counter(
  'http_requests_total',
  'Total HTTP requests'
);

/** HTTP errors counter */
export const httpErrorsTotal = metrics.counter(
  'http_errors_total',
  'Total HTTP errors'
);

/** Active users gauge */
export const activeUsersGauge = metrics.gauge(
  'active_users',
  'Number of currently active users'
);

/** Database query duration histogram */
export const dbQueryDuration = metrics.histogram(
  'db_query_duration_ms',
  'Database query duration in milliseconds'
);

/** Database connection pool gauge */
export const dbConnectionPool = metrics.gauge(
  'db_connection_pool',
  'Database connection pool statistics'
);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Execute a function within a traced span.
 *
 * @example
 * const result = await withSpan('fetchUser', async (span) => {
 *   span.addEvent('starting fetch');
 *   const user = await db.users.findById(id);
 *   if (!user) {
 *     span.setStatus('error', 'User not found');
 *     return err({ type: 'not_found', id });
 *   }
 *   return ok(user);
 * });
 */
export async function withSpan<T>(
  name: string,
  fn: (span: ActiveSpan) => Promise<T>,
  options?: StartSpanOptions
): Promise<T> {
  const span = tracer.startSpan(name, options);
  const startTime = Date.now();

  try {
    const result = await fn(span);
    span.setStatus('ok');
    return result;
  } catch (error) {
    span.setStatus('error', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    span.addEvent('completed', { durationMs: duration });
    span.end();
  }
}

/**
 * Add attributes to the current span.
 *
 * @example
 * addSpanAttributes({
 *   'user.id': userId,
 *   'entity.type': 'project',
 *   'entity.id': projectId,
 * });
 */
export function addSpanAttributes(attributes: SpanAttributes): void {
  const span = tracer.getCurrentSpan();
  if (span && span.traceId !== 'noop') {
    Object.assign(span.attributes, attributes);
  }
}

/**
 * Create a span for manual management.
 * Use withSpan() when possible, but this is useful for complex control flow.
 *
 * @example
 * const span = createSpan("workflow.execute");
 * setSpanAttribute("workflowId", id);
 * try {
 *   // ... work
 * } finally {
 *   span.end();
 * }
 */
export function createSpan(name: string): { end: () => void; traceId: string } {
  const span = tracer.startSpan(name);
  return {
    traceId: span.traceId,
    end: () => span.end(),
  };
}

/**
 * Set a single span attribute on the current span.
 *
 * @example
 * setSpanAttribute("user.id", userId);
 */
export function setSpanAttribute(key: string, value: string | number | boolean): void {
  addSpanAttributes({ [key]: value });
}

/**
 * Time a function and record duration to histogram.
 *
 * @example
 * const user = await timed(dbQueryDuration, { operation: 'findUser' }, async () => {
 *   return await db.users.findById(id);
 * });
 */
export async function timed<T>(
  histogram: Histogram,
  labels: MetricLabels,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    histogram.observe(Date.now() - start, labels);
  }
}

/**
 * Create a middleware-style request handler with observability.
 *
 * @example
 * // In API route
 * export const GET = withObservability('GET /api/users', async (req, ctx) => {
 *   const users = await db.users.findAll();
 *   return Response.json(users);
 * });
 */
export function withObservability<T>(
  operationName: string,
  handler: (request: Request, context: RequestContext) => Promise<T>
): (request: Request) => Promise<T> {
  return async (request: Request): Promise<T> => {
    const span = tracer.startSpan(operationName, {
      attributes: {
        'http.method': request.method,
        'http.url': request.url,
      },
    });

    const context = tracer.createContext(span);
    logger.pushContext(context);

    const startTime = Date.now();

    try {
      httpRequestTotal.inc({ method: request.method, path: operationName });

      const result = await handler(request, context);

      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'Unknown error');
      httpErrorsTotal.inc({ method: request.method, path: operationName });

      logger.error('Request failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    } finally {
      const duration = Date.now() - startTime;
      httpRequestDuration.observe(duration, { method: request.method, path: operationName });

      logger.popContext();
      span.end();
    }
  };
}

// ============================================================
// COMMON HEALTH CHECKS
// ============================================================

/**
 * Create a database health check.
 *
 * @example
 * healthChecks.register('database', createDatabaseHealthCheck(supabase));
 */
export function createDatabaseHealthCheck(
  supabase: { from: (table: string) => { select: (cols: string) => { limit: (n: number) => PromiseLike<{ error: unknown }> } } }
): HealthCheckFn {
  return async (): Promise<DependencyHealth> => {
    const start = Date.now();
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const latencyMs = Date.now() - start;

      if (error) {
        return {
          name: 'database',
          status: 'unhealthy',
          latencyMs,
          message: String(error),
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        name: 'database',
        status: latencyMs > 1000 ? 'degraded' : 'healthy',
        latencyMs,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  };
}

/**
 * Create an external API health check.
 *
 * @example
 * healthChecks.register('stripe', createApiHealthCheck('https://api.stripe.com/v1'));
 */
export function createApiHealthCheck(
  url: string,
  options?: { timeout?: number; expectedStatus?: number }
): HealthCheckFn {
  const timeout = options?.timeout || 5000;
  const expectedStatus = options?.expectedStatus || 200;

  return async (): Promise<DependencyHealth> => {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      if (response.status !== expectedStatus) {
        return {
          name: url,
          status: 'unhealthy',
          latencyMs,
          message: `Unexpected status: ${response.status}`,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        name: url,
        status: latencyMs > 2000 ? 'degraded' : 'healthy',
        latencyMs,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        name: url,
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  };
}

// ============================================================
// DEFAULT SLO DEFINITIONS
// ============================================================

/**
 * Register common SLOs.
 */
export function registerDefaultSLOs(): void {
  sloTracker.registerSLO({
    name: 'api_availability',
    description: 'API should be available 99.9% of the time',
    target: 0.999,
    window: '30d',
    indicator: 'availability',
  });

  sloTracker.registerSLO({
    name: 'api_latency_p99',
    description: 'P99 latency should be under 500ms',
    target: 0.99,
    window: '7d',
    indicator: 'latency_p99',
  });

  sloTracker.registerSLO({
    name: 'api_error_rate',
    description: 'Error rate should be under 1%',
    target: 0.99,
    window: '1d',
    indicator: 'error_rate',
  });
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize observability with configuration.
 *
 * @example
 * // In app entry point
 * initObservability({
 *   serviceName: 'my-app',
 *   environment: 'production',
 *   logLevel: 'info',
 *   tracingEndpoint: 'https://otel-collector.example.com/v1/traces',
 * });
 */
export function initObservability(config: {
  serviceName?: string;
  environment?: string;
  logLevel?: LogLevel;
  tracingEnabled?: boolean;
  tracingSamplingRate?: number;
  tracingEndpoint?: string;
}): void {
  // Logger is already initialized, but we can reconfigure if needed
  logger.info('Observability initialized', {
    service: config.serviceName || 'taxbook-pro',
    environment: config.environment || process.env.NODE_ENV,
    tracingEnabled: config.tracingEnabled ?? true,
  });

  // Register default SLOs
  registerDefaultSLOs();
}

// ============================================================
// EXPORTS FOR TESTING
// ============================================================

export {
  StructuredLogger,
  Tracer,
  MetricsRegistry,
  HealthCheckRegistry,
  SLOTracker,
};

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
