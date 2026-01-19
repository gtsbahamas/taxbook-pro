// ============================================================
// DATABASE SEED DATA - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// SEED SCRIPT: Populates the database with test/development data.
//
// IMPORTANT:
// - Only run in development environment (enforced)
// - Uses service role key to bypass RLS
// - Idempotent: checks for existing data before inserting
//
// Usage:
//   npx tsx scripts/seed.ts seed      # Seed the database
//   npx tsx scripts/seed.ts reset     # Clear all data
//   npx tsx scripts/seed.ts seed-dev  # Reset + seed (full refresh)
//
// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Type alias for Supabase table insert/row types
type Tables = Database["public"]["Tables"];

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NODE_ENV = process.env.NODE_ENV;

if (!SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

// CRITICAL: Only allow seeding in development
const isProduction = NODE_ENV === "production";
const isExplicitlyAllowed = process.env.ALLOW_SEED_IN_PRODUCTION === "true";

if (isProduction && !isExplicitlyAllowed) {
  console.error("ERROR: Cannot run seed script in production environment.");
  console.error("If you really need to seed production, set ALLOW_SEED_IN_PRODUCTION=true");
  process.exit(1);
}

// ============================================================
// SUPABASE CLIENT (Service Role - Bypasses RLS)
// ============================================================

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================
// SEED DATA DEFINITIONS
// ============================================================

// Test users for development
const TEST_USERS = [
  {
    email: "admin@example.com",
    password: "testpassword123",
    user_metadata: { full_name: "Admin User", role: "admin" },
  },
  {
    email: "user@example.com",
    password: "testpassword123",
    user_metadata: { full_name: "Test User", role: "user" },
  },
  {
    email: "demo@example.com",
    password: "testpassword123",
    user_metadata: { full_name: "Demo User", role: "user" },
  },
] as const;

// Sample data for Profile
const SEED_PROFILE: Array<{
  userId: string;
  email: string;
  name: string;
  firmName?: string;
  licenseNumber?: string;
  timezone: string;
  subscriptionTier: string;
  bookingSlug?: string;
  taxSeasonStart?: Date;
  taxSeasonEnd?: Date;
  maxDailyAppointments: number;
  maxDailyAppointmentsTaxSeason: number;
}> = [
  // Record 1
  {
    userId: "Profile Value 1",
    email: "alpha.profile@example.com",
    name: "Profile Alpha",
    firmName: "Profile Value 1",
    licenseNumber: "Profile Value 1",
    timezone: "Profile Value 1",
    subscriptionTier: "Profile Value 1",
    bookingSlug: "Profile Value 1",
    taxSeasonStart: new Date("2024-01-15T10:00:00Z"),
    taxSeasonEnd: new Date("2024-01-15T10:00:00Z"),
    maxDailyAppointments: 100,
    maxDailyAppointmentsTaxSeason: 100,
  },
  // Record 2
  {
    userId: "Profile Value 2",
    email: "beta.profile@example.com",
    name: "Profile Beta",
    firmName: "Profile Value 2",
    licenseNumber: "Profile Value 2",
    timezone: "Profile Value 2",
    subscriptionTier: "Profile Value 2",
    bookingSlug: "Profile Value 2",
    taxSeasonStart: new Date("2024-02-20T14:30:00Z"),
    taxSeasonEnd: new Date("2024-02-20T14:30:00Z"),
    maxDailyAppointments: 250,
    maxDailyAppointmentsTaxSeason: 250,
  },
  // Record 3
  {
    userId: "Profile Value 3",
    email: "gamma.profile@example.com",
    name: "Profile Gamma",
    firmName: "Profile Value 3",
    licenseNumber: "Profile Value 3",
    timezone: "Profile Value 3",
    subscriptionTier: "Profile Value 3",
    bookingSlug: "Profile Value 3",
    taxSeasonStart: new Date("2024-03-10T09:15:00Z"),
    taxSeasonEnd: new Date("2024-03-10T09:15:00Z"),
    maxDailyAppointments: 500,
    maxDailyAppointmentsTaxSeason: 500,
  },
  // Record 4
  {
    userId: "Profile Value 4",
    email: "delta.profile@example.com",
    name: "Profile Delta",
    firmName: "Profile Value 4",
    licenseNumber: "Profile Value 4",
    timezone: "Profile Value 4",
    subscriptionTier: "Profile Value 4",
    bookingSlug: "Profile Value 4",
    taxSeasonStart: new Date("2024-04-05T16:45:00Z"),
    taxSeasonEnd: new Date("2024-04-05T16:45:00Z"),
    maxDailyAppointments: 750,
    maxDailyAppointmentsTaxSeason: 750,
  },
  // Record 5
  {
    userId: "Profile Value 5",
    email: "epsilon.profile@example.com",
    name: "Profile Epsilon",
    firmName: "Profile Value 5",
    licenseNumber: "Profile Value 5",
    timezone: "Profile Value 5",
    subscriptionTier: "Profile Value 5",
    bookingSlug: "Profile Value 5",
    taxSeasonStart: new Date("2024-05-01T08:00:00Z"),
    taxSeasonEnd: new Date("2024-05-01T08:00:00Z"),
    maxDailyAppointments: 1000,
    maxDailyAppointmentsTaxSeason: 1000,
  },
];

// Sample data for Client
const SEED_CLIENT: Array<{
  userId: string;
  name: string;
  email: string;
  phone?: string;
  taxIdLast4?: string;
  filingStatus?: string;
  preferredContact: string;
  notes?: string;
}> = [
  // Record 1
  {
    userId: "Client Value 1",
    name: "Client Alpha",
    email: "alpha.client@example.com",
    phone: "+1-555-0101",
    taxIdLast4: "Client Value 1",
    filingStatus: "Client Value 1",
    preferredContact: "Client Value 1",
    notes: "Initial notes for tracking purposes.",
  },
  // Record 2
  {
    userId: "Client Value 2",
    name: "Client Beta",
    email: "beta.client@example.com",
    phone: "+1-555-0102",
    taxIdLast4: "Client Value 2",
    filingStatus: "Client Value 2",
    preferredContact: "Client Value 2",
    notes: "Follow-up notes with additional context.",
  },
  // Record 3
  {
    userId: "Client Value 3",
    name: "Client Gamma",
    email: "gamma.client@example.com",
    phone: "+1-555-0103",
    taxIdLast4: "Client Value 3",
    filingStatus: "Client Value 3",
    preferredContact: "Client Value 3",
    notes: "Technical notes for implementation reference.",
  },
  // Record 4
  {
    userId: "Client Value 4",
    name: "Client Delta",
    email: "delta.client@example.com",
    phone: "+1-555-0104",
    taxIdLast4: "Client Value 4",
    filingStatus: "Client Value 4",
    preferredContact: "Client Value 4",
    notes: "Review notes pending approval.",
  },
  // Record 5
  {
    userId: "Client Value 5",
    name: "Client Epsilon",
    email: "epsilon.client@example.com",
    phone: "+1-555-0105",
    taxIdLast4: "Client Value 5",
    filingStatus: "Client Value 5",
    preferredContact: "Client Value 5",
    notes: "Archived for compliance and audit purposes.",
  },
];

// Sample data for Service
const SEED_SERVICE: Array<{
  userId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  taxSeasonOnly: boolean;
  requiresDocuments: boolean;
  isActive: boolean;
  bufferMinutes: number;
}> = [
  // Record 1
  {
    userId: "Service Value 1",
    name: "Service Alpha",
    description: "A comprehensive service designed for production use cases.",
    durationMinutes: 100,
    price: 99.99,
    taxSeasonOnly: true,
    requiresDocuments: true,
    isActive: true,
    bufferMinutes: 100,
  },
  // Record 2
  {
    userId: "Service Value 2",
    name: "Service Beta",
    description: "An enhanced service with additional features and capabilities.",
    durationMinutes: 250,
    price: 149.99,
    taxSeasonOnly: false,
    requiresDocuments: false,
    isActive: false,
    bufferMinutes: 250,
  },
  // Record 3
  {
    userId: "Service Value 3",
    name: "Service Gamma",
    description: "A specialized service optimized for specific workflows.",
    durationMinutes: 500,
    price: 299.99,
    taxSeasonOnly: true,
    requiresDocuments: true,
    isActive: true,
    bufferMinutes: 500,
  },
  // Record 4
  {
    userId: "Service Value 4",
    name: "Service Delta",
    description: "A featured service showcasing best practices and patterns.",
    durationMinutes: 750,
    price: 49.99,
    taxSeasonOnly: false,
    requiresDocuments: false,
    isActive: false,
    bufferMinutes: 750,
  },
  // Record 5
  {
    userId: "Service Value 5",
    name: "Service Epsilon",
    description: "An archived service preserved for historical reference.",
    durationMinutes: 1000,
    price: 199.99,
    taxSeasonOnly: true,
    requiresDocuments: true,
    isActive: true,
    bufferMinutes: 1000,
  },
];

// Sample data for Appointment
const SEED_APPOINTMENT: Array<{
  userId: string;
  clientId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  notes?: string;
  meetingLink?: string;
  reminderSent24h: boolean;
  reminderSent1h: boolean;
  cancellationReason?: string;
}> = [
  // Record 1
  {
    userId: "Appointment Value 1",
    clientId: "Appointment Value 1",
    serviceId: "Appointment Value 1",
    startsAt: new Date("2024-01-15T10:00:00Z"),
    endsAt: new Date("2024-01-15T10:00:00Z"),
    status: "active",
    notes: "Initial notes for tracking purposes.",
    meetingLink: "Appointment Value 1",
    reminderSent24h: true,
    reminderSent1h: true,
    cancellationReason: "Appointment Value 1",
  },
  // Record 2
  {
    userId: "Appointment Value 2",
    clientId: "Appointment Value 2",
    serviceId: "Appointment Value 2",
    startsAt: new Date("2024-02-20T14:30:00Z"),
    endsAt: new Date("2024-02-20T14:30:00Z"),
    status: "pending",
    notes: "Follow-up notes with additional context.",
    meetingLink: "Appointment Value 2",
    reminderSent24h: false,
    reminderSent1h: false,
    cancellationReason: "Appointment Value 2",
  },
  // Record 3
  {
    userId: "Appointment Value 3",
    clientId: "Appointment Value 3",
    serviceId: "Appointment Value 3",
    startsAt: new Date("2024-03-10T09:15:00Z"),
    endsAt: new Date("2024-03-10T09:15:00Z"),
    status: "completed",
    notes: "Technical notes for implementation reference.",
    meetingLink: "Appointment Value 3",
    reminderSent24h: true,
    reminderSent1h: true,
    cancellationReason: "Appointment Value 3",
  },
  // Record 4
  {
    userId: "Appointment Value 4",
    clientId: "Appointment Value 4",
    serviceId: "Appointment Value 4",
    startsAt: new Date("2024-04-05T16:45:00Z"),
    endsAt: new Date("2024-04-05T16:45:00Z"),
    status: "draft",
    notes: "Review notes pending approval.",
    meetingLink: "Appointment Value 4",
    reminderSent24h: false,
    reminderSent1h: false,
    cancellationReason: "Appointment Value 4",
  },
  // Record 5
  {
    userId: "Appointment Value 5",
    clientId: "Appointment Value 5",
    serviceId: "Appointment Value 5",
    startsAt: new Date("2024-05-01T08:00:00Z"),
    endsAt: new Date("2024-05-01T08:00:00Z"),
    status: "archived",
    notes: "Archived for compliance and audit purposes.",
    meetingLink: "Appointment Value 5",
    reminderSent24h: true,
    reminderSent1h: true,
    cancellationReason: "Appointment Value 5",
  },
];

// Sample data for Availability
const SEED_AVAILABILITY: Array<{
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isTaxSeason: boolean;
}> = [
  // Record 1
  {
    userId: "Availability Value 1",
    dayOfWeek: 100,
    startTime: "Availability Value 1",
    endTime: "Availability Value 1",
    isTaxSeason: true,
  },
  // Record 2
  {
    userId: "Availability Value 2",
    dayOfWeek: 250,
    startTime: "Availability Value 2",
    endTime: "Availability Value 2",
    isTaxSeason: false,
  },
  // Record 3
  {
    userId: "Availability Value 3",
    dayOfWeek: 500,
    startTime: "Availability Value 3",
    endTime: "Availability Value 3",
    isTaxSeason: true,
  },
  // Record 4
  {
    userId: "Availability Value 4",
    dayOfWeek: 750,
    startTime: "Availability Value 4",
    endTime: "Availability Value 4",
    isTaxSeason: false,
  },
  // Record 5
  {
    userId: "Availability Value 5",
    dayOfWeek: 1000,
    startTime: "Availability Value 5",
    endTime: "Availability Value 5",
    isTaxSeason: true,
  },
];

// Sample data for Document
const SEED_DOCUMENT: Array<{
  userId: string;
  clientId: string;
  appointmentId?: string;
  documentType: string;
  fileUrl?: string;
  fileName?: string;
  status: string;
  taxYear?: number;
  notes?: string;
  rejectionReason?: string;
}> = [
  // Record 1
  {
    userId: "Document Value 1",
    clientId: "Document Value 1",
    appointmentId: "Document Value 1",
    documentType: "Document Value 1",
    fileUrl: "Document Value 1",
    fileName: "Document Value 1",
    status: "active",
    taxYear: 100,
    notes: "Initial notes for tracking purposes.",
    rejectionReason: "Document Value 1",
  },
  // Record 2
  {
    userId: "Document Value 2",
    clientId: "Document Value 2",
    appointmentId: "Document Value 2",
    documentType: "Document Value 2",
    fileUrl: "Document Value 2",
    fileName: "Document Value 2",
    status: "pending",
    taxYear: 250,
    notes: "Follow-up notes with additional context.",
    rejectionReason: "Document Value 2",
  },
  // Record 3
  {
    userId: "Document Value 3",
    clientId: "Document Value 3",
    appointmentId: "Document Value 3",
    documentType: "Document Value 3",
    fileUrl: "Document Value 3",
    fileName: "Document Value 3",
    status: "completed",
    taxYear: 500,
    notes: "Technical notes for implementation reference.",
    rejectionReason: "Document Value 3",
  },
  // Record 4
  {
    userId: "Document Value 4",
    clientId: "Document Value 4",
    appointmentId: "Document Value 4",
    documentType: "Document Value 4",
    fileUrl: "Document Value 4",
    fileName: "Document Value 4",
    status: "draft",
    taxYear: 750,
    notes: "Review notes pending approval.",
    rejectionReason: "Document Value 4",
  },
  // Record 5
  {
    userId: "Document Value 5",
    clientId: "Document Value 5",
    appointmentId: "Document Value 5",
    documentType: "Document Value 5",
    fileUrl: "Document Value 5",
    fileName: "Document Value 5",
    status: "archived",
    taxYear: 1000,
    notes: "Archived for compliance and audit purposes.",
    rejectionReason: "Document Value 5",
  },
];


// ============================================================
// SEED FUNCTIONS
// ============================================================

/**
 * Creates test users in auth.users.
 * Uses Supabase Admin API to create users with known passwords.
 */
async function seedTestUsers(): Promise<Map<string, string>> {
  console.log("\n--- Seeding Test Users ---");
  const userIdMap = new Map<string, string>();

  for (const userData of TEST_USERS) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(
      (u) => u.email === userData.email
    );

    if (existingUser) {
      console.log(`  [SKIP] User already exists: ${userData.email}`);
      userIdMap.set(userData.email, existingUser.id);
      continue;
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: userData.user_metadata,
    });

    if (error) {
      console.error(`  [ERROR] Failed to create user ${userData.email}:`, error.message);
      continue;
    }

    console.log(`  [OK] Created user: ${userData.email}`);
    userIdMap.set(userData.email, data.user.id);
  }

  return userIdMap;
}

