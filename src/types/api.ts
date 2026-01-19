// ============================================================
// API CONTRACTS - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// API-FIRST DESIGN: Define request/response contracts BEFORE routes.
// These types are shared between client and server.
// Frontend uses these for type-safe API calls.
// Backend uses these to validate and respond.
//
// ============================================================

import type { Result } from "./errors.js";
import type { ApiError, ValidationError } from "./errors.js";
import type { Profile, ProfileId, CreateProfileInput, UpdateProfileInput, ProfileFilters } from "./domain.js";
import type { Client, ClientId, CreateClientInput, UpdateClientInput, ClientFilters } from "./domain.js";
import type { Service, ServiceId, CreateServiceInput, UpdateServiceInput, ServiceFilters } from "./domain.js";
import type { Appointment, AppointmentId, CreateAppointmentInput, UpdateAppointmentInput, AppointmentFilters } from "./domain.js";
import type { Availability, AvailabilityId, CreateAvailabilityInput, UpdateAvailabilityInput, AvailabilityFilters } from "./domain.js";
import type { Document, DocumentId, CreateDocumentInput, UpdateDocumentInput, DocumentFilters } from "./domain.js";

// ============================================================
// API RESPONSE WRAPPER
// ============================================================

/**
 * Standard API response envelope.
 * All API responses use this shape.
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly type: string;
    readonly message: string;
    readonly details?: ValidationError[];
    readonly requestId?: string;
  };
  readonly meta?: {
    readonly total?: number;
    readonly page?: number;
    readonly limit?: number;
    readonly hasMore?: boolean;
  };
}

// Response constructors
export const apiSuccess = <T>(data: T, meta?: ApiResponse<T>["meta"]): ApiResponse<T> => ({
  success: true,
  data,
  meta,
});

export const apiError = (error: ApiError, requestId?: string): ApiResponse<never> => ({
  success: false,
  error: {
    type: error.type,
    message: "message" in error ? error.message : error.type,
    details: error.type === "bad_request" ? error.details : undefined,
    requestId,
  },
});

// ============================================================
// PAGINATION
// ============================================================

export interface PaginationParams {
  readonly page?: number;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
  readonly nextCursor?: string;
}

// ============================================================
// ENTITY API CONTRACTS
// ============================================================

// --- Profile API ---

/**
 * GET /api/profile
 * List Profile with optional filters
 */
export interface ListProfileRequest extends PaginationParams {
  readonly filters?: ProfileFilters;
}

export type ListProfileResponse = ApiResponse<PaginatedResponse<Profile>>;

/**
 * GET /api/profile/:id
 * Get single Profile by ID
 */
export interface GetProfileRequest {
  readonly id: ProfileId;
}

export type GetProfileResponse = ApiResponse<Profile>;

/**
 * POST /api/profile
 * Create new Profile
 */
export interface CreateProfileRequest {
  readonly data: CreateProfileInput;
}

export type CreateProfileResponse = ApiResponse<Profile>;

/**
 * PATCH /api/profile/:id
 * Update existing Profile
 */
export interface UpdateProfileRequest {
  readonly id: ProfileId;
  readonly data: UpdateProfileInput;
}

export type UpdateProfileResponse = ApiResponse<Profile>;

/**
 * DELETE /api/profile/:id
 * Delete Profile
 */
export interface DeleteProfileRequest {
  readonly id: ProfileId;
}

export type DeleteProfileResponse = ApiResponse<{ deleted: true }>;

// --- Client API ---

/**
 * GET /api/client
 * List Client with optional filters
 */
export interface ListClientRequest extends PaginationParams {
  readonly filters?: ClientFilters;
}

export type ListClientResponse = ApiResponse<PaginatedResponse<Client>>;

/**
 * GET /api/client/:id
 * Get single Client by ID
 */
export interface GetClientRequest {
  readonly id: ClientId;
}

