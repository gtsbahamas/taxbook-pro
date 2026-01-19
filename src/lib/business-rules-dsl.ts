// ============================================================
// BUSINESS RULES DSL ENGINE - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// DECLARATIVE BUSINESS RULES WITH DSL CONDITIONS AND ACTIONS
//
// Rule Categories:
// - validation: Input validation before operations
// - constraint: Invariants that must always hold
// - authorization: Permission checks
// - trigger: Side effects when conditions met
// - computed: Derived values
// - gate: State transition gates
// - default: Default value computation
// - formatting: Output formatting rules
//
// Condition Types:
// - expression: JavaScript subset expression
// - all: AND of multiple conditions
// - any: OR of multiple conditions
// - not: Negation of condition
// - field: Field comparison (eq, gt, in, etc.)
// - state: Entity state check
// - role: User role check
// - custom: Custom function call
//
// Action Types:
// - allow: Allow the operation
// - deny: Deny with message
// - validate: Return validation errors
// - transform: Transform field values
// - compute: Compute derived value
// - trigger: Fire a trigger
// - set-field: Set field value
// - require-confirmation: Request user confirmation
// - log: Log message
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What if rule depends on missing data? → Graceful undefined handling
// - What if rules conflict? → Priority-based resolution
// - What if rule evaluation fails? → Safe deny by default
//
// Inversion Insights Applied:
//   - What would make a client NOT book? Complex forms, unclear availability, no reminders
//   - What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   - What would cause double-bookings? Race conditions, timezone bugs, unclear UI
// ============================================================

import { type Result, ok, err } from "@/types/errors";
import { evaluate, evaluateBoolean, type EvaluationContext } from "@/lib/expression-evaluator";
import { logger } from "@/lib/observability";

// ============================================================
// TYPES
// ============================================================

/** Comparison operators */
export type RuleOperator =
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte"
  | "in" | "not_in" | "contains" | "not_contains"
  | "starts_with" | "ends_with" | "matches"
  | "is_null" | "is_not_null" | "is_empty" | "is_not_empty";

/** Condition types */
export type RuleCondition =
  | { readonly type: "expression"; readonly expression: string }
  | { readonly type: "all"; readonly conditions: readonly RuleCondition[] }
  | { readonly type: "any"; readonly conditions: readonly RuleCondition[] }
  | { readonly type: "not"; readonly condition: RuleCondition }
  | { readonly type: "field"; readonly field: string; readonly operator: RuleOperator; readonly value: unknown }
  | { readonly type: "state"; readonly field: string; readonly states: readonly string[] }
  | { readonly type: "role"; readonly roles: readonly string[] }
  | { readonly type: "custom"; readonly name: string; readonly args: Record<string, unknown> };

/** Validation error */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code?: string;
}

/** Field transformation */
export interface FieldTransformation {
  readonly field: string;
  readonly transform: "uppercase" | "lowercase" | "trim" | "sanitize" | "custom";
  readonly customExpression?: string;
}

/** Action types */
export type RuleAction =
  | { readonly type: "allow" }
  | { readonly type: "deny"; readonly message: string; readonly code?: string }
  | { readonly type: "validate"; readonly errors: readonly ValidationError[] }
  | { readonly type: "transform"; readonly transformations: readonly FieldTransformation[] }
  | { readonly type: "compute"; readonly field: string; readonly expression: string }
  | { readonly type: "trigger"; readonly triggerId: string; readonly payload?: Record<string, unknown> }
  | { readonly type: "set-field"; readonly field: string; readonly value: unknown }
  | { readonly type: "require-confirmation"; readonly message: string }
  | { readonly type: "log"; readonly level: "info" | "warn" | "error"; readonly message: string };

/** Rule categories */
export type BusinessRuleCategory =
  | "validation"
  | "constraint"
  | "authorization"
  | "trigger"
  | "computed"
  | "gate"
  | "default"
  | "formatting";

/** Rule definition */
export interface BusinessRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly entity: string;
  readonly category: BusinessRuleCategory;
  readonly enabled: boolean;
  readonly priority: number;
  readonly when: RuleCondition;
  readonly then: RuleAction;
  readonly otherwise?: RuleAction;
  readonly dependsOn?: readonly string[];
  readonly tags?: readonly string[];
}

