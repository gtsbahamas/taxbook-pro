// ============================================================
// BUSINESS RULES ENGINE - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// TYPE-SAFE BUSINESS RULE EVALUATION ENGINE
//
// Business rules define the WHAT (constraints and behaviors) not the HOW.
// This engine evaluates rules at runtime with full type safety.
//
// Rule Types:
// - validation: Input validation before operations
// - constraint: Invariants that must always hold
// - trigger: Side effects when conditions are met
// - computed: Derived values from other fields
// - authorization: Permission checks for operations
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What could violate business invariants? → Explicit rule checks
// - What hidden assumptions exist? → Make them explicit rules
// - What would cause data corruption? → Constraint rules
//
// Inversion Insights Applied:
//   • What would make a client NOT book? Complex forms, unclear availability, no reminders
//   • What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   • What would cause double-bookings? Race conditions, timezone bugs, unclear UI
// ============================================================

import { type Result, ok, err } from "@/types/errors";

// ============================================================
// RULE TYPES
// ============================================================

export type BusinessRuleType =
  | "validation"
  | "constraint"
  | "trigger"
  | "computed"
  | "authorization";

export type RuleSeverity = "error" | "warning" | "info";

export interface RuleError {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly message: string;
  readonly severity: RuleSeverity;
  readonly field?: string;
  readonly context?: Record<string, unknown>;
}

export interface RuleContext<T = unknown> {
  readonly entity: string;
  readonly operation: "create" | "update" | "delete" | "read" | "transition";
  readonly data: T;
  readonly userId?: string;
  readonly userRoles?: readonly string[];
  readonly previousData?: T;
  readonly metadata?: Record<string, unknown>;
}

export interface BusinessRule<T = unknown> {
  readonly id: string;
  readonly name: string;
  readonly type: BusinessRuleType;
  readonly description: string;
  readonly entity: string;
  readonly field?: string;
  readonly priority: number; // Higher = runs first
  readonly enabled: boolean;
  readonly evaluate: (context: RuleContext<T>) => Result<void, RuleError>;
  readonly dependsOn?: readonly string[];
}

// ============================================================
// RULE REGISTRY
// ============================================================

class RuleRegistry {
  private rules: Map<string, BusinessRule> = new Map();
  private entityRules: Map<string, Set<string>> = new Map();
  private typeRules: Map<BusinessRuleType, Set<string>> = new Map();

  register<T>(rule: BusinessRule<T>): void {
    this.rules.set(rule.id, rule as BusinessRule);

    // Index by entity
    if (!this.entityRules.has(rule.entity)) {
      this.entityRules.set(rule.entity, new Set());
    }
    this.entityRules.get(rule.entity)!.add(rule.id);

    // Index by type
    if (!this.typeRules.has(rule.type)) {
      this.typeRules.set(rule.type, new Set());
    }
    this.typeRules.get(rule.type)!.add(rule.id);
  }

  get(id: string): BusinessRule | undefined {
    return this.rules.get(id);
  }

