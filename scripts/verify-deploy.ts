#!/usr/bin/env npx tsx
/**
 * Deploy Verification Script - taxbook-pro
 * Generated: 2026-01-19
 *
 * CLI tool to verify a deployment is healthy.
 * Run this after every deployment to catch issues early.
 *
 * Usage:
 *   npx tsx scripts/verify-deploy.ts --url https://your-app.vercel.app
 *   npx tsx scripts/verify-deploy.ts --url https://your-app.vercel.app --full
 *   npx tsx scripts/verify-deploy.ts --url https://your-app.vercel.app --json
 */

import { parseArgs } from 'node:util';

// ============================================================
// CLI PARSING
// ============================================================

const { values } = parseArgs({
  options: {
    url: { type: 'string', short: 'u' },
    full: { type: 'boolean', short: 'f' },
    json: { type: 'boolean', short: 'j' },
    timeout: { type: 'string', short: 't' },
    help: { type: 'boolean', short: 'h' },
  },
});

// ============================================================
// HELP
// ============================================================

if (values.help) {
  console.log(`
Deploy Verification Script
==========================

Verifies a deployment is healthy by checking critical endpoints and functionality.

Usage:
  npx tsx scripts/verify-deploy.ts --url <deploy-url>

Options:
  -u, --url <url>      Deployed URL to verify (required)
  -f, --full           Run full verification (including Playwright tests)
  -j, --json           Output results as JSON
  -t, --timeout <ms>   Request timeout in ms (default: 10000)
  -h, --help           Show this help message

Examples:
  # Quick check
  npx tsx scripts/verify-deploy.ts --url https://my-app.vercel.app

  # Full verification with Playwright
  npx tsx scripts/verify-deploy.ts --url https://my-app.vercel.app --full

  # JSON output for CI
  npx tsx scripts/verify-deploy.ts --url https://my-app.vercel.app --json
`);
  process.exit(0);
}

// ============================================================
// VALIDATION
// ============================================================

if (!values.url) {
  console.error('Error: --url is required');
  process.exit(1);
}

const DEPLOY_URL = values.url.replace(/\/$/, ''); // Remove trailing slash
const TIMEOUT = parseInt(values.timeout || '10000', 10);
const OUTPUT_JSON = values.json || false;
const RUN_FULL = values.full || false;

// ============================================================
// TYPES
// ============================================================

