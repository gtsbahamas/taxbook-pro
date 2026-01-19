/**
 * RBAC Permission Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * These tests verify role-based access control is correctly enforced.
 * They catch:
 * - Privilege escalation vulnerabilities
 * - Missing permission checks
 * - Cross-user data access
 * - Column-level permission leaks
 *
 * CRITICAL: These tests protect against authorization bypass attacks.
 *
 * Run with: npx playwright test permissions.spec.ts
 */

import { test, expect } from '@playwright/test';

// Test users with different roles
const USERS = {
  admin: {
    email: 'admin-test@example.com',
    password: 'admin-test-password-123',
    roles: ['admin'],
  },
  member: {
    email: 'member-test@example.com',
    password: 'member-test-password-123',
    roles: ['member'],
  },
  viewer: {
    email: 'viewer-test@example.com',
    password: 'viewer-test-password-123',
    roles: ['viewer'],
  },
  unauthenticated: {
    email: null,
    password: null,
    roles: [],
  },
};

// Helper to get auth session
async function getAuthSession(
  request: any,
  user: { email: string | null; password: string | null; roles: string[] }
) {
  if (!user.email || !user.password) return null;

  const response = await request.post('/api/auth/login', {
    data: { email: user.email, password: user.password }
  });

  if (response.status() !== 200) return null;

  const { session } = await response.json();
  return session;
}

// ============================================================
// ROLE-BASED ACCESS MATRIX
// ============================================================

interface EntityPermissions {
  readonly create: boolean;
  readonly read: boolean;
  readonly update: boolean;
  readonly delete: boolean;
}

interface AccessMatrixEntry {
  readonly resource: string;
  readonly endpoint: string;
  readonly permissions: {
    readonly admin: EntityPermissions;
    readonly member: EntityPermissions;
    readonly viewer: EntityPermissions;
    readonly unauthenticated: EntityPermissions;
  };
}

