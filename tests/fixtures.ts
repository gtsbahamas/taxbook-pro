// ============================================================
// TEST FIXTURES - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// EXPORTABLE TEST FIXTURES: Import these into your test files.
//
// Usage:
//   import { fixtures, factories } from '@/tests/fixtures';
//
//   // Use pre-defined fixtures
//   const user = fixtures.users.admin;
//
//   // Use factories to create custom fixtures
//   const task = factories.task({ title: 'Custom Title' });
//
// ============================================================

import { expect } from "vitest";
import type { Database } from "@/types/database";

// Type aliases for database tables
type Tables = Database["public"]["Tables"];
type ProfileRow = Tables["profiles"]["Row"];
type ProfileInsert = Tables["profiles"]["Insert"];
type ClientRow = Tables["clients"]["Row"];
type ClientInsert = Tables["clients"]["Insert"];
type ServiceRow = Tables["services"]["Row"];
type ServiceInsert = Tables["services"]["Insert"];
type AppointmentRow = Tables["appointments"]["Row"];
type AppointmentInsert = Tables["appointments"]["Insert"];
type AvailabilityRow = Tables["availabilities"]["Row"];
type AvailabilityInsert = Tables["availabilities"]["Insert"];
type DocumentRow = Tables["documents"]["Row"];
type DocumentInsert = Tables["documents"]["Insert"];

// ============================================================
// TEST USER FIXTURES
// ============================================================

export interface TestUser {
  email: string;
  password: string;
  metadata: {
    full_name: string;
    role: "admin" | "user";
  };
}

/**
 * Pre-defined test users for authentication testing.
 * These match the seed data credentials.
 */
export const testUsers = {
  admin: {
    email: "admin@example.com",
    password: "testpassword123",
    metadata: { full_name: "Admin User", role: "admin" as const },
  },
  user: {
    email: "user@example.com",
    password: "testpassword123",
    metadata: { full_name: "Test User", role: "user" as const },
  },
  demo: {
    email: "demo@example.com",
    password: "testpassword123",
    metadata: { full_name: "Demo User", role: "user" as const },
  },
} as const satisfies Record<string, TestUser>;

// ============================================================
// ENTITY FIXTURE TYPES
// ============================================================

/**
 * Profile fixture type (without generated fields).
 * Use this for creating test data.
 */
export type ProfileFixture = Omit<ProfileInsert, "id" | "created_at" | "updated_at">;

/**
 * Client fixture type (without generated fields).
 * Use this for creating test data.
 */
export type ClientFixture = Omit<ClientInsert, "id" | "created_at" | "updated_at">;

/**
 * Service fixture type (without generated fields).
 * Use this for creating test data.
 */
export type ServiceFixture = Omit<ServiceInsert, "id" | "created_at" | "updated_at">;

/**
 * Appointment fixture type (without generated fields).
 * Use this for creating test data.
 */
export type AppointmentFixture = Omit<AppointmentInsert, "id" | "created_at" | "updated_at">;

/**
 * Availability fixture type (without generated fields).
 * Use this for creating test data.
 */
export type AvailabilityFixture = Omit<AvailabilityInsert, "id" | "created_at" | "updated_at">;

/**
 * Document fixture type (without generated fields).
 * Use this for creating test data.
 */
export type DocumentFixture = Omit<DocumentInsert, "id" | "created_at" | "updated_at">;


// ============================================================
// FACTORY FUNCTIONS
// ============================================================

/**
 * Creates a unique string with optional prefix for testing.
 * Uses timestamp + random to ensure uniqueness across test runs.
 */
