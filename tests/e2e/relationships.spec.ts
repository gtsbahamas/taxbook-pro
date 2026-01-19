/**
 * Relationship & Foreign Key Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * These tests verify:
 * - Foreign key constraints are enforced
 * - Cascade behaviors work correctly
 * - Orphan prevention is active
 * - Relationship queries return correct data
 *
 * Run with: npx playwright test tests/relationships.spec.ts
 */

import { test, expect } from '@playwright/test';

// Test user credentials
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'e2e-test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'e2e-test-password-123';

let authToken: string;

test.beforeAll(async ({ request }) => {
  // Login once for all relationship tests
  const loginResponse = await request.post('/api/auth/login', {
    data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
  });
  if (loginResponse.ok()) {
    const { session } = await loginResponse.json();
    authToken = session?.access_token || '';
  }
});

// ============================================================
// FOREIGN KEY CONSTRAINT TESTS
// ============================================================

test.describe('Foreign Key Constraints', () => {
  test('Client.user_id should reject invalid Profile reference', async ({ request }) => {
    // Attempt to create Client with non-existent Profile ID
    const response = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'FK Test Item', // Common required field
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Service.user_id should reject invalid Profile reference', async ({ request }) => {
    // Attempt to create Service with non-existent Profile ID
    const response = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'FK Test Item', // Common required field
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Appointment.user_id should reject invalid Profile reference', async ({ request }) => {
    // Attempt to create Appointment with non-existent Profile ID
    const response = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'FK Test Item', // Common required field
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Appointment.client_id should reject invalid Client reference', async ({ request }) => {
    // Attempt to create Appointment with non-existent Client ID
    const response = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        client_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'FK Test Item', // Common required field
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Appointment.service_id should reject invalid Service reference', async ({ request }) => {
    // Attempt to create Appointment with non-existent Service ID
    const response = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        service_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'FK Test Item', // Common required field
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Availability.user_id should reject invalid Profile reference', async ({ request }) => {
    // Attempt to create Availability with non-existent Profile ID
    const response = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'FK Test Item', // Common required field
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Document.user_id should reject invalid Profile reference', async ({ request }) => {
    // Attempt to create Document with non-existent Profile ID
    const response = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'FK Test Item', // Common required field
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Document.client_id should reject invalid Client reference', async ({ request }) => {
    // Attempt to create Document with non-existent Client ID
    const response = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        client_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'FK Test Item', // Common required field
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Document.appointment_id should reject invalid Appointment reference', async ({ request }) => {
    // Attempt to create Document with non-existent Appointment ID
    const response = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        appointment_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        name: 'FK Test Item', // Common required field
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

});

// ============================================================
// CASCADE DELETE TESTS
// ============================================================

test.describe('Cascade Delete Behavior', () => {
  test('deleting Profile should cascade delete related Client', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Cascade Parent Test',
        description: 'Test parent for cascade delete',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Client) linked to parent
    const childResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Cascade Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Delete parent
    await request.delete(`/api/profile/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Child should also be deleted (or soft deleted)
    const verifyResponse = await request.get(`/api/client/${child.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Either 404 (hard delete) or has deleted_at (soft delete)
    if (verifyResponse.status() === 200) {
      const { data } = await verifyResponse.json();
      expect(data.deleted_at).toBeDefined();
    } else {
      expect(verifyResponse.status()).toBe(404);
    }
  });

  test('deleting Profile should cascade delete related Service', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Cascade Parent Test',
        description: 'Test parent for cascade delete',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Service) linked to parent
    const childResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Cascade Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Delete parent
    await request.delete(`/api/profile/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Child should also be deleted (or soft deleted)
    const verifyResponse = await request.get(`/api/service/${child.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Either 404 (hard delete) or has deleted_at (soft delete)
    if (verifyResponse.status() === 200) {
      const { data } = await verifyResponse.json();
      expect(data.deleted_at).toBeDefined();
    } else {
      expect(verifyResponse.status()).toBe(404);
    }
  });

  test('deleting Profile should cascade delete related Appointment', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Cascade Parent Test',
        description: 'Test parent for cascade delete',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Appointment) linked to parent
    const childResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Cascade Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Delete parent
    await request.delete(`/api/profile/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Child should also be deleted (or soft deleted)
    const verifyResponse = await request.get(`/api/appointment/${child.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Either 404 (hard delete) or has deleted_at (soft delete)
    if (verifyResponse.status() === 200) {
      const { data } = await verifyResponse.json();
      expect(data.deleted_at).toBeDefined();
    } else {
      expect(verifyResponse.status()).toBe(404);
    }
  });

  test('deleting Client should cascade delete related Appointment', async ({ request }) => {
    // Create parent (Client)
    const parentResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Cascade Parent Test',
        description: 'Test parent for cascade delete',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Appointment) linked to parent
    const childResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        client_id: parent.id,
        name: 'Cascade Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Delete parent
    await request.delete(`/api/client/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Child should also be deleted (or soft deleted)
    const verifyResponse = await request.get(`/api/appointment/${child.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Either 404 (hard delete) or has deleted_at (soft delete)
    if (verifyResponse.status() === 200) {
      const { data } = await verifyResponse.json();
      expect(data.deleted_at).toBeDefined();
    } else {
      expect(verifyResponse.status()).toBe(404);
    }
  });

  test('deleting Service should cascade delete related Appointment', async ({ request }) => {
    // Create parent (Service)
    const parentResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Cascade Parent Test',
        description: 'Test parent for cascade delete',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Appointment) linked to parent
    const childResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        service_id: parent.id,
        name: 'Cascade Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Delete parent
    await request.delete(`/api/service/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Child should also be deleted (or soft deleted)
    const verifyResponse = await request.get(`/api/appointment/${child.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Either 404 (hard delete) or has deleted_at (soft delete)
    if (verifyResponse.status() === 200) {
      const { data } = await verifyResponse.json();
      expect(data.deleted_at).toBeDefined();
    } else {
      expect(verifyResponse.status()).toBe(404);
    }
  });

  test('deleting Profile should cascade delete related Availability', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Cascade Parent Test',
        description: 'Test parent for cascade delete',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Availability) linked to parent
    const childResponse = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Cascade Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Delete parent
    await request.delete(`/api/profile/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Child should also be deleted (or soft deleted)
    const verifyResponse = await request.get(`/api/availability/${child.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Either 404 (hard delete) or has deleted_at (soft delete)
    if (verifyResponse.status() === 200) {
      const { data } = await verifyResponse.json();
      expect(data.deleted_at).toBeDefined();
    } else {
      expect(verifyResponse.status()).toBe(404);
    }
  });

  test('deleting Profile should cascade delete related Document', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Cascade Parent Test',
        description: 'Test parent for cascade delete',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Document) linked to parent
    const childResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Cascade Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Delete parent
    await request.delete(`/api/profile/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Child should also be deleted (or soft deleted)
    const verifyResponse = await request.get(`/api/document/${child.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Either 404 (hard delete) or has deleted_at (soft delete)
    if (verifyResponse.status() === 200) {
      const { data } = await verifyResponse.json();
      expect(data.deleted_at).toBeDefined();
    } else {
      expect(verifyResponse.status()).toBe(404);
    }
  });

  test('deleting Client should cascade delete related Document', async ({ request }) => {
    // Create parent (Client)
    const parentResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Cascade Parent Test',
        description: 'Test parent for cascade delete',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Document) linked to parent
    const childResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        client_id: parent.id,
        name: 'Cascade Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Delete parent
    await request.delete(`/api/client/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Child should also be deleted (or soft deleted)
    const verifyResponse = await request.get(`/api/document/${child.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Either 404 (hard delete) or has deleted_at (soft delete)
    if (verifyResponse.status() === 200) {
      const { data } = await verifyResponse.json();
      expect(data.deleted_at).toBeDefined();
    } else {
      expect(verifyResponse.status()).toBe(404);
    }
  });

  test('deleting Appointment should cascade delete related Document', async ({ request }) => {
    // Create parent (Appointment)
    const parentResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Cascade Parent Test',
        description: 'Test parent for cascade delete',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Document) linked to parent
    const childResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        appointment_id: parent.id,
        name: 'Cascade Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Delete parent
    await request.delete(`/api/appointment/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Child should also be deleted (or soft deleted)
    const verifyResponse = await request.get(`/api/document/${child.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Either 404 (hard delete) or has deleted_at (soft delete)
    if (verifyResponse.status() === 200) {
      const { data } = await verifyResponse.json();
      expect(data.deleted_at).toBeDefined();
    } else {
      expect(verifyResponse.status()).toBe(404);
    }
  });

});

// ============================================================
// RESTRICT DELETE TESTS
// ============================================================

test.describe('Restrict Delete Behavior', () => {
});

// ============================================================
// RELATIONSHIP QUERY TESTS
// ============================================================

test.describe('Relationship Queries', () => {
  test('should include Client when querying Profile with include', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Query Parent Test',
        description: 'Test parent for relationship query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Client) linked to parent
    const childResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Query Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    // Query parent with include
    const queryResponse = await request.get(`/api/profile/${parent.id}?include=client`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Client
    expect(data.client).toBeDefined();
  });

  test('should include Profile when querying Client', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Include Parent Test',
        description: 'Test parent for include query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Client) linked to parent
    const childResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Include Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/client/${child.id}?include=profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Profile
    expect(data.profile).toBeDefined();
    expect(data.profile.id).toBe(parent.id);
  });

  test('should include Service when querying Profile with include', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Query Parent Test',
        description: 'Test parent for relationship query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Service) linked to parent
    const childResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Query Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    // Query parent with include
    const queryResponse = await request.get(`/api/profile/${parent.id}?include=service`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Service
    expect(data.service).toBeDefined();
  });

  test('should include Profile when querying Service', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Include Parent Test',
        description: 'Test parent for include query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Service) linked to parent
    const childResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Include Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/service/${child.id}?include=profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Profile
    expect(data.profile).toBeDefined();
    expect(data.profile.id).toBe(parent.id);
  });

  test('should include Appointment when querying Profile with include', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Query Parent Test',
        description: 'Test parent for relationship query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Appointment) linked to parent
    const childResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Query Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    // Query parent with include
    const queryResponse = await request.get(`/api/profile/${parent.id}?include=appointment`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Appointment
    expect(data.appointment).toBeDefined();
  });

  test('should include Profile when querying Appointment', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Include Parent Test',
        description: 'Test parent for include query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Appointment) linked to parent
    const childResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Include Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/appointment/${child.id}?include=profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Profile
    expect(data.profile).toBeDefined();
    expect(data.profile.id).toBe(parent.id);
  });

  test('should include Appointment when querying Client with include', async ({ request }) => {
    // Create parent (Client)
    const parentResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Query Parent Test',
        description: 'Test parent for relationship query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Appointment) linked to parent
    const childResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        client_id: parent.id,
        name: 'Query Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    // Query parent with include
    const queryResponse = await request.get(`/api/client/${parent.id}?include=appointment`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Appointment
    expect(data.appointment).toBeDefined();
  });

  test('should include Client when querying Appointment', async ({ request }) => {
    // Create parent (Client)
    const parentResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Include Parent Test',
        description: 'Test parent for include query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Appointment) linked to parent
    const childResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        client_id: parent.id,
        name: 'Include Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/appointment/${child.id}?include=client`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Client
    expect(data.client).toBeDefined();
    expect(data.client.id).toBe(parent.id);
  });

  test('should include Appointment when querying Service with include', async ({ request }) => {
    // Create parent (Service)
    const parentResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Query Parent Test',
        description: 'Test parent for relationship query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Appointment) linked to parent
    const childResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        service_id: parent.id,
        name: 'Query Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    // Query parent with include
    const queryResponse = await request.get(`/api/service/${parent.id}?include=appointment`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Appointment
    expect(data.appointment).toBeDefined();
  });

  test('should include Service when querying Appointment', async ({ request }) => {
    // Create parent (Service)
    const parentResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Include Parent Test',
        description: 'Test parent for include query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Appointment) linked to parent
    const childResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        service_id: parent.id,
        name: 'Include Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/appointment/${child.id}?include=service`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Service
    expect(data.service).toBeDefined();
    expect(data.service.id).toBe(parent.id);
  });

  test('should include Availability when querying Profile with include', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Query Parent Test',
        description: 'Test parent for relationship query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Availability) linked to parent
    const childResponse = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Query Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    // Query parent with include
    const queryResponse = await request.get(`/api/profile/${parent.id}?include=availability`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Availability
    expect(data.availability).toBeDefined();
  });

  test('should include Profile when querying Availability', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Include Parent Test',
        description: 'Test parent for include query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Availability) linked to parent
    const childResponse = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Include Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/availability/${child.id}?include=profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Profile
    expect(data.profile).toBeDefined();
    expect(data.profile.id).toBe(parent.id);
  });

  test('should include Document when querying Profile with include', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Query Parent Test',
        description: 'Test parent for relationship query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Document) linked to parent
    const childResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Query Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    // Query parent with include
    const queryResponse = await request.get(`/api/profile/${parent.id}?include=document`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Document
    expect(data.document).toBeDefined();
  });

  test('should include Profile when querying Document', async ({ request }) => {
    // Create parent (Profile)
    const parentResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Include Parent Test',
        description: 'Test parent for include query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Document) linked to parent
    const childResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        user_id: parent.id,
        name: 'Include Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/document/${child.id}?include=profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Profile
    expect(data.profile).toBeDefined();
    expect(data.profile.id).toBe(parent.id);
  });

  test('should include Document when querying Client with include', async ({ request }) => {
    // Create parent (Client)
    const parentResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Query Parent Test',
        description: 'Test parent for relationship query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Document) linked to parent
    const childResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        client_id: parent.id,
        name: 'Query Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    // Query parent with include
    const queryResponse = await request.get(`/api/client/${parent.id}?include=document`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Document
    expect(data.document).toBeDefined();
  });

  test('should include Client when querying Document', async ({ request }) => {
    // Create parent (Client)
    const parentResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Include Parent Test',
        description: 'Test parent for include query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Document) linked to parent
    const childResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        client_id: parent.id,
        name: 'Include Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/document/${child.id}?include=client`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Client
    expect(data.client).toBeDefined();
    expect(data.client.id).toBe(parent.id);
  });

  test('should include Document when querying Appointment with include', async ({ request }) => {
    // Create parent (Appointment)
    const parentResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Query Parent Test',
        description: 'Test parent for relationship query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Document) linked to parent
    const childResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        appointment_id: parent.id,
        name: 'Query Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    // Query parent with include
    const queryResponse = await request.get(`/api/appointment/${parent.id}?include=document`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Document
    expect(data.document).toBeDefined();
  });

  test('should include Appointment when querying Document', async ({ request }) => {
    // Create parent (Appointment)
    const parentResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Include Parent Test',
        description: 'Test parent for include query',
      }
    });

    if (!parentResponse.ok()) {
      test.skip();
      return;
    }

    const { data: parent } = await parentResponse.json();

    // Create child (Document) linked to parent
    const childResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        appointment_id: parent.id,
        name: 'Include Child Test',
      }
    });

    if (!childResponse.ok()) {
      test.skip();
      return;
    }

    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/document/${child.id}?include=appointment`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Appointment
    expect(data.appointment).toBeDefined();
    expect(data.appointment.id).toBe(parent.id);
  });

});

// ============================================================
// ORPHAN PREVENTION TESTS
// ============================================================

test.describe('Orphan Prevention', () => {
  test('Client should require user_id (no orphans)', async ({ request }) => {
    // Attempt to create Client without user_id
    const response = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        // Missing user_id - should fail validation
        name: 'Orphan Test Item',
      }
    });

    // Should be rejected (400 validation error)
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Service should require user_id (no orphans)', async ({ request }) => {
    // Attempt to create Service without user_id
    const response = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        // Missing user_id - should fail validation
        name: 'Orphan Test Item',
      }
    });

    // Should be rejected (400 validation error)
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Appointment should require user_id (no orphans)', async ({ request }) => {
    // Attempt to create Appointment without user_id
    const response = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        // Missing user_id - should fail validation
        name: 'Orphan Test Item',
      }
    });

    // Should be rejected (400 validation error)
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Appointment should require client_id (no orphans)', async ({ request }) => {
    // Attempt to create Appointment without client_id
    const response = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        // Missing client_id - should fail validation
        name: 'Orphan Test Item',
      }
    });

    // Should be rejected (400 validation error)
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Appointment should require service_id (no orphans)', async ({ request }) => {
    // Attempt to create Appointment without service_id
    const response = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        // Missing service_id - should fail validation
        name: 'Orphan Test Item',
      }
    });

    // Should be rejected (400 validation error)
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Availability should require user_id (no orphans)', async ({ request }) => {
    // Attempt to create Availability without user_id
    const response = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        // Missing user_id - should fail validation
        name: 'Orphan Test Item',
      }
    });

    // Should be rejected (400 validation error)
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Document should require user_id (no orphans)', async ({ request }) => {
    // Attempt to create Document without user_id
    const response = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        // Missing user_id - should fail validation
        name: 'Orphan Test Item',
      }
    });

    // Should be rejected (400 validation error)
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Document should require client_id (no orphans)', async ({ request }) => {
    // Attempt to create Document without client_id
    const response = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        // Missing client_id - should fail validation
        name: 'Orphan Test Item',
      }
    });

    // Should be rejected (400 validation error)
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Document should require appointment_id (no orphans)', async ({ request }) => {
    // Attempt to create Document without appointment_id
    const response = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        // Missing appointment_id - should fail validation
        name: 'Orphan Test Item',
      }
    });

    // Should be rejected (400 validation error)
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
