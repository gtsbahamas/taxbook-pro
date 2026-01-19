// ============================================================
// API ROUTE HANDLERS - STATE MACHINE TRANSITIONS - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// DYNAMIC ROUTE: /api/[entity]/[id]/transition
// Handles state machine transitions for entities with state machines.
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
  Appointment,
  AppointmentId,
} from "@/types/domain";
import { appointmentId } from "@/types/domain";
import {
  getAppointment,
  transitionAppointment,
  type AppointmentTransitionName,
} from "@/lib/repositories";
import {
  getAppointmentAllowedTransitions,
} from "@/lib/state-machines";
import type {
  Document,
  DocumentId,
} from "@/types/domain";
import { documentId } from "@/types/domain";
import {
  getDocument,
  transitionDocument,
  type DocumentTransitionName,
} from "@/lib/repositories";
import {
  getDocumentAllowedTransitions,
} from "@/lib/state-machines";

// ============================================================
// TYPES
// ============================================================

type TransitionableEntity = never;

interface RouteParams {
  params: Promise<{ entity: string; id: string }>;
}

interface TransitionRequest {
  transition: string;
}

// ============================================================
// ENTITY HANDLERS
// ============================================================

// --- Appointment Transition Handler ---

async function transitionAppointmentHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('PATCH /api/appointment/:id/transition', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id/transition', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: AppointmentId = appointmentId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists and get current state
      const existingResult = await getAppointment(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id/transition', error: 'internal' });
        const error = internalError("Failed to fetch Appointment");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id/transition', error: 'not_found' });
        const error = notFound("Appointment", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Parse request body
      let body: TransitionRequest;
      try {
        body = await request.json() as TransitionRequest;
      } catch {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id/transition', error: 'bad_request' });
        const error = badRequest("Invalid JSON body");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const { transition } = body;
      if (!transition || typeof transition !== 'string') {
        span.setStatus('error', 'missing_transition');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id/transition', error: 'bad_request' });
        const error = badRequest("Missing 'transition' field in request body");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Validate transition is allowed
      const currentState = existingResult.value.status as string;
      const allowedTransitions = getAppointmentAllowedTransitions(currentState);

      if (!allowedTransitions.includes(transition as AppointmentTransitionName)) {
        span.setStatus('error', 'invalid_transition');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id/transition', error: 'bad_request' });
        const error = badRequest(
          `Invalid transition '${transition}' from state '${currentState}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`
        );
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('transition_valid', { currentState, transition });

      // Perform transition
      const transitionResult = await transitionAppointment(entityId, transition as AppointmentTransitionName);
      if (!transitionResult.ok) {
        span.setStatus('error', 'transition_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id/transition', error: 'internal' });

        // Handle invalid transition error from repository
        if ('type' in transitionResult.error && transitionResult.error.type === 'invalid_transition') {
          const error = badRequest(
            `Cannot perform '${transition}' from current state`
          );
          return Response.json(apiError(error), { status: apiErrorToStatus(error) });
        }

        const error = internalError("Failed to transition Appointment");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('transitioned', { entityId: id, newState: transitionResult.value.status });
      const response: ApiResponse<Appointment> = apiSuccess(transitionResult.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'PATCH', path: '/api/appointment/:id/transition', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/appointment/:id/transition',
        method: 'PATCH',
        error: error instanceof Error ? error.message : String(error),
      });
      const apiErr = internalError("Unexpected error");
      return Response.json(apiError(apiErr), { status: apiErrorToStatus(apiErr) });
    }
  });
}

// --- Document Transition Handler ---

async function transitionDocumentHandler(
  request: NextRequest,
  id: string
): Promise<Response> {
  return withSpan('PATCH /api/document/:id/transition', async (span) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        span.setStatus('error', 'unauthorized');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id/transition', error: 'unauthorized' });
        const error = unauthorized();
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('authenticated', { userId: user.id });

      const entityId: DocumentId = documentId(id);
      span.addEvent('entity_lookup', { entityId: id });

      // Verify entity exists and get current state
      const existingResult = await getDocument(entityId);
      if (!existingResult.ok) {
        span.setStatus('error', 'fetch_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id/transition', error: 'internal' });
        const error = internalError("Failed to fetch Document");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      if (existingResult.value === null) {
        span.setStatus('error', 'not_found');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id/transition', error: 'not_found' });
        const error = notFound("Document", id);
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Parse request body
      let body: TransitionRequest;
      try {
        body = await request.json() as TransitionRequest;
      } catch {
        span.setStatus('error', 'invalid_json');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id/transition', error: 'bad_request' });
        const error = badRequest("Invalid JSON body");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      const { transition } = body;
      if (!transition || typeof transition !== 'string') {
        span.setStatus('error', 'missing_transition');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id/transition', error: 'bad_request' });
        const error = badRequest("Missing 'transition' field in request body");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      // Validate transition is allowed
      const currentState = existingResult.value.status as string;
      const allowedTransitions = getDocumentAllowedTransitions(currentState);

      if (!allowedTransitions.includes(transition as DocumentTransitionName)) {
        span.setStatus('error', 'invalid_transition');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id/transition', error: 'bad_request' });
        const error = badRequest(
          `Invalid transition '${transition}' from state '${currentState}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`
        );
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('transition_valid', { currentState, transition });

      // Perform transition
      const transitionResult = await transitionDocument(entityId, transition as DocumentTransitionName);
      if (!transitionResult.ok) {
        span.setStatus('error', 'transition_failed');
        httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id/transition', error: 'internal' });

        // Handle invalid transition error from repository
        if ('type' in transitionResult.error && transitionResult.error.type === 'invalid_transition') {
          const error = badRequest(
            `Cannot perform '${transition}' from current state`
          );
          return Response.json(apiError(error), { status: apiErrorToStatus(error) });
        }

        const error = internalError("Failed to transition Document");
        return Response.json(apiError(error), { status: apiErrorToStatus(error) });
      }

      span.addEvent('transitioned', { entityId: id, newState: transitionResult.value.status });
      const response: ApiResponse<Document> = apiSuccess(transitionResult.value);
      return Response.json(response, { status: 200 });
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'unknown');
      httpErrorsTotal.inc({ method: 'PATCH', path: '/api/document/:id/transition', error: 'internal' });
      logger.error('Request failed', {
        path: '/api/document/:id/transition',
        method: 'PATCH',
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
 * PATCH /api/[entity]/[id]/transition
 * Perform a state machine transition on an entity.
 *
 * Request body: { "transition": "transitionName" }
 * Response: Updated entity with new state
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

  switch (entity as TransitionableEntity) {
    case "appointment":
      return transitionAppointmentHandler(request, id);
    case "document":
      return transitionDocumentHandler(request, id);
    default:
      const error = notFound(`Entity '${entity}' does not support transitions`);
      return Response.json(apiError(error), { status: apiErrorToStatus(error) });
  }
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