/**
 * Seeds Profile table with sample data.
 * Idempotent: checks for existing records before inserting.
 */
async function seedProfile(
  userIdMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("\n--- Seeding Profile ---");
  const idMap = new Map<string, string>();

  // Get the default user ID for owned records
  const defaultUserId = userIdMap.get("user@example.com");
  if (!defaultUserId) {
    console.warn("  [WARN] No default user found, skipping user-owned records");
  }

  for (let i = 0; i < SEED_PROFILE.length; i++) {
    const seedData = SEED_PROFILE[i];

    // Build the insert data with proper typing
    const insertData = {
      user_id: seedData.userId,
      email: seedData.email,
      name: seedData.name,
      firm_name: seedData.firmName,
      license_number: seedData.licenseNumber,
      timezone: seedData.timezone,
      subscription_tier: seedData.subscriptionTier,
      booking_slug: seedData.bookingSlug,
      tax_season_start: seedData.taxSeasonStart,
      tax_season_end: seedData.taxSeasonEnd,
      max_daily_appointments: seedData.maxDailyAppointments,
      max_daily_appointments_tax_season: seedData.maxDailyAppointmentsTaxSeason,
    } as Tables["profile"]["Insert"];


    // Insert the record
    const { data: insertedData, error } = await supabase
      .from("profile")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error(`  [ERROR] Failed to create Profile:`, error.message);
      continue;
    }

    console.log(`  [OK] Created Profile #${i + 1}`);
    idMap.set(`profile_${i}`, insertedData.id);
  }

  return idMap;
}