function uniqueString(prefix = "test"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Creates a unique email address for testing.
 */
function uniqueEmail(prefix = "test"): string {
  return `${uniqueString(prefix)}@example.com`;
}

/**
 * Creates a unique slug for testing.
 */
function uniqueSlug(prefix = "test"): string {
  return uniqueString(prefix).toLowerCase().replace(/_/g, "-");
}

/**
 * Creates a random integer between min and max (inclusive).
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Creates a random price/amount with 2 decimal places.
 */
function randomPrice(min = 10, max = 500): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * Creates a random date within the last N days.
 */
function randomRecentDate(daysAgo = 30): Date {
  const now = Date.now();
  const past = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

/**
 * Factory function for creating Profile fixtures.
 * Generates sensible defaults that can be overridden.
 */
export function createProfileFixture(
  overrides: Partial<ProfileFixture> = {}
): ProfileFixture {
  const defaults: ProfileFixture = {
    user_id: `Profile ${uniqueString()}`,
    email: uniqueEmail("profile"),
    name: `Test Profile ${uniqueString()}`,
    firm_name: `Profile ${uniqueString()}`,
    license_number: `Profile ${uniqueString()}`,
    timezone: `Profile ${uniqueString()}`,
    subscription_tier: `Profile ${uniqueString()}`,
    booking_slug: `Profile ${uniqueString()}`,
    tax_season_start: randomRecentDate().toISOString(),
    tax_season_end: randomRecentDate().toISOString(),
    max_daily_appointments: randomInt(1, 1000),
    max_daily_appointments_tax_season: randomInt(1, 1000),
  };

  return { ...defaults, ...overrides };
}

/**
 * Factory function for creating Client fixtures.
 * Generates sensible defaults that can be overridden.
 */
export function createClientFixture(
  overrides: Partial<ClientFixture> = {}
): ClientFixture {
  const defaults: ClientFixture = {
    user_id: `Client ${uniqueString()}`,
    name: `Test Client ${uniqueString()}`,
    email: uniqueEmail("client"),
    phone: `+1-555-${randomInt(1000, 9999)}`,
    tax_id_last4: `Client ${uniqueString()}`,
    filing_status: `Client ${uniqueString()}`,
    preferred_contact: `Client ${uniqueString()}`,
    notes: `Test notes: ${uniqueString()}`,
  };

  return { ...defaults, ...overrides };
}

/**
 * Factory function for creating Service fixtures.
 * Generates sensible defaults that can be overridden.
 */
export function createServiceFixture(
  overrides: Partial<ServiceFixture> = {}
): ServiceFixture {
  const defaults: ServiceFixture = {
    user_id: `Service ${uniqueString()}`,
    name: `Test Service ${uniqueString()}`,
    description: `Test description for service. ${uniqueString()}`,
    duration_minutes: randomInt(1, 1000),
    price: randomPrice(),
    tax_season_only: true,
    requires_documents: true,
    is_active: true,
    buffer_minutes: randomInt(1, 1000),
  };

  return { ...defaults, ...overrides };
}

/**
 * Factory function for creating Appointment fixtures.
 * Generates sensible defaults that can be overridden.
 */
export function createAppointmentFixture(
  overrides: Partial<AppointmentFixture> = {}
): AppointmentFixture {
  const defaults: AppointmentFixture = {
    user_id: `Appointment ${uniqueString()}`,
    client_id: `Appointment ${uniqueString()}`,
    service_id: `Appointment ${uniqueString()}`,
    starts_at: randomRecentDate().toISOString(),
    ends_at: randomRecentDate().toISOString(),
    status: "active",
    notes: `Test notes: ${uniqueString()}`,
    meeting_link: `Appointment ${uniqueString()}`,
    reminder_sent_24h: true,
    reminder_sent_1h: true,
    cancellation_reason: `Appointment ${uniqueString()}`,
  };

  return { ...defaults, ...overrides };
}

/**
 * Factory function for creating Availability fixtures.
 * Generates sensible defaults that can be overridden.
 */
export function createAvailabilityFixture(
  overrides: Partial<AvailabilityFixture> = {}
): AvailabilityFixture {
  const defaults: AvailabilityFixture = {
    user_id: `Availability ${uniqueString()}`,
    day_of_week: randomInt(1, 1000),
    start_time: `Availability ${uniqueString()}`,
    end_time: `Availability ${uniqueString()}`,
    is_tax_season: true,
  };

  return { ...defaults, ...overrides };
}

/**
 * Factory function for creating Document fixtures.
 * Generates sensible defaults that can be overridden.
 */
export function createDocumentFixture(
  overrides: Partial<DocumentFixture> = {}
): DocumentFixture {
  const defaults: DocumentFixture = {
    user_id: `Document ${uniqueString()}`,
    client_id: `Document ${uniqueString()}`,
    appointment_id: `Document ${uniqueString()}`,
    document_type: `Document ${uniqueString()}`,
    file_url: `Document ${uniqueString()}`,
    file_name: `Document ${uniqueString()}`,
    status: "active",
    tax_year: randomInt(1, 1000),
    notes: `Test notes: ${uniqueString()}`,
    rejection_reason: `Document ${uniqueString()}`,
  };

  return { ...defaults, ...overrides };
}


// ============================================================
// PRE-DEFINED FIXTURES
// ============================================================

/**
 * Pre-defined fixtures for common test scenarios.
 * Use these for consistent test data across test files.
 */
export const fixtures = {
  users: testUsers,

  profile: {
    /**
     * Standard valid profile fixture.
     */
    valid: createProfileFixture(),

    /**
     * Minimal profile with only required fields.
     */
    minimal: createProfileFixture({
      firm_name: undefined,
      license_number: undefined,
      booking_slug: undefined,
      tax_season_start: undefined,
      tax_season_end: undefined,
    }),

    /**
     * Profile for testing edge cases.
     */
    edgeCase: createProfileFixture({
      email: "very.long.email.address.for.testing.edge.cases@subdomain.example.com",
      name: "A".repeat(255), // Max length name
    }),
  },

  client: {
    /**
     * Standard valid client fixture.
     */
    valid: createClientFixture(),

    /**
     * Minimal client with only required fields.
     */
    minimal: createClientFixture({
      phone: undefined,
      tax_id_last4: undefined,
      filing_status: undefined,
      notes: undefined,
    }),

    /**
     * Client for testing edge cases.
     */
    edgeCase: createClientFixture({
      name: "A".repeat(255), // Max length name
      email: "very.long.email.address.for.testing.edge.cases@subdomain.example.com",
    }),
  },

  service: {
    /**
     * Standard valid service fixture.
     */
    valid: createServiceFixture(),

    /**
     * Minimal service with only required fields.
     */
    minimal: createServiceFixture({
      description: undefined,
      price: undefined,
    }),

    /**
     * Service for testing edge cases.
     */
    edgeCase: createServiceFixture({
      name: "A".repeat(255), // Max length name
      description: "Short desc", // Minimum content
      price: 0.01, // Minimum price
    }),
  },

  appointment: {
    /**
     * Standard valid appointment fixture.
     */
    valid: createAppointmentFixture(),

    /**
     * Minimal appointment with only required fields.
     */
    minimal: createAppointmentFixture({
      notes: undefined,
      meeting_link: undefined,
      cancellation_reason: undefined,
    }),

    /**
     * Appointment for testing edge cases.
     */
    edgeCase: createAppointmentFixture({
    }),
  },

  availability: {
    /**
     * Standard valid availability fixture.
     */
    valid: createAvailabilityFixture(),

    /**
     * Minimal availability with only required fields.
     */
    minimal: createAvailabilityFixture({
    }),

    /**
     * Availability for testing edge cases.
     */
    edgeCase: createAvailabilityFixture({
    }),
  },

  document: {
    /**
     * Standard valid document fixture.
     */
    valid: createDocumentFixture(),

    /**
     * Minimal document with only required fields.
     */
    minimal: createDocumentFixture({
      appointment_id: undefined,
      file_url: undefined,
      file_name: undefined,
      tax_year: undefined,
      notes: undefined,
      rejection_reason: undefined,
    }),

    /**
     * Document for testing edge cases.
     */
    edgeCase: createDocumentFixture({
    }),
  },

};

// ============================================================
// FACTORY REGISTRY
// ============================================================

/**
 * Factory functions for creating entity fixtures.
 * Use these when you need multiple unique instances or custom overrides.
 */
export const factories = {
  profile: createProfileFixture,
  client: createClientFixture,
  service: createServiceFixture,
  appointment: createAppointmentFixture,
  availability: createAvailabilityFixture,
  document: createDocumentFixture,
};

// ============================================================
// BATCH CREATION HELPERS
// ============================================================

/**
 * Creates multiple fixtures of the same type.
 */
export function createMany<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overrides?: Partial<T>
): T[] {
  return Array.from({ length: count }, () => factory(overrides));
}

/**
 * Creates multiple Profile fixtures.
 */
export function createManyProfiles(
  count: number,
  overrides?: Partial<ProfileFixture>
): ProfileFixture[] {
  return createMany(createProfileFixture, count, overrides);
}

/**
 * Creates multiple Client fixtures.
 */
export function createManyClients(
  count: number,
  overrides?: Partial<ClientFixture>
): ClientFixture[] {
  return createMany(createClientFixture, count, overrides);
}

/**
 * Creates multiple Service fixtures.
 */
export function createManyServices(
  count: number,
  overrides?: Partial<ServiceFixture>
): ServiceFixture[] {
  return createMany(createServiceFixture, count, overrides);
}

/**
 * Creates multiple Appointment fixtures.
 */
export function createManyAppointments(
  count: number,
  overrides?: Partial<AppointmentFixture>
): AppointmentFixture[] {
  return createMany(createAppointmentFixture, count, overrides);
}

/**
 * Creates multiple Availability fixtures.
 */
export function createManyAvailabilitys(
  count: number,
  overrides?: Partial<AvailabilityFixture>
): AvailabilityFixture[] {
  return createMany(createAvailabilityFixture, count, overrides);
}

/**
 * Creates multiple Document fixtures.
 */
export function createManyDocuments(
  count: number,
  overrides?: Partial<DocumentFixture>
): DocumentFixture[] {
  return createMany(createDocumentFixture, count, overrides);
}


// ============================================================
// TEST DATA VALIDATION HELPERS
// ============================================================

/**
 * Validates that a value matches the expected fixture shape.
 * Useful for asserting API responses match expected structure.
 */
export function expectShape<T extends object>(
  actual: unknown,
  expected: T
): void {
  const actualObj = actual as Record<string, unknown>;
  for (const key of Object.keys(expected)) {
    if (expected[key as keyof T] !== undefined) {
      expect(actualObj).toHaveProperty(key);
    }
  }
}

/**
 * Validates that a response contains the expected ID.
 */
export function expectId(response: unknown): string {
  const obj = response as { id?: string };
  expect(obj).toHaveProperty("id");
  expect(typeof obj.id).toBe("string");
  expect(obj.id!.length).toBeGreaterThan(0);
  return obj.id!;
}

/**
 * Validates that timestamps are present and valid.
 */
export function expectTimestamps(
  response: unknown,
  options: { hasUpdatedAt?: boolean } = {}
): void {
  const obj = response as { created_at?: string; updated_at?: string };
  expect(obj).toHaveProperty("created_at");
  expect(new Date(obj.created_at!).getTime()).toBeGreaterThan(0);

  if (options.hasUpdatedAt !== false) {
    expect(obj).toHaveProperty("updated_at");
    expect(new Date(obj.updated_at!).getTime()).toBeGreaterThan(0);
  }
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
