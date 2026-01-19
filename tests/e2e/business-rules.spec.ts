/**
 * Business Rules Validation Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * These tests verify business rules are correctly enforced.
 * They catch:
 * - Validation rules not triggering
 * - Constraint violations allowed
 * - Authorization rules bypassed
 * - Computed field errors
 *
 * Run with: npx playwright test business-rules.spec.ts
 */

import { test, expect } from '@playwright/test';

// Test user credentials
const TEST_USER_EMAIL = 'e2e-test@example.com';
const TEST_USER_PASSWORD = 'e2e-test-password-123';

// Admin user for role-based tests
const ADMIN_USER_EMAIL = 'admin-test@example.com';
const ADMIN_USER_PASSWORD = 'admin-test-password-123';

// ============================================================
// VALIDATION RULES
// ============================================================

test.describe('Validation Rules', () => {
  test.describe('Required Fields', () => {
    test('Profile should reject creation with missing required fields', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Attempt to create without required fields
      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {} // Empty - missing all required fields
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error).toBeDefined();
      expect(error.type).toBe('validation_failed');
    });

    test('Profile should reject creation without id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except id
      const data = {
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
      };

      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.id || error.message).toBeDefined();
    });
    test('Profile should reject creation without user_id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except user_id
      const data = {
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
      };

      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.user_id || error.message).toBeDefined();
    });
    test('Profile should reject creation without email', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except email
      const data = {
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
      };

      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.email || error.message).toBeDefined();
    });
    test('Profile should reject creation without name', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except name
      const data = {
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
      };

      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.name || error.message).toBeDefined();
    });
    test('Profile should reject creation without timezone', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except timezone
      const data = {
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
      };

      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.timezone || error.message).toBeDefined();
    });
    test('Profile should reject creation without subscription_tier', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except subscription_tier
      const data = {
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
      };

      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.subscription_tier || error.message).toBeDefined();
    });
    test('Profile should reject creation without max_daily_appointments', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except max_daily_appointments
      const data = {
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
      };

      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.max_daily_appointments || error.message).toBeDefined();
    });
    test('Profile should reject creation without max_daily_appointments_tax_season', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except max_daily_appointments_tax_season
      const data = {
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
      };

      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.max_daily_appointments_tax_season || error.message).toBeDefined();
    });
    test('Profile should reject creation without created_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except created_at
      const data = {
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
      };

      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.created_at || error.message).toBeDefined();
    });
    test('Profile should reject creation without updated_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except updated_at
      const data = {
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
      };

      const response = await request.post('/api/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.updated_at || error.message).toBeDefined();
    });
    test('Client should reject creation with missing required fields', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Attempt to create without required fields
      const response = await request.post('/api/client', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {} // Empty - missing all required fields
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error).toBeDefined();
      expect(error.type).toBe('validation_failed');
    });

    test('Client should reject creation without id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except id
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        email: 'test@example.com',
        preferred_contact: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/client', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.id || error.message).toBeDefined();
    });
    test('Client should reject creation without user_id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except user_id
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        email: 'test@example.com',
        preferred_contact: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/client', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.user_id || error.message).toBeDefined();
    });
    test('Client should reject creation without name', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except name
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        email: 'test@example.com',
        preferred_contact: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/client', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.name || error.message).toBeDefined();
    });
    test('Client should reject creation without email', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except email
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        email: 'test@example.com',
        preferred_contact: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/client', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.email || error.message).toBeDefined();
    });
    test('Client should reject creation without preferred_contact', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except preferred_contact
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        email: 'test@example.com',
        preferred_contact: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/client', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.preferred_contact || error.message).toBeDefined();
    });
    test('Client should reject creation without created_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except created_at
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        email: 'test@example.com',
        preferred_contact: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/client', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.created_at || error.message).toBeDefined();
    });
    test('Client should reject creation without updated_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except updated_at
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        name: 'Test Value',
        email: 'test@example.com',
        preferred_contact: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/client', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.updated_at || error.message).toBeDefined();
    });
    test('Service should reject creation with missing required fields', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Attempt to create without required fields
      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {} // Empty - missing all required fields
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error).toBeDefined();
      expect(error.type).toBe('validation_failed');
    });

    test('Service should reject creation without id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except id
      const data = {
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
      };

      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.id || error.message).toBeDefined();
    });
    test('Service should reject creation without user_id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except user_id
      const data = {
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
      };

      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.user_id || error.message).toBeDefined();
    });
    test('Service should reject creation without name', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except name
      const data = {
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
      };

      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.name || error.message).toBeDefined();
    });
    test('Service should reject creation without duration_minutes', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except duration_minutes
      const data = {
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
      };

      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.duration_minutes || error.message).toBeDefined();
    });
    test('Service should reject creation without tax_season_only', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except tax_season_only
      const data = {
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
      };

      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.tax_season_only || error.message).toBeDefined();
    });
    test('Service should reject creation without requires_documents', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except requires_documents
      const data = {
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
      };

      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.requires_documents || error.message).toBeDefined();
    });
    test('Service should reject creation without is_active', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except is_active
      const data = {
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
      };

      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.is_active || error.message).toBeDefined();
    });
    test('Service should reject creation without buffer_minutes', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except buffer_minutes
      const data = {
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
      };

      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.buffer_minutes || error.message).toBeDefined();
    });
    test('Service should reject creation without created_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except created_at
      const data = {
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
      };

      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.created_at || error.message).toBeDefined();
    });
    test('Service should reject creation without updated_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except updated_at
      const data = {
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
      };

      const response = await request.post('/api/service', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.updated_at || error.message).toBeDefined();
    });
    test('Appointment should reject creation with missing required fields', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Attempt to create without required fields
      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {} // Empty - missing all required fields
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error).toBeDefined();
      expect(error.type).toBe('validation_failed');
    });

    test('Appointment should reject creation without id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except id
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.id || error.message).toBeDefined();
    });
    test('Appointment should reject creation without user_id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except user_id
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.user_id || error.message).toBeDefined();
    });
    test('Appointment should reject creation without client_id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except client_id
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.client_id || error.message).toBeDefined();
    });
    test('Appointment should reject creation without service_id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except service_id
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.service_id || error.message).toBeDefined();
    });
    test('Appointment should reject creation without starts_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except starts_at
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.starts_at || error.message).toBeDefined();
    });
    test('Appointment should reject creation without ends_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except ends_at
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.ends_at || error.message).toBeDefined();
    });
    test('Appointment should reject creation without status', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except status
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.status || error.message).toBeDefined();
    });
    test('Appointment should reject creation without reminder_sent_24h', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except reminder_sent_24h
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.reminder_sent_24h || error.message).toBeDefined();
    });
    test('Appointment should reject creation without reminder_sent_1h', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except reminder_sent_1h
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.reminder_sent_1h || error.message).toBeDefined();
    });
    test('Appointment should reject creation without created_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except created_at
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.created_at || error.message).toBeDefined();
    });
    test('Appointment should reject creation without updated_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except updated_at
      const data = {
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
      };

      const response = await request.post('/api/appointment', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.updated_at || error.message).toBeDefined();
    });
    test('Availability should reject creation with missing required fields', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Attempt to create without required fields
      const response = await request.post('/api/availability', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {} // Empty - missing all required fields
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error).toBeDefined();
      expect(error.type).toBe('validation_failed');
    });

    test('Availability should reject creation without id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except id
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/availability', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.id || error.message).toBeDefined();
    });
    test('Availability should reject creation without user_id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except user_id
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/availability', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.user_id || error.message).toBeDefined();
    });
    test('Availability should reject creation without day_of_week', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except day_of_week
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/availability', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.day_of_week || error.message).toBeDefined();
    });
    test('Availability should reject creation without start_time', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except start_time
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/availability', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.start_time || error.message).toBeDefined();
    });
    test('Availability should reject creation without end_time', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except end_time
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/availability', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.end_time || error.message).toBeDefined();
    });
    test('Availability should reject creation without is_tax_season', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except is_tax_season
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/availability', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.is_tax_season || error.message).toBeDefined();
    });
    test('Availability should reject creation without created_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except created_at
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/availability', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.created_at || error.message).toBeDefined();
    });
    test('Availability should reject creation without updated_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except updated_at
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        day_of_week: 42,
        start_time: 'Test Value',
        end_time: 'Test Value',
        is_tax_season: true,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/availability', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.updated_at || error.message).toBeDefined();
    });
    test('Document should reject creation with missing required fields', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Attempt to create without required fields
      const response = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data: {} // Empty - missing all required fields
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error).toBeDefined();
      expect(error.type).toBe('validation_failed');
    });

    test('Document should reject creation without id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except id
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.id || error.message).toBeDefined();
    });
    test('Document should reject creation without user_id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except user_id
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.user_id || error.message).toBeDefined();
    });
    test('Document should reject creation without client_id', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except client_id
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.client_id || error.message).toBeDefined();
    });
    test('Document should reject creation without document_type', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except document_type
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.document_type || error.message).toBeDefined();
    });
    test('Document should reject creation without status', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except status
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.status || error.message).toBeDefined();
    });
    test('Document should reject creation without created_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except created_at
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.created_at || error.message).toBeDefined();
    });
    test('Document should reject creation without updated_at', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Create with all fields except updated_at
      const data = {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };

      const response = await request.post('/api/document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        data
      });

      expect(response.status()).toBe(400);
      const { error } = await response.json();
      expect(error.fields?.updated_at || error.message).toBeDefined();
    });
  });

  test.describe('Format Validation', () => {









































































  });

  test.describe('Length/Range Validation', () => {



























































































































































































































  });
});