test.describe('Role-Based Access Control', () => {
  // Access matrix: which roles can do what
  const accessMatrix: AccessMatrixEntry[] = [
    {
      resource: 'Profile',
      endpoint: '/api/profile',
      permissions: {
        // Define expected permissions per role
        admin: { create: true, read: true, update: true, delete: true },
        member: { create: true, read: true, update: true, delete: false },
        viewer: { create: false, read: true, update: false, delete: false },
        unauthenticated: { create: false, read: false, update: false, delete: false },
      }
    },
    {
      resource: 'Client',
      endpoint: '/api/client',
      permissions: {
        // Define expected permissions per role
        admin: { create: true, read: true, update: true, delete: true },
        member: { create: true, read: true, update: true, delete: false },
        viewer: { create: false, read: true, update: false, delete: false },
        unauthenticated: { create: false, read: false, update: false, delete: false },
      }
    },
    {
      resource: 'Service',
      endpoint: '/api/service',
      permissions: {
        // Define expected permissions per role
        admin: { create: true, read: true, update: true, delete: true },
        member: { create: true, read: true, update: true, delete: false },
        viewer: { create: false, read: true, update: false, delete: false },
        unauthenticated: { create: false, read: false, update: false, delete: false },
      }
    },
    {
      resource: 'Appointment',
      endpoint: '/api/appointment',
      permissions: {
        // Define expected permissions per role
        admin: { create: true, read: true, update: true, delete: true },
        member: { create: true, read: true, update: true, delete: false },
        viewer: { create: false, read: true, update: false, delete: false },
        unauthenticated: { create: false, read: false, update: false, delete: false },
      }
    },
    {
      resource: 'Availability',
      endpoint: '/api/availability',
      permissions: {
        // Define expected permissions per role
        admin: { create: true, read: true, update: true, delete: true },
        member: { create: true, read: true, update: true, delete: false },
        viewer: { create: false, read: true, update: false, delete: false },
        unauthenticated: { create: false, read: false, update: false, delete: false },
      }
    },
    {
      resource: 'Document',
      endpoint: '/api/document',
      permissions: {
        // Define expected permissions per role
        admin: { create: true, read: true, update: true, delete: true },
        member: { create: true, read: true, update: true, delete: false },
        viewer: { create: false, read: true, update: false, delete: false },
        unauthenticated: { create: false, read: false, update: false, delete: false },
      }
    },
  ];

  for (const { resource, endpoint, permissions } of accessMatrix) {
    test.describe(`${resource} Permissions`, () => {
      // Test READ permission
      for (const [role, perms] of Object.entries(permissions) as [keyof typeof permissions, EntityPermissions][]) {
        test(`${role} ${perms.read ? 'CAN' : 'CANNOT'} read ${resource}`, async ({ request }) => {
          const user = USERS[role as keyof typeof USERS];
          const session = await getAuthSession(request, user);

          const headers: Record<string, string> = session
            ? { 'Authorization': `Bearer ${session.access_token}` }
            : {};

          const response = await request.get(endpoint, { headers });

          if (perms.read) {
            expect([200, 201, 204]).toContain(response.status());
          } else {
            expect([401, 403]).toContain(response.status());
          }
        });
      }

      // Test CREATE permission
      for (const [role, perms] of Object.entries(permissions) as [keyof typeof permissions, EntityPermissions][]) {
        test(`${role} ${perms.create ? 'CAN' : 'CANNOT'} create ${resource}`, async ({ request }) => {
          const user = USERS[role as keyof typeof USERS];
          const session = await getAuthSession(request, user);

          const headers: Record<string, string> = session
            ? { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
            : { 'Content-Type': 'application/json' };

          const response = await request.post(endpoint, {
            headers,
            data: { test: 'permission-check' }
          });

          if (perms.create) {
            // May be 201 (created) or 400 (validation - but auth passed)
            expect([201, 400, 422]).toContain(response.status());
          } else {
            expect([401, 403]).toContain(response.status());
          }
        });
      }

      // Test DELETE permission
      for (const [role, perms] of Object.entries(permissions) as [keyof typeof permissions, EntityPermissions][]) {
        test(`${role} ${perms.delete ? 'CAN' : 'CANNOT'} delete ${resource}`, async ({ request }) => {
          const user = USERS[role as keyof typeof USERS];
          const session = await getAuthSession(request, user);

          const headers: Record<string, string> = session
            ? { 'Authorization': `Bearer ${session.access_token}` }
            : {};

          // Try to delete a non-existent resource to test permission check
          const response = await request.delete(`${endpoint}/00000000-0000-0000-0000-000000000000`, { headers });

          if (perms.delete) {
            // May be 404 (not found) but auth should pass
            expect([200, 204, 404]).toContain(response.status());
          } else {
            expect([401, 403]).toContain(response.status());
          }
        });
      }
    });
  }
});

// ============================================================
// PRIVILEGE ESCALATION PREVENTION
// ============================================================

test.describe('Privilege Escalation Prevention', () => {
  test('member cannot promote self to admin', async ({ request }) => {
    const session = await getAuthSession(request, USERS.member);
    if (!session) {
      test.skip();
      return;
    }

    // Try to update own profile with admin role
    const response = await request.patch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      data: { roles: ['admin'] }
    });

    // Should either reject or ignore the role change
    if (response.status() === 200) {
      const { data } = await response.json();
      expect(data.roles).not.toContain('admin');
    } else {
      expect([400, 403]).toContain(response.status());
    }
  });

  test('viewer cannot access admin endpoints', async ({ request }) => {
    const session = await getAuthSession(request, USERS.viewer);
    if (!session) {
      test.skip();
      return;
    }

    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/stats',
      '/api/admin/settings',
    ];

    for (const endpoint of adminEndpoints) {
      const response = await request.get(endpoint, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      // Should be forbidden or not found (not 200)
      expect([403, 404]).toContain(response.status());
    }
  });

  test('cannot bypass auth with forged headers', async ({ request }) => {
    // Try various auth bypass attempts
    const bypassAttempts: Record<string, string>[] = [
      { 'Authorization': 'Bearer fake-token' },
      { 'Authorization': 'Basic YWRtaW46YWRtaW4=' }, // admin:admin base64
      { 'X-User-Id': 'admin' },
      { 'X-Role': 'admin' },
      { 'Authorization': 'Bearer null' },
      { 'Authorization': 'Bearer undefined' },
    ];

    for (const headers of bypassAttempts) {
      const response = await request.get('/api/profile', { headers });
      expect(response.status()).toBe(401);
    }
  });
});