export type GetClientResponse = ApiResponse<Client>;

/**
 * POST /api/client
 * Create new Client
 */
export interface CreateClientRequest {
  readonly data: CreateClientInput;
}

export type CreateClientResponse = ApiResponse<Client>;

/**
 * PATCH /api/client/:id
 * Update existing Client
 */
export interface UpdateClientRequest {
  readonly id: ClientId;
  readonly data: UpdateClientInput;
}

export type UpdateClientResponse = ApiResponse<Client>;

/**
 * DELETE /api/client/:id
 * Delete Client
 */
export interface DeleteClientRequest {
  readonly id: ClientId;
}

export type DeleteClientResponse = ApiResponse<{ deleted: true }>;

// --- Service API ---

/**
 * GET /api/service
 * List Service with optional filters
 */
export interface ListServiceRequest extends PaginationParams {
  readonly filters?: ServiceFilters;
}

export type ListServiceResponse = ApiResponse<PaginatedResponse<Service>>;

/**
 * GET /api/service/:id
 * Get single Service by ID
 */
export interface GetServiceRequest {
  readonly id: ServiceId;
}

export type GetServiceResponse = ApiResponse<Service>;

/**
 * POST /api/service
 * Create new Service
 */
export interface CreateServiceRequest {
  readonly data: CreateServiceInput;
}

export type CreateServiceResponse = ApiResponse<Service>;

/**
 * PATCH /api/service/:id
 * Update existing Service
 */
export interface UpdateServiceRequest {
  readonly id: ServiceId;
  readonly data: UpdateServiceInput;
}

export type UpdateServiceResponse = ApiResponse<Service>;

/**
 * DELETE /api/service/:id
 * Delete Service
 */
export interface DeleteServiceRequest {
  readonly id: ServiceId;
}

export type DeleteServiceResponse = ApiResponse<{ deleted: true }>;

// --- Appointment API ---

/**
 * GET /api/appointment
 * List Appointment with optional filters
 */
export interface ListAppointmentRequest extends PaginationParams {
  readonly filters?: AppointmentFilters;
}

export type ListAppointmentResponse = ApiResponse<PaginatedResponse<Appointment>>;

/**
 * GET /api/appointment/:id
 * Get single Appointment by ID
 */
export interface GetAppointmentRequest {
  readonly id: AppointmentId;
}

export type GetAppointmentResponse = ApiResponse<Appointment>;

/**
 * POST /api/appointment
 * Create new Appointment
 */
export interface CreateAppointmentRequest {
  readonly data: CreateAppointmentInput;
}

export type CreateAppointmentResponse = ApiResponse<Appointment>;

/**
 * PATCH /api/appointment/:id
 * Update existing Appointment
 */
export interface UpdateAppointmentRequest {
  readonly id: AppointmentId;
  readonly data: UpdateAppointmentInput;
}

export type UpdateAppointmentResponse = ApiResponse<Appointment>;

/**
 * DELETE /api/appointment/:id
 * Delete Appointment
 */
export interface DeleteAppointmentRequest {
  readonly id: AppointmentId;
}

export type DeleteAppointmentResponse = ApiResponse<{ deleted: true }>;

// --- Availability API ---

/**
 * GET /api/availability
 * List Availability with optional filters
 */
export interface ListAvailabilityRequest extends PaginationParams {
  readonly filters?: AvailabilityFilters;
}

export type ListAvailabilityResponse = ApiResponse<PaginatedResponse<Availability>>;

/**
 * GET /api/availability/:id
 * Get single Availability by ID
 */
export interface GetAvailabilityRequest {
  readonly id: AvailabilityId;
}

export type GetAvailabilityResponse = ApiResponse<Availability>;

/**
 * POST /api/availability
 * Create new Availability
 */
export interface CreateAvailabilityRequest {
  readonly data: CreateAvailabilityInput;
}

export type CreateAvailabilityResponse = ApiResponse<Availability>;

