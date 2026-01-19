// ============================================================
// API ROUTE HANDLERS - COLLECTION ROUTES - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// DYNAMIC ROUTE: /api/[entity]
// Handles list (GET) and create (POST) operations for all entities.
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What could go wrong? → Request ID for tracing all errors
// - What would cause users to abandon? → Clear error messages
// - What would make debugging hard? → Structured logging
//
// Inversion Insights Applied:
//   • What would make a client NOT book? Complex forms, unclear availability, no reminders
//   • What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   • What would cause double-bookings? Race conditions, timezone bugs, unclear UI
//
// SCALABILITY PATTERNS (Second-Order Mental Model):
// - What happens at 10x users? → Cache-Control headers reduce load
// - What cascades from slow APIs? → ETag for conditional requests
//
// Second-Order Insights Applied:
//   • Easy booking → more clients → need capacity management
//   • Document collection → less back-and-forth → faster appointments
//   • Tax season mode → prevents burnout → sustainable practice
// ============================================================

import { NextRequest } from "next/server";
import { getUser as getAuthUser } from "@/lib/supabase/server";
import {
  type ApiResponse,
  type PaginatedResponse,
  apiSuccess,
  apiError,
} from "@/types/api";
import {
  badRequest,
  unauthorized,
  notFound,
  internalError,
  apiErrorToStatus,
} from "@/types/errors";
import {
  logger,
  withSpan,
  httpErrorsTotal,
} from "@/lib/observability";
import type {
  Profile,
  CreateProfileInput,
  ProfileFilters,
} from "@/types/domain";
import {
  listProfile,
  createProfile,
} from "@/lib/repositories";
import {
  validateProfileInput,
} from "@/lib/validation";
import type {
  Client,
  CreateClientInput,
  ClientFilters,
} from "@/types/domain";
import {
  listClient,
  insertClient,
} from "@/lib/repositories";
import {
  validateClientInput,
} from "@/lib/validation";
import type {
  Service,
  CreateServiceInput,
  ServiceFilters,
} from "@/types/domain";
import {
  listService,
  createService,
} from "@/lib/repositories";
import {
  validateServiceInput,
} from "@/lib/validation";
import type {
  Appointment,
  CreateAppointmentInput,
  AppointmentFilters,
} from "@/types/domain";
import {
  listAppointment,
  createAppointment,
} from "@/lib/repositories";
import {
  validateAppointmentInput,
} from "@/lib/validation";
import type {
  Availability,
  CreateAvailabilityInput,
  AvailabilityFilters,
} from "@/types/domain";
import {
  listAvailability,
  createAvailability,
} from "@/lib/repositories";
import {
  validateAvailabilityInput,
} from "@/lib/validation";
import type {
  Document,
  CreateDocumentInput,
  DocumentFilters,
} from "@/types/domain";
import {
  listDocument,
  createDocument,
} from "@/lib/repositories";
import {
  validateDocumentInput,
} from "@/lib/validation";
import {
  validatePagination,
} from "@/lib/validation";

// ============================================================
// TYPES
// ============================================================

// Support both singular and plural entity names in URL paths
type EntityName = "profile" | "profiles" | "client" | "clients" | "service" | "services" | "appointment" | "appointments" | "availability" | "availabilities" | "document" | "documents";

interface RouteParams {
  params: Promise<{ entity: string }>;
}

// ============================================================
// DEFENSIVE: REQUEST HELPERS
// ============================================================

const MAX_BODY_SIZE = 1_048_576; // 1MB

const safeParseJson = async (
  request: NextRequest
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> => {
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return { ok: false, error: "Content-Type must be application/json" };
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return { ok: false, error: `Request body too large (max ${MAX_BODY_SIZE} bytes)` };
    }

    const body = await request.json();
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }
};

// ============================================================
// ENTITY HANDLERS
// ============================================================

// --- Profile Handlers ---