/**
 * Seeds Client table with sample data.
 * Idempotent: checks for existing records before inserting.
 */
async function seedClient(
  userIdMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("\n--- Seeding Client ---");
  const idMap = new Map<string, string>();

  // Get the default user ID for owned records
  const defaultUserId = userIdMap.get("user@example.com");
  if (!defaultUserId) {
    console.warn("  [WARN] No default user found, skipping user-owned records");
  }

  for (let i = 0; i < SEED_CLIENT.length; i++) {
    const seedData = SEED_CLIENT[i];

    // Build the insert data with proper typing
    const insertData = {
      user_id: seedData.userId,
      name: seedData.name,
      email: seedData.email,
      phone: seedData.phone,
      tax_id_last4: seedData.taxIdLast4,
      filing_status: seedData.filingStatus,
      preferred_contact: seedData.preferredContact,
      notes: seedData.notes,
    } as Tables["client"]["Insert"];


    // Insert the record
    const { data: insertedData, error } = await supabase
      .from("client")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error(`  [ERROR] Failed to create Client:`, error.message);
      continue;
    }

    console.log(`  [OK] Created Client #${i + 1}`);
    idMap.set(`client_${i}`, insertedData.id);
  }

  return idMap;
}

/**
 * Seeds Service table with sample data.
 * Idempotent: checks for existing records before inserting.
 */