/**
 * PATCH /api/availability/:id
 * Update existing Availability
 */
export interface UpdateAvailabilityRequest {
  readonly id: AvailabilityId;
  readonly data: UpdateAvailabilityInput;
}

export type UpdateAvailabilityResponse = ApiResponse<Availability>;

/**
 * DELETE /api/availability/:id
 * Delete Availability
 */
export interface DeleteAvailabilityRequest {
  readonly id: AvailabilityId;
}

export type DeleteAvailabilityResponse = ApiResponse<{ deleted: true }>;

// --- Document API ---

/**
 * GET /api/document
 * List Document with optional filters
 */
export interface ListDocumentRequest extends PaginationParams {
  readonly filters?: DocumentFilters;
}

export type ListDocumentResponse = ApiResponse<PaginatedResponse<Document>>;

/**
 * GET /api/document/:id
 * Get single Document by ID
 */
export interface GetDocumentRequest {
  readonly id: DocumentId;
}

export type GetDocumentResponse = ApiResponse<Document>;

/**
 * POST /api/document
 * Create new Document
 */
export interface CreateDocumentRequest {
  readonly data: CreateDocumentInput;
}

export type CreateDocumentResponse = ApiResponse<Document>;

/**
 * PATCH /api/document/:id
 * Update existing Document
 */
export interface UpdateDocumentRequest {
  readonly id: DocumentId;
  readonly data: UpdateDocumentInput;
}

export type UpdateDocumentResponse = ApiResponse<Document>;

/**
 * DELETE /api/document/:id
 * Delete Document
 */
export interface DeleteDocumentRequest {
  readonly id: DocumentId;
}

export type DeleteDocumentResponse = ApiResponse<{ deleted: true }>;


// ============================================================
// BATCH OPERATIONS
// ============================================================

/**
 * POST /api/profile/batch
 * Create multiple Profile in one request
 */
export interface BatchCreateProfileRequest {
  readonly items: CreateProfileInput[];
}

export type BatchCreateProfileResponse = ApiResponse<{
  readonly created: Profile[];
  readonly errors: Array<{ index: number; error: ValidationError[] }>;
}>;

/**
 * POST /api/client/batch
 * Create multiple Client in one request
 */
export interface BatchCreateClientRequest {
  readonly items: CreateClientInput[];
}

export type BatchCreateClientResponse = ApiResponse<{
  readonly created: Client[];
  readonly errors: Array<{ index: number; error: ValidationError[] }>;
}>;

/**
 * POST /api/service/batch
 * Create multiple Service in one request
 */
export interface BatchCreateServiceRequest {
  readonly items: CreateServiceInput[];
}

export type BatchCreateServiceResponse = ApiResponse<{
  readonly created: Service[];
  readonly errors: Array<{ index: number; error: ValidationError[] }>;
}>;

/**
 * POST /api/appointment/batch
 * Create multiple Appointment in one request
 */
export interface BatchCreateAppointmentRequest {
  readonly items: CreateAppointmentInput[];
}

export type BatchCreateAppointmentResponse = ApiResponse<{
  readonly created: Appointment[];
  readonly errors: Array<{ index: number; error: ValidationError[] }>;
}>;

/**
 * POST /api/availability/batch
 * Create multiple Availability in one request
 */
export interface BatchCreateAvailabilityRequest {
  readonly items: CreateAvailabilityInput[];
}

export type BatchCreateAvailabilityResponse = ApiResponse<{
  readonly created: Availability[];
  readonly errors: Array<{ index: number; error: ValidationError[] }>;
}>;

/**
 * POST /api/document/batch
 * Create multiple Document in one request
 */
export interface BatchCreateDocumentRequest {
  readonly items: CreateDocumentInput[];
}

export type BatchCreateDocumentResponse = ApiResponse<{
  readonly created: Document[];
  readonly errors: Array<{ index: number; error: ValidationError[] }>;
}>;