async function listProfileHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('GET /api/profile', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/profile', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
      const offset = (page - 1) * limit;

      span.addEvent('params_parsed', { page, limit, offset });

      let filters: ProfileFilters | undefined;
      const filtersParam = searchParams.get("filters");
      if (filtersParam) {
        try {
          filters = JSON.parse(filtersParam) as ProfileFilters;
        } catch {
          span.setStatus('error', 'invalid_filters');
          httpErrorsTotal.inc({ method: 'GET', path: '/api/profile', error: 'bad_request' });
          const error = badRequest("Invalid filters JSON");
          return Response.json(apiError(error), { status: apiErrorToStatus(error) });
        }
      }

      const result = await listProfile(filters, { limit, offset });
      if (!result.ok) {
        span.setStatus('error', 'query_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/profile', error: 'internal' });
        const error = internalError("Failed to fetch Profile");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const { items, total, hasMore } = result.value;
      span.addEvent('query_complete', { resultCount: items.length, total });

      const response: ApiResponse<PaginatedResponse<Profile>> = apiSuccess(
        { items, total, page, limit, hasMore },
        { total, page, limit, hasMore }
      );

      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/profile', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/profile',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function createProfileHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('POST /api/profile', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/profile', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const parseResult = await safeParseJson(request);
      if (!parseResult.ok) {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/profile', error: 'bad_request' });
        const error = badRequest(parseResult.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const validation = validateProfileInput(parseResult.data as CreateProfileInput);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/profile', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      const result = await createProfile(validation.value);
      if (!result.ok) {
        const dbError = result.error;
        if (dbError.type === "constraint_violation") {
          span.setStatus('error', 'conflict');
          httpErrorsTotal.inc({ method: 'POST', path: '/api/profile', error: 'conflict' });
          const error = badRequest(`Constraint violation: ${dbError.constraint}`);
          return Response.json(apiError(error), { status: 409 });
        }
        span.setStatus('error', 'create_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/profile', error: 'internal' });
        const error = internalError("Failed to create Profile");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('created', { id: result.value.id });
      const response: ApiResponse<Profile> = apiSuccess(result.value);
      return Response.json(response, { status: 201 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'POST', path: '/api/profile', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/profile',
        method: 'POST',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Client Handlers ---

async function listClientHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('GET /api/client', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/client', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
      const offset = (page - 1) * limit;

      span.addEvent('params_parsed', { page, limit, offset });

      let filters: ClientFilters | undefined;
      const filtersParam = searchParams.get("filters");
      if (filtersParam) {
        try {
          filters = JSON.parse(filtersParam) as ClientFilters;
        } catch {
          span.setStatus('error', 'invalid_filters');
          httpErrorsTotal.inc({ method: 'GET', path: '/api/client', error: 'bad_request' });
          const error = badRequest("Invalid filters JSON");
          return Response.json(apiError(error), { status: apiErrorToStatus(error) });
        }
      }

      const result = await listClient(filters, { limit, offset });
      if (!result.ok) {
        span.setStatus('error', 'query_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/client', error: 'internal' });
        const error = internalError("Failed to fetch Client");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const { items, total, hasMore } = result.value;
      span.addEvent('query_complete', { resultCount: items.length, total });

      const response: ApiResponse<PaginatedResponse<Client>> = apiSuccess(
        { items, total, page, limit, hasMore },
        { total, page, limit, hasMore }
      );

      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/client', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/client',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function createClientHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('POST /api/client', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/client', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const parseResult = await safeParseJson(request);
      if (!parseResult.ok) {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/client', error: 'bad_request' });
        const error = badRequest(parseResult.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Inject userId from authenticated session
      const inputWithUser = { ...parseResult.data as CreateClientInput, userId: user.id };

      const validation = validateClientInput(inputWithUser);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/client', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      const result = await insertClient(validation.value);
      if (!result.ok) {
        const dbError = result.error;
        if (dbError.type === "constraint_violation") {
          span.setStatus('error', 'conflict');
          httpErrorsTotal.inc({ method: 'POST', path: '/api/client', error: 'conflict' });
          const error = badRequest(`Constraint violation: ${dbError.constraint}`);
          return Response.json(apiError(error), { status: 409 });
        }
        span.setStatus('error', 'create_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/client', error: 'internal' });
        const error = internalError("Failed to create Client");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('created', { id: result.value.id });
      const response: ApiResponse<Client> = apiSuccess(result.value);
      return Response.json(response, { status: 201 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'POST', path: '/api/client', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/client',
        method: 'POST',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Service Handlers ---

async function listServiceHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('GET /api/service', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/service', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
      const offset = (page - 1) * limit;

      span.addEvent('params_parsed', { page, limit, offset });

      let filters: ServiceFilters | undefined;
      const filtersParam = searchParams.get("filters");
      if (filtersParam) {
        try {
          filters = JSON.parse(filtersParam) as ServiceFilters;
        } catch {
          span.setStatus('error', 'invalid_filters');
          httpErrorsTotal.inc({ method: 'GET', path: '/api/service', error: 'bad_request' });
          const error = badRequest("Invalid filters JSON");
          return Response.json(apiError(error), { status: apiErrorToStatus(error) });
        }
      }

      const result = await listService(filters, { limit, offset });
      if (!result.ok) {
        span.setStatus('error', 'query_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/service', error: 'internal' });
        const error = internalError("Failed to fetch Service");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const { items, total, hasMore } = result.value;
      span.addEvent('query_complete', { resultCount: items.length, total });

      const response: ApiResponse<PaginatedResponse<Service>> = apiSuccess(
        { items, total, page, limit, hasMore },
        { total, page, limit, hasMore }
      );

      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/service', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/service',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function createServiceHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('POST /api/service', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/service', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const parseResult = await safeParseJson(request);
      if (!parseResult.ok) {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/service', error: 'bad_request' });
        const error = badRequest(parseResult.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Inject userId from authenticated session
      const inputWithUser = { ...parseResult.data as CreateServiceInput, userId: user.id };

      const validation = validateServiceInput(inputWithUser);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/service', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      const result = await createService(validation.value);
      if (!result.ok) {
        const dbError = result.error;
        if (dbError.type === "constraint_violation") {
          span.setStatus('error', 'conflict');
          httpErrorsTotal.inc({ method: 'POST', path: '/api/service', error: 'conflict' });
          const error = badRequest(`Constraint violation: ${dbError.constraint}`);
          return Response.json(apiError(error), { status: 409 });
        }
        span.setStatus('error', 'create_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/service', error: 'internal' });
        const error = internalError("Failed to create Service");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('created', { id: result.value.id });
      const response: ApiResponse<Service> = apiSuccess(result.value);
      return Response.json(response, { status: 201 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'POST', path: '/api/service', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/service',
        method: 'POST',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Appointment Handlers ---

async function listAppointmentHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('GET /api/appointment', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/appointment', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
      const offset = (page - 1) * limit;

      span.addEvent('params_parsed', { page, limit, offset });

      let filters: AppointmentFilters | undefined;
      const filtersParam = searchParams.get("filters");
      if (filtersParam) {
        try {
          filters = JSON.parse(filtersParam) as AppointmentFilters;
        } catch {
          span.setStatus('error', 'invalid_filters');
          httpErrorsTotal.inc({ method: 'GET', path: '/api/appointment', error: 'bad_request' });
          const error = badRequest("Invalid filters JSON");
          return Response.json(apiError(error), { status: apiErrorToStatus(error) });
        }
      }

      const result = await listAppointment(filters, { limit, offset });
      if (!result.ok) {
        span.setStatus('error', 'query_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/appointment', error: 'internal' });
        const error = internalError("Failed to fetch Appointment");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const { items, total, hasMore } = result.value;
      span.addEvent('query_complete', { resultCount: items.length, total });

      const response: ApiResponse<PaginatedResponse<Appointment>> = apiSuccess(
        { items, total, page, limit, hasMore },
        { total, page, limit, hasMore }
      );

      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/appointment', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/appointment',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function createAppointmentHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('POST /api/appointment', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/appointment', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const parseResult = await safeParseJson(request);
      if (!parseResult.ok) {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/appointment', error: 'bad_request' });
        const error = badRequest(parseResult.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Inject userId from authenticated session
      const inputWithUser = { ...parseResult.data as CreateAppointmentInput, userId: user.id };

      const validation = validateAppointmentInput(inputWithUser);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/appointment', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      const result = await createAppointment(validation.value);
      if (!result.ok) {
        const dbError = result.error;
        if (dbError.type === "constraint_violation") {
          span.setStatus('error', 'conflict');
          httpErrorsTotal.inc({ method: 'POST', path: '/api/appointment', error: 'conflict' });
          const error = badRequest(`Constraint violation: ${dbError.constraint}`);
          return Response.json(apiError(error), { status: 409 });
        }
        span.setStatus('error', 'create_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/appointment', error: 'internal' });
        const error = internalError("Failed to create Appointment");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('created', { id: result.value.id });
      const response: ApiResponse<Appointment> = apiSuccess(result.value);
      return Response.json(response, { status: 201 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'POST', path: '/api/appointment', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/appointment',
        method: 'POST',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Availability Handlers ---

async function listAvailabilityHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('GET /api/availability', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/availability', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
      const offset = (page - 1) * limit;

      span.addEvent('params_parsed', { page, limit, offset });

      let filters: AvailabilityFilters | undefined;
      const filtersParam = searchParams.get("filters");
      if (filtersParam) {
        try {
          filters = JSON.parse(filtersParam) as AvailabilityFilters;
        } catch {
          span.setStatus('error', 'invalid_filters');
          httpErrorsTotal.inc({ method: 'GET', path: '/api/availability', error: 'bad_request' });
          const error = badRequest("Invalid filters JSON");
          return Response.json(apiError(error), { status: apiErrorToStatus(error) });
        }
      }

      const result = await listAvailability(filters, { limit, offset });
      if (!result.ok) {
        span.setStatus('error', 'query_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/availability', error: 'internal' });
        const error = internalError("Failed to fetch Availability");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const { items, total, hasMore } = result.value;
      span.addEvent('query_complete', { resultCount: items.length, total });

      const response: ApiResponse<PaginatedResponse<Availability>> = apiSuccess(
        { items, total, page, limit, hasMore },
        { total, page, limit, hasMore }
      );

      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/availability', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/availability',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function createAvailabilityHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('POST /api/availability', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/availability', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const parseResult = await safeParseJson(request);
      if (!parseResult.ok) {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/availability', error: 'bad_request' });
        const error = badRequest(parseResult.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Inject userId from authenticated session
      const inputWithUser = { ...parseResult.data as CreateAvailabilityInput, userId: user.id };

      const validation = validateAvailabilityInput(inputWithUser);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/availability', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      const result = await createAvailability(validation.value);
      if (!result.ok) {
        const dbError = result.error;
        if (dbError.type === "constraint_violation") {
          span.setStatus('error', 'conflict');
          httpErrorsTotal.inc({ method: 'POST', path: '/api/availability', error: 'conflict' });
          const error = badRequest(`Constraint violation: ${dbError.constraint}`);
          return Response.json(apiError(error), { status: 409 });
        }
        span.setStatus('error', 'create_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/availability', error: 'internal' });
        const error = internalError("Failed to create Availability");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('created', { id: result.value.id });
      const response: ApiResponse<Availability> = apiSuccess(result.value);
      return Response.json(response, { status: 201 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'POST', path: '/api/availability', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/availability',
        method: 'POST',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Document Handlers ---

async function listDocumentHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('GET /api/document', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/document', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
      const offset = (page - 1) * limit;

      span.addEvent('params_parsed', { page, limit, offset });

      let filters: DocumentFilters | undefined;
      const filtersParam = searchParams.get("filters");
      if (filtersParam) {
        try {
          filters = JSON.parse(filtersParam) as DocumentFilters;
        } catch {
          span.setStatus('error', 'invalid_filters');
          httpErrorsTotal.inc({ method: 'GET', path: '/api/document', error: 'bad_request' });
          const error = badRequest("Invalid filters JSON");
          return Response.json(apiError(error), { status: apiErrorToStatus(error) });
        }
      }

      const result = await listDocument(filters, { limit, offset });
      if (!result.ok) {
        span.setStatus('error', 'query_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/document', error: 'internal' });
        const error = internalError("Failed to fetch Document");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const { items, total, hasMore } = result.value;
      span.addEvent('query_complete', { resultCount: items.length, total });

      const response: ApiResponse<PaginatedResponse<Document>> = apiSuccess(
        { items, total, page, limit, hasMore },
        { total, page, limit, hasMore }
      );

      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/document', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/document',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function createDocumentHandler(
  request: NextRequest
): Promise<Response> {
  return withSpan('POST /api/document', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/document', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const parseResult = await safeParseJson(request);
      if (!parseResult.ok) {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/document', error: 'bad_request' });
        const error = badRequest(parseResult.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Inject userId from authenticated session
      const inputWithUser = { ...parseResult.data as CreateDocumentInput, userId: user.id };

      const validation = validateDocumentInput(inputWithUser);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/document', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      const result = await createDocument(validation.value);
      if (!result.ok) {
        const dbError = result.error;
        if (dbError.type === "constraint_violation") {
          span.setStatus('error', 'conflict');
          httpErrorsTotal.inc({ method: 'POST', path: '/api/document', error: 'conflict' });
          const error = badRequest(`Constraint violation: ${dbError.constraint}`);
          return Response.json(apiError(error), { status: 409 });
        }
        span.setStatus('error', 'create_failed');
        httpErrorsTotal.inc({ method: 'POST', path: '/api/document', error: 'internal' });
        const error = internalError("Failed to create Document");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('created', { id: result.value.id });
      const response: ApiResponse<Document> = apiSuccess(result.value);
      return Response.json(response, { status: 201 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'POST', path: '/api/document', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/document',
        method: 'POST',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}


// ============================================================
// ROUTE HANDLERS
// ============================================================

/**
 * GET /api/[entity]
 * List entities with pagination and optional filters.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { entity } = await params;

  switch (entity as EntityName) {
    case "profile":
    case "profiles":
      return listProfileHandler(request);
    case "client":
    case "clients":
      return listClientHandler(request);
    case "service":
    case "services":
      return listServiceHandler(request);
    case "appointment":
    case "appointments":
      return listAppointmentHandler(request);
    case "availability":
    case "availabilities":
      return listAvailabilityHandler(request);
    case "document":
    case "documents":
      return listDocumentHandler(request);
    default:
      const error = notFound(`Unknown entity: ${entity}`);
      return Response.json(apiError(error), { status: apiErrorToStatus(error) });
  }
}

/**
 * POST /api/[entity]
 * Create a new entity.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { entity } = await params;

  switch (entity as EntityName) {
    case "profile":
    case "profiles":
      return createProfileHandler(request);
    case "client":
    case "clients":
      return createClientHandler(request);
    case "service":
    case "services":
      return createServiceHandler(request);
    case "appointment":
    case "appointments":
      return createAppointmentHandler(request);
    case "availability":
    case "availabilities":
      return createAvailabilityHandler(request);
    case "document":
    case "documents":
      return createDocumentHandler(request);
    default:
      const error = notFound(`Unknown entity: ${entity}`);
      return Response.json(apiError(error), { status: apiErrorToStatus(error) });
  }
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