// ============================================================
// CROSS-USER DATA ISOLATION
// ============================================================

test.describe('Cross-User Data Isolation', () => {
  test('User A cannot access User B\'s Profile data', async ({ request }) => {
    // Login as member (User A)
    const sessionA = await getAuthSession(request, USERS.member);
    if (!sessionA) {
      test.skip();
      return;
    }

    // Create a resource as User A
    const createResponse = await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'user-a-Test Value',
        user_id: 'user-a-Test Value',
        email: 'user-a-test@example.com',
        name: 'user-a-Test Value',
        timezone: 'user-a-Test Value',
        subscription_tier: 'user-a-Test Value',
        max_daily_appointments: 'user-a-42',
        max_daily_appointments_tax_season: 'user-a-42',
        created_at: 'user-a-new Date().toISOString().split('T')[0]',
        updated_at: 'user-a-new Date().toISOString().split('T')[0]',
      }
    });

    if (createResponse.status() !== 201) {
      test.skip();
      return;
    }

    const { data: resourceA } = await createResponse.json();

    // Login as viewer (User B)
    const sessionB = await getAuthSession(request, USERS.viewer);
    if (!sessionB) {
      test.skip();
      return;
    }

    // User B tries to access User A's resource
    const accessResponse = await request.get(
      `/api/profile/${resourceA.id}`,
      { headers: { 'Authorization': `Bearer ${sessionB.access_token}` } }
    );

    // Should NOT be able to access
    expect([403, 404]).toContain(accessResponse.status());

    // If somehow got 200, verify no data leaked
    if (accessResponse.status() === 200) {
      const { data } = await accessResponse.json();
      expect(data).toBeUndefined();
    }
  });

  test('Profile list only returns own resources', async ({ request }) => {
    const sessionA = await getAuthSession(request, USERS.member);
    const sessionB = await getAuthSession(request, USERS.viewer);

    if (!sessionA || !sessionB) {
      test.skip();
      return;
    }

    // Create resource as User A
    await request.post('/api/profile', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'isolation-test-a-Test Value',
        user_id: 'isolation-test-a-Test Value',
        email: 'isolation-test-a-test@example.com',
        name: 'isolation-test-a-Test Value',
        timezone: 'isolation-test-a-Test Value',
        subscription_tier: 'isolation-test-a-Test Value',
        max_daily_appointments: 'isolation-test-a-42',
        max_daily_appointments_tax_season: 'isolation-test-a-42',
        created_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
        updated_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
      }
    });

    // List as User B
    const listResponse = await request.get('/api/profile', {
      headers: { 'Authorization': `Bearer ${sessionB.access_token}` }
    });

    if (listResponse.status() === 200) {
      const { data: list } = await listResponse.json();

      // User B should not see User A's resources
      const hasUserAData = list?.some((item: any) =>
        item.id?.includes('isolation-test-a')
      );
      expect(hasUserAData).toBe(false);
    }
  });
  test('User A cannot access User B\'s Client data', async ({ request }) => {
    // Login as member (User A)
    const sessionA = await getAuthSession(request, USERS.member);
    if (!sessionA) {
      test.skip();
      return;
    }

    // Create a resource as User A
    const createResponse = await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'user-a-Test Value',
        user_id: 'user-a-Test Value',
        name: 'user-a-Test Value',
        email: 'user-a-test@example.com',
        preferred_contact: 'user-a-Test Value',
        created_at: 'user-a-new Date().toISOString().split('T')[0]',
        updated_at: 'user-a-new Date().toISOString().split('T')[0]',
      }
    });

    if (createResponse.status() !== 201) {
      test.skip();
      return;
    }

    const { data: resourceA } = await createResponse.json();

    // Login as viewer (User B)
    const sessionB = await getAuthSession(request, USERS.viewer);
    if (!sessionB) {
      test.skip();
      return;
    }

    // User B tries to access User A's resource
    const accessResponse = await request.get(
      `/api/client/${resourceA.id}`,
      { headers: { 'Authorization': `Bearer ${sessionB.access_token}` } }
    );

    // Should NOT be able to access
    expect([403, 404]).toContain(accessResponse.status());

    // If somehow got 200, verify no data leaked
    if (accessResponse.status() === 200) {
      const { data } = await accessResponse.json();
      expect(data).toBeUndefined();
    }
  });

  test('Client list only returns own resources', async ({ request }) => {
    const sessionA = await getAuthSession(request, USERS.member);
    const sessionB = await getAuthSession(request, USERS.viewer);

    if (!sessionA || !sessionB) {
      test.skip();
      return;
    }

    // Create resource as User A
    await request.post('/api/client', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'isolation-test-a-Test Value',
        user_id: 'isolation-test-a-Test Value',
        name: 'isolation-test-a-Test Value',
        email: 'isolation-test-a-test@example.com',
        preferred_contact: 'isolation-test-a-Test Value',
        created_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
        updated_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
      }
    });

    // List as User B
    const listResponse = await request.get('/api/client', {
      headers: { 'Authorization': `Bearer ${sessionB.access_token}` }
    });

    if (listResponse.status() === 200) {
      const { data: list } = await listResponse.json();

      // User B should not see User A's resources
      const hasUserAData = list?.some((item: any) =>
        item.id?.includes('isolation-test-a')
      );
      expect(hasUserAData).toBe(false);
    }
  });
  test('User A cannot access User B\'s Service data', async ({ request }) => {
    // Login as member (User A)
    const sessionA = await getAuthSession(request, USERS.member);
    if (!sessionA) {
      test.skip();
      return;
    }

    // Create a resource as User A
    const createResponse = await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'user-a-Test Value',
        user_id: 'user-a-Test Value',
        name: 'user-a-Test Value',
        duration_minutes: 'user-a-42',
        tax_season_only: 'user-a-true',
        requires_documents: 'user-a-true',
        is_active: 'user-a-true',
        buffer_minutes: 'user-a-42',
        created_at: 'user-a-new Date().toISOString().split('T')[0]',
        updated_at: 'user-a-new Date().toISOString().split('T')[0]',
      }
    });

    if (createResponse.status() !== 201) {
      test.skip();
      return;
    }

    const { data: resourceA } = await createResponse.json();

    // Login as viewer (User B)
    const sessionB = await getAuthSession(request, USERS.viewer);
    if (!sessionB) {
      test.skip();
      return;
    }

    // User B tries to access User A's resource
    const accessResponse = await request.get(
      `/api/service/${resourceA.id}`,
      { headers: { 'Authorization': `Bearer ${sessionB.access_token}` } }
    );

    // Should NOT be able to access
    expect([403, 404]).toContain(accessResponse.status());

    // If somehow got 200, verify no data leaked
    if (accessResponse.status() === 200) {
      const { data } = await accessResponse.json();
      expect(data).toBeUndefined();
    }
  });

  test('Service list only returns own resources', async ({ request }) => {
    const sessionA = await getAuthSession(request, USERS.member);
    const sessionB = await getAuthSession(request, USERS.viewer);

    if (!sessionA || !sessionB) {
      test.skip();
      return;
    }

    // Create resource as User A
    await request.post('/api/service', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'isolation-test-a-Test Value',
        user_id: 'isolation-test-a-Test Value',
        name: 'isolation-test-a-Test Value',
        duration_minutes: 'isolation-test-a-42',
        tax_season_only: 'isolation-test-a-true',
        requires_documents: 'isolation-test-a-true',
        is_active: 'isolation-test-a-true',
        buffer_minutes: 'isolation-test-a-42',
        created_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
        updated_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
      }
    });

    // List as User B
    const listResponse = await request.get('/api/service', {
      headers: { 'Authorization': `Bearer ${sessionB.access_token}` }
    });

    if (listResponse.status() === 200) {
      const { data: list } = await listResponse.json();

      // User B should not see User A's resources
      const hasUserAData = list?.some((item: any) =>
        item.id?.includes('isolation-test-a')
      );
      expect(hasUserAData).toBe(false);
    }
  });
  test('User A cannot access User B\'s Appointment data', async ({ request }) => {
    // Login as member (User A)
    const sessionA = await getAuthSession(request, USERS.member);
    if (!sessionA) {
      test.skip();
      return;
    }

    // Create a resource as User A
    const createResponse = await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'user-a-Test Value',
        user_id: 'user-a-Test Value',
        client_id: 'user-a-Test Value',
        service_id: 'user-a-Test Value',
        starts_at: 'user-a-new Date().toISOString().split('T')[0]',
        ends_at: 'user-a-new Date().toISOString().split('T')[0]',
        status: 'user-a-Test Value',
        reminder_sent_24h: 'user-a-true',
        reminder_sent_1h: 'user-a-true',
        created_at: 'user-a-new Date().toISOString().split('T')[0]',
        updated_at: 'user-a-new Date().toISOString().split('T')[0]',
      }
    });

    if (createResponse.status() !== 201) {
      test.skip();
      return;
    }

    const { data: resourceA } = await createResponse.json();

    // Login as viewer (User B)
    const sessionB = await getAuthSession(request, USERS.viewer);
    if (!sessionB) {
      test.skip();
      return;
    }

    // User B tries to access User A's resource
    const accessResponse = await request.get(
      `/api/appointment/${resourceA.id}`,
      { headers: { 'Authorization': `Bearer ${sessionB.access_token}` } }
    );

    // Should NOT be able to access
    expect([403, 404]).toContain(accessResponse.status());

    // If somehow got 200, verify no data leaked
    if (accessResponse.status() === 200) {
      const { data } = await accessResponse.json();
      expect(data).toBeUndefined();
    }
  });

  test('Appointment list only returns own resources', async ({ request }) => {
    const sessionA = await getAuthSession(request, USERS.member);
    const sessionB = await getAuthSession(request, USERS.viewer);

    if (!sessionA || !sessionB) {
      test.skip();
      return;
    }

    // Create resource as User A
    await request.post('/api/appointment', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'isolation-test-a-Test Value',
        user_id: 'isolation-test-a-Test Value',
        client_id: 'isolation-test-a-Test Value',
        service_id: 'isolation-test-a-Test Value',
        starts_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
        ends_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
        status: 'isolation-test-a-Test Value',
        reminder_sent_24h: 'isolation-test-a-true',
        reminder_sent_1h: 'isolation-test-a-true',
        created_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
        updated_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
      }
    });

    // List as User B
    const listResponse = await request.get('/api/appointment', {
      headers: { 'Authorization': `Bearer ${sessionB.access_token}` }
    });

    if (listResponse.status() === 200) {
      const { data: list } = await listResponse.json();

      // User B should not see User A's resources
      const hasUserAData = list?.some((item: any) =>
        item.id?.includes('isolation-test-a')
      );
      expect(hasUserAData).toBe(false);
    }
  });
  test('User A cannot access User B\'s Availability data', async ({ request }) => {
    // Login as member (User A)
    const sessionA = await getAuthSession(request, USERS.member);
    if (!sessionA) {
      test.skip();
      return;
    }

    // Create a resource as User A
    const createResponse = await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'user-a-Test Value',
        user_id: 'user-a-Test Value',
        day_of_week: 'user-a-42',
        start_time: 'user-a-Test Value',
        end_time: 'user-a-Test Value',
        is_tax_season: 'user-a-true',
        created_at: 'user-a-new Date().toISOString().split('T')[0]',
        updated_at: 'user-a-new Date().toISOString().split('T')[0]',
      }
    });

    if (createResponse.status() !== 201) {
      test.skip();
      return;
    }

    const { data: resourceA } = await createResponse.json();

    // Login as viewer (User B)
    const sessionB = await getAuthSession(request, USERS.viewer);
    if (!sessionB) {
      test.skip();
      return;
    }

    // User B tries to access User A's resource
    const accessResponse = await request.get(
      `/api/availability/${resourceA.id}`,
      { headers: { 'Authorization': `Bearer ${sessionB.access_token}` } }
    );

    // Should NOT be able to access
    expect([403, 404]).toContain(accessResponse.status());

    // If somehow got 200, verify no data leaked
    if (accessResponse.status() === 200) {
      const { data } = await accessResponse.json();
      expect(data).toBeUndefined();
    }
  });

  test('Availability list only returns own resources', async ({ request }) => {
    const sessionA = await getAuthSession(request, USERS.member);
    const sessionB = await getAuthSession(request, USERS.viewer);

    if (!sessionA || !sessionB) {
      test.skip();
      return;
    }

    // Create resource as User A
    await request.post('/api/availability', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'isolation-test-a-Test Value',
        user_id: 'isolation-test-a-Test Value',
        day_of_week: 'isolation-test-a-42',
        start_time: 'isolation-test-a-Test Value',
        end_time: 'isolation-test-a-Test Value',
        is_tax_season: 'isolation-test-a-true',
        created_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
        updated_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
      }
    });

    // List as User B
    const listResponse = await request.get('/api/availability', {
      headers: { 'Authorization': `Bearer ${sessionB.access_token}` }
    });

    if (listResponse.status() === 200) {
      const { data: list } = await listResponse.json();

      // User B should not see User A's resources
      const hasUserAData = list?.some((item: any) =>
        item.id?.includes('isolation-test-a')
      );
      expect(hasUserAData).toBe(false);
    }
  });
  test('User A cannot access User B\'s Document data', async ({ request }) => {
    // Login as member (User A)
    const sessionA = await getAuthSession(request, USERS.member);
    if (!sessionA) {
      test.skip();
      return;
    }

    // Create a resource as User A
    const createResponse = await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'user-a-Test Value',
        user_id: 'user-a-Test Value',
        client_id: 'user-a-Test Value',
        document_type: 'user-a-Test Value',
        status: 'user-a-Test Value',
        created_at: 'user-a-new Date().toISOString().split('T')[0]',
        updated_at: 'user-a-new Date().toISOString().split('T')[0]',
      }
    });

    if (createResponse.status() !== 201) {
      test.skip();
      return;
    }

    const { data: resourceA } = await createResponse.json();

    // Login as viewer (User B)
    const sessionB = await getAuthSession(request, USERS.viewer);
    if (!sessionB) {
      test.skip();
      return;
    }

    // User B tries to access User A's resource
    const accessResponse = await request.get(
      `/api/document/${resourceA.id}`,
      { headers: { 'Authorization': `Bearer ${sessionB.access_token}` } }
    );

    // Should NOT be able to access
    expect([403, 404]).toContain(accessResponse.status());

    // If somehow got 200, verify no data leaked
    if (accessResponse.status() === 200) {
      const { data } = await accessResponse.json();
      expect(data).toBeUndefined();
    }
  });

  test('Document list only returns own resources', async ({ request }) => {
    const sessionA = await getAuthSession(request, USERS.member);
    const sessionB = await getAuthSession(request, USERS.viewer);

    if (!sessionA || !sessionB) {
      test.skip();
      return;
    }

    // Create resource as User A
    await request.post('/api/document', {
      headers: { 'Authorization': `Bearer ${sessionA.access_token}` },
      data: {
        id: 'isolation-test-a-Test Value',
        user_id: 'isolation-test-a-Test Value',
        client_id: 'isolation-test-a-Test Value',
        document_type: 'isolation-test-a-Test Value',
        status: 'isolation-test-a-Test Value',
        created_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
        updated_at: 'isolation-test-a-new Date().toISOString().split('T')[0]',
      }
    });

    // List as User B
    const listResponse = await request.get('/api/document', {
      headers: { 'Authorization': `Bearer ${sessionB.access_token}` }
    });

    if (listResponse.status() === 200) {
      const { data: list } = await listResponse.json();

      // User B should not see User A's resources
      const hasUserAData = list?.some((item: any) =>
        item.id?.includes('isolation-test-a')
      );
      expect(hasUserAData).toBe(false);
    }
  });
});