// ============================================================
// ACTION ENDPOINTS (non-CRUD operations)
// ============================================================

/**
 * POST /api//api/appointments/:id/confirm
 * Transition Appointment from draft to confirmed
 */
export interface ConfirmAppointmentRequest {
  readonly id: string;
}

export type ConfirmAppointmentResponse = ApiResponse<Appointment>;

/**
 * POST /api//api/appointments/:id/start
 * Transition Appointment from confirmed to in_progress
 */
export interface StartAppointmentRequest {
  readonly id: string;
}

export type StartAppointmentResponse = ApiResponse<Appointment>;

/**
 * POST /api//api/appointments/:id/complete
 * Transition Appointment from in_progress to completed
 */
export interface CompleteAppointmentRequest {
  readonly id: string;
}

export type CompleteAppointmentResponse = ApiResponse<Appointment>;

/**
 * POST /api//api/appointments/:id/cancel
 * Transition Appointment from confirmed to cancelled
 */
export interface CancelAppointmentRequest {
  readonly id: string;
}

export type CancelAppointmentResponse = ApiResponse<Appointment>;

/**
 * POST /api//api/appointments/:id/cancel-draft
 * Transition Appointment from draft to cancelled
 */
export interface CancelDraftAppointmentRequest {
  readonly id: string;
}

export type CancelDraftAppointmentResponse = ApiResponse<Appointment>;

/**
 * POST /api//api/appointments/:id/mark-no-show
 * Transition Appointment from confirmed to no_show
 */
export interface MarkNoShowAppointmentRequest {
  readonly id: string;
}

export type MarkNoShowAppointmentResponse = ApiResponse<Appointment>;

/**
 * POST /api//api/documents/:id/upload
 * Transition Document from requested to uploaded
 */
export interface UploadDocumentRequest {
  readonly id: string;
}

export type UploadDocumentResponse = ApiResponse<Document>;

/**
 * POST /api//api/documents/:id/review
 * Transition Document from uploaded to reviewed
 */
export interface ReviewDocumentRequest {
  readonly id: string;
}

export type ReviewDocumentResponse = ApiResponse<Document>;

/**
 * POST /api//api/documents/:id/accept
 * Transition Document from reviewed to accepted
 */
export interface AcceptDocumentRequest {
  readonly id: string;
}

export type AcceptDocumentResponse = ApiResponse<Document>;

/**
 * POST /api//api/documents/:id/reject
 * Transition Document from reviewed to rejected
 */
export interface RejectDocumentRequest {
  readonly id: string;
}

export type RejectDocumentResponse = ApiResponse<Document>;

/**
 * POST /api//api/documents/:id/reupload
 * Transition Document from rejected to uploaded
 */
export interface ReuploadDocumentRequest {
  readonly id: string;
}

export type ReuploadDocumentResponse = ApiResponse<Document>;


// ============================================================
// TYPE-SAFE FETCH WRAPPER
// ============================================================

/**
 * Type-safe API client interface.
 * Implement this for your HTTP client (fetch, axios, etc.)
 */
