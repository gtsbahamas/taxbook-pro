// ============================================================
// STATE MACHINE RUNTIME - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// TYPE-SAFE STATE MACHINE GUARDS AND ACTIONS
//
// This module provides:
// - Generated guard functions for conditional transitions
// - Generated action functions for state entry/exit/transition
// - Type-safe state machine runtime helpers
// - Audit trail support for state changes
//
// Guards check conditions before transitions:
// - Role-based authorization
// - Business rule validation
// - Data integrity checks
//
// Actions execute at specific lifecycle points:
// - onEntry: When entering a state
// - onExit: When leaving a state
// - onTransition: During a transition
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What if guard evaluation throws? -> Catch and deny transition
// - What if action fails? -> Rollback support
// - What if context is missing? -> Graceful degradation
//
// Inversion Insights Applied:
//   - What would make a client NOT book? Complex forms, unclear availability, no reminders
//   - What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   - What would cause double-bookings? Race conditions, timezone bugs, unclear UI
// ============================================================

import { type Result, ok, err } from "@/types/errors";
import { logger } from "@/lib/observability";

// ============================================================
// CORE TYPES
// ============================================================

/** Context available during guard/action evaluation */
export interface StateMachineContext<TData = Record<string, unknown>> {
  /** Current entity data */
  readonly data: TData;
  /** Previous entity data (for comparison) */
  readonly previousData?: TData;
  /** Current user information */
  readonly user?: {
    readonly id: string;
    readonly roles: readonly string[];
    readonly email?: string;
  };
  /** Entity identifier */
  readonly entityId: string;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
  /** Timestamp of the operation */
  readonly timestamp: Date;
}

/** Guard function type */
export type GuardFunction<TData = Record<string, unknown>> = (
  context: StateMachineContext<TData>
) => GuardResult;

/** Result of guard evaluation */
export interface GuardResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

/** Action function type */
export type ActionFunction<TData = Record<string, unknown>> = (
  context: StateMachineContext<TData>
) => Promise<ActionResult>;

/** Result of action execution */
export interface ActionResult {
  readonly success: boolean;
  readonly error?: string;
  /** Field updates to apply after action */
  readonly updates?: Record<string, unknown>;
}

/** Side effect configuration */
export interface SideEffectConfig {
  readonly type: "notification" | "email" | "webhook" | "job" | "audit-log" | "analytics" | "update-field";
  readonly config: Record<string, unknown>;
}

/** Transition attempt result */
export interface TransitionAttemptResult {
  readonly allowed: boolean;
  readonly fromState: string;
  readonly toState: string;
  readonly transitionName: string;
  readonly failedGuards: readonly { name: string; reason: string }[];
  readonly executedActions: readonly string[];
  readonly errors: readonly string[];
}

// ============================================================
// GUARD REGISTRY
// ============================================================

type GuardRegistry = Map<string, GuardFunction>;

const guardRegistries: Map<string, GuardRegistry> = new Map();

/**
 * Register a guard function for an entity
 */
export function registerGuard<TData = Record<string, unknown>>(
  entityName: string,
  guardName: string,
  guardFn: GuardFunction<TData>
): void {
  if (!guardRegistries.has(entityName)) {
    guardRegistries.set(entityName, new Map());
  }
  guardRegistries.get(entityName)!.set(guardName, guardFn as GuardFunction);
  logger.debug(`Registered guard: ${entityName}.${guardName}`);
}

/**
 * Get a registered guard function
 */
export function getGuard(entityName: string, guardName: string): GuardFunction | undefined {
  return guardRegistries.get(entityName)?.get(guardName);
}

/**
 * Evaluate multiple guards
 */
