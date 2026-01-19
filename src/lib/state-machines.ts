/**
 * State Machine Definitions - taxbook-pro
 * Generated: 2026-01-19
 *
 * Client-safe state machine definitions.
 * These can be imported by both client and server components.
 *
 * IMPORTANT: This file contains NO server-only imports (like next/headers).
 * It's safe to use in 'use client' components.
 */

import type { AppointmentId } from "@/types/domain";
import type { DocumentId } from "@/types/domain";

// ============================================================
// APPOINTMENT STATE MACHINE
// ============================================================

/** Valid states for Appointment */
export const appointmentStates = [
  "draft",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentState = typeof appointmentStates[number];

/** Valid transition names for Appointment */
export const appointmentTransitionNames = [
  "confirm",
  "start",
  "complete",
  "cancel",
  "cancelDraft",
  "markNoShow",
] as const;

export type AppointmentTransitionName = typeof appointmentTransitionNames[number];

/** Transition definitions - maps transition name to valid from states */
export const appointmentTransitions: Record<AppointmentTransitionName, { fromStates: string[]; toState: (from: string) => string }> = {
  "confirm": {
    fromStates: ["draft"],
    toState: (from: string) => {
      if (from === "draft") return "confirmed";
      return "";
    },
  },
  "start": {
    fromStates: ["confirmed"],
    toState: (from: string) => {
      if (from === "confirmed") return "in_progress";
      return "";
    },
  },
  "complete": {
    fromStates: ["in_progress"],
    toState: (from: string) => {
      if (from === "in_progress") return "completed";
      return "";
    },
  },
  "cancel": {
    fromStates: ["confirmed"],
    toState: (from: string) => {
      if (from === "confirmed") return "cancelled";
      return "";
    },
  },
  "cancelDraft": {
    fromStates: ["draft"],
    toState: (from: string) => {
      if (from === "draft") return "cancelled";
      return "";
    },
  },
  "markNoShow": {
    fromStates: ["confirmed"],
    toState: (from: string) => {
      if (from === "confirmed") return "no_show";
      return "";
    },
  },
};

/** State machine transition error */
export interface AppointmentTransitionError {
  readonly type: "invalid_transition";
  readonly entityId: AppointmentId;
  readonly currentState: string;
  readonly attemptedTransition: string;
  readonly allowedTransitions: readonly string[];
}

/**
 * Gets the allowed transitions for a Appointment in its current state.
 */
export const getAppointmentAllowedTransitions = (
  currentState: string
): readonly AppointmentTransitionName[] => {
  const allowed: AppointmentTransitionName[] = [];
  if (appointmentTransitions["confirm"].fromStates.includes(currentState)) {
    allowed.push("confirm");
  }
  if (appointmentTransitions["start"].fromStates.includes(currentState)) {
    allowed.push("start");
  }
  if (appointmentTransitions["complete"].fromStates.includes(currentState)) {
    allowed.push("complete");
  }
  if (appointmentTransitions["cancel"].fromStates.includes(currentState)) {
    allowed.push("cancel");
  }
  if (appointmentTransitions["cancelDraft"].fromStates.includes(currentState)) {
    allowed.push("cancelDraft");
  }
  if (appointmentTransitions["markNoShow"].fromStates.includes(currentState)) {
    allowed.push("markNoShow");
  }
  return allowed;
};

/**
 * Checks if a Appointment can perform a given transition.
 */
export const canAppointmentTransition = (
  currentState: string,
  transition: AppointmentTransitionName
): boolean => {
  const transitionDef = appointmentTransitions[transition];
  return transitionDef?.fromStates.includes(currentState) ?? false;
};

// ============================================================
// DOCUMENT STATE MACHINE
// ============================================================

/** Valid states for Document */
export const documentStates = [
  "requested",
  "uploaded",
  "reviewed",
  "accepted",
  "rejected",
] as const;

export type DocumentState = typeof documentStates[number];

/** Valid transition names for Document */
export const documentTransitionNames = [
  "upload",
  "review",
  "accept",
  "reject",
  "reupload",
] as const;

export type DocumentTransitionName = typeof documentTransitionNames[number];

/** Transition definitions - maps transition name to valid from states */
export const documentTransitions: Record<DocumentTransitionName, { fromStates: string[]; toState: (from: string) => string }> = {
  "upload": {
    fromStates: ["requested"],
    toState: (from: string) => {
      if (from === "requested") return "uploaded";
      return "";
    },
  },
  "review": {
    fromStates: ["uploaded"],
    toState: (from: string) => {
      if (from === "uploaded") return "reviewed";
      return "";
    },
  },
  "accept": {
    fromStates: ["reviewed"],
    toState: (from: string) => {
      if (from === "reviewed") return "accepted";
      return "";
    },
  },
  "reject": {
    fromStates: ["reviewed"],
    toState: (from: string) => {
      if (from === "reviewed") return "rejected";
      return "";
    },
  },
  "reupload": {
    fromStates: ["rejected"],
    toState: (from: string) => {
      if (from === "rejected") return "uploaded";
      return "";
    },
  },
};

/** State machine transition error */
export interface DocumentTransitionError {
  readonly type: "invalid_transition";
  readonly entityId: DocumentId;
  readonly currentState: string;
  readonly attemptedTransition: string;
  readonly allowedTransitions: readonly string[];
}

/**
 * Gets the allowed transitions for a Document in its current state.
 */
export const getDocumentAllowedTransitions = (
  currentState: string
): readonly DocumentTransitionName[] => {
  const allowed: DocumentTransitionName[] = [];
  if (documentTransitions["upload"].fromStates.includes(currentState)) {
    allowed.push("upload");
  }
  if (documentTransitions["review"].fromStates.includes(currentState)) {
    allowed.push("review");
  }
  if (documentTransitions["accept"].fromStates.includes(currentState)) {
    allowed.push("accept");
  }
  if (documentTransitions["reject"].fromStates.includes(currentState)) {
    allowed.push("reject");
  }
  if (documentTransitions["reupload"].fromStates.includes(currentState)) {
    allowed.push("reupload");
  }
  return allowed;
};

/**
 * Checks if a Document can perform a given transition.
 */
export const canDocumentTransition = (
  currentState: string,
  transition: DocumentTransitionName
): boolean => {
  const transitionDef = documentTransitions[transition];
  return transitionDef?.fromStates.includes(currentState) ?? false;
};


// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