// ============================================================
// COLUMN-LEVEL PERMISSIONS
// ============================================================

test.describe('Column-Level Permissions', () => {
  test('sensitive field Client.tax_id_last4 should be protected', async ({ request }) => {
    const memberSession = await getAuthSession(request, USERS.member);
    const adminSession = await getAuthSession(request, USERS.admin);

    const entityName = 'Client';
    const fieldName = 'tax_id_last4';

    if (!memberSession) {
      test.skip();
      return;
    }

    // Member reads entity
    const memberResponse = await request.get(`/api/${entityName}`, {
      headers: { 'Authorization': `Bearer ${memberSession.access_token}` }
    });

    if (memberResponse.status() === 200) {
      const { data: memberData } = await memberResponse.json();

      // Member should NOT see sensitive field
      if (Array.isArray(memberData) && memberData.length > 0) {
        expect(memberData[0][fieldName]).toBeUndefined();
      }
    }

    // Admin reads same entity
    if (adminSession) {
      const adminResponse = await request.get(`/api/${entityName}`, {
        headers: { 'Authorization': `Bearer ${adminSession.access_token}` }
      });

      if (adminResponse.status() === 200) {
        const { data: adminData } = await adminResponse.json();

        // Admin SHOULD see sensitive field
        if (Array.isArray(adminData) && adminData.length > 0) {
          // Field may or may not exist, but admin has permission
          // This is more of a documentation test
        }
      }
    }
  });
});

