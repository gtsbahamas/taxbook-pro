// ============================================================
// VALIDATION SCHEMAS - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// ZOD-BASED VALIDATION: Runtime type checking with rich error messages.
// Every input is validated BEFORE entering business logic.
// Invalid data is rejected at the boundary, not deep in the system.
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What could go wrong? → Reject invalid data at the boundary
// - What would cause users to abandon? → Clear error messages
// - What would make this unmaintainable? → Consistent validation
//
// Inversion Insights Applied:
//   • What would make a client NOT book? Complex forms, unclear availability, no reminders
//   • What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   • What would cause double-bookings? Race conditions, timezone bugs, unclear UI
// ============================================================

import { z } from "zod";
import {
  type ValidationResult,
  type ValidationError,
  ok,
  err,
} from "@/types/errors";
import type {
  CreateProfileInput,
  UpdateProfileInput,
  ProfileFilters,
  CreateClientInput,
  UpdateClientInput,
  ClientFilters,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentFilters,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
  AvailabilityFilters,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentFilters,
} from "@/types/domain";

// ============================================================
// DEFENSIVE LIMITS (Inversion: "What could go wrong?")
// ============================================================

/**
 * DEFENSIVE: Maximum depth for nested object validation.
 * Prevents stack overflow from deeply nested malicious payloads.
 */
const MAX_OBJECT_DEPTH = 10;

/**
 * DEFENSIVE: Maximum items in batch operations.
 * Prevents array bomb attacks and memory exhaustion.
 */
const MAX_BATCH_SIZE = 100;

/**
 * DEFENSIVE: Maximum string length for general text fields.
 * Prevents memory exhaustion from large payloads.
 */
const MAX_STRING_LENGTH = 10_000;

/**
 * DEFENSIVE: Maximum field name length.
 * Prevents injection attacks via field names.
 */
const MAX_FIELD_NAME_LENGTH = 64;

/**
 * DEFENSIVE: Safe field name pattern.
 * Only allows alphanumeric, underscore, and dot (for nested paths).
 */
const SAFE_FIELD_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

// ============================================================
// COMMON VALIDATION PATTERNS
// ============================================================

const nonEmptyString = (fieldName: string, minLength = 1, maxLength = 255) =>
  z
    .string()
    .min(minLength, `${fieldName} must be at least ${minLength} characters`)
    .max(maxLength, `${fieldName} must be at most ${maxLength} characters`);

/**
 * DEFENSIVE: Large text field with explicit max length.
 * Use for description, content, notes fields.
 */
const textField = (fieldName: string, maxLength = MAX_STRING_LENGTH) =>
  z
    .string()
    .max(maxLength, `${fieldName} must be at most ${maxLength} characters`);

const emailSchema = z
  .string()
  .email("Must be a valid email address")
  .max(255, "Email must be at most 255 characters")
  .transform((email) => email.toLowerCase().trim()); // DEFENSIVE: Normalize

const uuidSchema = z.string().uuid("Must be a valid UUID");

const positiveNumber = (fieldName: string) =>
  z.number().positive(`${fieldName} must be a positive number`);

const nonNegativeNumber = (fieldName: string) =>
  z.number().nonnegative(`${fieldName} cannot be negative`);

/**
 * DEFENSIVE: Safe integer with bounds.
 * Prevents integer overflow attacks.
 */
const safeInteger = (fieldName: string, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) =>
  z
    .number()
    .int(`${fieldName} must be an integer`)
    .min(min, `${fieldName} must be at least ${min}`)
    .max(max, `${fieldName} must be at most ${max}`);

const dateSchema = z.coerce.date();

const booleanSchema = z.boolean();

/**
 * DEFENSIVE: URL validation with protocol restriction.
 * Prevents javascript: and data: URL injection.
 */
const safeUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (url) => url.startsWith("https://") || url.startsWith("http://"),
    "URL must use http or https protocol"
  );

// ============================================================
// ZOD ERROR TO VALIDATION ERROR CONVERTER
// ============================================================

const zodToValidationErrors = (error: z.ZodError): ValidationError[] =>
  error.errors.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
    code: mapZodCodeToValidationCode(issue.code),
  }));

