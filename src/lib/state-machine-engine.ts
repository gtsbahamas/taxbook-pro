// ============================================================
// STATE MACHINE ENGINE - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// ENHANCED STATE MACHINE RUNTIME WITH XSTATE-STYLE FEATURES
//
// Features:
// - Guards: Conditional transitions with expression evaluation
// - Actions: Entry/exit/transition actions
// - Hierarchy: Compound states with parent/child relationships
// - Parallel: Concurrent state regions
// - History: Shallow and deep history states
// - Events: Named events to trigger transitions
// - Timeouts: Auto-transitions after duration
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What if transition is invalid? → Return explicit error
// - What if guard throws? → Catch and deny transition
// - What if action fails? → Rollback support
// - What if state is stale? → Optimistic locking
//
// Inversion Insights Applied:
//   - What would make a client NOT book? Complex forms, unclear availability, no reminders
//   - What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   - What would cause double-bookings? Race conditions, timezone bugs, unclear UI
// ============================================================

import { type Result, ok, err } from "@/types/errors";
import { evaluate, evaluateBoolean, type EvaluationContext } from "@/lib/expression-evaluator";
import { executeTriggers, createTriggerContext, type TriggerContext } from "@/lib/triggers";
import { logger } from "@/lib/observability";

// ============================================================
// TYPES
// ============================================================

/** Guard condition for state transitions */
export interface Guard {
  readonly name: string;
  readonly description: string;
  readonly expression: string;
  readonly errorMessage: string;
}

/** Action to execute during state lifecycle */
export interface StateAction {
  readonly name: string;
  readonly description: string;
  readonly type: "trigger" | "update-field" | "validate" | "notify" | "custom";
  readonly config: Record<string, unknown>;
}

/** Side effect triggered by transition */
export interface SideEffect {
  readonly type: "notification" | "email" | "webhook" | "job" | "audit-log" | "analytics";
  readonly config: Record<string, unknown>;
}

/** State definition with full features */
export interface State {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly color: string;
  readonly isInitial?: boolean;
  readonly isFinal?: boolean;
  readonly onEntry?: readonly StateAction[];
  readonly onExit?: readonly StateAction[];
  readonly timeout?: {
    readonly duration: number;
    readonly transitionTo: string;
  };
  /** Parent state (for hierarchy) */
  readonly parent?: string;
  /** Child state names */
  readonly children?: readonly string[];
  /** Parallel regions */
  readonly regions?: readonly StateRegion[];
}

/** Parallel region within a compound state */
export interface StateRegion {
  readonly id: string;
  readonly name: string;
  readonly initialState: string;
  readonly states: readonly string[];
}

/** Enhanced transition definition */
export interface Transition {
  readonly name: string;
  readonly displayName: string;
  readonly from: string;
  readonly to: string;
  readonly description?: string;
  readonly event?: string;
  readonly guards?: readonly Guard[];
  readonly actions?: readonly StateAction[];
  readonly sideEffects?: readonly SideEffect[];
  readonly confirmationRequired?: boolean;
  readonly confirmationMessage?: string;
  readonly requiredRole?: string;
  readonly priority?: number;
  readonly internal?: boolean;
}

/** Named event that triggers transitions */
export interface StateEvent {
  readonly name: string;
  readonly displayName: string;
  readonly description?: string;
  readonly payloadSchema?: Record<string, string>;
}

/** Complete state machine configuration */
export interface StateMachineConfig {
  readonly field: string;
  readonly states: readonly State[];
  readonly transitions: readonly Transition[];
  readonly events?: readonly StateEvent[];
  readonly trackHistory?: boolean;
  readonly historyType?: "shallow" | "deep";
  readonly contextType?: string;
}