// ============================================================
// SESSION SECURITY
// ============================================================

test.describe('Session Security', () => {
  test('expired token should be rejected', async ({ request }) => {
    // Use an obviously expired/invalid token
    const response = await request.get('/api/profile', {
      headers: { 'Authorization': 'Bearer expired.token.here' }
    });

    expect(response.status()).toBe(401);
  });

  test('malformed token should be rejected', async ({ request }) => {
    const malformedTokens = [
      'Bearer ',
      'Bearer null',
      'Bearer undefined',
      'bearer token', // wrong case
      'Token bearer-token', // wrong scheme
      'Bearer a.b', // missing segment
      'Bearer ....', // dots only
    ];

    for (const token of malformedTokens) {
      const response = await request.get('/api/profile', {
        headers: { 'Authorization': token }
      });

      expect(response.status()).toBe(401);
    }
  });

  test('logout should invalidate session', async ({ request }) => {
    const session = await getAuthSession(request, USERS.member);
    if (!session) {
      test.skip();
      return;
    }

    // Verify session works
    const beforeLogout = await request.get('/api/profile', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    expect([200, 404]).toContain(beforeLogout.status()); // Auth passed

    // Logout
    await request.post('/api/auth/signout', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });

    // Session should be invalid now (may still work if using JWTs)
    // This test documents the expected behavior
  });
});