async function seedService(
  userIdMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("\n--- Seeding Service ---");
  const idMap = new Map<string, string>();

  // Get the default user ID for owned records
  const defaultUserId = userIdMap.get("user@example.com");
  if (!defaultUserId) {
    console.warn("  [WARN] No default user found, skipping user-owned records");
  }

  for (let i = 0; i < SEED_SERVICE.length; i++) {
    const seedData = SEED_SERVICE[i];

    // Build the insert data with proper typing
    const insertData = {
      user_id: seedData.userId,
      name: seedData.name,
      description: seedData.description,
      duration_minutes: seedData.durationMinutes,
      price: seedData.price,
      tax_season_only: seedData.taxSeasonOnly,
      requires_documents: seedData.requiresDocuments,
      is_active: seedData.isActive,
      buffer_minutes: seedData.bufferMinutes,
    } as Tables["service"]["Insert"];


    // Insert the record
    const { data: insertedData, error } = await supabase
      .from("service")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error(`  [ERROR] Failed to create Service:`, error.message);
      continue;
    }

    console.log(`  [OK] Created Service #${i + 1}`);
    idMap.set(`service_${i}`, insertedData.id);
  }

  return idMap;
}

/**
 * Seeds Appointment table with sample data.
 * Idempotent: checks for existing records before inserting.
 */
