// ============================================================
// HEALTH CHECK API - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// Health check endpoints for load balancers and Kubernetes probes.
// Uses the observability health registry for consistent health checks.
//
// ENDPOINTS:
//   GET /api/health       - Combined health check (liveness + readiness)
//   GET /api/health/live  - Liveness probe (is the process alive?)
//   GET /api/health/ready - Readiness probe (can it accept traffic?)
//
// KUBERNETES PROBE CONFIGURATION:
//   livenessProbe:
//     httpGet:
//       path: /api/health/live
//       port: 3000
//     initialDelaySeconds: 10
//     periodSeconds: 15
//
//   readinessProbe:
//     httpGet:
//       path: /api/health/ready
//       port: 3000
//     initialDelaySeconds: 5
//     periodSeconds: 10
//
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  healthChecks,
  createDatabaseHealthCheck,
  logger,
} from "@/lib/observability";

// ============================================================
// HEALTH CHECK REGISTRATION
// ============================================================

let initialized = false;

/**
 * Register health checks on first request.
 * Uses lazy initialization to avoid issues with module loading order.
 */
async function ensureHealthChecksRegistered(): Promise<void> {
  if (initialized) return;

  try {
    const supabase = await createClient();
    healthChecks.register('database', createDatabaseHealthCheck(supabase));

    // Add additional health checks here as needed:
    // healthChecks.register('redis', createApiHealthCheck('http://redis:6379/ping'));
    // healthChecks.register('external-api', createApiHealthCheck('https://api.example.com/health'));

    initialized = true;
    logger.info('Health checks registered', { checks: ['database'] });
  } catch (error) {
    logger.error('Failed to register health checks', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ============================================================
// VERSION DETECTION
// ============================================================

/**
 * Get application version from package.json.
 * Returns null if version cannot be determined.
 */
function getVersion(): string | null {
  try {
    if (process.env.npm_package_version) {
      return process.env.npm_package_version;
    }
    if (process.env.APP_VERSION) {
      return process.env.APP_VERSION;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// ROUTE: GET /api/health
// ============================================================

/**
 * Combined health check endpoint.
 *
 * Returns:
 *   200 - All checks pass, system is healthy
 *   503 - One or more checks failed, system is unhealthy
 *
 * Response includes:
 *   - Overall status
 *   - Timestamp (ISO 8601)
 *   - Application version
 *   - Individual dependency health with latency
 */
export async function GET(): Promise<Response> {
  await ensureHealthChecksRegistered();

  const health = await healthChecks.getHealth();
  const version = getVersion();

  // Log health check for monitoring
  logger.info('Health check performed', {
    status: health.status,
    dependencyCount: health.dependencies.length,
    dependencies: health.dependencies.map(d => ({
      name: d.name,
      status: d.status,
      latencyMs: d.latencyMs,
    })),
  });

  // Add version to response
  const response = {
    ...health,
    version,
  };

  return NextResponse.json(response, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}

// ============================================================
// LIVENESS CHECK - /api/health/live/route.ts
// ============================================================
//
// Create this file at: src/app/api/health/live/route.ts
//
// import { NextResponse } from "next/server";
// import { healthChecks } from "@/lib/observability";
//
// export async function GET(): Promise<Response> {
//   const liveness = healthChecks.getLiveness();
//
//   return NextResponse.json(liveness, {
//     status: liveness.status === 'alive' ? 200 : 503,
//     headers: {
//       "Cache-Control": "no-cache, no-store, must-revalidate",
//       "Content-Type": "application/json",
//     },
//   });
// }
//
// ============================================================

// ============================================================
// READINESS CHECK - /api/health/ready/route.ts
// ============================================================
//
// Create this file at: src/app/api/health/ready/route.ts
//
// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";
// import { healthChecks, createDatabaseHealthCheck } from "@/lib/observability";
//
// let initialized = false;
//
// async function ensureHealthChecksRegistered(): Promise<void> {
//   if (initialized) return;
//   const supabase = await createClient();
//   healthChecks.register('database', createDatabaseHealthCheck(supabase));
//   initialized = true;
// }
//
// export async function GET(): Promise<Response> {
//   await ensureHealthChecksRegistered();
//   const readiness = await healthChecks.getReadiness();
//
//   return NextResponse.json(readiness, {
//     status: readiness.status === 'ready' ? 200 : 503,
//     headers: {
//       "Cache-Control": "no-cache, no-store, must-revalidate",
//       "Content-Type": "application/json",
//     },
//   });
// }
//
// ============================================================

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