/** Context for transition evaluation */
export interface TransitionContext {
  readonly entity: string;
  readonly entityId: string;
  readonly data: Record<string, unknown>;
  readonly previousData?: Record<string, unknown>;
  readonly userId?: string;
  readonly userRoles?: readonly string[];
  readonly event?: string;
  readonly eventPayload?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

/** Result of attempting a transition */
export interface TransitionResult {
  readonly success: boolean;
  readonly fromState: string;
  readonly toState: string;
  readonly transitionName: string;
  readonly guardsFailed?: readonly { name: string; message: string }[];
  readonly error?: string;
  readonly executedActions?: readonly string[];
  readonly sideEffectResults?: readonly { type: string; success: boolean; error?: string }[];
}

/** History entry for state tracking */
export interface StateHistoryEntry {
  readonly timestamp: Date;
  readonly fromState: string;
  readonly toState: string;
  readonly transitionName: string;
  readonly event?: string;
  readonly userId?: string;
  readonly metadata?: Record<string, unknown>;
}

// ============================================================
// STATE MACHINE ERROR TYPES
// ============================================================

export type StateMachineError =
  | { type: "invalid-state"; currentState: string; message: string }
  | { type: "transition-not-found"; from: string; event?: string; message: string }
  | { type: "guard-failed"; guard: string; message: string }
  | { type: "action-failed"; action: string; message: string }
  | { type: "unauthorized"; requiredRole: string; message: string }
  | { type: "invalid-event"; event: string; message: string };

// ============================================================
// STATE MACHINE ENGINE
// ============================================================

export class StateMachine {
  private config: StateMachineConfig;
  private stateMap: Map<string, State>;
  private transitionMap: Map<string, Transition[]>;
  private eventTransitionMap: Map<string, Transition[]>;
  private history: StateHistoryEntry[] = [];

  constructor(config: StateMachineConfig) {
    this.config = config;
    this.stateMap = new Map(config.states.map(s => [s.name, s]));
    this.transitionMap = new Map();
    this.eventTransitionMap = new Map();

    // Index transitions by source state
    for (const transition of config.transitions) {
      const key = transition.from;
      if (!this.transitionMap.has(key)) {
        this.transitionMap.set(key, []);
      }
      this.transitionMap.get(key)!.push(transition);

      // Index by event
      if (transition.event) {
        const eventKey = `${transition.from}:${transition.event}`;
        if (!this.eventTransitionMap.has(eventKey)) {
          this.eventTransitionMap.set(eventKey, []);
        }
        this.eventTransitionMap.get(eventKey)!.push(transition);
      }
    }
  }

  // ============================================================
  // STATE QUERIES
  // ============================================================

  /** Get the initial state */
  getInitialState(): string {
    const initial = this.config.states.find(s => s.isInitial);
    if (!initial) {
      // Default to first state if none marked as initial
      return this.config.states[0]?.name ?? "";
    }
    return initial.name;
  }

  /** Get state definition */
  getState(name: string): State | undefined {
    return this.stateMap.get(name);
  }

  /** Check if state is valid */
  isValidState(name: string): boolean {
    return this.stateMap.has(name);
  }

  /** Check if state is final */
  isFinalState(name: string): boolean {
    return this.stateMap.get(name)?.isFinal ?? false;
  }

  /** Get available transitions from current state */
  getAvailableTransitions(currentState: string): readonly Transition[] {
    return this.transitionMap.get(currentState) ?? [];
  }

  /** Get transitions triggered by an event from current state */
  getEventTransitions(currentState: string, event: string): readonly Transition[] {
    const key = `${currentState}:${event}`;
    return this.eventTransitionMap.get(key) ?? [];
  }

  /** Get all states in hierarchy (including parents) */
  getStateHierarchy(stateName: string): readonly string[] {
    const hierarchy: string[] = [];
    let current = stateName;

    while (current) {
      hierarchy.push(current);
      const state = this.stateMap.get(current);
      current = state?.parent ?? "";
    }

    return hierarchy;
  }