async function seedAppointment(
  userIdMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("\n--- Seeding Appointment ---");
  const idMap = new Map<string, string>();

  // Get the default user ID for owned records
  const defaultUserId = userIdMap.get("user@example.com");
  if (!defaultUserId) {
    console.warn("  [WARN] No default user found, skipping user-owned records");
  }

  for (let i = 0; i < SEED_APPOINTMENT.length; i++) {
    const seedData = SEED_APPOINTMENT[i];

    // Build the insert data with proper typing
    const insertData = {
      user_id: seedData.userId,
      client_id: seedData.clientId,
      service_id: seedData.serviceId,
      starts_at: seedData.startsAt,
      ends_at: seedData.endsAt,
      status: seedData.status,
      notes: seedData.notes,
      meeting_link: seedData.meetingLink,
      reminder_sent_24h: seedData.reminderSent24h,
      reminder_sent_1h: seedData.reminderSent1h,
      cancellation_reason: seedData.cancellationReason,
    } as Tables["appointment"]["Insert"];


    // Insert the record
    const { data: insertedData, error } = await supabase
      .from("appointment")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error(`  [ERROR] Failed to create Appointment:`, error.message);
      continue;
    }

    console.log(`  [OK] Created Appointment #${i + 1}`);
    idMap.set(`appointment_${i}`, insertedData.id);
  }

  return idMap;
}