export interface ApiClient {
  // Profile
  listProfile(request: ListProfileRequest): Promise<ListProfileResponse>;
  getProfile(request: GetProfileRequest): Promise<GetProfileResponse>;
  createProfile(request: CreateProfileRequest): Promise<CreateProfileResponse>;
  updateProfile(request: UpdateProfileRequest): Promise<UpdateProfileResponse>;
  deleteProfile(request: DeleteProfileRequest): Promise<DeleteProfileResponse>;
  // Client
  listClient(request: ListClientRequest): Promise<ListClientResponse>;
  getClient(request: GetClientRequest): Promise<GetClientResponse>;
  createClient(request: CreateClientRequest): Promise<CreateClientResponse>;
  updateClient(request: UpdateClientRequest): Promise<UpdateClientResponse>;
  deleteClient(request: DeleteClientRequest): Promise<DeleteClientResponse>;
  // Service
  listService(request: ListServiceRequest): Promise<ListServiceResponse>;
  getService(request: GetServiceRequest): Promise<GetServiceResponse>;
  createService(request: CreateServiceRequest): Promise<CreateServiceResponse>;
  updateService(request: UpdateServiceRequest): Promise<UpdateServiceResponse>;
  deleteService(request: DeleteServiceRequest): Promise<DeleteServiceResponse>;
  // Appointment
  listAppointment(request: ListAppointmentRequest): Promise<ListAppointmentResponse>;
  getAppointment(request: GetAppointmentRequest): Promise<GetAppointmentResponse>;
  createAppointment(request: CreateAppointmentRequest): Promise<CreateAppointmentResponse>;
  updateAppointment(request: UpdateAppointmentRequest): Promise<UpdateAppointmentResponse>;
  deleteAppointment(request: DeleteAppointmentRequest): Promise<DeleteAppointmentResponse>;
  // Availability
  listAvailability(request: ListAvailabilityRequest): Promise<ListAvailabilityResponse>;
  getAvailability(request: GetAvailabilityRequest): Promise<GetAvailabilityResponse>;
  createAvailability(request: CreateAvailabilityRequest): Promise<CreateAvailabilityResponse>;
  updateAvailability(request: UpdateAvailabilityRequest): Promise<UpdateAvailabilityResponse>;
  deleteAvailability(request: DeleteAvailabilityRequest): Promise<DeleteAvailabilityResponse>;
  // Document
  listDocument(request: ListDocumentRequest): Promise<ListDocumentResponse>;
  getDocument(request: GetDocumentRequest): Promise<GetDocumentResponse>;
  createDocument(request: CreateDocumentRequest): Promise<CreateDocumentResponse>;
  updateDocument(request: UpdateDocumentRequest): Promise<UpdateDocumentResponse>;
  deleteDocument(request: DeleteDocumentRequest): Promise<DeleteDocumentResponse>;
}

// ============================================================
// WEBHOOK PAYLOADS (if using webhooks)
// ============================================================

export interface ProfileWebhookPayload {
  readonly event: "profile.created" | "profile.updated" | "profile.deleted";
  readonly data: Profile;
  readonly previousData?: Profile; // For updates
  readonly timestamp: string;
  readonly webhookId: string;
}

export interface ClientWebhookPayload {
  readonly event: "client.created" | "client.updated" | "client.deleted";
  readonly data: Client;
  readonly previousData?: Client; // For updates
  readonly timestamp: string;
  readonly webhookId: string;
}

export interface ServiceWebhookPayload {
  readonly event: "service.created" | "service.updated" | "service.deleted";
  readonly data: Service;
  readonly previousData?: Service; // For updates
  readonly timestamp: string;
  readonly webhookId: string;
}

export interface AppointmentWebhookPayload {
  readonly event: "appointment.created" | "appointment.updated" | "appointment.deleted";
  readonly data: Appointment;
  readonly previousData?: Appointment; // For updates
  readonly timestamp: string;
  readonly webhookId: string;
}

export interface AvailabilityWebhookPayload {
  readonly event: "availability.created" | "availability.updated" | "availability.deleted";
  readonly data: Availability;
  readonly previousData?: Availability; // For updates
  readonly timestamp: string;
  readonly webhookId: string;
}

export interface DocumentWebhookPayload {
  readonly event: "document.created" | "document.updated" | "document.deleted";
  readonly data: Document;
  readonly previousData?: Document; // For updates
  readonly timestamp: string;
  readonly webhookId: string;
}


export type WebhookPayload =
  | ProfileWebhookPayload  | ClientWebhookPayload  | ServiceWebhookPayload  | AppointmentWebhookPayload  | AvailabilityWebhookPayload  | DocumentWebhookPayload;

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
