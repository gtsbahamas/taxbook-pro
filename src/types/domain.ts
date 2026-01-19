// ============================================================
// DOMAIN TYPES - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// TYPE-FIRST DESIGN: These types are the contract.
// Implementation code MUST conform to these types.
// Do NOT modify types to fit implementation - fix the implementation.
//
// ============================================================

// ============================================================
// BRANDED ID TYPES
// ============================================================
// Branded types prevent accidentally passing wrong ID types

declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

export type ProfileId = Brand<string, "ProfileId">;
export type ClientId = Brand<string, "ClientId">;
export type ServiceId = Brand<string, "ServiceId">;
export type AppointmentId = Brand<string, "AppointmentId">;
export type AvailabilityId = Brand<string, "AvailabilityId">;
export type DocumentId = Brand<string, "DocumentId">;

// ID constructors (use these, not raw strings)
export const profileId = (id: string): ProfileId => id as ProfileId;
export const clientId = (id: string): ClientId => id as ClientId;
export const serviceId = (id: string): ServiceId => id as ServiceId;
export const appointmentId = (id: string): AppointmentId => id as AppointmentId;
export const availabilityId = (id: string): AvailabilityId => id as AvailabilityId;
export const documentId = (id: string): DocumentId => id as DocumentId;

// ============================================================
// CORE DOMAIN ENTITIES
// ============================================================

/**
 * Tax professional profile extending auth.users
 */