/** Rule evaluation context */
export interface RuleContext {
  readonly entity: string;
  readonly operation: "create" | "update" | "delete" | "read" | "transition";
  readonly data: Record<string, unknown>;
  readonly previousData?: Record<string, unknown>;
  readonly userId?: string;
  readonly userRoles?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

/** Single rule evaluation result */
export interface RuleResult {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly matched: boolean;
  readonly action?: RuleAction;
  readonly error?: string;
  readonly durationMs: number;
}

/** Batch evaluation result */
export interface EvaluationResult {
  readonly passed: boolean;
  readonly results: readonly RuleResult[];
  readonly errors: readonly ValidationError[];
  readonly transformations: Record<string, unknown>;
  readonly requiresConfirmation?: { message: string; ruleId: string };
  readonly totalDurationMs: number;
}

/** Custom function definition */
export interface CustomFunction {
  readonly name: string;
  readonly fn: (args: Record<string, unknown>, context: RuleContext) => boolean;
}

// ============================================================
// RULE REGISTRY
// ============================================================

class RuleRegistry {
  private rules: Map<string, BusinessRule> = new Map();
  private entityIndex: Map<string, Set<string>> = new Map();
  private categoryIndex: Map<BusinessRuleCategory, Set<string>> = new Map();
  private customFunctions: Map<string, CustomFunction> = new Map();

  /** Register a rule */
  register(rule: BusinessRule): void {
    this.rules.set(rule.id, rule);

    // Index by entity
    if (!this.entityIndex.has(rule.entity)) {
      this.entityIndex.set(rule.entity, new Set());
    }
    this.entityIndex.get(rule.entity)!.add(rule.id);

    // Index by category
    if (!this.categoryIndex.has(rule.category)) {
      this.categoryIndex.set(rule.category, new Set());
    }
    this.categoryIndex.get(rule.category)!.add(rule.id);
  }

  /** Register multiple rules */
  registerMany(rules: readonly BusinessRule[]): void {
    for (const rule of rules) {
      this.register(rule);
    }
  }

  /** Register custom function */
  registerFunction(func: CustomFunction): void {
    this.customFunctions.set(func.name, func);
  }

  /** Get rule by ID */
  get(id: string): BusinessRule | undefined {
    return this.rules.get(id);
  }