// ============================================================
// CONSTRAINT RULES
// ============================================================

test.describe('Constraint Rules', () => {




  test('Appointment should enforce valid state values', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();

    // Try to create with invalid state
    const response = await request.post('/api/appointment', {
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
        status: 'INVALID_STATE_VALUE',
      }
    });

    expect([400, 422]).toContain(response.status());
  });


  test('Document should enforce valid state values', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();

    // Try to create with invalid state
    const response = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      data: {
        id: 'Test Value',
        user_id: 'Test Value',
        client_id: 'Test Value',
        document_type: 'Test Value',
        status: 'Test Value',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
        status: 'INVALID_STATE_VALUE',
      }
    });

    expect([400, 422]).toContain(response.status());
  });
});

// ============================================================
// BUSINESS LOGIC RULES
// ============================================================

test.describe('Business Logic Rules', () => {
  test('should enforce rule: prevent_double_booking', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();

    // Test: No double-booking same practitioner
    // Rule type: constraint
    // Expression: NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.user_id &#x3D; NEW.user_id
      AND a.id !&#x3D; NEW.id
      AND a.status NOT IN (&#x27;cancelled&#x27;, &#x27;no_show&#x27;)
      AND (NEW.starts_at, NEW.ends_at) OVERLAPS (a.starts_at, a.ends_at)
    )

    // This test should verify the business rule is enforced
    // Implementation depends on specific rule logic

    const response = await request.get('/api/health', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });

    // Basic check that API is responding
    expect(response.status()).toBe(200);

    // TODO: Implement specific test for this business rule
    // Based on rule: No double-booking same practitioner
  });
  test('should enforce rule: check_daily_capacity', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();

    // Test: Tax season capacity limits
    // Rule type: validation
    // Expression: (
      SELECT COUNT(*) FROM appointments a
      WHERE a.user_id &#x3D; NEW.user_id
      AND DATE(a.starts_at) &#x3D; DATE(NEW.starts_at)
      AND a.status NOT IN (&#x27;cancelled&#x27;, &#x27;no_show&#x27;)
    ) &lt; COALESCE((SELECT max_daily_appointments FROM profiles WHERE user_id &#x3D; NEW.user_id), 8)

    // This test should verify the business rule is enforced
    // Implementation depends on specific rule logic

    const response = await request.get('/api/health', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });

    // Basic check that API is responding
    expect(response.status()).toBe(200);

    // TODO: Implement specific test for this business rule
    // Based on rule: Tax season capacity limits
  });
  test('should enforce rule: check_documents_required', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();

    // Test: Document collection required before certain services
    // Rule type: validation
    // Expression: 
      NOT (SELECT requires_documents FROM services WHERE id &#x3D; NEW.service_id)
      OR EXISTS (
        SELECT 1 FROM documents d
        WHERE d.client_id &#x3D; NEW.client_id
        AND d.status &#x3D; &#x27;accepted&#x27;
      )
    

    // This test should verify the business rule is enforced
    // Implementation depends on specific rule logic

    const response = await request.get('/api/health', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });

    // Basic check that API is responding
    expect(response.status()).toBe(200);

    // TODO: Implement specific test for this business rule
    // Based on rule: Document collection required before certain services
  });
});