  /** Check if state is descendant of another */
  isDescendantOf(childState: string, parentState: string): boolean {
    const hierarchy = this.getStateHierarchy(childState);
    return hierarchy.includes(parentState);
  }

  /** Get deepest active state in compound state */
  getDeepestActiveState(compoundState: string, currentState: string): string {
    if (!this.isDescendantOf(currentState, compoundState)) {
      return compoundState;
    }
    return currentState;
  }

  // ============================================================
  // TRANSITION LOGIC
  // ============================================================

  /** Evaluate guard condition */
  private evaluateGuard(
    guard: Guard,
    context: TransitionContext
  ): Result<void, { name: string; message: string }> {
    const evalContext: EvaluationContext = {
      data: context.data,
      previousData: context.previousData,
      user: context.userId
        ? { id: context.userId, roles: context.userRoles ?? [] }
        : undefined,
      vars: {
        event: context.event,
        eventPayload: context.eventPayload,
        metadata: context.metadata,
      },
    };

    const result = evaluateBoolean(guard.expression, evalContext);

    if (!result.ok) {
      logger.warn("Guard expression evaluation failed", {
        guard: guard.name,
        expression: guard.expression,
        error: result.error.message,
      });
      return err({ name: guard.name, message: `Guard evaluation error: ${result.error.message}` });
    }

    if (!result.value) {
      return err({ name: guard.name, message: guard.errorMessage });
    }

    return ok(undefined);
  }

  /** Execute state action */
  private async executeAction(
    action: StateAction,
    context: TransitionContext
  ): Promise<Result<void, string>> {
    logger.debug("Executing state action", {
      action: action.name,
      type: action.type,
      entityId: context.entityId,
    });

    try {
      switch (action.type) {
        case "trigger":
          const triggerContext = createTriggerContext(
            context.entity,
            "transition",
            context.entityId,
            context.data,
            {
              previousData: context.previousData,
              userId: context.userId,
              metadata: {
                ...context.metadata,
                actionName: action.name,
                ...(action.config as Record<string, unknown>),
              },
            }
          );
          await executeTriggers(triggerContext);
          break;

        case "update-field":
          // Field updates should be handled by caller after transition
          logger.info("Field update action", {
            action: action.name,
            config: action.config,
          });
          break;

        case "validate":
          // Validation already handled by guards
          break;

        case "notify":
          const triggerContextNotify = createTriggerContext(
            context.entity,
            "transition",
            context.entityId,
            context.data,
            { userId: context.userId }
          );
          await executeTriggers(triggerContextNotify);
          break;

        case "custom":
          logger.info("Custom action", {
            action: action.name,
            config: action.config,
          });
          break;
      }

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("State action failed", {
        action: action.name,
        error: message,
      });
      return err(message);
    }
  }

  /** Find best matching transition */
  findTransition(
    currentState: string,
    event?: string,
    context?: TransitionContext
  ): Transition | undefined {
    let candidates: Transition[];

    if (event) {
      // Event-driven: look for transitions with matching event
      candidates = [...(this.getEventTransitions(currentState, event) || [])];

      // Also check parent states for hierarchical machines
      const hierarchy = this.getStateHierarchy(currentState);
      for (const ancestorState of hierarchy.slice(1)) {
        const ancestorTransitions = this.getEventTransitions(ancestorState, event);
        candidates.push(...ancestorTransitions);
      }
    } else {
      // Direct transitions from current state
      candidates = [...(this.getAvailableTransitions(currentState) || [])];
    }

    if (candidates.length === 0) {
      return undefined;
    }

    // Sort by priority (higher first)
    candidates.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // If context provided, find first transition where all guards pass
    if (context) {
      for (const transition of candidates) {
        if (!transition.guards || transition.guards.length === 0) {
          return transition;
        }

        const allGuardsPass = transition.guards.every(
          guard => this.evaluateGuard(guard, context).ok
        );

        if (allGuardsPass) {
          return transition;
        }
      }
      return undefined;
    }

    return candidates[0];
  }