/**
 * Seeds Availability table with sample data.
 * Idempotent: checks for existing records before inserting.
 */
async function seedAvailability(
  userIdMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("\n--- Seeding Availability ---");
  const idMap = new Map<string, string>();

  // Get the default user ID for owned records
  const defaultUserId = userIdMap.get("user@example.com");
  if (!defaultUserId) {
    console.warn("  [WARN] No default user found, skipping user-owned records");
  }

  for (let i = 0; i < SEED_AVAILABILITY.length; i++) {
    const seedData = SEED_AVAILABILITY[i];

    // Build the insert data with proper typing
    const insertData = {
      user_id: seedData.userId,
      day_of_week: seedData.dayOfWeek,
      start_time: seedData.startTime,
      end_time: seedData.endTime,
      is_tax_season: seedData.isTaxSeason,
    } as Tables["availability"]["Insert"];


    // Insert the record
    const { data: insertedData, error } = await supabase
      .from("availability")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error(`  [ERROR] Failed to create Availability:`, error.message);
      continue;
    }

    console.log(`  [OK] Created Availability #${i + 1}`);
    idMap.set(`availability_${i}`, insertedData.id);
  }

  return idMap;
}

/**
 * Seeds Document table with sample data.
 * Idempotent: checks for existing records before inserting.
 */
async function seedDocument(
  userIdMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("\n--- Seeding Document ---");
  const idMap = new Map<string, string>();

  // Get the default user ID for owned records
  const defaultUserId = userIdMap.get("user@example.com");
  if (!defaultUserId) {
    console.warn("  [WARN] No default user found, skipping user-owned records");
  }

  for (let i = 0; i < SEED_DOCUMENT.length; i++) {
    const seedData = SEED_DOCUMENT[i];

    // Build the insert data with proper typing
    const insertData = {
      user_id: seedData.userId,
      client_id: seedData.clientId,
      appointment_id: seedData.appointmentId,
      document_type: seedData.documentType,
      file_url: seedData.fileUrl,
      file_name: seedData.fileName,
      status: seedData.status,
      tax_year: seedData.taxYear,
      notes: seedData.notes,
      rejection_reason: seedData.rejectionReason,
    } as Tables["document"]["Insert"];


    // Insert the record
    const { data: insertedData, error } = await supabase
      .from("document")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error(`  [ERROR] Failed to create Document:`, error.message);
      continue;
    }

    console.log(`  [OK] Created Document #${i + 1}`);
    idMap.set(`document_${i}`, insertedData.id);
  }

  return idMap;
}


/**
 * Seeds all entities in dependency order.
 * Passes ID maps to child seeders to maintain relationships.
 */