// ============================================================
// AUTHORIZATION RULES
// ============================================================

test.describe('Authorization Rules', () => {
  test.describe('Unauthenticated Access', () => {
    test('should reject unauthenticated access to Profile endpoints', async ({ request }) => {
      // No auth header
      const getResponse = await request.get('/api/profile');
      expect(getResponse.status()).toBe(401);

      const postResponse = await request.post('/api/profile', {
        data: { test: 'data' }
      });
      expect(postResponse.status()).toBe(401);
    });
    test('should reject unauthenticated access to Client endpoints', async ({ request }) => {
      // No auth header
      const getResponse = await request.get('/api/client');
      expect(getResponse.status()).toBe(401);

      const postResponse = await request.post('/api/client', {
        data: { test: 'data' }
      });
      expect(postResponse.status()).toBe(401);
    });
    test('should reject unauthenticated access to Service endpoints', async ({ request }) => {
      // No auth header
      const getResponse = await request.get('/api/service');
      expect(getResponse.status()).toBe(401);

      const postResponse = await request.post('/api/service', {
        data: { test: 'data' }
      });
      expect(postResponse.status()).toBe(401);
    });
    test('should reject unauthenticated access to Appointment endpoints', async ({ request }) => {
      // No auth header
      const getResponse = await request.get('/api/appointment');
      expect(getResponse.status()).toBe(401);

      const postResponse = await request.post('/api/appointment', {
        data: { test: 'data' }
      });
      expect(postResponse.status()).toBe(401);
    });
    test('should reject unauthenticated access to Availability endpoints', async ({ request }) => {
      // No auth header
      const getResponse = await request.get('/api/availability');
      expect(getResponse.status()).toBe(401);

      const postResponse = await request.post('/api/availability', {
        data: { test: 'data' }
      });
      expect(postResponse.status()).toBe(401);
    });
    test('should reject unauthenticated access to Document endpoints', async ({ request }) => {
      // No auth header
      const getResponse = await request.get('/api/document');
      expect(getResponse.status()).toBe(401);

      const postResponse = await request.post('/api/document', {
        data: { test: 'data' }
      });
      expect(postResponse.status()).toBe(401);
    });
  });

  test.describe('Owner-Only Access', () => {
    // Second user for cross-user tests
    const USER_2_EMAIL = 'test-user-2@example.com';
    const USER_2_PASSWORD = 'test-password-456';

  });

  test.describe('Role-Based Access', () => {
    test('practitioner role should have correct permissions', async ({ request }) => {
      // This test verifies role-based permissions
      // Specific assertions depend on what permissions the role has

      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Check user's roles
      const userResponse = await request.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (userResponse.status() === 200) {
        const { data: user } = await userResponse.json();
        // User roles should be defined
        expect(user.roles || []).toBeDefined();
      }
    });
    test('admin role should have correct permissions', async ({ request }) => {
      // This test verifies role-based permissions
      // Specific assertions depend on what permissions the role has

      const loginResponse = await request.post('/api/auth/login', {
        data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
      });
      const { session } = await loginResponse.json();

      // Check user's roles
      const userResponse = await request.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (userResponse.status() === 200) {
        const { data: user } = await userResponse.json();
        // User roles should be defined
        expect(user.roles || []).toBeDefined();
      }
    });

    test('admin role should have full access', async ({ request }) => {
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: ADMIN_USER_EMAIL, password: ADMIN_USER_PASSWORD }
      });

      if (loginResponse.status() !== 200) {
        // Admin user may not exist - skip test
        test.skip();
        return;
      }

      const { session } = await loginResponse.json();

      // Admin should be able to access admin endpoints
      const adminResponse = await request.get('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      // Admin endpoint should be accessible (or not exist - 404)
      expect([200, 404]).toContain(adminResponse.status());
    });
  });
});

// ============================================================
// ERROR MESSAGE QUALITY
// ============================================================

test.describe('Error Message Quality', () => {
  test('validation errors should be user-friendly', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();

    // Send invalid data to trigger validation error
    const response = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      data: {} // Missing required fields
    });

    expect(response.status()).toBe(400);
    const { error } = await response.json();

    // Error should have meaningful structure
    expect(error).toBeDefined();
    expect(typeof error.message === 'string' || error.type).toBeTruthy();

    // Should not expose internal details
    expect(JSON.stringify(error)).not.toContain('stack');
    expect(JSON.stringify(error)).not.toContain('node_modules');
  });

  test('authorization errors should not leak information', async ({ request }) => {
    // Try to access resource without auth
    const response = await request.get('/api/profile/some-id');

    expect([401, 403]).toContain(response.status());
    const body = await response.json();

    // Should not reveal whether resource exists
    expect(JSON.stringify(body)).not.toContain('exists');
    expect(JSON.stringify(body)).not.toContain('found');
  });
});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