  getByEntity(entity: string): readonly BusinessRule[] {
    const ruleIds = this.entityRules.get(entity) || new Set();
    return Array.from(ruleIds)
      .map((id) => this.rules.get(id)!)
      .filter((r) => r.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  getByType(type: BusinessRuleType): readonly BusinessRule[] {
    const ruleIds = this.typeRules.get(type) || new Set();
    return Array.from(ruleIds)
      .map((id) => this.rules.get(id)!)
      .filter((r) => r.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  getByEntityAndType(entity: string, type: BusinessRuleType): readonly BusinessRule[] {
    return this.getByEntity(entity).filter((r) => r.type === type);
  }

  all(): readonly BusinessRule[] {
    return Array.from(this.rules.values());
  }
}

export const ruleRegistry = new RuleRegistry();

// ============================================================
// RULE EVALUATION ENGINE
// ============================================================

export interface EvaluationResult {
  readonly passed: boolean;
  readonly errors: readonly RuleError[];
  readonly warnings: readonly RuleError[];
  readonly rulesEvaluated: number;
}

/**
 * Evaluate all rules for an entity operation.
 * Rules are evaluated in priority order (highest first).
 * Stops on first error for validation/constraint rules.
 */
export function evaluateRules<T>(
  context: RuleContext<T>,
  options: {
    types?: readonly BusinessRuleType[];
    stopOnFirstError?: boolean;
  } = {}
): EvaluationResult {
  const { types, stopOnFirstError = true } = options;

  const rules = types
    ? types.flatMap((t) => ruleRegistry.getByEntityAndType(context.entity, t))
    : ruleRegistry.getByEntity(context.entity);

  // Sort by priority and respect dependencies
  const sortedRules = topologicalSort(rules);

  const errors: RuleError[] = [];
  const warnings: RuleError[] = [];
  let rulesEvaluated = 0;

  for (const rule of sortedRules) {
    rulesEvaluated++;

    const result = rule.evaluate(context as RuleContext);

    if (!result.ok) {
      if (result.error.severity === "error") {
        errors.push(result.error);
        if (stopOnFirstError) {
          break;
        }
      } else if (result.error.severity === "warning") {
        warnings.push(result.error);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    rulesEvaluated,
  };
}

/**
 * Evaluate validation rules only (for input validation).
 * All validation rules are evaluated, collecting all errors.
 */
export function validateInput<T>(context: RuleContext<T>): EvaluationResult {
  return evaluateRules(context, {
    types: ["validation"],
    stopOnFirstError: false,
  });
}

/**
 * Evaluate constraint rules only (for invariant checking).
 * Stops on first constraint violation.
 */
export function checkConstraints<T>(context: RuleContext<T>): EvaluationResult {
  return evaluateRules(context, {
    types: ["constraint"],
    stopOnFirstError: true,
  });
}

/**
 * Evaluate authorization rules only.
 */
export function checkAuthorization<T>(context: RuleContext<T>): EvaluationResult {
  return evaluateRules(context, {
    types: ["authorization"],
    stopOnFirstError: true,
  });
}

// ============================================================
// RULE HELPERS
// ============================================================

/**
 * Create a validation rule with common patterns.
 */
export function createValidationRule<T>(
  id: string,
  name: string,
  entity: string,
  field: string,
  validate: (value: unknown, context: RuleContext<T>) => boolean,
  errorMessage: string
): BusinessRule<T> {
  return {
    id,
    name,
    type: "validation",
    description: `Validate ${field} for ${entity}`,
    entity,
    field,
    priority: 100,
    enabled: true,
    evaluate: (context) => {
      const value = (context.data as Record<string, unknown>)?.[field];
      if (validate(value, context)) {
        return ok(undefined);
      }
      return err({
        ruleId: id,
        ruleName: name,
        message: errorMessage,
        severity: "error",
        field,
      });
    },
  };
}

/**
 * Create a constraint rule that must always hold.
 */
export function createConstraintRule<T>(
  id: string,
  name: string,
  entity: string,
  check: (data: T, context: RuleContext<T>) => boolean,
  errorMessage: string
): BusinessRule<T> {
  return {
    id,
    name,
    type: "constraint",
    description: name,
    entity,
    priority: 50,
    enabled: true,
    evaluate: (context) => {
      if (check(context.data, context)) {
        return ok(undefined);
      }
      return err({
        ruleId: id,
        ruleName: name,
        message: errorMessage,
        severity: "error",
      });
    },
  };
}

/**
 * Create an authorization rule.
 */
export function createAuthorizationRule<T>(
  id: string,
  name: string,
  entity: string,
  operation: RuleContext["operation"],
  check: (context: RuleContext<T>) => boolean,
  errorMessage: string = "Not authorized"
): BusinessRule<T> {
  return {
    id,
    name,
    type: "authorization",
    description: `Authorization for ${operation} on ${entity}`,
    entity,
    priority: 200, // Auth runs first
    enabled: true,
    evaluate: (context) => {
      if (context.operation !== operation) {
        return ok(undefined); // Rule doesn't apply to this operation
      }
      if (check(context)) {
        return ok(undefined);
      }
      return err({
        ruleId: id,
        ruleName: name,
        message: errorMessage,
        severity: "error",
      });
    },
  };
}

// ============================================================
// TOPOLOGICAL SORT (for dependency ordering)
// ============================================================

function topologicalSort(rules: readonly BusinessRule[]): readonly BusinessRule[] {
  const sorted: BusinessRule[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const ruleMap = new Map(rules.map((r) => [r.id, r]));

  function visit(rule: BusinessRule): void {
    if (visited.has(rule.id)) return;
    if (visiting.has(rule.id)) {
      console.warn(`Circular dependency detected in rule ${rule.id}`);
      return;
    }

    visiting.add(rule.id);

    for (const depId of rule.dependsOn || []) {
      const dep = ruleMap.get(depId);
      if (dep) {
        visit(dep);
      }
    }

    visiting.delete(rule.id);
    visited.add(rule.id);
    sorted.push(rule);
  }

  // Sort by priority first, then process
  const prioritySorted = [...rules].sort((a, b) => b.priority - a.priority);
  for (const rule of prioritySorted) {
    visit(rule);
  }

  return sorted;
}

// ============================================================
// ENTITY-SPECIFIC RULES (Auto-Generated from Schema)
// ============================================================

// ------------------------------------------------------------
// Profile Business Rules
// ------------------------------------------------------------

// === Required Field Rules ===
ruleRegistry.register(requiredFieldRule("Profile", "userId"));
ruleRegistry.register(requiredFieldRule("Profile", "email"));
ruleRegistry.register(requiredFieldRule("Profile", "name"));
ruleRegistry.register(requiredFieldRule("Profile", "timezone"));
ruleRegistry.register(requiredFieldRule("Profile", "subscriptionTier"));
ruleRegistry.register(requiredFieldRule("Profile", "maxDailyAppointments"));
ruleRegistry.register(requiredFieldRule("Profile", "maxDailyAppointmentsTaxSeason"));

// === String Length Rules ===

// === Numeric Range Rules ===

// === Enum Validation Rules ===

// === Email Format Rules ===
ruleRegistry.register(emailFormatRule("Profile", "email"));

// === URL Format Rules ===

// === Unique Constraint Rules (handled at DB level, logged here) ===


// === Custom Business Rules ===

// ------------------------------------------------------------
// Client Business Rules
// ------------------------------------------------------------

// === Required Field Rules ===
ruleRegistry.register(requiredFieldRule("Client", "userId"));
ruleRegistry.register(requiredFieldRule("Client", "name"));
ruleRegistry.register(requiredFieldRule("Client", "email"));
ruleRegistry.register(requiredFieldRule("Client", "preferredContact"));

// === String Length Rules ===

// === Numeric Range Rules ===

// === Enum Validation Rules ===

// === Email Format Rules ===
ruleRegistry.register(emailFormatRule("Client", "email"));

// === URL Format Rules ===

// === Unique Constraint Rules (handled at DB level, logged here) ===


// === Custom Business Rules ===

// ------------------------------------------------------------
// Service Business Rules
// ------------------------------------------------------------

// === Required Field Rules ===
ruleRegistry.register(requiredFieldRule("Service", "userId"));
ruleRegistry.register(requiredFieldRule("Service", "name"));
ruleRegistry.register(requiredFieldRule("Service", "durationMinutes"));
ruleRegistry.register(requiredFieldRule("Service", "taxSeasonOnly"));
ruleRegistry.register(requiredFieldRule("Service", "requiresDocuments"));
ruleRegistry.register(requiredFieldRule("Service", "isActive"));
ruleRegistry.register(requiredFieldRule("Service", "bufferMinutes"));

// === String Length Rules ===

// === Numeric Range Rules ===

// === Enum Validation Rules ===

// === Email Format Rules ===

// === URL Format Rules ===

// === Unique Constraint Rules (handled at DB level, logged here) ===


// === Custom Business Rules ===

// ------------------------------------------------------------
// Appointment Business Rules
// ------------------------------------------------------------

// === Required Field Rules ===
ruleRegistry.register(requiredFieldRule("Appointment", "userId"));
ruleRegistry.register(requiredFieldRule("Appointment", "clientId"));
ruleRegistry.register(requiredFieldRule("Appointment", "serviceId"));
ruleRegistry.register(requiredFieldRule("Appointment", "startsAt"));
ruleRegistry.register(requiredFieldRule("Appointment", "endsAt"));
ruleRegistry.register(requiredFieldRule("Appointment", "status"));
ruleRegistry.register(requiredFieldRule("Appointment", "reminderSent24h"));
ruleRegistry.register(requiredFieldRule("Appointment", "reminderSent1h"));

// === String Length Rules ===

// === Numeric Range Rules ===

// === Enum Validation Rules ===

// === Email Format Rules ===

// === URL Format Rules ===

// === Unique Constraint Rules (handled at DB level, logged here) ===

// === State Machine Constraint ===
ruleRegistry.register(createConstraintRule(
  "Appointment-valid-state",
  "Appointment must have valid state",
  "Appointment",
  (data: Record<string, unknown>) => {
    const validStates = ["draft", "confirmed", "in_progress", "completed", "cancelled", "no_show"];
    return validStates.includes(data.status as string);
  },
  "Invalid state for Appointment"
));

// === State Transition Rules ===
ruleRegistry.register(createConstraintRule(
  "Appointment-transition-draft-to-confirmed",
  "Confirm transition from draft to confirmed",
  "Appointment",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "draft" || newState !== "confirmed") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from draft to confirmed"
));
ruleRegistry.register(createConstraintRule(
  "Appointment-transition-confirmed-to-in_progress",
  "Start transition from confirmed to in_progress",
  "Appointment",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "confirmed" || newState !== "in_progress") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from confirmed to in_progress"
));
ruleRegistry.register(createConstraintRule(
  "Appointment-transition-in_progress-to-completed",
  "Complete transition from in_progress to completed",
  "Appointment",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "in_progress" || newState !== "completed") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from in_progress to completed"
));
ruleRegistry.register(createConstraintRule(
  "Appointment-transition-confirmed-to-cancelled",
  "Cancel transition from confirmed to cancelled",
  "Appointment",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "confirmed" || newState !== "cancelled") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from confirmed to cancelled"
));
ruleRegistry.register(createConstraintRule(
  "Appointment-transition-draft-to-cancelled",
  "CancelDraft transition from draft to cancelled",
  "Appointment",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "draft" || newState !== "cancelled") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from draft to cancelled"
));
ruleRegistry.register(createConstraintRule(
  "Appointment-transition-confirmed-to-no_show",
  "MarkNoShow transition from confirmed to no_show",
  "Appointment",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "confirmed" || newState !== "no_show") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from confirmed to no_show"
));

// === Custom Business Rules ===
ruleRegistry.register({
  id: "Appointment-prevent-double-booking",
  name: "prevent_double_booking",
  type: "constraint" as BusinessRuleType,
  description: "No double-booking same practitioner",
  entity: "Appointment",
  
  priority: 100,
  enabled: true,
  evaluate: (context) => {
    // Custom rule: No double-booking same practitioner
    // This rule is enforced at the database level via SQL constraint:
    // NOT EXISTS (
    //   SELECT 1 FROM appointments a
    //   WHERE a.user_id = NEW.user_id
    //   AND a.id != NEW.id
    //   AND a.status NOT IN ('cancelled', 'no_show')
    //   AND (NEW.starts_at, NEW.ends_at) OVERLAPS (a.starts_at, a.ends_at)
    // )
    return ok(undefined);
  },
});
ruleRegistry.register({
  id: "Appointment-check-daily-capacity",
  name: "check_daily_capacity",
  type: "validation" as BusinessRuleType,
  description: "Tax season capacity limits",
  entity: "Appointment",
  
  priority: 100,
  enabled: true,
  evaluate: (context) => {
    // Custom rule: Tax season capacity limits
    // This rule is enforced at the database level via SQL constraint:
    // (
    //   SELECT COUNT(*) FROM appointments a
    //   WHERE a.user_id = NEW.user_id
    //   AND DATE(a.starts_at) = DATE(NEW.starts_at)
    //   AND a.status NOT IN ('cancelled', 'no_show')
    // ) < COALESCE((SELECT max_daily_appointments FROM profiles WHERE user_id = NEW.user_id), 8)
    return ok(undefined);
  },
});
ruleRegistry.register({
  id: "Appointment-check-documents-required",
  name: "check_documents_required",
  type: "validation" as BusinessRuleType,
  description: "Document collection required before certain services",
  entity: "Appointment",
  
  priority: 100,
  enabled: true,
  evaluate: (context) => {
    // Custom rule: Document collection required before certain services
    // This rule is enforced at the database level via SQL constraint:
    // NOT (SELECT requires_documents FROM services WHERE id = NEW.service_id)
    // OR EXISTS (
    //   SELECT 1 FROM documents d
    //   WHERE d.client_id = NEW.client_id
    //   AND d.status = 'accepted'
    // )
    return ok(undefined);
  },
});

// ------------------------------------------------------------
// Availability Business Rules
// ------------------------------------------------------------

// === Required Field Rules ===
ruleRegistry.register(requiredFieldRule("Availability", "userId"));
ruleRegistry.register(requiredFieldRule("Availability", "dayOfWeek"));
ruleRegistry.register(requiredFieldRule("Availability", "startTime"));
ruleRegistry.register(requiredFieldRule("Availability", "endTime"));
ruleRegistry.register(requiredFieldRule("Availability", "isTaxSeason"));

// === String Length Rules ===

// === Numeric Range Rules ===

// === Enum Validation Rules ===

// === Email Format Rules ===

// === URL Format Rules ===

// === Unique Constraint Rules (handled at DB level, logged here) ===


// === Custom Business Rules ===

// ------------------------------------------------------------
// Document Business Rules
// ------------------------------------------------------------

// === Required Field Rules ===
ruleRegistry.register(requiredFieldRule("Document", "userId"));
ruleRegistry.register(requiredFieldRule("Document", "clientId"));
ruleRegistry.register(requiredFieldRule("Document", "documentType"));
ruleRegistry.register(requiredFieldRule("Document", "status"));

// === String Length Rules ===

// === Numeric Range Rules ===

// === Enum Validation Rules ===

// === Email Format Rules ===

// === URL Format Rules ===
ruleRegistry.register(createValidationRule(
  "Document-fileUrl-url",
  "fileUrl must be valid URL",
  "Document",
  "fileUrl",
  (value) => {
    if (!value) return true;
    try {
      const url = new URL(value as string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  },
  "fileUrl must be a valid HTTP(S) URL"
));

// === Unique Constraint Rules (handled at DB level, logged here) ===

// === State Machine Constraint ===
ruleRegistry.register(createConstraintRule(
  "Document-valid-state",
  "Document must have valid state",
  "Document",
  (data: Record<string, unknown>) => {
    const validStates = ["requested", "uploaded", "reviewed", "accepted", "rejected"];
    return validStates.includes(data.status as string);
  },
  "Invalid state for Document"
));

// === State Transition Rules ===
ruleRegistry.register(createConstraintRule(
  "Document-transition-requested-to-uploaded",
  "Upload transition from requested to uploaded",
  "Document",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "requested" || newState !== "uploaded") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from requested to uploaded"
));
ruleRegistry.register(createConstraintRule(
  "Document-transition-uploaded-to-reviewed",
  "Review transition from uploaded to reviewed",
  "Document",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "uploaded" || newState !== "reviewed") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from uploaded to reviewed"
));
ruleRegistry.register(createConstraintRule(
  "Document-transition-reviewed-to-accepted",
  "Accept transition from reviewed to accepted",
  "Document",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "reviewed" || newState !== "accepted") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from reviewed to accepted"
));
ruleRegistry.register(createConstraintRule(
  "Document-transition-reviewed-to-rejected",
  "Reject transition from reviewed to rejected",
  "Document",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "reviewed" || newState !== "rejected") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from reviewed to rejected"
));
ruleRegistry.register(createConstraintRule(
  "Document-transition-rejected-to-uploaded",
  "Reupload transition from rejected to uploaded",
  "Document",
  (data: Record<string, unknown>, context) => {
    const currentState = context.previousData?.status as string;
    const newState = data.status as string;

    if (currentState !== "rejected" || newState !== "uploaded") {
      return true; // This rule doesn't apply
    }

    // Transition is allowed
    return true;
  },
  "Cannot transition from rejected to uploaded"
));