const mapZodCodeToValidationCode = (
  zodCode: z.ZodIssueCode
): ValidationError["code"] => {
  switch (zodCode) {
    case "invalid_type":
      return "invalid_format";
    case "too_small":
      return "too_short";
    case "too_big":
      return "too_long";
    case "invalid_string":
      return "invalid_format";
    case "custom":
      return "invalid_state";
    default:
      return "invalid_format";
  }
};

// ============================================================
// VALIDATION WRAPPER
// ============================================================

const validate = <T>(
  schema: z.ZodType<T>,
  input: unknown
): ValidationResult<T> => {
  const result = schema.safeParse(input);
  if (result.success) {
    return ok(result.data);
  }
  return err(zodToValidationErrors(result.error));
};

// ============================================================
// ENTITY VALIDATION SCHEMAS
// ============================================================

// ------------------------------------------------------------
// Profile Schemas
// ------------------------------------------------------------

/**
 * Schema for creating a new Profile
 * Auto-generated with constraints from entity definition.
 */
export const CreateProfileSchema = z.object({
  userId: uuidSchema,
  email: emailSchema,
  name: nonEmptyString("name", 1, 255),
  firmName: textField("firmName").optional(),
  licenseNumber: textField("licenseNumber").optional(),
  timezone: nonEmptyString("timezone", 1, 255),
  subscriptionTier: nonEmptyString("subscriptionTier", 1, 255),
  bookingSlug: textField("bookingSlug").optional(),
  taxSeasonStart: dateSchema.optional(),
  taxSeasonEnd: dateSchema.optional(),
  maxDailyAppointments: z.number(),
  maxDailyAppointmentsTaxSeason: z.number(),
});

/**
 * Schema for updating an existing Profile (all fields optional)
 */
export const UpdateProfileSchema = z.object({
  userId: uuidSchema.optional(),
  email: emailSchema.optional(),
  name: textField("name").optional(),
  firmName: textField("firmName").optional(),
  licenseNumber: textField("licenseNumber").optional(),
  timezone: textField("timezone").optional(),
  subscriptionTier: textField("subscriptionTier").optional(),
  bookingSlug: textField("bookingSlug").optional(),
  taxSeasonStart: dateSchema.optional(),
  taxSeasonEnd: dateSchema.optional(),
  maxDailyAppointments: z.number().optional(),
  maxDailyAppointmentsTaxSeason: z.number().optional(),
});

/**
 * Schema for filtering/querying Profile list
 */