async function seedAll(): Promise<void> {
  console.log("=".repeat(60));
  console.log("STARTING DATABASE SEED");
  console.log("=".repeat(60));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  try {
    // 1. Seed test users first (needed for user_id foreign keys)
    const userIdMap = await seedTestUsers();

    // 2. Seed entities in dependency order
    // TODO: Adjust order based on your entity relationships
    // Store ID maps for entities that may be referenced by later entities
    const entityIdMaps: Record<string, Map<string, string>> = {};

    entityIdMaps["profile"] = await seedProfile(userIdMap);
    entityIdMaps["client"] = await seedClient(userIdMap);
    entityIdMaps["service"] = await seedService(userIdMap);
    entityIdMaps["appointment"] = await seedAppointment(userIdMap);
    entityIdMaps["availability"] = await seedAvailability(userIdMap);
    entityIdMaps["document"] = await seedDocument(userIdMap);

    console.log("\n" + "=".repeat(60));
    console.log("SEED COMPLETE");
    console.log("=".repeat(60));
    console.log("\nTest credentials:");
    for (const user of TEST_USERS) {
      console.log(`  ${user.email} / ${user.password}`);
    }
  } catch (error) {
    console.error("\nSEED FAILED:", error);
    process.exit(1);
  }
}

// ============================================================
// RESET FUNCTIONS
// ============================================================

/**
 * Clears all data from the database.
 * WARNING: This is destructive! Only use in development.
 */
async function resetAll(): Promise<void> {
  console.log("=".repeat(60));
  console.log("RESETTING DATABASE");
  console.log("=".repeat(60));
  console.log(`Environment: ${NODE_ENV}`);

  // Double-check we're not in production
  if (isProduction && !isExplicitlyAllowed) {
    console.error("ABORT: Cannot reset production database!");
    process.exit(1);
  }

  try {
    // Delete in reverse dependency order to avoid FK violations
    console.log("  Clearing document...");
    const { error: documentError } = await supabase
      .from("document")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Match all rows

    if (documentError) {
      console.warn(`  [WARN] Failed to clear document:`, documentError.message);
    }

    console.log("  Clearing availability...");
    const { error: availabilityError } = await supabase
      .from("availability")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Match all rows

    if (availabilityError) {
      console.warn(`  [WARN] Failed to clear availability:`, availabilityError.message);
    }

    console.log("  Clearing appointment...");
    const { error: appointmentError } = await supabase
      .from("appointment")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Match all rows

    if (appointmentError) {
      console.warn(`  [WARN] Failed to clear appointment:`, appointmentError.message);
    }

    console.log("  Clearing service...");
    const { error: serviceError } = await supabase
      .from("service")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Match all rows

    if (serviceError) {
      console.warn(`  [WARN] Failed to clear service:`, serviceError.message);
    }

    console.log("  Clearing client...");
    const { error: clientError } = await supabase
      .from("client")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Match all rows

    if (clientError) {
      console.warn(`  [WARN] Failed to clear client:`, clientError.message);
    }

    console.log("  Clearing profile...");
    const { error: profileError } = await supabase
      .from("profile")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Match all rows

    if (profileError) {
      console.warn(`  [WARN] Failed to clear profile:`, profileError.message);
    }

    // Delete test users
    console.log("  Clearing test users...");
    const { data: users } = await supabase.auth.admin.listUsers();
    for (const userData of TEST_USERS) {
      const user = users?.users.find((u) => u.email === userData.email);
      if (user) {
        await supabase.auth.admin.deleteUser(user.id);
        console.log(`    Deleted user: ${userData.email}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("RESET COMPLETE");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\nRESET FAILED:", error);
    process.exit(1);
  }
}

// ============================================================
// CLI RUNNER
// ============================================================

async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case "seed":
      await seedAll();
      break;

    case "reset":
      await resetAll();
      break;

    case "seed-dev":
      // Full refresh: reset then seed
      await resetAll();
      await seedAll();
      break;

    default:
      console.log("Usage: npx tsx scripts/seed.ts <command>");
      console.log("");
      console.log("Commands:");
      console.log("  seed      Seed the database with test data");
      console.log("  reset     Clear all data from the database");
      console.log("  seed-dev  Reset and re-seed (full refresh)");
      console.log("");
      console.log("Environment:");
      console.log("  NEXT_PUBLIC_SUPABASE_URL      Required");
      console.log("  SUPABASE_SERVICE_ROLE_KEY     Required (for bypassing RLS)");
      console.log("  NODE_ENV                      Prevents running in production");
      console.log("  ALLOW_SEED_IN_PRODUCTION      Override production check (dangerous)");
      process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