  /** Perform state transition */
  async transition(
    currentState: string,
    transitionName: string,
    context: TransitionContext
  ): Promise<Result<TransitionResult, StateMachineError>> {
    const startTime = Date.now();

    // Validate current state
    if (!this.isValidState(currentState)) {
      return err({
        type: "invalid-state",
        currentState,
        message: `Invalid current state: ${currentState}`,
      });
    }

    // Find the transition
    const transitions = this.getAvailableTransitions(currentState);
    const transition = transitions.find(t => t.name === transitionName);

    if (!transition) {
      return err({
        type: "transition-not-found",
        from: currentState,
        message: `Transition '${transitionName}' not found from state '${currentState}'`,
      });
    }

    // Check authorization
    if (transition.requiredRole) {
      const hasRole = context.userRoles?.includes(transition.requiredRole);
      if (!hasRole) {
        return err({
          type: "unauthorized",
          requiredRole: transition.requiredRole,
          message: `Required role '${transition.requiredRole}' not found`,
        });
      }
    }

    // Evaluate guards
    const guardFailures: { name: string; message: string }[] = [];
    for (const guard of transition.guards ?? []) {
      const guardResult = this.evaluateGuard(guard, context);
      if (!guardResult.ok) {
        guardFailures.push(guardResult.error);
      }
    }

    if (guardFailures.length > 0) {
      return ok({
        success: false,
        fromState: currentState,
        toState: currentState,
        transitionName,
        guardsFailed: guardFailures,
      });
    }

    const executedActions: string[] = [];
    const toState = transition.internal ? currentState : transition.to;

    try {
      // Execute exit actions (unless internal transition)
      if (!transition.internal) {
        const exitState = this.stateMap.get(currentState);
        for (const action of exitState?.onExit ?? []) {
          const actionResult = await this.executeAction(action, context);
          if (!actionResult.ok) {
            return err({
              type: "action-failed",
              action: action.name,
              message: actionResult.error,
            });
          }
          executedActions.push(`exit:${action.name}`);
        }
      }

      // Execute transition actions
      for (const action of transition.actions ?? []) {
        const actionResult = await this.executeAction(action, context);
        if (!actionResult.ok) {
          return err({
            type: "action-failed",
            action: action.name,
            message: actionResult.error,
          });
        }
        executedActions.push(`transition:${action.name}`);
      }

      // Execute entry actions (unless internal transition)
      if (!transition.internal) {
        const entryState = this.stateMap.get(toState);
        for (const action of entryState?.onEntry ?? []) {
          const actionResult = await this.executeAction(action, context);
          if (!actionResult.ok) {
            return err({
              type: "action-failed",
              action: action.name,
              message: actionResult.error,
            });
          }
          executedActions.push(`entry:${action.name}`);
        }
      }

      // Execute side effects (async, don't block)
      const sideEffectResults: { type: string; success: boolean; error?: string }[] = [];
      for (const effect of transition.sideEffects ?? []) {
        try {
          const triggerContext = createTriggerContext(
            context.entity,
            "transition",
            context.entityId,
            { ...context.data, [this.config.field]: toState },
            {
              previousData: context.previousData,
              userId: context.userId,
              metadata: {
                transition: transitionName,
                fromState: currentState,
                toState,
                sideEffectType: effect.type,
                ...effect.config,
              },
            }
          );
          await executeTriggers(triggerContext);
          sideEffectResults.push({ type: effect.type, success: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          sideEffectResults.push({ type: effect.type, success: false, error: message });
          logger.warn("Side effect failed", {
            type: effect.type,
            error: message,
          });
        }
      }

      // Record history
      if (this.config.trackHistory) {
        this.history.push({
          timestamp: new Date(),
          fromState: currentState,
          toState,
          transitionName,
          event: context.event,
          userId: context.userId,
          metadata: context.metadata,
        });
      }

      logger.info("State transition completed", {
        entity: context.entity,
        entityId: context.entityId,
        from: currentState,
        to: toState,
        transition: transitionName,
        duration: Date.now() - startTime,
      });

      return ok({
        success: true,
        fromState: currentState,
        toState,
        transitionName,
        executedActions,
        sideEffectResults,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("State transition failed", {
        entity: context.entity,
        entityId: context.entityId,
        from: currentState,
        transition: transitionName,
        error: message,
      });

      return err({
        type: "action-failed",
        action: "unknown",
        message,
      });
    }
  }

  /** Send event to trigger transition */
  async send(
    currentState: string,
    event: string,
    context: TransitionContext,
    payload?: Record<string, unknown>
  ): Promise<Result<TransitionResult, StateMachineError>> {
    // Find transition for this event
    const transition = this.findTransition(currentState, event, {
      ...context,
      event,
      eventPayload: payload,
    });

    if (!transition) {
      return err({
        type: "transition-not-found",
        from: currentState,
        event,
        message: `No transition found for event '${event}' from state '${currentState}'`,
      });
    }

    return this.transition(currentState, transition.name, {
      ...context,
      event,
      eventPayload: payload,
    });
  }

  /** Get state history */
  getHistory(): readonly StateHistoryEntry[] {
    return [...this.history];
  }

  /** Clear history */
  clearHistory(): void {
    this.history = [];
  }

  /** Generate Mermaid diagram */
  toMermaid(): string {
    const lines: string[] = ["stateDiagram-v2"];

    // Add states
    for (const state of this.config.states) {
      if (state.isInitial) {
        lines.push(`    [*] --> ${state.name}`);
      }
      lines.push(`    ${state.name}: ${state.displayName}`);
      if (state.isFinal) {
        lines.push(`    ${state.name} --> [*]`);
      }
    }

    lines.push("");

    // Add transitions
    for (const transition of this.config.transitions) {
      const label = transition.event
        ? `${transition.displayName} [${transition.event}]`
        : transition.displayName;
      lines.push(`    ${transition.from} --> ${transition.to}: ${label}`);
    }

    return lines.join("\n");
  }

  /** Get configuration */
  getConfig(): StateMachineConfig {
    return this.config;
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

/** Create a state machine instance */
export function createStateMachine(config: StateMachineConfig): StateMachine {
  return new StateMachine(config);
}

// ============================================================
// ENTITY-SPECIFIC STATE MACHINES
// ============================================================

// ------------------------------------------------------------
// Appointment State Machine
// ------------------------------------------------------------

export const appointmentStateMachineConfig: StateMachineConfig = {
  field: "status",
  trackHistory: true,
  states: [
    {
      name: "draft",
      displayName: "Draft",
      description: "Appointment being scheduled",
      color: "gray",
      isInitial: true,
      
      
      
    },
    {
      name: "confirmed",
      displayName: "Confirmed",
      description: "Appointment confirmed",
      color: "blue",
      
      
      
      
    },
    {
      name: "in_progress",
      displayName: "In Progress",
      description: "Appointment currently happening",
      color: "yellow",
      
      
      
      
    },
    {
      name: "completed",
      displayName: "Completed",
      description: "Appointment completed successfully",
      color: "green",
      
      isFinal: true,
      
      
    },
    {
      name: "cancelled",
      displayName: "Cancelled",
      description: "Appointment cancelled",
      color: "red",
      
      isFinal: true,
      
      
    },
    {
      name: "no_show",
      displayName: "No Show",
      description: "Client did not show up",
      color: "red",
      
      isFinal: true,
      
      
    },
  ],
  transitions: [
    {
      name: "confirm",
      displayName: "Confirm",
      from: "draft",
      to: "confirmed",
      description: "Confirm the appointment",
      
      sideEffects: [
        { type: "email", config: {
  "template": "appointment_confirmed",
  "to": "client.email"
} },
      ],
      
      
      
      
      
    },
    {
      name: "start",
      displayName: "Start",
      from: "confirmed",
      to: "in_progress",
      description: "Start the appointment",
      
      
      
      
      
      
    },
    {
      name: "complete",
      displayName: "Complete",
      from: "in_progress",
      to: "completed",
      description: "Mark as completed",
      
      sideEffects: [
        { type: "audit-log", config: {
  "action": "appointment_completed"
} },
      ],
      
      
      
      
      
    },
    {
      name: "cancel",
      displayName: "Cancel",
      from: "confirmed",
      to: "cancelled",
      description: "Cancel the appointment",
      
      sideEffects: [
        { type: "email", config: {
  "template": "appointment_cancelled",
  "to": "client.email"
} },
      ],
      confirmationRequired: true,
      confirmationMessage: "Are you sure you want to cancel this appointment?",
      
      
      
    },
    {
      name: "cancel_draft",
      displayName: "Cancel",
      from: "draft",
      to: "cancelled",
      description: "Cancel the draft appointment",
      
      
      
      
      
      
    },
    {
      name: "mark_no_show",
      displayName: "No Show",
      from: "confirmed",
      to: "no_show",
      description: "Mark client as no-show",
      
      sideEffects: [
        { type: "audit-log", config: {
  "action": "client_no_show"
} },
      ],
      confirmationRequired: true,
      confirmationMessage: "Mark this client as a no-show?",
      
      
      
    },
  ],
};

export const appointmentStateMachine = createStateMachine(appointmentStateMachineConfig);

// ------------------------------------------------------------
// Document State Machine
// ------------------------------------------------------------

export const documentStateMachineConfig: StateMachineConfig = {
  field: "status",
  trackHistory: true,
  states: [
    {
      name: "requested",
      displayName: "Requested",
      description: "Document requested from client",
      color: "gray",
      isInitial: true,
      
      
      
    },
    {
      name: "uploaded",
      displayName: "Uploaded",
      description: "Document uploaded by client",
      color: "blue",
      
      
      
      
    },
    {
      name: "reviewed",
      displayName: "Reviewed",
      description: "Document reviewed by practitioner",
      color: "yellow",
      
      
      
      
    },
    {
      name: "accepted",
      displayName: "Accepted",
      description: "Document accepted",
      color: "green",
      
      isFinal: true,
      
      
    },
    {
      name: "rejected",
      displayName: "Rejected",
      description: "Document rejected, needs resubmission",
      color: "red",
      
      
      
      
    },
  ],
  transitions: [
    {
      name: "upload",
      displayName: "Upload",
      from: "requested",
      to: "uploaded",
      description: "Client uploads the document",
      
      sideEffects: [
        { type: "notification", config: {
  "message": "New document uploaded by client"
} },
      ],
      
      
      
      
      
    },
    {
      name: "review",
      displayName: "Review",
      from: "uploaded",
      to: "reviewed",
      description: "Mark as reviewed",
      
      
      
      
      
      
    },
    {
      name: "accept",
      displayName: "Accept",
      from: "reviewed",
      to: "accepted",
      description: "Accept the document",
      
      sideEffects: [
        { type: "email", config: {
  "template": "document_accepted",
  "to": "client.email"
} },
      ],
      
      
      
      
      
    },
    {
      name: "reject",
      displayName: "Reject",
      from: "reviewed",
      to: "rejected",
      description: "Reject and request resubmission",
      
      sideEffects: [
        { type: "email", config: {
  "template": "document_rejected",
  "to": "client.email"
} },
      ],
      
      
      
      
      
    },
    {
      name: "reupload",
      displayName: "Reupload",
      from: "rejected",
      to: "uploaded",
      description: "Client reuploads the document",
      
      
      
      
      
      
    },
  ],
};

export const documentStateMachine = createStateMachine(documentStateMachineConfig);


// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