export const ProfileFiltersSchema = z.object({
  email: z.union([z.string(), z.array(z.string())]).optional(),
  name: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  orderBy: z.enum(["id", "userId", "email", "name", "firmName", "licenseNumber", "timezone", "subscriptionTier", "bookingSlug", "taxSeasonStart", "taxSeasonEnd", "maxDailyAppointments", "maxDailyAppointmentsTaxSeason", "createdAt", "updatedAt", "createdAt", "updatedAt"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
});

/**
 * Validate input for creating a Profile
 */
export const validateProfileInput = (
  input: unknown
): ValidationResult<CreateProfileInput> =>
  validate(CreateProfileSchema, input);

/**
 * Validate input for updating a Profile
 */
export const validateUpdateProfileInput = (
  input: unknown
): ValidationResult<UpdateProfileInput> =>
  validate(UpdateProfileSchema, input);

/**
 * Validate filters for querying Profile list
 */
export const validateProfileFilters = (
  input: unknown
): ValidationResult<ProfileFilters> =>
  validate(ProfileFiltersSchema, input);

// ------------------------------------------------------------
// Client Schemas
// ------------------------------------------------------------

/**
 * Schema for creating a new Client
 * Auto-generated with constraints from entity definition.
 */
export const CreateClientSchema = z.object({
  userId: uuidSchema.optional(), // Auto-injected from session
  name: nonEmptyString("name", 1, 255),
  email: emailSchema,
  phone: textField("phone").optional(),
  taxIdLast4: textField("taxIdLast4").optional(),
  filingStatus: textField("filingStatus").optional(),
  preferredContact: nonEmptyString("preferredContact", 1, 255),
  notes: textField("notes").optional(),
});

/**
 * Schema for updating an existing Client (all fields optional)
 */
export const UpdateClientSchema = z.object({
  userId: uuidSchema.optional(),
  name: textField("name").optional(),
  email: emailSchema.optional(),
  phone: textField("phone").optional(),
  taxIdLast4: textField("taxIdLast4").optional(),
  filingStatus: textField("filingStatus").optional(),
  preferredContact: textField("preferredContact").optional(),
  notes: textField("notes").optional(),
});

/**
 * Schema for filtering/querying Client list
 */
export const ClientFiltersSchema = z.object({
  name: z.union([z.string(), z.array(z.string())]).optional(),
  email: z.union([z.string(), z.array(z.string())]).optional(),
  phone: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  orderBy: z.enum(["id", "userId", "name", "email", "phone", "taxIdLast4", "filingStatus", "preferredContact", "notes", "createdAt", "updatedAt", "createdAt", "updatedAt"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
});

/**
 * Validate input for creating a Client
 */
export const validateClientInput = (
  input: unknown
): ValidationResult<CreateClientInput> =>
  validate(CreateClientSchema, input);

/**
 * Validate input for updating a Client
 */
export const validateUpdateClientInput = (
  input: unknown
): ValidationResult<UpdateClientInput> =>
  validate(UpdateClientSchema, input);

/**
 * Validate filters for querying Client list
 */
export const validateClientFilters = (
  input: unknown
): ValidationResult<ClientFilters> =>
  validate(ClientFiltersSchema, input);

// ------------------------------------------------------------
// Service Schemas
// ------------------------------------------------------------

/**
 * Schema for creating a new Service
 * Auto-generated with constraints from entity definition.
 */
export const CreateServiceSchema = z.object({
  userId: uuidSchema.optional(), // Auto-injected from session
  name: nonEmptyString("name", 1, 255),
  description: textField("description").optional(),
  durationMinutes: z.number(),
  price: z.number().optional(),
  taxSeasonOnly: booleanSchema,
  requiresDocuments: booleanSchema,
  isActive: booleanSchema,
  bufferMinutes: z.number(),
});

/**
 * Schema for updating an existing Service (all fields optional)
 */
export const UpdateServiceSchema = z.object({
  userId: uuidSchema.optional(),
  name: textField("name").optional(),
  description: textField("description").optional(),
  durationMinutes: z.number().optional(),
  price: z.number().optional(),
  taxSeasonOnly: booleanSchema.optional(),
  requiresDocuments: booleanSchema.optional(),
  isActive: booleanSchema.optional(),
  bufferMinutes: z.number().optional(),
});

/**
 * Schema for filtering/querying Service list
 */
export const ServiceFiltersSchema = z.object({
  name: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  orderBy: z.enum(["id", "userId", "name", "description", "durationMinutes", "price", "taxSeasonOnly", "requiresDocuments", "isActive", "bufferMinutes", "createdAt", "updatedAt", "createdAt", "updatedAt"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
});

/**
 * Validate input for creating a Service
 */
export const validateServiceInput = (
  input: unknown
): ValidationResult<CreateServiceInput> =>
  validate(CreateServiceSchema, input);

/**
 * Validate input for updating a Service
 */
export const validateUpdateServiceInput = (
  input: unknown
): ValidationResult<UpdateServiceInput> =>
  validate(UpdateServiceSchema, input);

/**
 * Validate filters for querying Service list
 */
export const validateServiceFilters = (
  input: unknown
): ValidationResult<ServiceFilters> =>
  validate(ServiceFiltersSchema, input);

// ------------------------------------------------------------
// Appointment Schemas
// ------------------------------------------------------------

/**
 * Schema for creating a new Appointment
 * Auto-generated with constraints from entity definition.
 */
export const CreateAppointmentSchema = z.object({
  userId: uuidSchema.optional(), // Auto-injected from session
  clientId: uuidSchema,
  serviceId: uuidSchema,
  startsAt: dateSchema,
  endsAt: dateSchema,
  status: nonEmptyString("status", 1, 255),
  notes: textField("notes").optional(),
  meetingLink: textField("meetingLink").optional(),
  reminderSent24h: booleanSchema,
  reminderSent1h: booleanSchema,
  cancellationReason: textField("cancellationReason").optional(),
});

/**
 * Schema for updating an existing Appointment (all fields optional)
 */
export const UpdateAppointmentSchema = z.object({
  userId: uuidSchema.optional(),
  clientId: uuidSchema.optional(),
  serviceId: uuidSchema.optional(),
  startsAt: dateSchema.optional(),
  endsAt: dateSchema.optional(),
  status: textField("status").optional(),
  notes: textField("notes").optional(),
  meetingLink: textField("meetingLink").optional(),
  reminderSent24h: booleanSchema.optional(),
  reminderSent1h: booleanSchema.optional(),
  cancellationReason: textField("cancellationReason").optional(),
});

/**
 * Schema for filtering/querying Appointment list
 */
export const AppointmentFiltersSchema = z.object({
  startsAt: z.union([z.string(), z.array(z.string()), z.date(), z.array(z.date())]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  orderBy: z.enum(["id", "userId", "clientId", "serviceId", "startsAt", "endsAt", "status", "notes", "meetingLink", "reminderSent24h", "reminderSent1h", "cancellationReason", "createdAt", "updatedAt"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
});

/**
 * Validate input for creating a Appointment
 */
export const validateAppointmentInput = (
  input: unknown
): ValidationResult<CreateAppointmentInput> =>
  validate(CreateAppointmentSchema, input);

/**
 * Validate input for updating a Appointment
 */
export const validateUpdateAppointmentInput = (
  input: unknown
): ValidationResult<UpdateAppointmentInput> =>
  validate(UpdateAppointmentSchema, input);

/**
 * Validate filters for querying Appointment list
 */
export const validateAppointmentFilters = (
  input: unknown
): ValidationResult<AppointmentFilters> =>
  validate(AppointmentFiltersSchema, input);

// ------------------------------------------------------------
// Availability Schemas
// ------------------------------------------------------------

/**
 * Schema for creating a new Availability
 * Auto-generated with constraints from entity definition.
 */
export const CreateAvailabilitySchema = z.object({
  userId: uuidSchema.optional(), // Auto-injected from session
  dayOfWeek: z.number(),
  startTime: nonEmptyString("startTime", 1, 255),
  endTime: nonEmptyString("endTime", 1, 255),
  isTaxSeason: booleanSchema,
});

/**
 * Schema for updating an existing Availability (all fields optional)
 */
export const UpdateAvailabilitySchema = z.object({
  userId: uuidSchema.optional(),
  dayOfWeek: z.number().optional(),
  startTime: textField("startTime").optional(),
  endTime: textField("endTime").optional(),
  isTaxSeason: booleanSchema.optional(),
});

/**
 * Schema for filtering/querying Availability list
 */
export const AvailabilityFiltersSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  orderBy: z.enum(["id", "userId", "dayOfWeek", "startTime", "endTime", "isTaxSeason", "createdAt", "updatedAt", "createdAt", "updatedAt"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
});

/**
 * Validate input for creating a Availability
 */
export const validateAvailabilityInput = (
  input: unknown
): ValidationResult<CreateAvailabilityInput> =>
  validate(CreateAvailabilitySchema, input);

/**
 * Validate input for updating a Availability
 */
export const validateUpdateAvailabilityInput = (
  input: unknown
): ValidationResult<UpdateAvailabilityInput> =>
  validate(UpdateAvailabilitySchema, input);

/**
 * Validate filters for querying Availability list
 */
export const validateAvailabilityFilters = (
  input: unknown
): ValidationResult<AvailabilityFilters> =>
  validate(AvailabilityFiltersSchema, input);

// ------------------------------------------------------------
// Document Schemas
// ------------------------------------------------------------

/**
 * Schema for creating a new Document
 * Auto-generated with constraints from entity definition.
 */
export const CreateDocumentSchema = z.object({
  userId: uuidSchema.optional(), // Auto-injected from session
  clientId: uuidSchema,
  appointmentId: uuidSchema.optional(),
  documentType: nonEmptyString("documentType", 1, 255),
  fileUrl: safeUrlSchema.optional(),
  fileName: textField("fileName").optional(),
  status: nonEmptyString("status", 1, 255),
  taxYear: z.number().optional(),
  notes: textField("notes").optional(),
  rejectionReason: textField("rejectionReason").optional(),
});

/**
 * Schema for updating an existing Document (all fields optional)
 */
export const UpdateDocumentSchema = z.object({
  userId: uuidSchema.optional(),
  clientId: uuidSchema.optional(),
  appointmentId: uuidSchema.optional(),
  documentType: textField("documentType").optional(),
  fileUrl: safeUrlSchema.optional(),
  fileName: textField("fileName").optional(),
  status: textField("status").optional(),
  taxYear: z.number().optional(),
  notes: textField("notes").optional(),
  rejectionReason: textField("rejectionReason").optional(),
});

/**
 * Schema for filtering/querying Document list
 */
export const DocumentFiltersSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  orderBy: z.enum(["id", "userId", "clientId", "appointmentId", "documentType", "fileUrl", "fileName", "status", "taxYear", "notes", "rejectionReason", "createdAt", "updatedAt", "createdAt", "updatedAt"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
});

/**
 * Validate input for creating a Document
 */
export const validateDocumentInput = (
  input: unknown
): ValidationResult<CreateDocumentInput> =>
  validate(CreateDocumentSchema, input);

/**
 * Validate input for updating a Document
 */
export const validateUpdateDocumentInput = (
  input: unknown
): ValidationResult<UpdateDocumentInput> =>
  validate(UpdateDocumentSchema, input);

/**
 * Validate filters for querying Document list
 */
export const validateDocumentFilters = (
  input: unknown
): ValidationResult<DocumentFilters> =>
  validate(DocumentFiltersSchema, input);


// ============================================================
// ID VALIDATION
// ============================================================

export const validateProfileId = (id: unknown): ValidationResult<string> =>
  validate(uuidSchema, id);

export const validateClientId = (id: unknown): ValidationResult<string> =>
  validate(uuidSchema, id);

export const validateServiceId = (id: unknown): ValidationResult<string> =>
  validate(uuidSchema, id);

export const validateAppointmentId = (id: unknown): ValidationResult<string> =>
  validate(uuidSchema, id);

export const validateAvailabilityId = (id: unknown): ValidationResult<string> =>
  validate(uuidSchema, id);

export const validateDocumentId = (id: unknown): ValidationResult<string> =>
  validate(uuidSchema, id);


// ============================================================
// BATCH VALIDATION HELPERS (with Defensive Limits)
// ============================================================

/**
 * DEFENSIVE: Validate an array of items with size limit.
 * Prevents array bomb attacks and memory exhaustion.
 *
 * @param maxItems - Maximum allowed items (default: MAX_BATCH_SIZE)
 */
export const validateArray = <T>(
  schema: z.ZodType<T>,
  items: unknown[],
  maxItems: number = MAX_BATCH_SIZE
): ValidationResult<T[]> => {
  // DEFENSIVE: Check array size before processing
  if (!Array.isArray(items)) {
    return err([{ field: "root", message: "Expected an array", code: "invalid_format" }]);
  }

  if (items.length > maxItems) {
    return err([{
      field: "root",
      message: `Batch size ${items.length} exceeds maximum of ${maxItems}`,
      code: "too_long",
    }]);
  }

  const results: T[] = [];
  const allErrors: ValidationError[] = [];

  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      results.push(result.data);
    } else {
      const indexedErrors = zodToValidationErrors(result.error).map((e) => ({
        ...e,
        field: `[${index}].${e.field}`,
      }));
      allErrors.push(...indexedErrors);
    }
  });

  if (allErrors.length > 0) {
    return err(allErrors);
  }
  return ok(results);
};

/**
 * DEFENSIVE: Validate field name is safe for use in queries.
 * Prevents injection attacks via field names in dynamic queries.
 */
export const validateFieldName = (fieldName: string): ValidationResult<string> => {
  if (!fieldName || typeof fieldName !== "string") {
    return err([{ field: "fieldName", message: "Field name is required", code: "required" }]);
  }

  if (fieldName.length > MAX_FIELD_NAME_LENGTH) {
    return err([{
      field: "fieldName",
      message: `Field name exceeds maximum length of ${MAX_FIELD_NAME_LENGTH}`,
      code: "too_long",
    }]);
  }

  if (!SAFE_FIELD_NAME_PATTERN.test(fieldName)) {
    return err([{
      field: "fieldName",
      message: "Field name contains invalid characters",
      code: "invalid_format",
    }]);
  }

  return ok(fieldName);
};

/**
 * DEFENSIVE: Validate sort/order parameters.
 * Prevents SQL injection via ORDER BY clauses.
 */
export const validateSortParams = <T extends string>(
  orderBy: unknown,
  orderDir: unknown,
  allowedFields: readonly T[]
): ValidationResult<{ orderBy?: T; orderDir?: "asc" | "desc" }> => {
  const result: { orderBy?: T; orderDir?: "asc" | "desc" } = {};

  if (orderBy !== undefined) {
    if (typeof orderBy !== "string") {
      return err([{ field: "orderBy", message: "orderBy must be a string", code: "invalid_format" }]);
    }
    if (!allowedFields.includes(orderBy as T)) {
      return err([{
        field: "orderBy",
        message: `orderBy must be one of: ${allowedFields.join(", ")}`,
        code: "invalid_format",
      }]);
    }
    result.orderBy = orderBy as T;
  }

  if (orderDir !== undefined) {
    if (orderDir !== "asc" && orderDir !== "desc") {
      return err([{
        field: "orderDir",
        message: "orderDir must be 'asc' or 'desc'",
        code: "invalid_format",
      }]);
    }
    result.orderDir = orderDir;
  }

  return ok(result);
};

/**
 * DEFENSIVE: Validate pagination parameters with bounds.
 * Prevents resource exhaustion via extreme pagination.
 */
export const validatePagination = (
  limit: unknown,
  offset: unknown,
  maxLimit: number = 100,
  maxOffset: number = 1_000_000
): ValidationResult<{ limit: number; offset: number }> => {
  const limitNum = typeof limit === "number" ? limit : typeof limit === "string" ? parseInt(limit, 10) : 20;
  const offsetNum = typeof offset === "number" ? offset : typeof offset === "string" ? parseInt(offset, 10) : 0;

  if (isNaN(limitNum) || limitNum < 1) {
    return err([{ field: "limit", message: "limit must be a positive integer", code: "out_of_range" }]);
  }

  if (limitNum > maxLimit) {
    return err([{ field: "limit", message: `limit cannot exceed ${maxLimit}`, code: "too_long" }]);
  }

  if (isNaN(offsetNum) || offsetNum < 0) {
    return err([{ field: "offset", message: "offset must be a non-negative integer", code: "out_of_range" }]);
  }

  if (offsetNum > maxOffset) {
    return err([{ field: "offset", message: `offset cannot exceed ${maxOffset}`, code: "too_long" }]);
  }

  return ok({ limit: limitNum, offset: offsetNum });
};

// ============================================================
// FIELD TYPE MAPPING (Applied Inline in Schemas)
// ============================================================
// Field types are mapped to Zod schemas with constraints:
//
// string      -> z.string() with minLength/maxLength
// string+enum -> z.enum([...values])
// email       -> emailSchema (normalized)
// url         -> safeUrlSchema (protocol validation)
// number      -> z.number() with min/max
// boolean     -> booleanSchema
// date/Date   -> dateSchema (coerced)
// uuid        -> uuidSchema
// json/jsonb  -> z.record(z.unknown())
// array       -> z.array(...)
//
// Constraints from entity definition:
// - constraints.minLength/maxLength -> string bounds
// - constraints.min/max -> number bounds
// - constraints.enum -> z.enum([...])
// - constraints.pattern -> z.regex(...) [future]
//
// ============================================================

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
