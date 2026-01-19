/**
 * E2E Critical Flow Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * These tests verify the critical user journeys actually work.
 * They catch:
 * - Hydration errors (nested buttons, invalid HTML)
 * - RLS policy failures at runtime
 * - Navigation/routing issues
 * - Form submission failures
 *
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test';

// Test user credentials (create this user in Supabase first)
const TEST_USER_EMAIL = 'e2e-test@example.com';
const TEST_USER_PASSWORD = 'e2e-test-password-123';

test.describe('Authentication Flow', () => {
  test('should allow user to sign up', async ({ page }) => {
    await page.goto('/signup');

    // Fill signup form
    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'Test123!@#');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/dashboard|verify/);
  });

  test('should allow user to log in', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);

    await page.click('button[type="submit"]');

    // Wait for redirect away from login page (more robust than checking specific URL)
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});


test.describe('HTML Validity & Hydration', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    // Wait for redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should have no console errors on dashboard', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('analytics')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have no hydration errors', async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (
        text.includes('Hydration') ||
        text.includes('hydration') ||
        text.includes('cannot be a descendant') ||
        text.includes('Expected server HTML')
      ) {
        hydrationErrors.push(text);
      }
    });

    // Visit all main pages
    const pages = ['/dashboard', '/profile', '/settings'];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }

    expect(hydrationErrors).toHaveLength(0);
  });

  test('should not have nested interactive elements', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for nested buttons (common hydration error cause)
    const nestedButtons = await page.$$eval('button button, a a, button a, a button', els => els.length);
    expect(nestedButtons).toBe(0);

    // Check for buttons inside links
    const buttonsInLinks = await page.$$eval('a button', els => els.length);
    expect(buttonsInLinks).toBe(0);
  });
});

test.describe('Database Operations via UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

});

// ============================================================
// ENTITY CRUD TESTS (Auto-Generated)
// ============================================================

test.describe('Profile CRUD Operations', () => {
  let authToken: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    // Login once for all tests in this suite
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();
    authToken = session.access_token;
  });

  test('CREATE: should create Profile with valid data', async ({ request }) => {
    const response = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "test-userId",
        email: "test-email",
        name: "test-name",
        timezone: "test-timezone",
        subscriptionTier: "test-subscriptionTier",
        maxDailyAppointments: 42,
        maxDailyAppointmentsTaxSeason: 42,
      }
    });

    expect(response.status()).toBe(201);
    const { data } = await response.json();
    expect(data.id).toBeDefined();
    createdId = data.id;

    // Verify all fields were saved correctly
    expect(data.userId).toBeDefined();
    expect(data.email).toBeDefined();
    expect(data.name).toBeDefined();
    expect(data.timezone).toBeDefined();
    expect(data.subscriptionTier).toBeDefined();
    expect(data.maxDailyAppointments).toBeDefined();
    expect(data.maxDailyAppointmentsTaxSeason).toBeDefined();
  });

  test('READ: should retrieve Profile by id', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "read-test-userId",
        email: "read-test-email",
        name: "read-test-name",
        timezone: "read-test-timezone",
        subscriptionTier: "read-test-subscriptionTier",
        maxDailyAppointments: 100,
        maxDailyAppointmentsTaxSeason: 100,
      }
    });
    const { data: created } = await createResponse.json();

    // Read it back
    const response = await request.get(`/api/profile/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data.id).toBe(created.id);
    expect(data.userId).toBe("read-test-userId");
    expect(data.email).toBe("read-test-email");
    expect(data.name).toBe("read-test-name");
    expect(data.timezone).toBe("read-test-timezone");
    expect(data.subscriptionTier).toBe("read-test-subscriptionTier");
  });

  test('READ: should list Profile with pagination', async ({ request }) => {
    const response = await request.get('/api/profile?limit=10&offset=0', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data, pagination } = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(pagination).toBeDefined();
    expect(pagination.limit).toBe(10);
  });

  test('UPDATE: should update Profile with valid data', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "original-userId",
        email: "original-email",
        name: "original-name",
        timezone: "original-timezone",
        subscriptionTier: "original-subscriptionTier",
        maxDailyAppointments: 1,
        maxDailyAppointmentsTaxSeason: 1,
      }
    });
    const { data: created } = await createResponse.json();

    // Update it
    const response = await request.patch(`/api/profile/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "updated-userId",
        email: "updated-email",
        name: "updated-name",
        timezone: "updated-timezone",
        subscriptionTier: "updated-subscriptionTier",
        maxDailyAppointments: 999,
        maxDailyAppointmentsTaxSeason: 999,
      }
    });

    expect(response.status()).toBe(200);
    const { data: updated } = await response.json();
    expect(updated.id).toBe(created.id);

    // Verify changes persisted
    const verifyResponse = await request.get(`/api/profile/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.userId).toBe("updated-userId");
    expect(verified.email).toBe("updated-email");
    expect(verified.name).toBe("updated-name");
    expect(verified.timezone).toBe("updated-timezone");
    expect(verified.subscriptionTier).toBe("updated-subscriptionTier");
  });

  test('DELETE: should delete Profile', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "to-delete-userId",
        email: "to-delete-email",
        name: "to-delete-name",
        timezone: "to-delete-timezone",
        subscriptionTier: "to-delete-subscriptionTier",
        maxDailyAppointments: 0,
        maxDailyAppointmentsTaxSeason: 0,
      }
    });
    const { data: created } = await createResponse.json();

    // Delete it
    const response = await request.delete(`/api/profile/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);

    // Verify it's gone
    const verifyResponse = await request.get(`/api/profile/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be 404 (hard delete) or return deleted_at (soft delete)
    expect(verifyResponse.status()).toBe(404);
  });

  // === Validation Tests ===
  test('VALIDATE: should reject Profile with missing required fields', async ({ request }) => {
    const response = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {} // Empty - missing required fields
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.type).toBe('validation_failed');
  });

});

test.describe('Client CRUD Operations', () => {
  let authToken: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    // Login once for all tests in this suite
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();
    authToken = session.access_token;
  });

  test('CREATE: should create Client with valid data', async ({ request }) => {
    const response = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "test-userId",
        name: "test-name",
        email: "test-email",
        preferredContact: "test-preferredContact",
      }
    });

    expect(response.status()).toBe(201);
    const { data } = await response.json();
    expect(data.id).toBeDefined();
    createdId = data.id;

    // Verify all fields were saved correctly
    expect(data.userId).toBeDefined();
    expect(data.name).toBeDefined();
    expect(data.email).toBeDefined();
    expect(data.preferredContact).toBeDefined();
  });

  test('READ: should retrieve Client by id', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "read-test-userId",
        name: "read-test-name",
        email: "read-test-email",
        preferredContact: "read-test-preferredContact",
      }
    });
    const { data: created } = await createResponse.json();

    // Read it back
    const response = await request.get(`/api/client/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data.id).toBe(created.id);
    expect(data.userId).toBe("read-test-userId");
    expect(data.name).toBe("read-test-name");
    expect(data.email).toBe("read-test-email");
    expect(data.preferredContact).toBe("read-test-preferredContact");
  });

  test('READ: should list Client with pagination', async ({ request }) => {
    const response = await request.get('/api/client?limit=10&offset=0', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data, pagination } = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(pagination).toBeDefined();
    expect(pagination.limit).toBe(10);
  });

  test('UPDATE: should update Client with valid data', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "original-userId",
        name: "original-name",
        email: "original-email",
        preferredContact: "original-preferredContact",
      }
    });
    const { data: created } = await createResponse.json();

    // Update it
    const response = await request.patch(`/api/client/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "updated-userId",
        name: "updated-name",
        email: "updated-email",
        preferredContact: "updated-preferredContact",
      }
    });

    expect(response.status()).toBe(200);
    const { data: updated } = await response.json();
    expect(updated.id).toBe(created.id);

    // Verify changes persisted
    const verifyResponse = await request.get(`/api/client/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.userId).toBe("updated-userId");
    expect(verified.name).toBe("updated-name");
    expect(verified.email).toBe("updated-email");
    expect(verified.preferredContact).toBe("updated-preferredContact");
  });

  test('DELETE: should delete Client', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "to-delete-userId",
        name: "to-delete-name",
        email: "to-delete-email",
        preferredContact: "to-delete-preferredContact",
      }
    });
    const { data: created } = await createResponse.json();

    // Delete it
    const response = await request.delete(`/api/client/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);

    // Verify it's gone
    const verifyResponse = await request.get(`/api/client/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be 404 (hard delete) or return deleted_at (soft delete)
    expect(verifyResponse.status()).toBe(404);
  });

  // === Validation Tests ===
  test('VALIDATE: should reject Client with missing required fields', async ({ request }) => {
    const response = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {} // Empty - missing required fields
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.type).toBe('validation_failed');
  });

});

test.describe('Service CRUD Operations', () => {
  let authToken: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    // Login once for all tests in this suite
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();
    authToken = session.access_token;
  });

  test('CREATE: should create Service with valid data', async ({ request }) => {
    const response = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "test-userId",
        name: "test-name",
        durationMinutes: 42,
        taxSeasonOnly: true,
        requiresDocuments: true,
        isActive: true,
        bufferMinutes: 42,
      }
    });

    expect(response.status()).toBe(201);
    const { data } = await response.json();
    expect(data.id).toBeDefined();
    createdId = data.id;

    // Verify all fields were saved correctly
    expect(data.userId).toBeDefined();
    expect(data.name).toBeDefined();
    expect(data.durationMinutes).toBeDefined();
    expect(data.taxSeasonOnly).toBeDefined();
    expect(data.requiresDocuments).toBeDefined();
    expect(data.isActive).toBeDefined();
    expect(data.bufferMinutes).toBeDefined();
  });

  test('READ: should retrieve Service by id', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "read-test-userId",
        name: "read-test-name",
        durationMinutes: 100,
        taxSeasonOnly: true,
        requiresDocuments: true,
        isActive: true,
        bufferMinutes: 100,
      }
    });
    const { data: created } = await createResponse.json();

    // Read it back
    const response = await request.get(`/api/service/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data.id).toBe(created.id);
    expect(data.userId).toBe("read-test-userId");
    expect(data.name).toBe("read-test-name");
  });

  test('READ: should list Service with pagination', async ({ request }) => {
    const response = await request.get('/api/service?limit=10&offset=0', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data, pagination } = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(pagination).toBeDefined();
    expect(pagination.limit).toBe(10);
  });

  test('UPDATE: should update Service with valid data', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "original-userId",
        name: "original-name",
        durationMinutes: 1,
        taxSeasonOnly: false,
        requiresDocuments: false,
        isActive: false,
        bufferMinutes: 1,
      }
    });
    const { data: created } = await createResponse.json();

    // Update it
    const response = await request.patch(`/api/service/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "updated-userId",
        name: "updated-name",
        durationMinutes: 999,
        taxSeasonOnly: true,
        requiresDocuments: true,
        isActive: true,
        bufferMinutes: 999,
      }
    });

    expect(response.status()).toBe(200);
    const { data: updated } = await response.json();
    expect(updated.id).toBe(created.id);

    // Verify changes persisted
    const verifyResponse = await request.get(`/api/service/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.userId).toBe("updated-userId");
    expect(verified.name).toBe("updated-name");
  });

  test('DELETE: should delete Service', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "to-delete-userId",
        name: "to-delete-name",
        durationMinutes: 0,
        taxSeasonOnly: true,
        requiresDocuments: true,
        isActive: true,
        bufferMinutes: 0,
      }
    });
    const { data: created } = await createResponse.json();

    // Delete it
    const response = await request.delete(`/api/service/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);

    // Verify it's gone
    const verifyResponse = await request.get(`/api/service/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be 404 (hard delete) or return deleted_at (soft delete)
    expect(verifyResponse.status()).toBe(404);
  });

  // === Validation Tests ===
  test('VALIDATE: should reject Service with missing required fields', async ({ request }) => {
    const response = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {} // Empty - missing required fields
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.type).toBe('validation_failed');
  });

});

test.describe('Appointment CRUD Operations', () => {
  let authToken: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    // Login once for all tests in this suite
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();
    authToken = session.access_token;
  });

  test('CREATE: should create Appointment with valid data', async ({ request }) => {
    const response = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "test-userId",
        clientId: "test-clientId",
        serviceId: "test-serviceId",
        startsAt: "test-value",
        endsAt: "test-value",
        status: "test-status",
        reminderSent24h: true,
        reminderSent1h: true,
      }
    });

    expect(response.status()).toBe(201);
    const { data } = await response.json();
    expect(data.id).toBeDefined();
    createdId = data.id;

    // Verify all fields were saved correctly
    expect(data.userId).toBeDefined();
    expect(data.clientId).toBeDefined();
    expect(data.serviceId).toBeDefined();
    expect(data.startsAt).toBeDefined();
    expect(data.endsAt).toBeDefined();
    expect(data.status).toBeDefined();
    expect(data.reminderSent24h).toBeDefined();
    expect(data.reminderSent1h).toBeDefined();
  });

  test('READ: should retrieve Appointment by id', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "read-test-userId",
        clientId: "read-test-clientId",
        serviceId: "read-test-serviceId",
        startsAt: "test",
        endsAt: "test",
        status: "read-test-status",
        reminderSent24h: true,
        reminderSent1h: true,
      }
    });
    const { data: created } = await createResponse.json();

    // Read it back
    const response = await request.get(`/api/appointment/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data.id).toBe(created.id);
    expect(data.userId).toBe("read-test-userId");
    expect(data.clientId).toBe("read-test-clientId");
    expect(data.serviceId).toBe("read-test-serviceId");
    expect(data.status).toBe("read-test-status");
  });

  test('READ: should list Appointment with pagination', async ({ request }) => {
    const response = await request.get('/api/appointment?limit=10&offset=0', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data, pagination } = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(pagination).toBeDefined();
    expect(pagination.limit).toBe(10);
  });

  test('UPDATE: should update Appointment with valid data', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "original-userId",
        clientId: "original-clientId",
        serviceId: "original-serviceId",
        startsAt: "original",
        endsAt: "original",
        status: "original-status",
        reminderSent24h: false,
        reminderSent1h: false,
      }
    });
    const { data: created } = await createResponse.json();

    // Update it
    const response = await request.patch(`/api/appointment/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "updated-userId",
        clientId: "updated-clientId",
        serviceId: "updated-serviceId",
        startsAt: "updated",
        endsAt: "updated",
        status: "updated-status",
        reminderSent24h: true,
        reminderSent1h: true,
      }
    });

    expect(response.status()).toBe(200);
    const { data: updated } = await response.json();
    expect(updated.id).toBe(created.id);

    // Verify changes persisted
    const verifyResponse = await request.get(`/api/appointment/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.userId).toBe("updated-userId");
    expect(verified.clientId).toBe("updated-clientId");
    expect(verified.serviceId).toBe("updated-serviceId");
    expect(verified.status).toBe("updated-status");
  });

  test('DELETE: should delete Appointment', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "to-delete-userId",
        clientId: "to-delete-clientId",
        serviceId: "to-delete-serviceId",
        startsAt: "delete-me",
        endsAt: "delete-me",
        status: "to-delete-status",
        reminderSent24h: true,
        reminderSent1h: true,
      }
    });
    const { data: created } = await createResponse.json();

    // Delete it
    const response = await request.delete(`/api/appointment/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);

    // Verify it's gone
    const verifyResponse = await request.get(`/api/appointment/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be 404 (hard delete) or return deleted_at (soft delete)
    expect(verifyResponse.status()).toBe(404);
  });

  // === Validation Tests ===
  test('VALIDATE: should reject Appointment with missing required fields', async ({ request }) => {
    const response = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {} // Empty - missing required fields
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.type).toBe('validation_failed');
  });

});

test.describe('Availability CRUD Operations', () => {
  let authToken: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    // Login once for all tests in this suite
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();
    authToken = session.access_token;
  });

  test('CREATE: should create Availability with valid data', async ({ request }) => {
    const response = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "test-userId",
        dayOfWeek: 42,
        startTime: "test-startTime",
        endTime: "test-endTime",
        isTaxSeason: true,
      }
    });

    expect(response.status()).toBe(201);
    const { data } = await response.json();
    expect(data.id).toBeDefined();
    createdId = data.id;

    // Verify all fields were saved correctly
    expect(data.userId).toBeDefined();
    expect(data.dayOfWeek).toBeDefined();
    expect(data.startTime).toBeDefined();
    expect(data.endTime).toBeDefined();
    expect(data.isTaxSeason).toBeDefined();
  });

  test('READ: should retrieve Availability by id', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "read-test-userId",
        dayOfWeek: 100,
        startTime: "read-test-startTime",
        endTime: "read-test-endTime",
        isTaxSeason: true,
      }
    });
    const { data: created } = await createResponse.json();

    // Read it back
    const response = await request.get(`/api/availability/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data.id).toBe(created.id);
    expect(data.userId).toBe("read-test-userId");
    expect(data.startTime).toBe("read-test-startTime");
    expect(data.endTime).toBe("read-test-endTime");
  });

  test('READ: should list Availability with pagination', async ({ request }) => {
    const response = await request.get('/api/availability?limit=10&offset=0', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data, pagination } = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(pagination).toBeDefined();
    expect(pagination.limit).toBe(10);
  });

  test('UPDATE: should update Availability with valid data', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "original-userId",
        dayOfWeek: 1,
        startTime: "original-startTime",
        endTime: "original-endTime",
        isTaxSeason: false,
      }
    });
    const { data: created } = await createResponse.json();

    // Update it
    const response = await request.patch(`/api/availability/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "updated-userId",
        dayOfWeek: 999,
        startTime: "updated-startTime",
        endTime: "updated-endTime",
        isTaxSeason: true,
      }
    });

    expect(response.status()).toBe(200);
    const { data: updated } = await response.json();
    expect(updated.id).toBe(created.id);

    // Verify changes persisted
    const verifyResponse = await request.get(`/api/availability/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.userId).toBe("updated-userId");
    expect(verified.startTime).toBe("updated-startTime");
    expect(verified.endTime).toBe("updated-endTime");
  });

  test('DELETE: should delete Availability', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "to-delete-userId",
        dayOfWeek: 0,
        startTime: "to-delete-startTime",
        endTime: "to-delete-endTime",
        isTaxSeason: true,
      }
    });
    const { data: created } = await createResponse.json();

    // Delete it
    const response = await request.delete(`/api/availability/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);

    // Verify it's gone
    const verifyResponse = await request.get(`/api/availability/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be 404 (hard delete) or return deleted_at (soft delete)
    expect(verifyResponse.status()).toBe(404);
  });

  // === Validation Tests ===
  test('VALIDATE: should reject Availability with missing required fields', async ({ request }) => {
    const response = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {} // Empty - missing required fields
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.type).toBe('validation_failed');
  });

});

test.describe('Document CRUD Operations', () => {
  let authToken: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    // Login once for all tests in this suite
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();
    authToken = session.access_token;
  });

  test('CREATE: should create Document with valid data', async ({ request }) => {
    const response = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "test-userId",
        clientId: "test-clientId",
        documentType: "test-documentType",
        status: "test-status",
      }
    });

    expect(response.status()).toBe(201);
    const { data } = await response.json();
    expect(data.id).toBeDefined();
    createdId = data.id;

    // Verify all fields were saved correctly
    expect(data.userId).toBeDefined();
    expect(data.clientId).toBeDefined();
    expect(data.documentType).toBeDefined();
    expect(data.status).toBeDefined();
  });

  test('READ: should retrieve Document by id', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "read-test-userId",
        clientId: "read-test-clientId",
        documentType: "read-test-documentType",
        status: "read-test-status",
      }
    });
    const { data: created } = await createResponse.json();

    // Read it back
    const response = await request.get(`/api/document/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data.id).toBe(created.id);
    expect(data.userId).toBe("read-test-userId");
    expect(data.clientId).toBe("read-test-clientId");
    expect(data.documentType).toBe("read-test-documentType");
    expect(data.status).toBe("read-test-status");
  });

  test('READ: should list Document with pagination', async ({ request }) => {
    const response = await request.get('/api/document?limit=10&offset=0', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const { data, pagination } = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(pagination).toBeDefined();
    expect(pagination.limit).toBe(10);
  });

  test('UPDATE: should update Document with valid data', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "original-userId",
        clientId: "original-clientId",
        documentType: "original-documentType",
        status: "original-status",
      }
    });
    const { data: created } = await createResponse.json();

    // Update it
    const response = await request.patch(`/api/document/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "updated-userId",
        clientId: "updated-clientId",
        documentType: "updated-documentType",
        status: "updated-status",
      }
    });

    expect(response.status()).toBe(200);
    const { data: updated } = await response.json();
    expect(updated.id).toBe(created.id);

    // Verify changes persisted
    const verifyResponse = await request.get(`/api/document/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.userId).toBe("updated-userId");
    expect(verified.clientId).toBe("updated-clientId");
    expect(verified.documentType).toBe("updated-documentType");
    expect(verified.status).toBe("updated-status");
  });

  test('DELETE: should delete Document', async ({ request }) => {
    // First create one
    const createResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        userId: "to-delete-userId",
        clientId: "to-delete-clientId",
        documentType: "to-delete-documentType",
        status: "to-delete-status",
      }
    });
    const { data: created } = await createResponse.json();

    // Delete it
    const response = await request.delete(`/api/document/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);

    // Verify it's gone
    const verifyResponse = await request.get(`/api/document/${created.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be 404 (hard delete) or return deleted_at (soft delete)
    expect(verifyResponse.status()).toBe(404);
  });

  // === Validation Tests ===
  test('VALIDATE: should reject Document with missing required fields', async ({ request }) => {
    const response = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {} // Empty - missing required fields
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.type).toBe('validation_failed');
  });

});


// ============================================================
// AUTHORIZATION TESTS (GAP-016)
// ============================================================
// These tests verify that RLS policies and API authorization work together.
// Critical: Prevents data leakage between users.

// Second test user for cross-user access tests
const TEST_USER_2_EMAIL = 'e2e-test-2@example.com';
const TEST_USER_2_PASSWORD = 'e2e-test-password-456';

test.describe('Authorization & Data Isolation', () => {
  test('should NOT allow User 2 to access User 1 Profile via API', async ({ request }) => {
    // Step 1: Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        email: 'test@example.com',
        name: 'Test Value',
        timezone: 'Test Value',
        subscription_tier: 'Test Value',
        max_daily_appointments: 42,
        max_daily_appointments_tax_season: 42,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    expect(createResponse.status()).toBe(201);
    const { data: created } = await createResponse.json();
    const resourceId = created.id;

    // Step 2: Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Step 3: Attempt to access User 1's resource as User 2
    const accessResponse = await request.get(`/api/profile/${resourceId}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be 404 (not found) or 403 (forbidden), NOT 200 with data
    expect([403, 404]).toContain(accessResponse.status());

    // Ensure no data was leaked
    const responseData = await accessResponse.json();
    expect(responseData.data).toBeUndefined();
  });

  test('should NOT allow User 2 to update User 1 Profile via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        email: 'test@example.com',
        name: 'Test Value',
        timezone: 'Test Value',
        subscription_tier: 'Test Value',
        max_daily_appointments: 42,
        max_daily_appointments_tax_season: 42,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to update
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const updateResponse = await request.patch(`/api/profile/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: { id: 'hacked-value' }
    });

    // Should be rejected
    expect([403, 404]).toContain(updateResponse.status());

    // Verify original data is unchanged (as User 1)
    const verifyResponse = await request.get(`/api/profile/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.id).not.toBe('hacked-value');
  });

  test('should NOT allow User 2 to delete User 1 Profile via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        email: 'test@example.com',
        name: 'Test Value',
        timezone: 'Test Value',
        subscription_tier: 'Test Value',
        max_daily_appointments: 42,
        max_daily_appointments_tax_season: 42,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to delete
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const deleteResponse = await request.delete(`/api/profile/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be rejected
    expect([403, 404]).toContain(deleteResponse.status());

    // Verify resource still exists (as User 1)
    const verifyResponse = await request.get(`/api/profile/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    expect(verifyResponse.status()).toBe(200);
  });

  test('should only return own Profile in list endpoint', async ({ request }) => {
    // Login as User 1
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    // Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Create resource as User 1
    const user1Resource = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'user1-Test Value',
        user_id: 'user1-Test Value',
        email: 'user1-test@example.com',
        name: 'user1-Test Value',
        timezone: 'user1-Test Value',
        subscription_tier: 'user1-Test Value',
        max_daily_appointments: 'user1-42',
        max_daily_appointments_tax_season: 'user1-42',
        created_at: 'user1-new Date().toISOString().split('T')[0]',
        updated_at: 'user1-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user1Data } = await user1Resource.json();

    // Create resource as User 2
    const user2Resource = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: {
        id: 'user2-Test Value',
        user_id: 'user2-Test Value',
        email: 'user2-test@example.com',
        name: 'user2-Test Value',
        timezone: 'user2-Test Value',
        subscription_tier: 'user2-Test Value',
        max_daily_appointments: 'user2-42',
        max_daily_appointments_tax_season: 'user2-42',
        created_at: 'user2-new Date().toISOString().split('T')[0]',
        updated_at: 'user2-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user2Data } = await user2Resource.json();

    // List as User 1 - should only see own resources
    const listResponse1 = await request.get('/api/profile', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: list1 } = await listResponse1.json();

    const user1Ids = list1.map((item: any) => item.id);
    expect(user1Ids).toContain(user1Data.id);
    expect(user1Ids).not.toContain(user2Data.id);

    // List as User 2 - should only see own resources
    const listResponse2 = await request.get('/api/profile', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });
    const { data: list2 } = await listResponse2.json();

    const user2Ids = list2.map((item: any) => item.id);
    expect(user2Ids).toContain(user2Data.id);
    expect(user2Ids).not.toContain(user1Data.id);
  });
  test('should NOT allow User 2 to access User 1 Client via API', async ({ request }) => {
    // Step 1: Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        email: 'test@example.com',
        preferred_contact: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    expect(createResponse.status()).toBe(201);
    const { data: created } = await createResponse.json();
    const resourceId = created.id;

    // Step 2: Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Step 3: Attempt to access User 1's resource as User 2
    const accessResponse = await request.get(`/api/client/${resourceId}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be 404 (not found) or 403 (forbidden), NOT 200 with data
    expect([403, 404]).toContain(accessResponse.status());

    // Ensure no data was leaked
    const responseData = await accessResponse.json();
    expect(responseData.data).toBeUndefined();
  });

  test('should NOT allow User 2 to update User 1 Client via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        email: 'test@example.com',
        preferred_contact: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to update
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const updateResponse = await request.patch(`/api/client/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: { id: 'hacked-value' }
    });

    // Should be rejected
    expect([403, 404]).toContain(updateResponse.status());

    // Verify original data is unchanged (as User 1)
    const verifyResponse = await request.get(`/api/client/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.id).not.toBe('hacked-value');
  });

  test('should NOT allow User 2 to delete User 1 Client via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        email: 'test@example.com',
        preferred_contact: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to delete
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const deleteResponse = await request.delete(`/api/client/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be rejected
    expect([403, 404]).toContain(deleteResponse.status());

    // Verify resource still exists (as User 1)
    const verifyResponse = await request.get(`/api/client/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    expect(verifyResponse.status()).toBe(200);
  });

  test('should only return own Client in list endpoint', async ({ request }) => {
    // Login as User 1
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    // Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Create resource as User 1
    const user1Resource = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'user1-Test Value',
        user_id: 'user1-Test Value',
        name: 'user1-Test Value',
        email: 'user1-test@example.com',
        preferred_contact: 'user1-Test Value',
        created_at: 'user1-new Date().toISOString().split('T')[0]',
        updated_at: 'user1-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user1Data } = await user1Resource.json();

    // Create resource as User 2
    const user2Resource = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: {
        id: 'user2-Test Value',
        user_id: 'user2-Test Value',
        name: 'user2-Test Value',
        email: 'user2-test@example.com',
        preferred_contact: 'user2-Test Value',
        created_at: 'user2-new Date().toISOString().split('T')[0]',
        updated_at: 'user2-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user2Data } = await user2Resource.json();

    // List as User 1 - should only see own resources
    const listResponse1 = await request.get('/api/client', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: list1 } = await listResponse1.json();

    const user1Ids = list1.map((item: any) => item.id);
    expect(user1Ids).toContain(user1Data.id);
    expect(user1Ids).not.toContain(user2Data.id);

    // List as User 2 - should only see own resources
    const listResponse2 = await request.get('/api/client', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });
    const { data: list2 } = await listResponse2.json();

    const user2Ids = list2.map((item: any) => item.id);
    expect(user2Ids).toContain(user2Data.id);
    expect(user2Ids).not.toContain(user1Data.id);
  });
  test('should NOT allow User 2 to access User 1 Service via API', async ({ request }) => {
    // Step 1: Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        duration_minutes: 42,
        tax_season_only: true,
        requires_documents: true,
        is_active: true,
        buffer_minutes: 42,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    expect(createResponse.status()).toBe(201);
    const { data: created } = await createResponse.json();
    const resourceId = created.id;

    // Step 2: Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Step 3: Attempt to access User 1's resource as User 2
    const accessResponse = await request.get(`/api/service/${resourceId}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be 404 (not found) or 403 (forbidden), NOT 200 with data
    expect([403, 404]).toContain(accessResponse.status());

    // Ensure no data was leaked
    const responseData = await accessResponse.json();
    expect(responseData.data).toBeUndefined();
  });

  test('should NOT allow User 2 to update User 1 Service via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        duration_minutes: 42,
        tax_season_only: true,
        requires_documents: true,
        is_active: true,
        buffer_minutes: 42,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to update
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const updateResponse = await request.patch(`/api/service/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: { id: 'hacked-value' }
    });

    // Should be rejected
    expect([403, 404]).toContain(updateResponse.status());

    // Verify original data is unchanged (as User 1)
    const verifyResponse = await request.get(`/api/service/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.id).not.toBe('hacked-value');
  });

  test('should NOT allow User 2 to delete User 1 Service via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        duration_minutes: 42,
        tax_season_only: true,
        requires_documents: true,
        is_active: true,
        buffer_minutes: 42,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to delete
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const deleteResponse = await request.delete(`/api/service/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be rejected
    expect([403, 404]).toContain(deleteResponse.status());

    // Verify resource still exists (as User 1)
    const verifyResponse = await request.get(`/api/service/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    expect(verifyResponse.status()).toBe(200);
  });

  test('should only return own Service in list endpoint', async ({ request }) => {
    // Login as User 1
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    // Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Create resource as User 1
    const user1Resource = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'user1-Test Value',
        user_id: 'user1-Test Value',
        name: 'user1-Test Value',
        duration_minutes: 'user1-42',
        tax_season_only: 'user1-true',
        requires_documents: 'user1-true',
        is_active: 'user1-true',
        buffer_minutes: 'user1-42',
        created_at: 'user1-new Date().toISOString().split('T')[0]',
        updated_at: 'user1-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user1Data } = await user1Resource.json();

    // Create resource as User 2
    const user2Resource = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: {
        id: 'user2-Test Value',
        user_id: 'user2-Test Value',
        name: 'user2-Test Value',
        duration_minutes: 'user2-42',
        tax_season_only: 'user2-true',
        requires_documents: 'user2-true',
        is_active: 'user2-true',
        buffer_minutes: 'user2-42',
        created_at: 'user2-new Date().toISOString().split('T')[0]',
        updated_at: 'user2-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user2Data } = await user2Resource.json();

    // List as User 1 - should only see own resources
    const listResponse1 = await request.get('/api/service', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: list1 } = await listResponse1.json();

    const user1Ids = list1.map((item: any) => item.id);
    expect(user1Ids).toContain(user1Data.id);
    expect(user1Ids).not.toContain(user2Data.id);

    // List as User 2 - should only see own resources
    const listResponse2 = await request.get('/api/service', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });
    const { data: list2 } = await listResponse2.json();

    const user2Ids = list2.map((item: any) => item.id);
    expect(user2Ids).toContain(user2Data.id);
    expect(user2Ids).not.toContain(user1Data.id);
  });
  test('should NOT allow User 2 to access User 1 Appointment via API', async ({ request }) => {
    // Step 1: Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
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
      }
    });
    expect(createResponse.status()).toBe(201);
    const { data: created } = await createResponse.json();
    const resourceId = created.id;

    // Step 2: Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Step 3: Attempt to access User 1's resource as User 2
    const accessResponse = await request.get(`/api/appointment/${resourceId}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be 404 (not found) or 403 (forbidden), NOT 200 with data
    expect([403, 404]).toContain(accessResponse.status());

    // Ensure no data was leaked
    const responseData = await accessResponse.json();
    expect(responseData.data).toBeUndefined();
  });

  test('should NOT allow User 2 to update User 1 Appointment via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
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
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to update
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const updateResponse = await request.patch(`/api/appointment/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: { id: 'hacked-value' }
    });

    // Should be rejected
    expect([403, 404]).toContain(updateResponse.status());

    // Verify original data is unchanged (as User 1)
    const verifyResponse = await request.get(`/api/appointment/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.id).not.toBe('hacked-value');
  });

  test('should NOT allow User 2 to delete User 1 Appointment via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
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
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to delete
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const deleteResponse = await request.delete(`/api/appointment/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be rejected
    expect([403, 404]).toContain(deleteResponse.status());

    // Verify resource still exists (as User 1)
    const verifyResponse = await request.get(`/api/appointment/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    expect(verifyResponse.status()).toBe(200);
  });

  test('should only return own Appointment in list endpoint', async ({ request }) => {
    // Login as User 1
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    // Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Create resource as User 1
    const user1Resource = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'user1-Test Value',
        user_id: 'user1-Test Value',
        client_id: 'user1-Test Value',
        service_id: 'user1-Test Value',
        starts_at: 'user1-new Date().toISOString().split('T')[0]',
        ends_at: 'user1-new Date().toISOString().split('T')[0]',
        status: 'user1-Test Value',
        reminder_sent_24h: 'user1-true',
        reminder_sent_1h: 'user1-true',
        created_at: 'user1-new Date().toISOString().split('T')[0]',
        updated_at: 'user1-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user1Data } = await user1Resource.json();

    // Create resource as User 2
    const user2Resource = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: {
        id: 'user2-Test Value',
        user_id: 'user2-Test Value',
        client_id: 'user2-Test Value',
        service_id: 'user2-Test Value',
        starts_at: 'user2-new Date().toISOString().split('T')[0]',
        ends_at: 'user2-new Date().toISOString().split('T')[0]',
        status: 'user2-Test Value',
        reminder_sent_24h: 'user2-true',
        reminder_sent_1h: 'user2-true',
        created_at: 'user2-new Date().toISOString().split('T')[0]',
        updated_at: 'user2-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user2Data } = await user2Resource.json();

    // List as User 1 - should only see own resources
    const listResponse1 = await request.get('/api/appointment', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: list1 } = await listResponse1.json();

    const user1Ids = list1.map((item: any) => item.id);
    expect(user1Ids).toContain(user1Data.id);
    expect(user1Ids).not.toContain(user2Data.id);

    // List as User 2 - should only see own resources
    const listResponse2 = await request.get('/api/appointment', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });
    const { data: list2 } = await listResponse2.json();

    const user2Ids = list2.map((item: any) => item.id);
    expect(user2Ids).toContain(user2Data.id);
    expect(user2Ids).not.toContain(user1Data.id);
  });
  test('should NOT allow User 2 to access User 1 Availability via API', async ({ request }) => {
    // Step 1: Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    expect(createResponse.status()).toBe(201);
    const { data: created } = await createResponse.json();
    const resourceId = created.id;

    // Step 2: Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Step 3: Attempt to access User 1's resource as User 2
    const accessResponse = await request.get(`/api/availability/${resourceId}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be 404 (not found) or 403 (forbidden), NOT 200 with data
    expect([403, 404]).toContain(accessResponse.status());

    // Ensure no data was leaked
    const responseData = await accessResponse.json();
    expect(responseData.data).toBeUndefined();
  });

  test('should NOT allow User 2 to update User 1 Availability via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to update
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const updateResponse = await request.patch(`/api/availability/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: { id: 'hacked-value' }
    });

    // Should be rejected
    expect([403, 404]).toContain(updateResponse.status());

    // Verify original data is unchanged (as User 1)
    const verifyResponse = await request.get(`/api/availability/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.id).not.toBe('hacked-value');
  });

  test('should NOT allow User 2 to delete User 1 Availability via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to delete
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const deleteResponse = await request.delete(`/api/availability/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be rejected
    expect([403, 404]).toContain(deleteResponse.status());

    // Verify resource still exists (as User 1)
    const verifyResponse = await request.get(`/api/availability/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    expect(verifyResponse.status()).toBe(200);
  });

  test('should only return own Availability in list endpoint', async ({ request }) => {
    // Login as User 1
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    // Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Create resource as User 1
    const user1Resource = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'user1-Test Value',
        user_id: 'user1-Test Value',
        day_of_week: 'user1-42',
        start_time: 'user1-Test Value',
        end_time: 'user1-Test Value',
        is_tax_season: 'user1-true',
        created_at: 'user1-new Date().toISOString().split('T')[0]',
        updated_at: 'user1-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user1Data } = await user1Resource.json();

    // Create resource as User 2
    const user2Resource = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: {
        id: 'user2-Test Value',
        user_id: 'user2-Test Value',
        day_of_week: 'user2-42',
        start_time: 'user2-Test Value',
        end_time: 'user2-Test Value',
        is_tax_season: 'user2-true',
        created_at: 'user2-new Date().toISOString().split('T')[0]',
        updated_at: 'user2-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user2Data } = await user2Resource.json();

    // List as User 1 - should only see own resources
    const listResponse1 = await request.get('/api/availability', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: list1 } = await listResponse1.json();

    const user1Ids = list1.map((item: any) => item.id);
    expect(user1Ids).toContain(user1Data.id);
    expect(user1Ids).not.toContain(user2Data.id);

    // List as User 2 - should only see own resources
    const listResponse2 = await request.get('/api/availability', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });
    const { data: list2 } = await listResponse2.json();

    const user2Ids = list2.map((item: any) => item.id);
    expect(user2Ids).toContain(user2Data.id);
    expect(user2Ids).not.toContain(user1Data.id);
  });
  test('should NOT allow User 2 to access User 1 Document via API', async ({ request }) => {
    // Step 1: Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    expect(createResponse.status()).toBe(201);
    const { data: created } = await createResponse.json();
    const resourceId = created.id;

    // Step 2: Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Step 3: Attempt to access User 1's resource as User 2
    const accessResponse = await request.get(`/api/document/${resourceId}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be 404 (not found) or 403 (forbidden), NOT 200 with data
    expect([403, 404]).toContain(accessResponse.status());

    // Ensure no data was leaked
    const responseData = await accessResponse.json();
    expect(responseData.data).toBeUndefined();
  });

  test('should NOT allow User 2 to update User 1 Document via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to update
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const updateResponse = await request.patch(`/api/document/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: { id: 'hacked-value' }
    });

    // Should be rejected
    expect([403, 404]).toContain(updateResponse.status());

    // Verify original data is unchanged (as User 1)
    const verifyResponse = await request.get(`/api/document/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: verified } = await verifyResponse.json();
    expect(verified.id).not.toBe('hacked-value');
  });

  test('should NOT allow User 2 to delete User 1 Document via API', async ({ request }) => {
    // Login as User 1 and create a resource
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    const createResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      }
    });
    const { data: created } = await createResponse.json();

    // Login as User 2 and attempt to delete
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    const deleteResponse = await request.delete(`/api/document/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });

    // Should be rejected
    expect([403, 404]).toContain(deleteResponse.status());

    // Verify resource still exists (as User 1)
    const verifyResponse = await request.get(`/api/document/${created.id}`, {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    expect(verifyResponse.status()).toBe(200);
  });

  test('should only return own Document in list endpoint', async ({ request }) => {
    // Login as User 1
    const loginResponse1 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session: session1 } = await loginResponse1.json();

    // Login as User 2
    const loginResponse2 = await request.post('/api/auth/login', {
      data: { email: TEST_USER_2_EMAIL, password: TEST_USER_2_PASSWORD }
    });
    const { session: session2 } = await loginResponse2.json();

    // Create resource as User 1
    const user1Resource = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` },
      data: {
        id: 'user1-Test Value',
        user_id: 'user1-Test Value',
        client_id: 'user1-Test Value',
        document_type: 'user1-Test Value',
        status: 'user1-Test Value',
        created_at: 'user1-new Date().toISOString().split('T')[0]',
        updated_at: 'user1-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user1Data } = await user1Resource.json();

    // Create resource as User 2
    const user2Resource = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` },
      data: {
        id: 'user2-Test Value',
        user_id: 'user2-Test Value',
        client_id: 'user2-Test Value',
        document_type: 'user2-Test Value',
        status: 'user2-Test Value',
        created_at: 'user2-new Date().toISOString().split('T')[0]',
        updated_at: 'user2-new Date().toISOString().split('T')[0]',
      }
    });
    const { data: user2Data } = await user2Resource.json();

    // List as User 1 - should only see own resources
    const listResponse1 = await request.get('/api/document', {
      headers: { 'Authorization': `Bearer ${session1.access_token}` }
    });
    const { data: list1 } = await listResponse1.json();

    const user1Ids = list1.map((item: any) => item.id);
    expect(user1Ids).toContain(user1Data.id);
    expect(user1Ids).not.toContain(user2Data.id);

    // List as User 2 - should only see own resources
    const listResponse2 = await request.get('/api/document', {
      headers: { 'Authorization': `Bearer ${session2.access_token}` }
    });
    const { data: list2 } = await listResponse2.json();

    const user2Ids = list2.map((item: any) => item.id);
    expect(user2Ids).toContain(user2Data.id);
    expect(user2Ids).not.toContain(user1Data.id);
  });
});

test.describe('API Error Handling', () => {
  test('should return 401 for unauthenticated API requests', async ({ request }) => {
    const response = await request.get('/api/profile');
    expect(response.status()).toBe(401);
  });

  test('should return 400 for invalid request body', async ({ request }) => {
    // Login first
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();

    // Send invalid data (missing required fields)
    const response = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      data: {} // Empty body - missing required fields
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.type).toBe('validation_failed');
  });

  test('should return 404 for non-existent resource', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();

    const response = await request.get('/api/profile/00000000-0000-0000-0000-000000000000', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });

    expect(response.status()).toBe(404);
  });
});