export interface Profile {
  readonly id: ProfileId;
  readonly userId: string; // References auth.users(id)
  readonly email: string;
  readonly name: string;
  readonly firmName: string | null; // Name of the tax preparation firm
  readonly licenseNumber: string | null; // CPA or tax preparer license number
  readonly timezone: string; // User&#x27;s timezone for scheduling
  readonly subscriptionTier: string;
  readonly bookingSlug: string | null; // Unique slug for public booking page
  readonly taxSeasonStart: Date | null; // When tax season starts (for capacity limits)
  readonly taxSeasonEnd: Date | null; // When tax season ends
  readonly maxDailyAppointments: number; // Maximum appointments per day during normal times
  readonly maxDailyAppointmentsTaxSeason: number; // Maximum appointments per day during tax season
  // Audit fields
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Tax clients belonging to a practitioner
 */
export interface Client {
  readonly id: ClientId;
  readonly userId: string; // The tax professional who owns this client
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly taxIdLast4: string | null; // Last 4 digits of SSN/TIN for verification
  readonly filingStatus: string | null;
  readonly preferredContact: string;
  readonly notes: string | null;
  // Audit fields
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Service offerings by a tax professional
 */
export interface Service {
  readonly id: ServiceId;
  readonly userId: string; // The tax professional who offers this service
  readonly name: string;
  readonly description: string | null;
  readonly durationMinutes: number;
  readonly price: number | null; // Price in dollars (optional, for display purposes)
  readonly taxSeasonOnly: boolean; // Only available during tax season
  readonly requiresDocuments: boolean; // Client must upload documents before appointment
  readonly isActive: boolean; // Whether this service is currently offered
  readonly bufferMinutes: number; // Buffer time after appointment
  // Audit fields
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Scheduled appointments between practitioners and clients
 */
export interface Appointment {
  readonly id: AppointmentId;
  readonly userId: string; // The tax professional
  readonly clientId: string;
  readonly serviceId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly status: string;
  readonly notes: string | null;
  readonly meetingLink: string | null; // Video conference link (Zoom, etc.)
  readonly reminderSent24h: boolean; // Whether 24h reminder was sent
  readonly reminderSent1h: boolean; // Whether 1h reminder was sent
  readonly cancellationReason: string | null; // Reason for cancellation if applicable
  // Audit fields
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Practitioner working hours
 */
export interface Availability {
  readonly id: AvailabilityId;
  readonly userId: string;
  readonly dayOfWeek: number; // 0&#x3D;Sunday, 1&#x3D;Monday, ..., 6&#x3D;Saturday
  readonly startTime: string; // Start time in HH:MM format
  readonly endTime: string; // End time in HH:MM format
  readonly isTaxSeason: boolean; // Whether this is tax season availability
  // Audit fields
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Client tax documents
 */
export interface Document {
  readonly id: DocumentId;
  readonly userId: string; // The tax professional who owns this
  readonly clientId: string;
  readonly appointmentId: string | null; // Optional link to specific appointment
  readonly documentType: string;
  readonly fileUrl: string | null; // Supabase Storage URL
  readonly fileName: string | null; // Original filename
  readonly status: string;
  readonly taxYear: number | null; // Tax year this document is for
  readonly notes: string | null; // Notes about the document
  readonly rejectionReason: string | null; // Reason for rejection if applicable
  // Audit fields
  readonly createdAt: Date;
  readonly updatedAt: Date;
}


// ============================================================
// ENTITY RELATIONSHIPS
// ============================================================

// Client many-to-one Profile
// Service many-to-one Profile
// Appointment many-to-one Profile
// Appointment many-to-one Client
// Appointment many-to-one Service
// Availability many-to-one Profile
// Document many-to-one Profile
// Document many-to-one Client
// Document many-to-one Appointment

// ============================================================
// VALIDATION CONSTRAINTS
// ============================================================

export const profileConstraints = {
} as const;

export const clientConstraints = {
  min_length_tax_id_last4: 4,
  max_length_tax_id_last4: 4,
  pattern_tax_id_last4: "^[0-9]{4}$",
} as const;

export const serviceConstraints = {
  min_duration_minutes: 15,
  max_duration_minutes: 480,
  min_price: 0,
} as const;

export const appointmentConstraints = {
} as const;

export const availabilityConstraints = {
  min_day_of_week: 0,
  max_day_of_week: 6,
  pattern_start_time: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
  pattern_end_time: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
} as const;

export const documentConstraints = {
  min_tax_year: 2000,
  max_tax_year: 2100,
} as const;


// ============================================================
// INPUT TYPES (for creating/updating)
// ============================================================
// These are what API endpoints accept - no IDs, no audit fields

export interface CreateProfileInput {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly firmName?: string;
  readonly licenseNumber?: string;
  readonly timezone: string;
  readonly subscriptionTier: string;
  readonly bookingSlug?: string;
  readonly taxSeasonStart?: Date;
  readonly taxSeasonEnd?: Date;
  readonly maxDailyAppointments: number;
  readonly maxDailyAppointmentsTaxSeason: number;
}

export interface UpdateProfileInput {
  readonly userId?: string;
  readonly email?: string;
  readonly name?: string;
  readonly firmName?: string;
  readonly licenseNumber?: string;
  readonly timezone?: string;
  readonly subscriptionTier?: string;
  readonly bookingSlug?: string;
  readonly taxSeasonStart?: Date;
  readonly taxSeasonEnd?: Date;
  readonly maxDailyAppointments?: number;
  readonly maxDailyAppointmentsTaxSeason?: number;
}

export interface CreateClientInput {
  readonly userId?: string; // Auto-injected from session
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly taxIdLast4?: string;
  readonly filingStatus?: string;
  readonly preferredContact: string;
  readonly notes?: string;
}

export interface UpdateClientInput {
  readonly userId?: string;
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly taxIdLast4?: string;
  readonly filingStatus?: string;
  readonly preferredContact?: string;
  readonly notes?: string;
}

export interface CreateServiceInput {
  readonly userId?: string; // Auto-injected from session
  readonly name: string;
  readonly description?: string;
  readonly durationMinutes: number;
  readonly price?: number;
  readonly taxSeasonOnly: boolean;
  readonly requiresDocuments: boolean;
  readonly isActive: boolean;
  readonly bufferMinutes: number;
}

export interface UpdateServiceInput {
  readonly userId?: string;
  readonly name?: string;
  readonly description?: string;
  readonly durationMinutes?: number;
  readonly price?: number;
  readonly taxSeasonOnly?: boolean;
  readonly requiresDocuments?: boolean;
  readonly isActive?: boolean;
  readonly bufferMinutes?: number;
}

export interface CreateAppointmentInput {
  readonly userId?: string; // Auto-injected from session
  readonly clientId: string;
  readonly serviceId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly status: string;
  readonly notes?: string;
  readonly meetingLink?: string;
  readonly reminderSent24h: boolean;
  readonly reminderSent1h: boolean;
  readonly cancellationReason?: string;
}

export interface UpdateAppointmentInput {
  readonly userId?: string;
  readonly clientId?: string;
  readonly serviceId?: string;
  readonly startsAt?: Date;
  readonly endsAt?: Date;
  readonly status?: string;
  readonly notes?: string;
  readonly meetingLink?: string;
  readonly reminderSent24h?: boolean;
  readonly reminderSent1h?: boolean;
  readonly cancellationReason?: string;
}

export interface CreateAvailabilityInput {
  readonly userId?: string; // Auto-injected from session
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly isTaxSeason: boolean;
}

export interface UpdateAvailabilityInput {
  readonly userId?: string;
  readonly dayOfWeek?: number;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly isTaxSeason?: boolean;
}

export interface CreateDocumentInput {
  readonly userId?: string; // Auto-injected from session
  readonly clientId: string;
  readonly appointmentId?: string;
  readonly documentType: string;
  readonly fileUrl?: string;
  readonly fileName?: string;
  readonly status: string;
  readonly taxYear?: number;
  readonly notes?: string;
  readonly rejectionReason?: string;
}

export interface UpdateDocumentInput {
  readonly userId?: string;
  readonly clientId?: string;
  readonly appointmentId?: string;
  readonly documentType?: string;
  readonly fileUrl?: string;
  readonly fileName?: string;
  readonly status?: string;
  readonly taxYear?: number;
  readonly notes?: string;
  readonly rejectionReason?: string;
}


// ============================================================
// FILTER/QUERY TYPES
// ============================================================

export interface ProfileFilters {
  readonly email?: string | string[];
  readonly name?: string | string[];
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: keyof Profile;
  readonly orderDir?: "asc" | "desc";
}

export interface ClientFilters {
  readonly name?: string | string[];
  readonly email?: string | string[];
  readonly phone?: string | string[];
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: keyof Client;
  readonly orderDir?: "asc" | "desc";
}

export interface ServiceFilters {
  readonly name?: string | string[];
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: keyof Service;
  readonly orderDir?: "asc" | "desc";
}

export interface AppointmentFilters {
  readonly startsAt?: Date | Date[] | string | string[];
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: keyof Appointment;
  readonly orderDir?: "asc" | "desc";
}

export interface AvailabilityFilters {
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: keyof Availability;
  readonly orderDir?: "asc" | "desc";
}

export interface DocumentFilters {
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: keyof Document;
  readonly orderDir?: "asc" | "desc";
}


// ============================================================
// SENSITIVE DATA MARKERS
// ============================================================

// Fields that should NEVER be logged or exposed in errors
export const SENSITIVE_FIELDS = [
  "Client.tax_id_last4",
] as const;

export type SensitiveField = typeof SENSITIVE_FIELDS[number];

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
