/**
 * Database Integration Tests - taxbook-pro
 * Generated: 2026-01-19
 *
 * CRITICAL: These tests run against a REAL database.
 * They verify RLS policies, triggers, and constraints actually work.
 *
 * Setup: Create a test user in Supabase Auth before running.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Check for required environment variables before creating clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Determine if we can run the tests
const canRunTests = Boolean(supabaseUrl && supabaseServiceKey && supabaseAnonKey);

if (!canRunTests) {
  console.log(
    'Skipping database integration tests: Missing required environment variables.\n' +
    'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Test user credentials
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'test-password-123';

// These will be initialized in beforeAll when tests can run
let adminClient: SupabaseClient;
let anonClient: SupabaseClient;
let testUserId: string;
let authedClient: SupabaseClient;

describe.skipIf(!canRunTests)('Database Integration Tests', () => {
  beforeAll(async () => {
    // Create clients inside beforeAll to avoid module-load-time errors
    adminClient = createClient(supabaseUrl!, supabaseServiceKey!);
    anonClient = createClient(supabaseUrl!, supabaseAnonKey!);

    // Create test user or get existing
    const { error: authError } = await adminClient.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
    });

    if (authError && !authError.message.includes('already exists')) {
      throw authError;
    }

    // Sign in as test user
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (signInError) throw signInError;
    testUserId = signInData.user!.id;

    // Create authenticated client
    authedClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session!.access_token}`,
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup: Delete test data (use service role to bypass RLS)
    await adminClient.from('profile').delete().eq('user_id', testUserId);
    await adminClient.from('client').delete().eq('user_id', testUserId);
    await adminClient.from('service').delete().eq('user_id', testUserId);
    await adminClient.from('appointment').delete().eq('user_id', testUserId);
    await adminClient.from('availability').delete().eq('user_id', testUserId);
    await adminClient.from('document').delete().eq('user_id', testUserId);
  });

  // ============================================================
  // RLS POLICY TESTS
  // ============================================================

  describe('RLS Policies', () => {
    describe('Profile', () => {
      it('should allow user to insert own profile', async () => {
        const { data, error } = await authedClient
          .from('profile')
          .insert({
            id: 'Test Value',
            email: 'test@example.com',
            name: 'Test Value',
            timezone: 'Test Value',
            subscription_tier: 'Test Value',
            max_daily_appointments: 42,
            max_daily_appointments_tax_season: 42,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: testUserId,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.user_id).toBe(testUserId);
      });

      it('should only return own profile on select', async () => {
        const { data, error } = await authedClient
          .from('profile')
          .select('*');

        expect(error).toBeNull();
        // All returned records should belong to test user
        data?.forEach(record => {
          expect(record.user_id).toBe(testUserId);
        });
      });

      it('should NOT allow inserting profile for another user', async () => {
        const { error } = await authedClient
          .from('profile')
          .insert({
            id: 'Test Value',
            email: 'test@example.com',
            name: 'Test Value',
            timezone: 'Test Value',
            subscription_tier: 'Test Value',
            max_daily_appointments: 42,
            max_daily_appointments_tax_season: 42,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: '00000000-0000-0000-0000-000000000000', // Fake user ID
          });

        expect(error).not.toBeNull();
      });
    });
    describe('Client', () => {
      it('should allow user to insert own client', async () => {
        const { data, error } = await authedClient
          .from('client')
          .insert({
            id: 'Test Value',
            name: 'Test Value',
            email: 'test@example.com',
            preferred_contact: 'Test Value',
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: testUserId,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.user_id).toBe(testUserId);
      });

      it('should only return own client on select', async () => {
        const { data, error } = await authedClient
          .from('client')
          .select('*');

        expect(error).toBeNull();
        // All returned records should belong to test user
        data?.forEach(record => {
          expect(record.user_id).toBe(testUserId);
        });
      });

      it('should NOT allow inserting client for another user', async () => {
        const { error } = await authedClient
          .from('client')
          .insert({
            id: 'Test Value',
            name: 'Test Value',
            email: 'test@example.com',
            preferred_contact: 'Test Value',
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: '00000000-0000-0000-0000-000000000000', // Fake user ID
          });

        expect(error).not.toBeNull();
      });
    });
    describe('Service', () => {
      it('should allow user to insert own service', async () => {
        const { data, error } = await authedClient
          .from('service')
          .insert({
            id: 'Test Value',
            name: 'Test Value',
            duration_minutes: 42,
            tax_season_only: true,
            requires_documents: true,
            is_active: true,
            buffer_minutes: 42,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: testUserId,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.user_id).toBe(testUserId);
      });

      it('should only return own service on select', async () => {
        const { data, error } = await authedClient
          .from('service')
          .select('*');

        expect(error).toBeNull();
        // All returned records should belong to test user
        data?.forEach(record => {
          expect(record.user_id).toBe(testUserId);
        });
      });

      it('should NOT allow inserting service for another user', async () => {
        const { error } = await authedClient
          .from('service')
          .insert({
            id: 'Test Value',
            name: 'Test Value',
            duration_minutes: 42,
            tax_season_only: true,
            requires_documents: true,
            is_active: true,
            buffer_minutes: 42,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: '00000000-0000-0000-0000-000000000000', // Fake user ID
          });

        expect(error).not.toBeNull();
      });
    });
    describe('Appointment', () => {
      it('should allow user to insert own appointment', async () => {
        const { data, error } = await authedClient
          .from('appointment')
          .insert({
            id: 'Test Value',
            client_id: 'Test Value',
            service_id: 'Test Value',
            starts_at: new Date().toISOString().split('T')[0],
            ends_at: new Date().toISOString().split('T')[0],
            status: 'Test Value',
            reminder_sent_24h: true,
            reminder_sent_1h: true,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: testUserId,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.user_id).toBe(testUserId);
      });

      it('should only return own appointment on select', async () => {
        const { data, error } = await authedClient
          .from('appointment')
          .select('*');

        expect(error).toBeNull();
        // All returned records should belong to test user
        data?.forEach(record => {
          expect(record.user_id).toBe(testUserId);
        });
      });

      it('should NOT allow inserting appointment for another user', async () => {
        const { error } = await authedClient
          .from('appointment')
          .insert({
            id: 'Test Value',
            client_id: 'Test Value',
            service_id: 'Test Value',
            starts_at: new Date().toISOString().split('T')[0],
            ends_at: new Date().toISOString().split('T')[0],
            status: 'Test Value',
            reminder_sent_24h: true,
            reminder_sent_1h: true,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: '00000000-0000-0000-0000-000000000000', // Fake user ID
          });

        expect(error).not.toBeNull();
      });
    });
    describe('Availability', () => {
      it('should allow user to insert own availability', async () => {
        const { data, error } = await authedClient
          .from('availability')
          .insert({
            id: 'Test Value',
            day_of_week: 42,
            start_time: 'Test Value',
            end_time: 'Test Value',
            is_tax_season: true,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: testUserId,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.user_id).toBe(testUserId);
      });

      it('should only return own availability on select', async () => {
        const { data, error } = await authedClient
          .from('availability')
          .select('*');

        expect(error).toBeNull();
        // All returned records should belong to test user
        data?.forEach(record => {
          expect(record.user_id).toBe(testUserId);
        });
      });

      it('should NOT allow inserting availability for another user', async () => {
        const { error } = await authedClient
          .from('availability')
          .insert({
            id: 'Test Value',
            day_of_week: 42,
            start_time: 'Test Value',
            end_time: 'Test Value',
            is_tax_season: true,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: '00000000-0000-0000-0000-000000000000', // Fake user ID
          });

        expect(error).not.toBeNull();
      });
    });
    describe('Document', () => {
      it('should allow user to insert own document', async () => {
        const { data, error } = await authedClient
          .from('document')
          .insert({
            id: 'Test Value',
            client_id: 'Test Value',
            document_type: 'Test Value',
            status: 'Test Value',
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: testUserId,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.user_id).toBe(testUserId);
      });

      it('should only return own document on select', async () => {
        const { data, error } = await authedClient
          .from('document')
          .select('*');

        expect(error).toBeNull();
        // All returned records should belong to test user
        data?.forEach(record => {
          expect(record.user_id).toBe(testUserId);
        });
      });

      it('should NOT allow inserting document for another user', async () => {
        const { error } = await authedClient
          .from('document')
          .insert({
            id: 'Test Value',
            client_id: 'Test Value',
            document_type: 'Test Value',
            status: 'Test Value',
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            user_id: '00000000-0000-0000-0000-000000000000', // Fake user ID
          });

        expect(error).not.toBeNull();
      });
    });

  });

  // ============================================================
  // TRIGGER TESTS
  // ============================================================

  describe('Database Triggers', () => {
    it('should auto-create profile on user signup', async () => {
      // Profile should exist for test user (created by trigger)
      const { data, error } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.email).toBe(TEST_USER_EMAIL);
    });

    it('should auto-update updated_at on record update', async () => {
      // Create a record
      const { data: created } = await authedClient
        .from('profile')
        .insert({
          id: 'Test Value',
          email: 'test@example.com',
          name: 'Test Value',
          timezone: 'Test Value',
          subscription_tier: 'Test Value',
          max_daily_appointments: 42,
          max_daily_appointments_tax_season: 42,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          user_id: testUserId,
        })
        .select()
        .single();

      const originalUpdatedAt = created!.updated_at;

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update the record
      const { data: updated } = await authedClient
        .from('profile')
        .update({ id: 'updated-value' })
        .eq('id', created!.id)
        .select()
        .single();

      expect(new Date(updated!.updated_at).getTime())
        .toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });
  });

  // ============================================================
  // CONSTRAINT TESTS
  // ============================================================

  describe('Database Constraints', () => {
  });
});