export function evaluateGuards<TData = Record<string, unknown>>(
  entityName: string,
  guardNames: readonly string[],
  context: StateMachineContext<TData>
): { allPassed: boolean; failures: { name: string; reason: string }[] } {
  const failures: { name: string; reason: string }[] = [];

  for (const guardName of guardNames) {
    const guard = getGuard(entityName, guardName);
    if (!guard) {
      logger.warn(`Guard not found: ${entityName}.${guardName}`);
      failures.push({ name: guardName, reason: "Guard not registered" });
      continue;
    }

    try {
      const result = guard(context as StateMachineContext);
      if (!result.allowed) {
        failures.push({ name: guardName, reason: result.reason || "Guard condition not met" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Guard evaluation error: ${entityName}.${guardName}`, { error: message });
      failures.push({ name: guardName, reason: `Guard error: ${message}` });
    }
  }

  return { allPassed: failures.length === 0, failures };
}

// ============================================================
// ACTION REGISTRY
// ============================================================

type ActionRegistry = Map<string, ActionFunction>;

const actionRegistries: Map<string, ActionRegistry> = new Map();

/**
 * Register an action function for an entity
 */
export function registerAction<TData = Record<string, unknown>>(
  entityName: string,
  actionName: string,
  actionFn: ActionFunction<TData>
): void {
  if (!actionRegistries.has(entityName)) {
    actionRegistries.set(entityName, new Map());
  }
  actionRegistries.get(entityName)!.set(actionName, actionFn as ActionFunction);
  logger.debug(`Registered action: ${entityName}.${actionName}`);
}

/**
 * Get a registered action function
 */
export function getAction(entityName: string, actionName: string): ActionFunction | undefined {
  return actionRegistries.get(entityName)?.get(actionName);
}

/**
 * Execute multiple actions sequentially
 */
export async function executeActions<TData = Record<string, unknown>>(
  entityName: string,
  actionNames: readonly string[],
  context: StateMachineContext<TData>
): Promise<{ success: boolean; executed: string[]; errors: string[]; updates: Record<string, unknown> }> {
  const executed: string[] = [];
  const errors: string[] = [];
  let updates: Record<string, unknown> = {};

  for (const actionName of actionNames) {
    const action = getAction(entityName, actionName);
    if (!action) {
      logger.warn(`Action not found: ${entityName}.${actionName}`);
      errors.push(`Action not registered: ${actionName}`);
      continue;
    }

    try {
      const result = await action(context as StateMachineContext);
      if (result.success) {
        executed.push(actionName);
        if (result.updates) {
          updates = { ...updates, ...result.updates };
        }
      } else {
        errors.push(`${actionName}: ${result.error || "Action failed"}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Action execution error: ${entityName}.${actionName}`, { error: message });
      errors.push(`${actionName}: ${message}`);
    }
  }

  return { success: errors.length === 0, executed, errors, updates };
}

// ============================================================
// TRANSITION HELPER
// ============================================================

/**
 * Check if a transition is allowed (without executing it)
 */
export function canTransition<TData = Record<string, unknown>>(
  entityName: string,
  fromState: string,
  toState: string,
  guardNames: readonly string[],
  context: StateMachineContext<TData>
): GuardResult {
  const { allPassed, failures } = evaluateGuards(entityName, guardNames, context);

  if (!allPassed) {
    return {
      allowed: false,
      reason: failures.map((f) => `${f.name}: ${f.reason}`).join("; "),
    };
  }

  return { allowed: true };
}

/**
 * Execute a state transition with guards and actions
 */
export async function executeTransition<TData = Record<string, unknown>>(
  entityName: string,
  transitionName: string,
  fromState: string,
  toState: string,
  context: StateMachineContext<TData>,
  config: {
    guards?: readonly string[];
    exitActions?: readonly string[];
    transitionActions?: readonly string[];
    entryActions?: readonly string[];
  }
): Promise<TransitionAttemptResult> {
  const { guards = [], exitActions = [], transitionActions = [], entryActions = [] } = config;

  // Step 1: Evaluate guards
  const guardResult = evaluateGuards(entityName, guards, context);
  if (!guardResult.allPassed) {
    return {
      allowed: false,
      fromState,
      toState,
      transitionName,
      failedGuards: guardResult.failures,
      executedActions: [],
      errors: [],
    };
  }

  const executedActions: string[] = [];
  const errors: string[] = [];

  // Step 2: Execute exit actions
  if (exitActions.length > 0) {
    const exitResult = await executeActions(entityName, exitActions, context);
    executedActions.push(...exitResult.executed.map((a) => `exit:${a}`));
    errors.push(...exitResult.errors);
    if (!exitResult.success) {
      return {
        allowed: false,
        fromState,
        toState,
        transitionName,
        failedGuards: [],
        executedActions,
        errors,
      };
    }
  }

  // Step 3: Execute transition actions
  if (transitionActions.length > 0) {
    const transResult = await executeActions(entityName, transitionActions, context);
    executedActions.push(...transResult.executed.map((a) => `transition:${a}`));
    errors.push(...transResult.errors);
    if (!transResult.success) {
      return {
        allowed: false,
        fromState,
        toState,
        transitionName,
        failedGuards: [],
        executedActions,
        errors,
      };
    }
  }

  // Step 4: Execute entry actions
  if (entryActions.length > 0) {
    const entryResult = await executeActions(entityName, entryActions, context);
    executedActions.push(...entryResult.executed.map((a) => `entry:${a}`));
    errors.push(...entryResult.errors);
  }

  return {
    allowed: errors.length === 0,
    fromState,
    toState,
    transitionName,
    failedGuards: [],
    executedActions,
    errors,
  };
}

// ============================================================
// ENTITY-SPECIFIC GUARDS AND ACTIONS
// ============================================================

// ------------------------------------------------------------
// APPOINTMENT GUARDS
// ------------------------------------------------------------


// Composite guard that checks all guards for a transition

// ------------------------------------------------------------
// APPOINTMENT ACTIONS
// ------------------------------------------------------------



// Composite action lists for states
export const appointmentDraftEntryActions = [
] as const;

export const appointmentDraftExitActions = [
] as const;
export const appointmentConfirmedEntryActions = [
] as const;

export const appointmentConfirmedExitActions = [
] as const;
export const appointmentInProgressEntryActions = [
] as const;

export const appointmentInProgressExitActions = [
] as const;
export const appointmentCompletedEntryActions = [
] as const;

export const appointmentCompletedExitActions = [
] as const;
export const appointmentCancelledEntryActions = [
] as const;

export const appointmentCancelledExitActions = [
] as const;
export const appointmentNoShowEntryActions = [
] as const;

export const appointmentNoShowExitActions = [
] as const;

// Composite action lists for transitions

// ------------------------------------------------------------
// APPOINTMENT TRANSITION CONFIGURATION
// ------------------------------------------------------------

export interface AppointmentTransitionConfig {
  readonly guards: readonly string[];
  readonly exitActions: readonly string[];
  readonly transitionActions: readonly string[];
  readonly entryActions: readonly string[];
}

export const appointmentTransitionConfigs: Record<string, AppointmentTransitionConfig> = {
  "confirm": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
  "start": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
  "complete": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
  "cancel": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
  "cancel_draft": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
  "mark_no_show": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
};

/**
 * Check if Appointment can perform a transition
 */
export function canAppointmentTransition(
  fromState: string,
  toState: string,
  transitionName: string,
  context: StateMachineContext
): GuardResult {
  const config = appointmentTransitionConfigs[transitionName];
  if (!config) {
    return { allowed: false, reason: `Unknown transition: ${transitionName}` };
  }

  return canTransition("Appointment", fromState, toState, config.guards, context);
}

/**
 * Execute Appointment state transition
 */
export async function executeAppointmentTransition(
  transitionName: string,
  fromState: string,
  toState: string,
  context: StateMachineContext
): Promise<TransitionAttemptResult> {
  const config = appointmentTransitionConfigs[transitionName];
  if (!config) {
    return {
      allowed: false,
      fromState,
      toState,
      transitionName,
      failedGuards: [{ name: "unknown", reason: `Unknown transition: ${transitionName}` }],
      executedActions: [],
      errors: [],
    };
  }

  return executeTransition("Appointment", transitionName, fromState, toState, context, config);
}

// ------------------------------------------------------------
// DOCUMENT GUARDS
// ------------------------------------------------------------


// Composite guard that checks all guards for a transition

// ------------------------------------------------------------
// DOCUMENT ACTIONS
// ------------------------------------------------------------



// Composite action lists for states
export const documentRequestedEntryActions = [
] as const;

export const documentRequestedExitActions = [
] as const;
export const documentUploadedEntryActions = [
] as const;

export const documentUploadedExitActions = [
] as const;
export const documentReviewedEntryActions = [
] as const;

export const documentReviewedExitActions = [
] as const;
export const documentAcceptedEntryActions = [
] as const;

export const documentAcceptedExitActions = [
] as const;
export const documentRejectedEntryActions = [
] as const;

export const documentRejectedExitActions = [
] as const;

// Composite action lists for transitions

// ------------------------------------------------------------
// DOCUMENT TRANSITION CONFIGURATION
// ------------------------------------------------------------

export interface DocumentTransitionConfig {
  readonly guards: readonly string[];
  readonly exitActions: readonly string[];
  readonly transitionActions: readonly string[];
  readonly entryActions: readonly string[];
}

export const documentTransitionConfigs: Record<string, DocumentTransitionConfig> = {
  "upload": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
  "review": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
  "accept": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
  "reject": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
  "reupload": {
    guards: [],
    exitActions: [], // Actions handled per state, not per transition
    transitionActions: [],
    entryActions: [], // Actions handled per state, not per transition
  },
};

/**
 * Check if Document can perform a transition
 */
export function canDocumentTransition(
  fromState: string,
  toState: string,
  transitionName: string,
  context: StateMachineContext
): GuardResult {
  const config = documentTransitionConfigs[transitionName];
  if (!config) {
    return { allowed: false, reason: `Unknown transition: ${transitionName}` };
  }

  return canTransition("Document", fromState, toState, config.guards, context);
}

/**
 * Execute Document state transition
 */
export async function executeDocumentTransition(
  transitionName: string,
  fromState: string,
  toState: string,
  context: StateMachineContext
): Promise<TransitionAttemptResult> {
  const config = documentTransitionConfigs[transitionName];
  if (!config) {
    return {
      allowed: false,
      fromState,
      toState,
      transitionName,
      failedGuards: [{ name: "unknown", reason: `Unknown transition: ${transitionName}` }],
      executedActions: [],
      errors: [],
    };
  }

  return executeTransition("Document", transitionName, fromState, toState, context, config);
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Create a state machine context from entity data
 */
export function createContext<TData extends Record<string, unknown>>(
  entityId: string,
  data: TData,
  options?: {
    previousData?: TData;
    user?: StateMachineContext["user"];
    metadata?: Record<string, unknown>;
  }
): StateMachineContext<TData> {
  return {
    entityId,
    data,
    previousData: options?.previousData,
    user: options?.user,
    metadata: options?.metadata,
    timestamp: new Date(),
  };
}

/**
 * Log state transition audit entry
 */
export function logTransitionAudit(
  entityName: string,
  result: TransitionAttemptResult,
  context: StateMachineContext
): void {
  if (result.allowed) {
    logger.info(`State transition successful: ${entityName}`, {
      entity: entityName,
      entityId: context.entityId,
      from: result.fromState,
      to: result.toState,
      transition: result.transitionName,
      executedActions: result.executedActions,
      userId: context.user?.id,
    });
  } else {
    logger.warn(`State transition denied: ${entityName}`, {
      entity: entityName,
      entityId: context.entityId,
      from: result.fromState,
      to: result.toState,
      transition: result.transitionName,
      failedGuards: result.failedGuards,
      errors: result.errors,
      userId: context.user?.id,
    });
  }
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
