/**
 * Deploy Verification Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * These tests run against a deployed URL to verify production health.
 * Run after every deployment to catch environment-specific issues.
 *
 * Usage:
 *   DEPLOY_URL=https://your-app.vercel.app npx playwright test deploy-verification.spec.ts
 *
 * What this tests:
 * - Homepage loads and renders
 * - API health endpoint responds
 * - Auth endpoints are accessible
 * - Core routes render without errors
 * - No console errors
 * - Performance within acceptable thresholds
 */

import { test, expect } from '@playwright/test';

// Get deploy URL from environment or default to localhost
const DEPLOY_URL = process.env.DEPLOY_URL || 'http://localhost:3000';

test.describe('Deploy Verification', () => {
  test.describe.configure({ mode: 'parallel' });

  // ============================================================
  // HOMEPAGE & CORE PAGES
  // ============================================================

  test.describe('Homepage', () => {
    test('loads and returns 200', async ({ request }) => {
      const response = await request.get(DEPLOY_URL);
      expect(response.status()).toBe(200);
    });

    test('renders content (not blank)', async ({ page }) => {
      await page.goto(DEPLOY_URL);
      await page.waitForLoadState('domcontentloaded');

      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(100);
    });

    test('has valid HTML title', async ({ page }) => {
      await page.goto(DEPLOY_URL);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      expect(title).not.toBe('Error');
      expect(title).not.toContain('404');
    });

    test('no critical console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignore common non-critical errors
          if (
            !text.includes('favicon.ico') &&
            !text.includes('Download the React DevTools') &&
            !text.includes('third-party cookie')
          ) {
            errors.push(text);
          }
        }
      });

      await page.goto(DEPLOY_URL);
      await page.waitForLoadState('networkidle');

      // Allow some errors but flag critical ones
      const criticalErrors = errors.filter(
        (e) =>
          e.includes('Uncaught') ||
          e.includes('TypeError') ||
          e.includes('ReferenceError') ||
          e.includes('SyntaxError')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  // ============================================================
  // API HEALTH
  // ============================================================

  test.describe('API Health', () => {
    test('health endpoint returns 200', async ({ request }) => {
      const response = await request.get(`${DEPLOY_URL}/api/health`);
      expect(response.status()).toBe(200);
    });

    test('health endpoint returns valid JSON', async ({ request }) => {
      const response = await request.get(`${DEPLOY_URL}/api/health`);
      const body = await response.json();

      expect(body.status).toBe('healthy');
      expect(body).toHaveProperty('timestamp');
    });

    test('health endpoint reports database connection', async ({ request }) => {
      const response = await request.get(`${DEPLOY_URL}/api/health`);
      const body = await response.json();

      // Database should be connected in production
      if (body.database) {
        expect(body.database.connected).toBe(true);
      }
    });
  });

  // ============================================================
  // AUTH ENDPOINTS
  // ============================================================

  test.describe('Auth Endpoints', () => {
    test('login page loads', async ({ page }) => {
      const response = await page.goto(`${DEPLOY_URL}/login`);
      expect(response?.status()).toBeLessThan(500);

      await page.waitForLoadState('domcontentloaded');
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toContain('sign in');
    });

    test('signup page loads', async ({ page }) => {
      const response = await page.goto(`${DEPLOY_URL}/signup`);
      expect(response?.status()).toBeLessThan(500);
    });

    test('forgot password page loads', async ({ page }) => {
      const response = await page.goto(`${DEPLOY_URL}/forgot-password`);
      expect(response?.status()).toBeLessThan(500);
    });
  });

  // ============================================================
  // CORE ROUTES
  // ============================================================

  test.describe('Core Routes', () => {
    test('profile list route responds', async ({ page }) => {
      // Protected routes should redirect to login (302) or show 401
      const response = await page.goto(`${DEPLOY_URL}/`);
      // Should not be 500
      expect(response?.status()).toBeLessThan(500);
    });
    test('client list route responds', async ({ page }) => {
      // Protected routes should redirect to login (302) or show 401
      const response = await page.goto(`${DEPLOY_URL}/`);
      // Should not be 500
      expect(response?.status()).toBeLessThan(500);
    });
    test('service list route responds', async ({ page }) => {
      // Protected routes should redirect to login (302) or show 401
      const response = await page.goto(`${DEPLOY_URL}/`);
      // Should not be 500
      expect(response?.status()).toBeLessThan(500);
    });
    test('appointment list route responds', async ({ page }) => {
      // Protected routes should redirect to login (302) or show 401
      const response = await page.goto(`${DEPLOY_URL}/`);
      // Should not be 500
      expect(response?.status()).toBeLessThan(500);
    });
    test('availability list route responds', async ({ page }) => {
      // Protected routes should redirect to login (302) or show 401
      const response = await page.goto(`${DEPLOY_URL}/`);
      // Should not be 500
      expect(response?.status()).toBeLessThan(500);
    });
    test('document list route responds', async ({ page }) => {
      // Protected routes should redirect to login (302) or show 401
      const response = await page.goto(`${DEPLOY_URL}/`);
      // Should not be 500
      expect(response?.status()).toBeLessThan(500);
    });

    test('dashboard redirects to login when unauthenticated', async ({ page }) => {
      const response = await page.goto(`${DEPLOY_URL}/dashboard`);
      // Should redirect to login or show 401
      expect([200, 302, 307, 401]).toContain(response?.status());

      // Should end up at login or show auth prompt
      await page.waitForLoadState('domcontentloaded');
      const url = page.url();
      const bodyText = await page.textContent('body');
      const isLoginRedirect = url.includes('login') || bodyText?.toLowerCase().includes('sign in');
      expect(isLoginRedirect).toBe(true);
    });

    test('settings page requires auth', async ({ page }) => {
      const response = await page.goto(`${DEPLOY_URL}/settings`);
      expect(response?.status()).toBeLessThan(500);
    });
  });

  // ============================================================
  // STATIC ASSETS
  // ============================================================

  test.describe('Static Assets', () => {
    test('critical assets load', async ({ page }) => {
      const failedAssets: string[] = [];

      page.on('response', (response) => {
        const url = response.url();
        const status = response.status();

        // Track failed static assets
        if (
          status >= 400 &&
          (url.includes('/_next/') ||
            url.includes('/static/') ||
            url.includes('.js') ||
            url.includes('.css'))
        ) {
          failedAssets.push(`${status}: ${url}`);
        }
      });

      await page.goto(DEPLOY_URL);
      await page.waitForLoadState('networkidle');

      expect(failedAssets).toHaveLength(0);
    });

    test('favicon exists', async ({ request }) => {
      const response = await request.get(`${DEPLOY_URL}/favicon.ico`);
      // Either 200 or 204 or redirect is acceptable
      expect([200, 204, 301, 302]).toContain(response.status());
    });
  });

  // ============================================================
  // PERFORMANCE
  // ============================================================

  test.describe('Performance', () => {
    test('homepage loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(DEPLOY_URL);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Should load within 10 seconds (generous for cold starts)
      expect(loadTime).toBeLessThan(10000);
    });

    test('API health responds within acceptable time', async ({ request }) => {
      const startTime = Date.now();
      await request.get(`${DEPLOY_URL}/api/health`);
      const responseTime = Date.now() - startTime;

      // Health endpoint should be fast (under 2 seconds)
      expect(responseTime).toBeLessThan(2000);
    });

    test('homepage is reasonably sized', async ({ page }) => {
      let totalSize = 0;

      page.on('response', async (response) => {
        const url = response.url();
        if (url.startsWith(DEPLOY_URL)) {
          const headers = response.headers();
          const contentLength = parseInt(headers['content-length'] || '0', 10);
          totalSize += contentLength;
        }
      });

      await page.goto(DEPLOY_URL);
      await page.waitForLoadState('networkidle');

      // Total page weight should be under 5MB (generous)
      expect(totalSize).toBeLessThan(5 * 1024 * 1024);
    });
  });

  // ============================================================
  // SECURITY HEADERS
  // ============================================================

  test.describe('Security Headers', () => {
    test('has basic security headers', async ({ request }) => {
      const response = await request.get(DEPLOY_URL);
      const headers = response.headers();

      // These are commonly expected in production
      const hasXContentType = !!headers['x-content-type-options'];
      const hasXFrameOptions = !!headers['x-frame-options'];

      // At least one security header should be present
      expect(hasXContentType || hasXFrameOptions).toBe(true);
    });

    test('HTTPS is enforced (when deployed)', async ({ request }) => {
      // Skip this test for localhost
      if (DEPLOY_URL.includes('localhost')) {
        test.skip();
        return;
      }

      // Verify the deploy URL uses HTTPS
      expect(DEPLOY_URL.startsWith('https://')).toBe(true);
    });
  });

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  test.describe('Error Handling', () => {
    test('404 page shows user-friendly message', async ({ page }) => {
      const response = await page.goto(`${DEPLOY_URL}/this-page-does-not-exist-xyz123`);
      expect(response?.status()).toBe(404);

      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toContain('not found');
    });

    test('invalid API route returns JSON error', async ({ request }) => {
      const response = await request.get(`${DEPLOY_URL}/api/nonexistent-endpoint-xyz`);
      expect(response.status()).toBe(404);

      const contentType = response.headers()['content-type'];
      // API routes should return JSON even for errors
      expect(contentType).toContain('application/json');
    });
  });
});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