interface CheckResult {
  name: string;
  passed: boolean;
  duration: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface VerificationResult {
  url: string;
  timestamp: string;
  passed: boolean;
  duration: number;
  checks: CheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

// ============================================================
// CHECK FUNCTIONS
// ============================================================

async function checkHomepage(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(DEPLOY_URL, {
      signal: AbortSignal.timeout(TIMEOUT),
    });

    const passed = response.status === 200;
    return {
      name: 'Homepage loads',
      passed,
      duration: Date.now() - start,
      message: passed ? 'OK' : `Status: ${response.status}`,
    };
  } catch (error) {
    return {
      name: 'Homepage loads',
      passed: false,
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkHealthEndpoint(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${DEPLOY_URL}/api/health`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });

    if (response.status !== 200) {
      return {
        name: 'Health endpoint',
        passed: false,
        duration: Date.now() - start,
        message: `Status: ${response.status}`,
      };
    }

    const body = await response.json() as { status?: string; database?: { connected?: boolean } };
    const isHealthy = body.status === 'healthy';
    const dbConnected = body.database?.connected ?? true;

    return {
      name: 'Health endpoint',
      passed: isHealthy && dbConnected,
      duration: Date.now() - start,
      message: isHealthy ? 'OK' : `Status: ${body.status}`,
      details: body,
    };
  } catch (error) {
    return {
      name: 'Health endpoint',
      passed: false,
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkLoginPage(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${DEPLOY_URL}/login`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });

    const passed = response.status < 500;
    return {
      name: 'Login page accessible',
      passed,
      duration: Date.now() - start,
      message: passed ? 'OK' : `Status: ${response.status}`,
    };
  } catch (error) {
    return {
      name: 'Login page accessible',
      passed: false,
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkSecurityHeaders(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(DEPLOY_URL, {
      signal: AbortSignal.timeout(TIMEOUT),
    });

    const headers = Object.fromEntries(response.headers.entries());
    const hasXContentType = !!headers['x-content-type-options'];
    const hasXFrameOptions = !!headers['x-frame-options'];

    const passed = hasXContentType || hasXFrameOptions;
    return {
      name: 'Security headers',
      passed,
      duration: Date.now() - start,
      message: passed ? 'OK' : 'Missing security headers',
      details: {
        'x-content-type-options': headers['x-content-type-options'] || 'missing',
        'x-frame-options': headers['x-frame-options'] || 'missing',
      },
    };
  } catch (error) {
    return {
      name: 'Security headers',
      passed: false,
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function check404Page(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${DEPLOY_URL}/this-page-does-not-exist-xyz123`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });

    const passed = response.status === 404;
    return {
      name: '404 page works',
      passed,
      duration: Date.now() - start,
      message: passed ? 'OK' : `Status: ${response.status} (expected 404)`,
    };
  } catch (error) {
    return {
      name: '404 page works',
      passed: false,
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkAPIEndpoints(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const endpoints = [
    '/api/',
    '/api/',
    '/api/',
    '/api/',
    '/api/',
    '/api/',
  ];

  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      const response = await fetch(`${DEPLOY_URL}${endpoint}`, {
        signal: AbortSignal.timeout(TIMEOUT),
      });

      // Should return 401 (unauthorized) not 500 (error)
      const passed = [401, 403].includes(response.status);
      results.push({
        name: `API ${endpoint}`,
        passed,
        duration: Date.now() - start,
        message: passed ? 'OK (returns 401/403)' : `Status: ${response.status}`,
      });
    } catch (error) {
      results.push({
        name: `API ${endpoint}`,
        passed: false,
        duration: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

async function checkResponseTime(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await fetch(DEPLOY_URL, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const duration = Date.now() - start;

    const passed = duration < 5000; // 5 second threshold
    return {
      name: 'Response time',
      passed,
      duration,
      message: passed ? `${duration}ms` : `${duration}ms (slow)`,
    };
  } catch (error) {
    return {
      name: 'Response time',
      passed: false,
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================
// MAIN
// ============================================================

async function runVerification(): Promise<VerificationResult> {
  const startTime = Date.now();
  const checks: CheckResult[] = [];

  // Run basic checks
  if (!OUTPUT_JSON) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Verifying deployment: ${DEPLOY_URL}`);
    console.log(`${'='.repeat(60)}\n`);
  }

  // Homepage
  const homepageResult = await checkHomepage();
  checks.push(homepageResult);
  if (!OUTPUT_JSON) printCheck(homepageResult);

  // Health endpoint
  const healthResult = await checkHealthEndpoint();
  checks.push(healthResult);
  if (!OUTPUT_JSON) printCheck(healthResult);

  // Login page
  const loginResult = await checkLoginPage();
  checks.push(loginResult);
  if (!OUTPUT_JSON) printCheck(loginResult);

  // Security headers
  const securityResult = await checkSecurityHeaders();
  checks.push(securityResult);
  if (!OUTPUT_JSON) printCheck(securityResult);

  // 404 page
  const notFoundResult = await check404Page();
  checks.push(notFoundResult);
  if (!OUTPUT_JSON) printCheck(notFoundResult);

  // Response time
  const responseTimeResult = await checkResponseTime();
  checks.push(responseTimeResult);
  if (!OUTPUT_JSON) printCheck(responseTimeResult);

  // API endpoints
  const apiResults = await checkAPIEndpoints();
  checks.push(...apiResults);
  if (!OUTPUT_JSON) {
    for (const result of apiResults) {
      printCheck(result);
    }
  }

  // Run full Playwright tests if requested
  if (RUN_FULL) {
    if (!OUTPUT_JSON) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log('Running full Playwright verification...');
      console.log(`${'─'.repeat(60)}\n`);
    }

    const { execSync } = await import('node:child_process');
    try {
      execSync(`DEPLOY_URL=${DEPLOY_URL} npx playwright test deploy-verification.spec.ts smoke.spec.ts`, {
        stdio: OUTPUT_JSON ? 'pipe' : 'inherit',
        cwd: process.cwd(),
      });
      checks.push({
        name: 'Playwright tests',
        passed: true,
        duration: 0,
        message: 'All passed',
      });
    } catch (error) {
      checks.push({
        name: 'Playwright tests',
        passed: false,
        duration: 0,
        message: 'Some tests failed',
      });
    }
  }

  // Calculate summary
  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed).length;
  const allPassed = failed === 0;

  const result: VerificationResult = {
    url: DEPLOY_URL,
    timestamp: new Date().toISOString(),
    passed: allPassed,
    duration: Date.now() - startTime,
    checks,
    summary: {
      total: checks.length,
      passed,
      failed,
    },
  };

  return result;
}

function printCheck(result: CheckResult): void {
  const icon = result.passed ? '✅' : '❌';
  const time = result.duration ? ` (${result.duration}ms)` : '';
  console.log(`  ${icon} ${result.name}${time}`);
  if (!result.passed && result.message) {
    console.log(`     └─ ${result.message}`);
  }
}

function printSummary(result: VerificationResult): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`\nURL: ${result.url}`);
  console.log(`Time: ${result.duration}ms`);
  console.log(`\nResults:`);
  console.log(`  ✅ Passed: ${result.summary.passed}`);
  console.log(`  ❌ Failed: ${result.summary.failed}`);
  console.log();

  if (result.passed) {
    console.log('🎉 Deployment verification PASSED!\n');
  } else {
    console.log('💥 Deployment verification FAILED!\n');
    console.log('Failed checks:');
    for (const check of result.checks.filter((c) => !c.passed)) {
      console.log(`  ❌ ${check.name}: ${check.message}`);
    }
    console.log();
  }
}

// ============================================================
// RUN
// ============================================================

runVerification()
  .then((result) => {
    if (OUTPUT_JSON) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printSummary(result);
    }
    process.exit(result.passed ? 0 : 1);
  })
  .catch((error) => {
    if (OUTPUT_JSON) {
      console.log(JSON.stringify({ error: error.message, passed: false }));
    } else {
      console.error('Fatal error:', error);
    }
    process.exit(1);
  });

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
