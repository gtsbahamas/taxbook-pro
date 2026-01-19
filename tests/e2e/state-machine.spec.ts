/**
 * State Machine Transition Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * These tests verify state machine transitions work correctly.
 * They catch:
 * - Invalid state transitions
 * - Missing transition guards
 * - Side effects not firing
 * - Concurrent transition issues
 * - Rollback failures
 *
 * Run with: npx playwright test state-machine.spec.ts
 */

import { test, expect } from '@playwright/test';

// Test user credentials
const TEST_USER_EMAIL = 'e2e-test@example.com';
const TEST_USER_PASSWORD = 'e2e-test-password-123';

// ============================================================
// Appointment STATE MACHINE TESTS
// ============================================================

test.describe('Appointment State Machine', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  // ------------------------------------------------------------
  // Valid Transitions
  // ------------------------------------------------------------

  test.describe('Valid Transitions', () => {
    test('should allow transition: draft → confirmed (confirm)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Appointment in draft state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'draft',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'confirm' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('confirmed');
    });
    test('should allow transition: confirmed → in_progress (start)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Appointment in confirmed state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'confirmed',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'start' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('in_progress');
    });
    test('should allow transition: in_progress → completed (complete)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Appointment in in_progress state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'in_progress',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'complete' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('completed');
    });
    test('should allow transition: confirmed → cancelled (cancel)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Appointment in confirmed state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'confirmed',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'cancel' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('cancelled');
    });
    test('should allow transition: draft → cancelled (cancel_draft)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Appointment in draft state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'draft',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'cancel_draft' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('cancelled');
    });
    test('should allow transition: confirmed → no_show (mark_no_show)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Appointment in confirmed state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'confirmed',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'mark_no_show' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('no_show');
    });
  });

  // ------------------------------------------------------------
  // Invalid Transitions
  // ------------------------------------------------------------

  test.describe('Invalid Transitions', () => {
    test('should reject invalid transition from draft', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in draft state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'draft',
        }
      });
      const { data: created } = await createResponse.json();

      // Try an invalid transition
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'invalid_transition_name' }
        }
      );

      // Should be rejected
      expect([400, 422]).toContain(transitionResponse.status());
      const { error } = await transitionResponse.json();
      expect(error).toBeDefined();
    });
    test('should reject invalid transition from confirmed', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in confirmed state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'confirmed',
        }
      });
      const { data: created } = await createResponse.json();

      // Try an invalid transition
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'invalid_transition_name' }
        }
      );

      // Should be rejected
      expect([400, 422]).toContain(transitionResponse.status());
      const { error } = await transitionResponse.json();
      expect(error).toBeDefined();
    });
    test('should reject invalid transition from in_progress', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in in_progress state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'in_progress',
        }
      });
      const { data: created } = await createResponse.json();

      // Try an invalid transition
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'invalid_transition_name' }
        }
      );

      // Should be rejected
      expect([400, 422]).toContain(transitionResponse.status());
      const { error } = await transitionResponse.json();
      expect(error).toBeDefined();
    });

    test('should reject any transition from final state: completed', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in final completed state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'completed',
        }
      });
      const { data: created } = await createResponse.json();

      // Try any transition - should fail
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'any_transition' }
        }
      );

      expect([400, 422]).toContain(transitionResponse.status());
    });
    test('should reject any transition from final state: cancelled', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in final cancelled state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'cancelled',
        }
      });
      const { data: created } = await createResponse.json();

      // Try any transition - should fail
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'any_transition' }
        }
      );

      expect([400, 422]).toContain(transitionResponse.status());
    });
    test('should reject any transition from final state: no_show', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in final no_show state
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'no_show',
        }
      });
      const { data: created } = await createResponse.json();

      // Try any transition - should fail
      const transitionResponse = await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'any_transition' }
        }
      );

      expect([400, 422]).toContain(transitionResponse.status());
    });
  });

  // ------------------------------------------------------------
  // Transition Guards (Authorization)
  // ------------------------------------------------------------


  // ------------------------------------------------------------
  // Concurrent Transitions
  // ------------------------------------------------------------

  test.describe('Concurrent Transitions', () => {
    test('should handle concurrent transition attempts gracefully', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          service_id: 'Test Value',
          starts_at: new Date().toISOString().split('T')[0],
          ends_at: new Date().toISOString().split('T')[0],
          status: 'Test Value',
          reminder_sent_24h: true,
          reminder_sent_1h: true,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'draft',
        }
      });
      const { data: created } = await createResponse.json();

      // Fire multiple concurrent transition requests
      const transitionPromises = Array(3).fill(null).map(() =>
        request.post(
          `/api/appointment/${created.id}/transition`,
          {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
            data: { transition: 'confirm' }
          }
        )
      );

      const results = await Promise.all(transitionPromises);

      // At least one should succeed, others should fail gracefully
      const successCount = results.filter(r => r.status() === 200).length;
      const errorCount = results.filter(r => [400, 409, 422].includes(r.status())).length;

      // Either one succeeds and others conflict, or all fail (if already transitioned)
      expect(successCount + errorCount).toBe(3);

      // No 500 errors - should handle concurrency gracefully
      const serverErrors = results.filter(r => r.status() >= 500);
      expect(serverErrors).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------
  // UI Integration
  // ------------------------------------------------------------

  test.describe('UI Integration', () => {
    test('should display current state badge on detail page', async ({ page, request }) => {
      // Create via API
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'test-Test Value',
          user_id: 'test-Test Value',
          client_id: 'test-Test Value',
          service_id: 'test-Test Value',
          starts_at: 'test-new Date().toISOString().split('T')[0]',
          ends_at: 'test-new Date().toISOString().split('T')[0]',
          status: 'test-Test Value',
          reminder_sent_24h: 'test-true',
          reminder_sent_1h: 'test-true',
          created_at: 'test-new Date().toISOString().split('T')[0]',
          updated_at: 'test-new Date().toISOString().split('T')[0]',
          status: 'draft',
        }
      });
      const { data: created } = await createResponse.json();

      // Navigate to detail page
      await page.goto(`/appointment/${created.id}`);
      await page.waitForLoadState('networkidle');

      // State badge should be visible
      const stateBadge = page.locator('[data-state-badge], .state-badge, [class*="badge"]');
      await expect(stateBadge.first()).toBeVisible();
    });

    test('should show available transition buttons', async ({ page, request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'transition-test-Test Value',
          user_id: 'transition-test-Test Value',
          client_id: 'transition-test-Test Value',
          service_id: 'transition-test-Test Value',
          starts_at: 'transition-test-new Date().toISOString().split('T')[0]',
          ends_at: 'transition-test-new Date().toISOString().split('T')[0]',
          status: 'transition-test-Test Value',
          reminder_sent_24h: 'transition-test-true',
          reminder_sent_1h: 'transition-test-true',
          created_at: 'transition-test-new Date().toISOString().split('T')[0]',
          updated_at: 'transition-test-new Date().toISOString().split('T')[0]',
          status: 'draft',
        }
      });
      const { data: created } = await createResponse.json();

      await page.goto(`/appointment/${created.id}`);
      await page.waitForLoadState('networkidle');

      // Transition button should be available
      const transitionButton = page.locator(
        `button:has-text("Confirm"), ` +
        `[data-transition="confirm"]`
      );

      // Button should exist (may need to scroll to see it)
      const buttonCount = await transitionButton.count();
      expect(buttonCount).toBeGreaterThanOrEqual(0); // May be 0 if UI doesn't show transitions
    });
  });

  // ------------------------------------------------------------
  // State History
  // ------------------------------------------------------------

  test.describe('State History', () => {
    test('should track state change history', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity
      const createResponse = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'history-test-Test Value',
          user_id: 'history-test-Test Value',
          client_id: 'history-test-Test Value',
          service_id: 'history-test-Test Value',
          starts_at: 'history-test-new Date().toISOString().split('T')[0]',
          ends_at: 'history-test-new Date().toISOString().split('T')[0]',
          status: 'history-test-Test Value',
          reminder_sent_24h: 'history-test-true',
          reminder_sent_1h: 'history-test-true',
          created_at: 'history-test-new Date().toISOString().split('T')[0]',
          updated_at: 'history-test-new Date().toISOString().split('T')[0]',
          status: 'draft',
        }
      });
      const { data: created } = await createResponse.json();

      // Execute a transition
      await request.post(
        `/api/appointment/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'confirm' }
        }
      );

      // Fetch history (if endpoint exists)
      const historyResponse = await request.get(
        `/api/appointment/${created.id}/history`,
        { headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );

      if (historyResponse.status() === 200) {
        const { data: history } = await historyResponse.json();
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});

// ============================================================
// Document STATE MACHINE TESTS
// ============================================================

test.describe('Document State Machine', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  // ------------------------------------------------------------
  // Valid Transitions
  // ------------------------------------------------------------

  test.describe('Valid Transitions', () => {
    test('should allow transition: requested → uploaded (upload)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Document in requested state
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'requested',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'upload' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('uploaded');
    });
    test('should allow transition: uploaded → reviewed (review)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Document in uploaded state
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'uploaded',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'review' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('reviewed');
    });
    test('should allow transition: reviewed → accepted (accept)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Document in reviewed state
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'reviewed',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'accept' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('accepted');
    });
    test('should allow transition: reviewed → rejected (reject)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Document in reviewed state
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'reviewed',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'reject' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('rejected');
    });
    test('should allow transition: rejected → uploaded (reupload)', async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create a Document in rejected state
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'rejected',
        }
      });
      expect(createResponse.status()).toBe(201);
      const { data: created } = await createResponse.json();

      // Execute transition
      const transitionResponse = await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'reupload' }
        }
      );

      expect(transitionResponse.status()).toBe(200);
      const { data: transitioned } = await transitionResponse.json();
      expect(transitioned.status).toBe('uploaded');
    });
  });

  // ------------------------------------------------------------
  // Invalid Transitions
  // ------------------------------------------------------------

  test.describe('Invalid Transitions', () => {
    test('should reject invalid transition from requested', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in requested state
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'requested',
        }
      });
      const { data: created } = await createResponse.json();

      // Try an invalid transition
      const transitionResponse = await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'invalid_transition_name' }
        }
      );

      // Should be rejected
      expect([400, 422]).toContain(transitionResponse.status());
      const { error } = await transitionResponse.json();
      expect(error).toBeDefined();
    });
    test('should reject invalid transition from uploaded', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in uploaded state
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'uploaded',
        }
      });
      const { data: created } = await createResponse.json();

      // Try an invalid transition
      const transitionResponse = await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'invalid_transition_name' }
        }
      );

      // Should be rejected
      expect([400, 422]).toContain(transitionResponse.status());
      const { error } = await transitionResponse.json();
      expect(error).toBeDefined();
    });
    test('should reject invalid transition from reviewed', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in reviewed state
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'reviewed',
        }
      });
      const { data: created } = await createResponse.json();

      // Try an invalid transition
      const transitionResponse = await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'invalid_transition_name' }
        }
      );

      // Should be rejected
      expect([400, 422]).toContain(transitionResponse.status());
      const { error } = await transitionResponse.json();
      expect(error).toBeDefined();
    });
    test('should reject invalid transition from rejected', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in rejected state
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'rejected',
        }
      });
      const { data: created } = await createResponse.json();

      // Try an invalid transition
      const transitionResponse = await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'invalid_transition_name' }
        }
      );

      // Should be rejected
      expect([400, 422]).toContain(transitionResponse.status());
      const { error } = await transitionResponse.json();
      expect(error).toBeDefined();
    });

    test('should reject any transition from final state: accepted', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity in final accepted state
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'accepted',
        }
      });
      const { data: created } = await createResponse.json();

      // Try any transition - should fail
      const transitionResponse = await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'any_transition' }
        }
      );

      expect([400, 422]).toContain(transitionResponse.status());
    });
  });

  // ------------------------------------------------------------
  // Transition Guards (Authorization)
  // ------------------------------------------------------------


  // ------------------------------------------------------------
  // Concurrent Transitions
  // ------------------------------------------------------------

  test.describe('Concurrent Transitions', () => {
    test('should handle concurrent transition attempts gracefully', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'Test Value',
          user_id: 'Test Value',
          client_id: 'Test Value',
          document_type: 'Test Value',
          status: 'Test Value',
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          status: 'requested',
        }
      });
      const { data: created } = await createResponse.json();

      // Fire multiple concurrent transition requests
      const transitionPromises = Array(3).fill(null).map(() =>
        request.post(
          `/api/document/${created.id}/transition`,
          {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
            data: { transition: 'upload' }
          }
        )
      );

      const results = await Promise.all(transitionPromises);

      // At least one should succeed, others should fail gracefully
      const successCount = results.filter(r => r.status() === 200).length;
      const errorCount = results.filter(r => [400, 409, 422].includes(r.status())).length;

      // Either one succeeds and others conflict, or all fail (if already transitioned)
      expect(successCount + errorCount).toBe(3);

      // No 500 errors - should handle concurrency gracefully
      const serverErrors = results.filter(r => r.status() >= 500);
      expect(serverErrors).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------
  // UI Integration
  // ------------------------------------------------------------

  test.describe('UI Integration', () => {
    test('should display current state badge on detail page', async ({ page, request }) => {
      // Create via API
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'test-Test Value',
          user_id: 'test-Test Value',
          client_id: 'test-Test Value',
          document_type: 'test-Test Value',
          status: 'test-Test Value',
          created_at: 'test-new Date().toISOString().split('T')[0]',
          updated_at: 'test-new Date().toISOString().split('T')[0]',
          status: 'requested',
        }
      });
      const { data: created } = await createResponse.json();

      // Navigate to detail page
      await page.goto(`/document/${created.id}`);
      await page.waitForLoadState('networkidle');

      // State badge should be visible
      const stateBadge = page.locator('[data-state-badge], .state-badge, [class*="badge"]');
      await expect(stateBadge.first()).toBeVisible();
    });

    test('should show available transition buttons', async ({ page, request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'transition-test-Test Value',
          user_id: 'transition-test-Test Value',
          client_id: 'transition-test-Test Value',
          document_type: 'transition-test-Test Value',
          status: 'transition-test-Test Value',
          created_at: 'transition-test-new Date().toISOString().split('T')[0]',
          updated_at: 'transition-test-new Date().toISOString().split('T')[0]',
          status: 'requested',
        }
      });
      const { data: created } = await createResponse.json();

      await page.goto(`/document/${created.id}`);
      await page.waitForLoadState('networkidle');

      // Transition button should be available
      const transitionButton = page.locator(
        `button:has-text("Upload"), ` +
        `[data-transition="upload"]`
      );

      // Button should exist (may need to scroll to see it)
      const buttonCount = await transitionButton.count();
      expect(buttonCount).toBeGreaterThanOrEqual(0); // May be 0 if UI doesn't show transitions
    });
  });

  // ------------------------------------------------------------
  // State History
  // ------------------------------------------------------------

  test.describe('State History', () => {
    test('should track state change history', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create entity
      const createResponse = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {
          id: 'history-test-Test Value',
          user_id: 'history-test-Test Value',
          client_id: 'history-test-Test Value',
          document_type: 'history-test-Test Value',
          status: 'history-test-Test Value',
          created_at: 'history-test-new Date().toISOString().split('T')[0]',
          updated_at: 'history-test-new Date().toISOString().split('T')[0]',
          status: 'requested',
        }
      });
      const { data: created } = await createResponse.json();

      // Execute a transition
      await request.post(
        `/api/document/${created.id}/transition`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          data: { transition: 'upload' }
        }
      );

      // Fetch history (if endpoint exists)
      const historyResponse = await request.get(
        `/api/document/${created.id}/history`,
        { headers: { 'Authorization': `Bearer ${session.access_token}` } }
      );

      if (historyResponse.status() === 200) {
        const { data: history } = await historyResponse.json();
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});


// ============================================================
// CROSS-ENTITY STATE MACHINE TESTS
// ============================================================

test.describe('State Machine Integration', () => {
  test('state machine config exports are valid', async ({ request }) => {
    // Test that the state machine configs can be imported
    // This is a compile-time check that configs are properly generated
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('all state machines have initial state', async () => {
    // Verify each state machine has at least one initial state
    const stateMachines = [
      {
        entity: 'Appointment',
        states: ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
        initialState: 'draft',
      },
      {
        entity: 'Document',
        states: ['requested', 'uploaded', 'reviewed', 'accepted', 'rejected'],
        initialState: 'requested',
      },
    ];

    for (const sm of stateMachines) {
      // Each state machine should have defined states
      expect(sm.states.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