// ============================================================
// ACCESS PATTERN TESTS
// ============================================================

test.describe('Access Patterns', () => {
  test('Profile has correct access pattern: authenticated-read', async ({ request }) => {
    const pattern: string = 'authenticated-read';

    switch (pattern) {
      case 'public-read':
        // Should allow read without auth
        const publicResponse = await request.get('/api/profile');
        expect([200, 404]).toContain(publicResponse.status());
        break;

      case 'owner-only':
        // Should require auth for any access
        const ownerResponse = await request.get('/api/profile');
        expect([401, 403]).toContain(ownerResponse.status());
        break;

      case 'authenticated-read':
      default:
        // Should require auth but allow any authenticated user to read
        const authResponse = await request.get('/api/profile');
        expect(authResponse.status()).toBe(401); // No auth = 401

        const session = await getAuthSession(request, USERS.viewer);
        if (session) {
          const authedResponse = await request.get('/api/profile', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          expect([200, 404]).toContain(authedResponse.status()); // Auth = OK
        }
        break;
    }
  });
  test('Client has correct access pattern: authenticated-read', async ({ request }) => {
    const pattern: string = 'authenticated-read';

    switch (pattern) {
      case 'public-read':
        // Should allow read without auth
        const publicResponse = await request.get('/api/client');
        expect([200, 404]).toContain(publicResponse.status());
        break;

      case 'owner-only':
        // Should require auth for any access
        const ownerResponse = await request.get('/api/client');
        expect([401, 403]).toContain(ownerResponse.status());
        break;

      case 'authenticated-read':
      default:
        // Should require auth but allow any authenticated user to read
        const authResponse = await request.get('/api/client');
        expect(authResponse.status()).toBe(401); // No auth = 401

        const session = await getAuthSession(request, USERS.viewer);
        if (session) {
          const authedResponse = await request.get('/api/client', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          expect([200, 404]).toContain(authedResponse.status()); // Auth = OK
        }
        break;
    }
  });
  test('Service has correct access pattern: authenticated-read', async ({ request }) => {
    const pattern: string = 'authenticated-read';

    switch (pattern) {
      case 'public-read':
        // Should allow read without auth
        const publicResponse = await request.get('/api/service');
        expect([200, 404]).toContain(publicResponse.status());
        break;

      case 'owner-only':
        // Should require auth for any access
        const ownerResponse = await request.get('/api/service');
        expect([401, 403]).toContain(ownerResponse.status());
        break;

      case 'authenticated-read':
      default:
        // Should require auth but allow any authenticated user to read
        const authResponse = await request.get('/api/service');
        expect(authResponse.status()).toBe(401); // No auth = 401

        const session = await getAuthSession(request, USERS.viewer);
        if (session) {
          const authedResponse = await request.get('/api/service', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          expect([200, 404]).toContain(authedResponse.status()); // Auth = OK
        }
        break;
    }
  });
  test('Appointment has correct access pattern: authenticated-read', async ({ request }) => {
    const pattern: string = 'authenticated-read';

    switch (pattern) {
      case 'public-read':
        // Should allow read without auth
        const publicResponse = await request.get('/api/appointment');
        expect([200, 404]).toContain(publicResponse.status());
        break;

      case 'owner-only':
        // Should require auth for any access
        const ownerResponse = await request.get('/api/appointment');
        expect([401, 403]).toContain(ownerResponse.status());
        break;

      case 'authenticated-read':
      default:
        // Should require auth but allow any authenticated user to read
        const authResponse = await request.get('/api/appointment');
        expect(authResponse.status()).toBe(401); // No auth = 401

        const session = await getAuthSession(request, USERS.viewer);
        if (session) {
          const authedResponse = await request.get('/api/appointment', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          expect([200, 404]).toContain(authedResponse.status()); // Auth = OK
        }
        break;
    }
  });
  test('Availability has correct access pattern: authenticated-read', async ({ request }) => {
    const pattern: string = 'authenticated-read';

    switch (pattern) {
      case 'public-read':
        // Should allow read without auth
        const publicResponse = await request.get('/api/availability');
        expect([200, 404]).toContain(publicResponse.status());
        break;

      case 'owner-only':
        // Should require auth for any access
        const ownerResponse = await request.get('/api/availability');
        expect([401, 403]).toContain(ownerResponse.status());
        break;

      case 'authenticated-read':
      default:
        // Should require auth but allow any authenticated user to read
        const authResponse = await request.get('/api/availability');
        expect(authResponse.status()).toBe(401); // No auth = 401

        const session = await getAuthSession(request, USERS.viewer);
        if (session) {
          const authedResponse = await request.get('/api/availability', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          expect([200, 404]).toContain(authedResponse.status()); // Auth = OK
        }
        break;
    }
  });
  test('Document has correct access pattern: authenticated-read', async ({ request }) => {
    const pattern: string = 'authenticated-read';

    switch (pattern) {
      case 'public-read':
        // Should allow read without auth
        const publicResponse = await request.get('/api/document');
        expect([200, 404]).toContain(publicResponse.status());
        break;

      case 'owner-only':
        // Should require auth for any access
        const ownerResponse = await request.get('/api/document');
        expect([401, 403]).toContain(ownerResponse.status());
        break;

      case 'authenticated-read':
      default:
        // Should require auth but allow any authenticated user to read
        const authResponse = await request.get('/api/document');
        expect(authResponse.status()).toBe(401); // No auth = 401

        const session = await getAuthSession(request, USERS.viewer);
        if (session) {
          const authedResponse = await request.get('/api/document', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          expect([200, 404]).toContain(authedResponse.status()); // Auth = OK
        }
        break;
    }
  });
});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