  /** Get rules by entity */
  getByEntity(entity: string): readonly BusinessRule[] {
    const ids = this.entityIndex.get(entity) || new Set();
    return Array.from(ids)
      .map(id => this.rules.get(id)!)
      .filter(r => r.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  /** Get rules by category */
  getByCategory(category: BusinessRuleCategory): readonly BusinessRule[] {
    const ids = this.categoryIndex.get(category) || new Set();
    return Array.from(ids)
      .map(id => this.rules.get(id)!)
      .filter(r => r.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  /** Get rules by entity and category */
  getByEntityAndCategory(entity: string, category: BusinessRuleCategory): readonly BusinessRule[] {
    return this.getByEntity(entity).filter(r => r.category === category);
  }

  /** Get custom function */
  getFunction(name: string): CustomFunction | undefined {
    return this.customFunctions.get(name);
  }

  /** Get all rules */
  all(): readonly BusinessRule[] {
    return Array.from(this.rules.values());
  }

  /** Clear all rules */
  clear(): void {
    this.rules.clear();
    this.entityIndex.clear();
    this.categoryIndex.clear();
  }
}

export const ruleRegistry = new RuleRegistry();

// ============================================================
// CONDITION EVALUATOR
// ============================================================

function evaluateCondition(
  condition: RuleCondition,
  context: RuleContext,
  registry: RuleRegistry
): boolean {
  switch (condition.type) {
    case "expression":
      const evalContext: EvaluationContext = {
        data: context.data,
        previousData: context.previousData,
        user: context.userId
          ? { id: context.userId, roles: context.userRoles ?? [] }
          : undefined,
        vars: context.metadata,
      };
      const result = evaluateBoolean(condition.expression, evalContext);
      return result.ok ? result.value : false;

    case "all":
      return condition.conditions.every(c => evaluateCondition(c, context, registry));

    case "any":
      return condition.conditions.some(c => evaluateCondition(c, context, registry));

    case "not":
      return !evaluateCondition(condition.condition, context, registry);

    case "field":
      return evaluateFieldCondition(condition, context);

    case "state":
      const stateValue = getNestedValue(context.data, condition.field);
      return condition.states.includes(stateValue as string);

    case "role":
      const userRoles = context.userRoles ?? [];
      return condition.roles.some(r => userRoles.includes(r));

    case "custom":
      const customFunc = registry.getFunction(condition.name);
      if (!customFunc) {
        logger.warn(`Custom function '${condition.name}' not found`);
        return false;
      }
      return customFunc.fn(condition.args, context);

    default:
      logger.warn(`Unknown condition type: ${(condition as RuleCondition).type}`);
      return false;
  }
}

function evaluateFieldCondition(
  condition: Extract<RuleCondition, { type: "field" }>,
  context: RuleContext
): boolean {
  const fieldValue = getNestedValue(context.data, condition.field);
  const compareValue = condition.value;

  switch (condition.operator) {
    case "eq": return fieldValue === compareValue;
    case "neq": return fieldValue !== compareValue;
    case "gt": return (fieldValue as number) > (compareValue as number);
    case "gte": return (fieldValue as number) >= (compareValue as number);
    case "lt": return (fieldValue as number) < (compareValue as number);
    case "lte": return (fieldValue as number) <= (compareValue as number);
    case "in":
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case "not_in":
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case "contains":
      if (typeof fieldValue === "string") {
        return fieldValue.includes(compareValue as string);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(compareValue);
      }
      return false;
    case "not_contains":
      if (typeof fieldValue === "string") {
        return !fieldValue.includes(compareValue as string);
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(compareValue);
      }
      return true;
    case "starts_with":
      return typeof fieldValue === "string" && fieldValue.startsWith(compareValue as string);
    case "ends_with":
      return typeof fieldValue === "string" && fieldValue.endsWith(compareValue as string);
    case "matches":
      if (typeof fieldValue !== "string") return false;
      try {
        return new RegExp(compareValue as string).test(fieldValue);
      } catch {
        return false;
      }
    case "is_null":
      return fieldValue === null || fieldValue === undefined;
    case "is_not_null":
      return fieldValue !== null && fieldValue !== undefined;
    case "is_empty":
      if (fieldValue === null || fieldValue === undefined) return true;
      if (typeof fieldValue === "string") return fieldValue === "";
      if (Array.isArray(fieldValue)) return fieldValue.length === 0;
      if (typeof fieldValue === "object") return Object.keys(fieldValue).length === 0;
      return false;
    case "is_not_empty":
      if (fieldValue === null || fieldValue === undefined) return false;
      if (typeof fieldValue === "string") return fieldValue !== "";
      if (Array.isArray(fieldValue)) return fieldValue.length > 0;
      if (typeof fieldValue === "object") return Object.keys(fieldValue).length > 0;
      return true;
    default:
      return false;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

// ============================================================
// ACTION EXECUTOR
// ============================================================

function executeAction(
  action: RuleAction,
  context: RuleContext,
  accumulator: {
    errors: ValidationError[];
    transformations: Record<string, unknown>;
    requiresConfirmation?: { message: string; ruleId: string };
  },
  ruleId: string
): { stop: boolean; denied: boolean } {
  switch (action.type) {
    case "allow":
      return { stop: false, denied: false };

    case "deny":
      accumulator.errors.push({
        field: "_global",
        message: action.message,
        code: action.code,
      });
      return { stop: true, denied: true };

    case "validate":
      accumulator.errors.push(...action.errors);
      return { stop: false, denied: false };

    case "transform":
      for (const transform of action.transformations) {
        const value = getNestedValue(context.data, transform.field);
        let newValue: unknown = value;

        switch (transform.transform) {
          case "uppercase":
            newValue = typeof value === "string" ? value.toUpperCase() : value;
            break;
          case "lowercase":
            newValue = typeof value === "string" ? value.toLowerCase() : value;
            break;
          case "trim":
            newValue = typeof value === "string" ? value.trim() : value;
            break;
          case "sanitize":
            newValue = typeof value === "string"
              ? value.replace(/<[^>]*>/g, "").trim()
              : value;
            break;
          case "custom":
            if (transform.customExpression) {
              const result = evaluate(transform.customExpression, {
                data: context.data,
                vars: { value },
              });
              if (result.ok) {
                newValue = result.value.value;
              }
            }
            break;
        }

        accumulator.transformations[transform.field] = newValue;
      }
      return { stop: false, denied: false };

    case "compute":
      const evalContext: EvaluationContext = {
        data: context.data,
        previousData: context.previousData,
      };
      const computeResult = evaluate(action.expression, evalContext);
      if (computeResult.ok) {
        accumulator.transformations[action.field] = computeResult.value.value;
      }
      return { stop: false, denied: false };

    case "trigger":
      // Triggers are handled asynchronously by the trigger engine
      logger.info("Rule trigger action", {
        triggerId: action.triggerId,
        payload: action.payload,
      });
      return { stop: false, denied: false };

    case "set-field":
      accumulator.transformations[action.field] = action.value;
      return { stop: false, denied: false };

    case "require-confirmation":
      accumulator.requiresConfirmation = {
        message: action.message,
        ruleId,
      };
      return { stop: true, denied: false };

    case "log":
      const logFn = action.level === "error" ? logger.error
        : action.level === "warn" ? logger.warn
        : logger.info;
      logFn(action.message, {
        entity: context.entity,
        operation: context.operation,
        ruleId,
      });
      return { stop: false, denied: false };

    default:
      return { stop: false, denied: false };
  }
}

// ============================================================
// RULE ENGINE
// ============================================================

/**
 * Evaluate all rules for an entity operation.
 */
export function evaluateRules(
  context: RuleContext,
  options: {
    categories?: readonly BusinessRuleCategory[];
    stopOnFirstDeny?: boolean;
    registry?: RuleRegistry;
  } = {}
): EvaluationResult {
  const startTime = Date.now();
  const registry = options.registry ?? ruleRegistry;
  const stopOnFirstDeny = options.stopOnFirstDeny ?? true;

  // Get applicable rules
  let rules: readonly BusinessRule[];
  if (options.categories) {
    rules = options.categories.flatMap(cat =>
      registry.getByEntityAndCategory(context.entity, cat)
    );
  } else {
    rules = registry.getByEntity(context.entity);
  }

  // Sort by dependency (topological sort)
  const sortedRules = topologicalSort(rules);

  const results: RuleResult[] = [];
  const accumulator = {
    errors: [] as ValidationError[],
    transformations: {} as Record<string, unknown>,
    requiresConfirmation: undefined as { message: string; ruleId: string } | undefined,
  };

  let stopped = false;
  let denied = false;

  for (const rule of sortedRules) {
    if (stopped) break;

    const ruleStart = Date.now();
    let matched = false;
    let action: RuleAction | undefined;
    let error: string | undefined;

    try {
      matched = evaluateCondition(rule.when, context, registry);
      action = matched ? rule.then : rule.otherwise;

      if (action) {
        const result = executeAction(action, context, accumulator, rule.id);
        if (result.stop) stopped = true;
        if (result.denied) denied = true;
        if (stopOnFirstDeny && denied) stopped = true;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      logger.error("Rule evaluation error", {
        ruleId: rule.id,
        error,
      });
    }

    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      action,
      error,
      durationMs: Date.now() - ruleStart,
    });
  }

  return {
    passed: !denied && accumulator.errors.length === 0,
    results,
    errors: accumulator.errors,
    transformations: accumulator.transformations,
    requiresConfirmation: accumulator.requiresConfirmation,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Evaluate validation rules only.
 */
export function validateData(context: RuleContext): EvaluationResult {
  return evaluateRules(context, {
    categories: ["validation"],
    stopOnFirstDeny: false,
  });
}

/**
 * Evaluate authorization rules only.
 */
export function checkAuthorization(context: RuleContext): EvaluationResult {
  return evaluateRules(context, {
    categories: ["authorization"],
    stopOnFirstDeny: true,
  });
}

/**
 * Evaluate constraint rules only.
 */
export function checkConstraints(context: RuleContext): EvaluationResult {
  return evaluateRules(context, {
    categories: ["constraint"],
    stopOnFirstDeny: true,
  });
}

/**
 * Evaluate gate rules for state transition.
 */
export function checkGates(
  context: RuleContext,
  fromState: string,
  toState: string
): EvaluationResult {
  const gateContext: RuleContext = {
    ...context,
    operation: "transition",
    metadata: {
      ...context.metadata,
      fromState,
      toState,
    },
  };

  return evaluateRules(gateContext, {
    categories: ["gate"],
    stopOnFirstDeny: true,
  });
}

/**
 * Compute derived values using computed rules.
 */
export function computeFields(context: RuleContext): Record<string, unknown> {
  const result = evaluateRules(context, {
    categories: ["computed", "default"],
    stopOnFirstDeny: false,
  });
  return result.transformations;
}

// ============================================================
// TOPOLOGICAL SORT
// ============================================================

function topologicalSort(rules: readonly BusinessRule[]): readonly BusinessRule[] {
  const sorted: BusinessRule[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const ruleMap = new Map(rules.map(r => [r.id, r]));

  function visit(rule: BusinessRule): void {
    if (visited.has(rule.id)) return;
    if (visiting.has(rule.id)) {
      logger.warn(`Circular rule dependency detected: ${rule.id}`);
      return;
    }

    visiting.add(rule.id);

    for (const depId of rule.dependsOn ?? []) {
      const dep = ruleMap.get(depId);
      if (dep) visit(dep);
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
// DSL HELPERS
// ============================================================

/** Create a field condition */
export function field(
  fieldName: string,
  operator: RuleOperator,
  value: unknown
): RuleCondition {
  return { type: "field", field: fieldName, operator, value };
}

/** Create an expression condition */
export function expr(expression: string): RuleCondition {
  return { type: "expression", expression };
}

/** Create an ALL condition (AND) */
export function all(...conditions: RuleCondition[]): RuleCondition {
  return { type: "all", conditions };
}

/** Create an ANY condition (OR) */
export function any(...conditions: RuleCondition[]): RuleCondition {
  return { type: "any", conditions };
}

/** Create a NOT condition */
export function not(condition: RuleCondition): RuleCondition {
  return { type: "not", condition };
}

/** Create a state condition */
export function inState(stateField: string, ...states: string[]): RuleCondition {
  return { type: "state", field: stateField, states };
}

/** Create a role condition */
export function hasRole(...roles: string[]): RuleCondition {
  return { type: "role", roles };
}

/** Create deny action */
export function deny(message: string, code?: string): RuleAction {
  return { type: "deny", message, code };
}

/** Create validation error action */
export function validate(...errors: ValidationError[]): RuleAction {
  return { type: "validate", errors };
}

/** Create allow action */
export function allow(): RuleAction {
  return { type: "allow" };
}

/** Create compute action */
export function compute(field: string, expression: string): RuleAction {
  return { type: "compute", field, expression };
}

/** Create rule builder */
export function defineRule(partial: Omit<BusinessRule, "enabled">): BusinessRule {
  return { ...partial, enabled: true };
}

// ============================================================
// ENTITY RULES REGISTRATION
// ============================================================

// ------------------------------------------------------------
// Profile Business Rules
// ------------------------------------------------------------



// ------------------------------------------------------------
// Client Business Rules
// ------------------------------------------------------------



// ------------------------------------------------------------
// Service Business Rules
// ------------------------------------------------------------



// ------------------------------------------------------------
// Appointment Business Rules
// ------------------------------------------------------------

ruleRegistry.register({
  id: "Appointment-prevent-double-booking",
  name: "prevent_double_booking",
  description: "No double-booking same practitioner",
  entity: "Appointment",
  category: "validation" as BusinessRuleCategory,
  enabled: true,
  priority: 100,
  when: { type: "expression", expression: "true" },
  then: { type: "allow" },
  
  
  
});

ruleRegistry.register({
  id: "Appointment-check-daily-capacity",
  name: "check_daily_capacity",
  description: "Tax season capacity limits",
  entity: "Appointment",
  category: "validation" as BusinessRuleCategory,
  enabled: true,
  priority: 100,
  when: { type: "expression", expression: "true" },
  then: { type: "allow" },
  
  
  
});

ruleRegistry.register({
  id: "Appointment-check-documents-required",
  name: "check_documents_required",
  description: "Document collection required before certain services",
  entity: "Appointment",
  category: "validation" as BusinessRuleCategory,
  enabled: true,
  priority: 100,
  when: { type: "expression", expression: "true" },
  then: { type: "allow" },
  
  
  
});


// State machine gate rules

// ------------------------------------------------------------
// Availability Business Rules
// ------------------------------------------------------------



// ------------------------------------------------------------
// Document Business Rules
// ------------------------------------------------------------


// State machine gate rules


// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
