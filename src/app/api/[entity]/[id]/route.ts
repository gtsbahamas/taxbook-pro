// ============================================================
// API ROUTE HANDLERS - SINGLE RESOURCE ROUTES - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// DYNAMIC ROUTE: /api/[entity]/[id]
// Handles get (GET), update (PATCH), delete (DELETE) for single resources.
//
// ============================================================

import { NextRequest } from "next/server";
import { getUser as getAuthUser } from "@/lib/supabase/server";
import {
  type ApiResponse,
  apiSuccess,
  apiError,
} from "@/types/api";
import {
  badRequest,
  unauthorized,
  forbidden,
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
  ProfileId,
  UpdateProfileInput,
} from "@/types/domain";
import { profileId } from "@/types/domain";
import {
  getProfile,
  updateProfile,
  deleteProfile,
} from "@/lib/repositories";
import {
  validateUpdateProfileInput,
} from "@/lib/validation";
import type {
  Client,
  ClientId,
  UpdateClientInput,
} from "@/types/domain";
import { clientId } from "@/types/domain";
import {
  getClient,
  updateClient,
  deleteClient,
} from "@/lib/repositories";
import {
  validateUpdateClientInput,
} from "@/lib/validation";
import type {
  Service,
  ServiceId,
  UpdateServiceInput,
} from "@/types/domain";
import { serviceId } from "@/types/domain";
import {
  getService,
  updateService,
  deleteService,
} from "@/lib/repositories";
import {
  validateUpdateServiceInput,
} from "@/lib/validation";
import type {
  Appointment,
  AppointmentId,
  UpdateAppointmentInput,
} from "@/types/domain";
import { appointmentId } from "@/types/domain";
import {
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from "@/lib/repositories";
import {
  validateUpdateAppointmentInput,
} from "@/lib/validation";
import type {
  Availability,
  AvailabilityId,
  UpdateAvailabilityInput,
} from "@/types/domain";
import { availabilityId } from "@/types/domain";
import {
  getAvailability,
  updateAvailability,
  deleteAvailability,
} from "@/lib/repositories";
import {
  validateUpdateAvailabilityInput,
} from "@/lib/validation";
import type {
  Document,
  DocumentId,
  UpdateDocumentInput,
} from "@/types/domain";
import { documentId } from "@/types/domain";
import {
  getDocument,
  updateDocument,
  deleteDocument,
} from "@/lib/repositories";
import {
  validateUpdateDocumentInput,
} from "@/lib/validation";

// ============================================================
// TYPES
// ============================================================

// Support both singular and plural entity names in URL paths
type EntityName = "profile" | "profiles" | "client" | "clients" | "service" | "services" | "appointment" | "appointments" | "availability" | "availabilities" | "document" | "documents";

interface RouteParams {
  params: Promise<{ entity: string; id: string }>;
}

// ============================================================
// ENTITY HANDLERS
// ============================================================

// --- Profile Handlers ---

async function getProfileHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('GET /api/profile/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/profile/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: ProfileId = profileId(id);
      span.addEvent('entity_lookup', { entityId: id });

      const result = await getProfile(entityId);
      if (!result.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/profile/:id', error: 'internal' });
        const error = internalError("Failed to fetch Profile");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (result.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/profile/:id', error: 'not_found' });
        const error = notFound("Profile", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('found', { entityId: id });
      const response: ApiResponse<Profile> = apiSuccess(result.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/profile/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/profile/:id',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function updateProfileHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('PATCH /api/profile/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/profile/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: ProfileId = profileId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getProfile(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/profile/:id', error: 'internal' });
        const error = internalError("Failed to fetch Profile");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/profile/:id', error: 'not_found' });
        const error = notFound("Profile", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Parse and validate body
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/profile/:id', error: 'bad_request' });
        const error = badRequest("Invalid JSON body");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const validation = validateUpdateProfileInput(body as UpdateProfileInput);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/profile/:id', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      // Update entity
      const updateResult = await updateProfile(entityId, validation.value);
      if (!updateResult.ok) {
        span.setStatus('error', 'update_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/profile/:id', error: 'internal' });
        const error = internalError("Failed to update Profile");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (updateResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/profile/:id', error: 'not_found' });
        const error = notFound("Profile", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('updated', { entityId: id });
      const response: ApiResponse<Profile> = apiSuccess(updateResult.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'PATCH', path: '/api/profile/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/profile/:id',
        method: 'PATCH',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function deleteProfileHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('DELETE /api/profile/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/profile/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: ProfileId = profileId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getProfile(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/profile/:id', error: 'internal' });
        const error = internalError("Failed to fetch Profile");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/profile/:id', error: 'not_found' });
        const error = notFound("Profile", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Delete entity
      const deleteResult = await deleteProfile(entityId);
      if (!deleteResult.ok) {
        span.setStatus('error', 'delete_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/profile/:id', error: 'internal' });
        const error = internalError("Failed to delete Profile");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('deleted', { entityId: id });
      const response: ApiResponse<{ deleted: true }> = apiSuccess({ deleted: true });
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'DELETE', path: '/api/profile/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/profile/:id',
        method: 'DELETE',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Client Handlers ---

async function getClientHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('GET /api/client/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/client/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: ClientId = clientId(id);
      span.addEvent('entity_lookup', { entityId: id });

      const result = await getClient(entityId);
      if (!result.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/client/:id', error: 'internal' });
        const error = internalError("Failed to fetch Client");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (result.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/client/:id', error: 'not_found' });
        const error = notFound("Client", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('found', { entityId: id });
      const response: ApiResponse<Client> = apiSuccess(result.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/client/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/client/:id',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function updateClientHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('PATCH /api/client/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/client/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: ClientId = clientId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getClient(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/client/:id', error: 'internal' });
        const error = internalError("Failed to fetch Client");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/client/:id', error: 'not_found' });
        const error = notFound("Client", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Parse and validate body
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/client/:id', error: 'bad_request' });
        const error = badRequest("Invalid JSON body");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const validation = validateUpdateClientInput(body as UpdateClientInput);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/client/:id', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      // Update entity
      const updateResult = await updateClient(entityId, validation.value);
      if (!updateResult.ok) {
        span.setStatus('error', 'update_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/client/:id', error: 'internal' });
        const error = internalError("Failed to update Client");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (updateResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/client/:id', error: 'not_found' });
        const error = notFound("Client", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('updated', { entityId: id });
      const response: ApiResponse<Client> = apiSuccess(updateResult.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'PATCH', path: '/api/client/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/client/:id',
        method: 'PATCH',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function deleteClientHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('DELETE /api/client/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/client/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: ClientId = clientId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getClient(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/client/:id', error: 'internal' });
        const error = internalError("Failed to fetch Client");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/client/:id', error: 'not_found' });
        const error = notFound("Client", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Delete entity
      const deleteResult = await deleteClient(entityId);
      if (!deleteResult.ok) {
        span.setStatus('error', 'delete_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/client/:id', error: 'internal' });
        const error = internalError("Failed to delete Client");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('deleted', { entityId: id });
      const response: ApiResponse<{ deleted: true }> = apiSuccess({ deleted: true });
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'DELETE', path: '/api/client/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/client/:id',
        method: 'DELETE',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Service Handlers ---

async function getServiceHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('GET /api/service/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/service/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: ServiceId = serviceId(id);
      span.addEvent('entity_lookup', { entityId: id });

      const result = await getService(entityId);
      if (!result.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/service/:id', error: 'internal' });
        const error = internalError("Failed to fetch Service");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (result.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/service/:id', error: 'not_found' });
        const error = notFound("Service", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('found', { entityId: id });
      const response: ApiResponse<Service> = apiSuccess(result.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/service/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/service/:id',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function updateServiceHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('PATCH /api/service/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/service/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: ServiceId = serviceId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getService(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/service/:id', error: 'internal' });
        const error = internalError("Failed to fetch Service");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/service/:id', error: 'not_found' });
        const error = notFound("Service", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Parse and validate body
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/service/:id', error: 'bad_request' });
        const error = badRequest("Invalid JSON body");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const validation = validateUpdateServiceInput(body as UpdateServiceInput);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/service/:id', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      // Update entity
      const updateResult = await updateService(entityId, validation.value);
      if (!updateResult.ok) {
        span.setStatus('error', 'update_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/service/:id', error: 'internal' });
        const error = internalError("Failed to update Service");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (updateResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/service/:id', error: 'not_found' });
        const error = notFound("Service", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('updated', { entityId: id });
      const response: ApiResponse<Service> = apiSuccess(updateResult.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'PATCH', path: '/api/service/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/service/:id',
        method: 'PATCH',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function deleteServiceHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('DELETE /api/service/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/service/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: ServiceId = serviceId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getService(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/service/:id', error: 'internal' });
        const error = internalError("Failed to fetch Service");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/service/:id', error: 'not_found' });
        const error = notFound("Service", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Delete entity
      const deleteResult = await deleteService(entityId);
      if (!deleteResult.ok) {
        span.setStatus('error', 'delete_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/service/:id', error: 'internal' });
        const error = internalError("Failed to delete Service");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('deleted', { entityId: id });
      const response: ApiResponse<{ deleted: true }> = apiSuccess({ deleted: true });
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'DELETE', path: '/api/service/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/service/:id',
        method: 'DELETE',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Appointment Handlers ---

async function getAppointmentHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('GET /api/appointment/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/appointment/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: AppointmentId = appointmentId(id);
      span.addEvent('entity_lookup', { entityId: id });

      const result = await getAppointment(entityId);
      if (!result.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/appointment/:id', error: 'internal' });
        const error = internalError("Failed to fetch Appointment");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (result.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/appointment/:id', error: 'not_found' });
        const error = notFound("Appointment", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('found', { entityId: id });
      const response: ApiResponse<Appointment> = apiSuccess(result.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/appointment/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/appointment/:id',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function updateAppointmentHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('PATCH /api/appointment/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: AppointmentId = appointmentId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getAppointment(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id', error: 'internal' });
        const error = internalError("Failed to fetch Appointment");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id', error: 'not_found' });
        const error = notFound("Appointment", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Parse and validate body
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id', error: 'bad_request' });
        const error = badRequest("Invalid JSON body");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const validation = validateUpdateAppointmentInput(body as UpdateAppointmentInput);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      // Update entity
      const updateResult = await updateAppointment(entityId, validation.value);
      if (!updateResult.ok) {
        span.setStatus('error', 'update_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id', error: 'internal' });
        const error = internalError("Failed to update Appointment");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (updateResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id', error: 'not_found' });
        const error = notFound("Appointment", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('updated', { entityId: id });
      const response: ApiResponse<Appointment> = apiSuccess(updateResult.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/appointment/:id',
        method: 'PATCH',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function deleteAppointmentHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('DELETE /api/appointment/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/appointment/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: AppointmentId = appointmentId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getAppointment(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/appointment/:id', error: 'internal' });
        const error = internalError("Failed to fetch Appointment");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/appointment/:id', error: 'not_found' });
        const error = notFound("Appointment", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Delete entity
      const deleteResult = await deleteAppointment(entityId);
      if (!deleteResult.ok) {
        span.setStatus('error', 'delete_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/appointment/:id', error: 'internal' });
        const error = internalError("Failed to delete Appointment");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('deleted', { entityId: id });
      const response: ApiResponse<{ deleted: true }> = apiSuccess({ deleted: true });
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'DELETE', path: '/api/appointment/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/appointment/:id',
        method: 'DELETE',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Availability Handlers ---

async function getAvailabilityHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('GET /api/availability/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/availability/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: AvailabilityId = availabilityId(id);
      span.addEvent('entity_lookup', { entityId: id });

      const result = await getAvailability(entityId);
      if (!result.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/availability/:id', error: 'internal' });
        const error = internalError("Failed to fetch Availability");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (result.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/availability/:id', error: 'not_found' });
        const error = notFound("Availability", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('found', { entityId: id });
      const response: ApiResponse<Availability> = apiSuccess(result.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/availability/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/availability/:id',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function updateAvailabilityHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('PATCH /api/availability/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/availability/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: AvailabilityId = availabilityId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getAvailability(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/availability/:id', error: 'internal' });
        const error = internalError("Failed to fetch Availability");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/availability/:id', error: 'not_found' });
        const error = notFound("Availability", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Parse and validate body
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/availability/:id', error: 'bad_request' });
        const error = badRequest("Invalid JSON body");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const validation = validateUpdateAvailabilityInput(body as UpdateAvailabilityInput);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/availability/:id', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      // Update entity
      const updateResult = await updateAvailability(entityId, validation.value);
      if (!updateResult.ok) {
        span.setStatus('error', 'update_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/availability/:id', error: 'internal' });
        const error = internalError("Failed to update Availability");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (updateResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/availability/:id', error: 'not_found' });
        const error = notFound("Availability", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('updated', { entityId: id });
      const response: ApiResponse<Availability> = apiSuccess(updateResult.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'PATCH', path: '/api/availability/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/availability/:id',
        method: 'PATCH',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function deleteAvailabilityHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('DELETE /api/availability/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/availability/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: AvailabilityId = availabilityId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getAvailability(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/availability/:id', error: 'internal' });
        const error = internalError("Failed to fetch Availability");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/availability/:id', error: 'not_found' });
        const error = notFound("Availability", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Delete entity
      const deleteResult = await deleteAvailability(entityId);
      if (!deleteResult.ok) {
        span.setStatus('error', 'delete_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/availability/:id', error: 'internal' });
        const error = internalError("Failed to delete Availability");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('deleted', { entityId: id });
      const response: ApiResponse<{ deleted: true }> = apiSuccess({ deleted: true });
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'DELETE', path: '/api/availability/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/availability/:id',
        method: 'DELETE',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Document Handlers ---

async function getDocumentHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('GET /api/document/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/document/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: DocumentId = documentId(id);
      span.addEvent('entity_lookup', { entityId: id });

      const result = await getDocument(entityId);
      if (!result.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/document/:id', error: 'internal' });
        const error = internalError("Failed to fetch Document");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (result.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'GET', path: '/api/document/:id', error: 'not_found' });
        const error = notFound("Document", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('found', { entityId: id });
      const response: ApiResponse<Document> = apiSuccess(result.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'GET', path: '/api/document/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/document/:id',
        method: 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function updateDocumentHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('PATCH /api/document/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: DocumentId = documentId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getDocument(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id', error: 'internal' });
        const error = internalError("Failed to fetch Document");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id', error: 'not_found' });
        const error = notFound("Document", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Parse and validate body
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id', error: 'bad_request' });
        const error = badRequest("Invalid JSON body");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const validation = validateUpdateDocumentInput(body as UpdateDocumentInput);
      if (!validation.ok) {
        span.setStatus('error', 'validation_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id', error: 'bad_request' });
        const error = badRequest("Validation failed", validation.error);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('validated');

      // Update entity
      const updateResult = await updateDocument(entityId, validation.value);
      if (!updateResult.ok) {
        span.setStatus('error', 'update_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id', error: 'internal' });
        const error = internalError("Failed to update Document");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (updateResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id', error: 'not_found' });
        const error = notFound("Document", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('updated', { entityId: id });
      const response: ApiResponse<Document> = apiSuccess(updateResult.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/document/:id',
        method: 'PATCH',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

async function deleteDocumentHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('DELETE /api/document/:id', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/document/:id', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: DocumentId = documentId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists
      const existingResult = await getDocument(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/document/:id', error: 'internal' });
        const error = internalError("Failed to fetch Document");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/document/:id', error: 'not_found' });
        const error = notFound("Document", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Delete entity
      const deleteResult = await deleteDocument(entityId);
      if (!deleteResult.ok) {
        span.setStatus('error', 'delete_failed');
        httpErrorsTotal.inc({ method: 'DELETE', path: '/api/document/:id', error: 'internal' });
        const error = internalError("Failed to delete Document");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('deleted', { entityId: id });
      const response: ApiResponse<{ deleted: true }> = apiSuccess({ deleted: true });
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'DELETE', path: '/api/document/:id', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/document/:id',
        method: 'DELETE',
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
 * GET /api/[entity]/[id]
 * Get a single entity by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { entity, id } = await params;

  if (!id) {
    const error = badRequest("Missing ID parameter");
    return Response.json(apiError(error), { status: apiErrorToStatus(error) });
  }

  switch (entity as EntityName) {
    case "profile":
    case "profiles":
      return getProfileHandler(request, id);
    case "client":
    case "clients":
      return getClientHandler(request, id);
    case "service":
    case "services":
      return getServiceHandler(request, id);
    case "appointment":
    case "appointments":
      return getAppointmentHandler(request, id);
    case "availability":
    case "availabilities":
      return getAvailabilityHandler(request, id);
    case "document":
    case "documents":
      return getDocumentHandler(request, id);
    default:
      const error = notFound(`Unknown entity: ${entity}`);
      return Response.json(apiError(error), { status: apiErrorToStatus(error) });
  }
}

/**
 * PATCH /api/[entity]/[id]
 * Update an entity by ID.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { entity, id } = await params;

  if (!id) {
    const error = badRequest("Missing ID parameter");
    return Response.json(apiError(error), { status: apiErrorToStatus(error) });
  }

  switch (entity as EntityName) {
    case "profile":
    case "profiles":
      return updateProfileHandler(request, id);
    case "client":
    case "clients":
      return updateClientHandler(request, id);
    case "service":
    case "services":
      return updateServiceHandler(request, id);
    case "appointment":
    case "appointments":
      return updateAppointmentHandler(request, id);
    case "availability":
    case "availabilities":
      return updateAvailabilityHandler(request, id);
    case "document":
    case "documents":
      return updateDocumentHandler(request, id);
    default:
      const error = notFound(`Unknown entity: ${entity}`);
      return Response.json(apiError(error), { status: apiErrorToStatus(error) });
  }
}

/**
 * DELETE /api/[entity]/[id]
 * Delete an entity by ID.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const { entity, id } = await params;

  if (!id) {
    const error = badRequest("Missing ID parameter");
    return Response.json(apiError(error), { status: apiErrorToStatus(error) });
  }

  switch (entity as EntityName) {
    case "profile":
    case "profiles":
      return deleteProfileHandler(request, id);
    case "client":
    case "clients":
      return deleteClientHandler(request, id);
    case "service":
    case "services":
      return deleteServiceHandler(request, id);
    case "appointment":
    case "appointments":
      return deleteAppointmentHandler(request, id);
    case "availability":
    case "availabilities":
      return deleteAvailabilityHandler(request, id);
    case "document":
    case "documents":
      return deleteDocumentHandler(request, id);
    default:
      const error = notFound(`Unknown entity: ${entity}`);
      return Response.json(apiError(error), { status: apiErrorToStatus(error) });
  }
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