// === Custom Business Rules ===


// ============================================================
// COMMON VALIDATION RULES
// ============================================================

// Email format validation (reusable)
export function emailFormatRule(entity: string, field: string = "email"): BusinessRule {
  return createValidationRule(
    `${entity}-email-format`,
    "Valid email format",
    entity,
    field,
    (value) => {
      if (!value) return true; // Optional field
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value as string);
    },
    "Must be a valid email address"
  );
}

// Required field validation (reusable)
export function requiredFieldRule(entity: string, field: string): BusinessRule {
  return createValidationRule(
    `${entity}-${field}-required`,
    `${field} is required`,
    entity,
    field,
    (value) => value !== undefined && value !== null && value !== "",
    `${field} is required`
  );
}

// String length validation (reusable)
export function stringLengthRule(
  entity: string,
  field: string,
  minLength: number,
  maxLength: number
): BusinessRule {
  return createValidationRule(
    `${entity}-${field}-length`,
    `${field} length validation`,
    entity,
    field,
    (value) => {
      if (!value) return true; // Optional field
      const len = (value as string).length;
      return len >= minLength && len <= maxLength;
    },
    `${field} must be between ${minLength} and ${maxLength} characters`
  );
}

// Numeric range validation (reusable)
export function numericRangeRule(
  entity: string,
  field: string,
  min: number,
  max: number
): BusinessRule {
  return createValidationRule(
    `${entity}-${field}-range`,
    `${field} range validation`,
    entity,
    field,
    (value) => {
      if (value === undefined || value === null) return true;
      const num = value as number;
      return num >= min && num <= max;
    },
    `${field} must be between ${min} and ${max}`
  );
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
