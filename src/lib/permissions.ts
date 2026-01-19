// ============================================================
// PERMISSIONS & RBAC - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT
//
// Permissions define WHO can do WHAT on WHICH resources.
// This module enforces permissions at the application level,
// complementing database-level RLS policies.
//
// Components:
// - Roles: Named permission sets (admin, member, viewer)
// - Permissions: Action + Resource combinations
// - Access Patterns: Entity-level access rules (owner-only, public, etc.)
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What if permission check is bypassed? → Enforce at multiple layers
// - What if role is missing? → Deny by default
// - What if user loses access? → Re-evaluate on each request
//
// Inversion Insights Applied:
//   • What would make a client NOT book? Complex forms, unclear availability, no reminders
//   • What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   • What would cause double-bookings? Race conditions, timezone bugs, unclear UI
// ============================================================

import { type Result, ok, err } from "@/types/errors";

// ============================================================
// PERMISSION TYPES
// ============================================================

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "*";

export type AccessPattern =
  | "public-read"
  | "public-write"
  | "authenticated-read"
  | "authenticated-write"
  | "owner-only"
  | "role-based"
  | "team-based"
  | "parent-based"
  | "custom";

export interface Permission {
  readonly action: PermissionAction;
  readonly resource: string;
  readonly conditions?: readonly PermissionCondition[];
}

export interface PermissionCondition {
  readonly field: string;
  readonly operator: "eq" | "neq" | "in" | "nin" | "gt" | "gte" | "lt" | "lte";
  readonly value: unknown;
}

export interface Role {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly isAdmin: boolean;
  readonly isDefault: boolean;
  readonly permissions: readonly Permission[];
  readonly inheritsFrom?: readonly string[];
}

export interface PermissionContext {
  readonly userId: string;
  readonly userRoles: readonly string[];
  readonly resource: string;
  readonly action: PermissionAction;
  readonly resourceId?: string;
  readonly resourceData?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

export interface PermissionCheckResult {
  readonly allowed: boolean;
  readonly reason: string;
  readonly matchedRole?: string;
  readonly matchedPermission?: Permission;
}

export interface PermissionError {
  readonly code: "unauthorized" | "forbidden" | "missing_role";
  readonly message: string;
  readonly resource: string;
  readonly action: PermissionAction;
}

// ============================================================
// ROLE REGISTRY
// ============================================================

class RoleRegistry {
  private roles: Map<string, Role> = new Map();

  register(role: Role): void {
    this.roles.set(role.name, role);
  }

  get(name: string): Role | undefined {
    return this.roles.get(name);
  }

  all(): readonly Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Get all permissions for a role, including inherited permissions.
   */
  getEffectivePermissions(roleName: string): readonly Permission[] {
    const role = this.get(roleName);
    if (!role) return [];

    const permissions = new Map<string, Permission>();

    // Add inherited permissions first
    if (role.inheritsFrom) {
      for (const parentName of role.inheritsFrom) {
        for (const perm of this.getEffectivePermissions(parentName)) {
          const key = `${perm.action}:${perm.resource}`;
          if (!permissions.has(key)) {
            permissions.set(key, perm);
          }
        }
      }
    }

    // Add own permissions (override inherited)
    for (const perm of role.permissions) {
      const key = `${perm.action}:${perm.resource}`;
      permissions.set(key, perm);
    }

    return Array.from(permissions.values());
  }
}

export const roleRegistry = new RoleRegistry();

// ============================================================
// ACCESS PATTERN REGISTRY
// ============================================================

const accessPatterns: Map<string, AccessPattern> = new Map();

/**
 * Register access pattern for an entity.
 */
export function registerAccessPattern(entity: string, pattern: AccessPattern): void {
  accessPatterns.set(entity, pattern);
}

/**
 * Get access pattern for an entity.
 */
export function getAccessPattern(entity: string): AccessPattern {
  return accessPatterns.get(entity) || "authenticated-read";
}

// ============================================================
// PERMISSION CHECKING
// ============================================================

/**
 * Check if a user has permission to perform an action on a resource.
 * DEFENSIVE: Deny by default.
 */
export function checkPermission(context: PermissionContext): PermissionCheckResult {
  // Admin role has full access
  if (context.userRoles.includes("admin")) {
    return {
      allowed: true,
      reason: "Admin role has full access",
      matchedRole: "admin",
    };
  }

  // Check access pattern for the resource
  const pattern = getAccessPattern(context.resource);

  // Handle public access patterns
  if (pattern === "public-read" && context.action === "read") {
    return {
      allowed: true,
      reason: "Resource has public read access",
    };
  }

  if (pattern === "public-write") {
    return {
      allowed: true,
      reason: "Resource has public write access",
    };
  }

  // Require authenticated user for other patterns
  if (!context.userId) {
    return {
      allowed: false,
      reason: "Authentication required",
    };
  }

  // Handle owner-only pattern
  if (pattern === "owner-only") {
    const ownerId = context.resourceData?.userId || context.resourceData?.ownerId;
    if (ownerId === context.userId) {
      return {
        allowed: true,
        reason: "User owns this resource",
      };
    }
    if (context.action !== "create") {
      return {
        allowed: false,
        reason: "Only the owner can access this resource",
      };
    }
  }

  // Check role-based permissions
  for (const roleName of context.userRoles) {
    const permissions = roleRegistry.getEffectivePermissions(roleName);

    for (const perm of permissions) {
      if (matchesPermission(perm, context)) {
        return {
          allowed: true,
          reason: `Permission granted by role ${roleName}`,
          matchedRole: roleName,
          matchedPermission: perm,
        };
      }
    }
  }

  // DEFENSIVE: Deny by default
  return {
    allowed: false,
    reason: "No matching permission found",
  };
}

/**
 * Check if a permission matches the context.
 */
function matchesPermission(permission: Permission, context: PermissionContext): boolean {
  // Check resource match
  if (permission.resource !== context.resource && permission.resource !== "*") {
    return false;
  }

  // Check action match
  // Wildcard (*) matches all actions
  if (permission.action === "*") {
    // Matches any action
  } else if (permission.action === "manage") {
    // "manage" includes all CRUD operations
    const managedActions: PermissionAction[] = ["create", "read", "update", "delete"];
    if (!managedActions.includes(context.action)) {
      return false;
    }
  } else if (permission.action !== context.action) {
    // Exact match required
    return false;
  }

  // Check conditions if any
  if (permission.conditions && permission.conditions.length > 0) {
    for (const condition of permission.conditions) {
      if (!evaluateCondition(condition, context.resourceData || {})) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Evaluate a permission condition against resource data.
 */
function evaluateCondition(
  condition: PermissionCondition,
  data: Record<string, unknown>
): boolean {
  const fieldValue = data[condition.field];

  switch (condition.operator) {
    case "eq":
      return fieldValue === condition.value;
    case "neq":
      return fieldValue !== condition.value;
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case "nin":
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    case "gt":
      return typeof fieldValue === "number" && fieldValue > (condition.value as number);
    case "gte":
      return typeof fieldValue === "number" && fieldValue >= (condition.value as number);
    case "lt":
      return typeof fieldValue === "number" && fieldValue < (condition.value as number);
    case "lte":
      return typeof fieldValue === "number" && fieldValue <= (condition.value as number);
    default:
      return false;
  }
}

// ============================================================
// PERMISSION ENFORCEMENT HELPERS
// ============================================================

/**
 * Enforce permission check, returning an error if not allowed.
 * Use this in route handlers and service layer.
 */
export function enforcePermission(
  context: PermissionContext
): Result<void, PermissionError> {
  const result = checkPermission(context);

  if (result.allowed) {
    return ok(undefined);
  }

  return err({
    code: context.userId ? "forbidden" : "unauthorized",
    message: result.reason,
    resource: context.resource,
    action: context.action,
  });
}

/**
 * Check if user can perform action (boolean helper for UI).
 */
export function canPerform(
  userId: string,
  userRoles: readonly string[],
  resource: string,
  action: PermissionAction,
  resourceData?: Record<string, unknown>
): boolean {
  return checkPermission({
    userId,
    userRoles,
    resource,
    action,
    resourceData,
  }).allowed;
}

/**
 * Get all allowed actions for a user on a resource.
 */
export function getAllowedActions(
  userId: string,
  userRoles: readonly string[],
  resource: string,
  resourceData?: Record<string, unknown>
): readonly PermissionAction[] {
  const actions: PermissionAction[] = ["create", "read", "update", "delete"];

  return actions.filter((action) =>
    checkPermission({
      userId,
      userRoles,
      resource,
      action,
      resourceData,
    }).allowed
  );
}

// ============================================================
// MIDDLEWARE HELPER
// ============================================================

export type PermissionMiddleware = (
  context: PermissionContext
) => Promise<Result<void, PermissionError>>;

/**
 * Create permission middleware for route handlers.
 */
export function createPermissionMiddleware(
  resource: string,
  action: PermissionAction
): PermissionMiddleware {
  return async (context) => {
    return enforcePermission({ ...context, resource, action });
  };
}

// ============================================================
// ROLE DEFINITIONS
// ============================================================

roleRegistry.register({
  name: "practitioner",
  displayName: "Practitioner",
  description: "Practitioner role",
  isAdmin: false,
  isDefault: false,
  permissions: [
  ],
});

roleRegistry.register({
  name: "admin",
  displayName: "Admin",
  description: "Admin role",
  isAdmin: true,
  isDefault: false,
  permissions: [
  ],
});


// ============================================================
// ENTITY ACCESS PATTERNS
// ============================================================

registerAccessPattern("Profile", "authenticated-read" as AccessPattern);
registerAccessPattern("Client", "authenticated-read" as AccessPattern);
registerAccessPattern("Service", "authenticated-read" as AccessPattern);
registerAccessPattern("Appointment", "authenticated-read" as AccessPattern);
registerAccessPattern("Availability", "authenticated-read" as AccessPattern);
registerAccessPattern("Document", "authenticated-read" as AccessPattern);

// ============================================================
// STATE MACHINE TRANSITION PERMISSIONS
// ============================================================

// Appointment state transition permissions
// Document state transition permissions

// ============================================================
// REACT HOOKS (for client-side permission checks)
// ============================================================

/**
 * React hook for permission checking.
 * Use in components to show/hide UI based on permissions.
 *
 * Example:
 * ```tsx
 * const { canEdit, canDelete } = usePermissions("Project", project);
 *
 * return (
 *   <>
 *     {canEdit && <EditButton />}
 *     {canDelete && <DeleteButton />}
 *   </>
 * );
 * ```
 */
export interface UsePermissionsResult {
  readonly canCreate: boolean;
  readonly canRead: boolean;
  readonly canUpdate: boolean;
  readonly canDelete: boolean;
  readonly canManage: boolean;
  readonly allowedActions: readonly PermissionAction[];
}

// Note: Implementation depends on auth context from your framework
// This is a type signature - implement in your auth provider
export type UsePermissionsHook = (
  resource: string,
  resourceData?: Record<string, unknown>
) => UsePermissionsResult;

// ============================================================
// COLUMN-LEVEL PERMISSIONS
// ============================================================

export interface ColumnPermission {
  readonly resource: string;
  readonly column: string;
  readonly read: readonly string[]; // Roles that can read
  readonly write: readonly string[]; // Roles that can write
}

const columnPermissions: Map<string, ColumnPermission> = new Map();

/**
 * Register column-level permissions.
 */
export function registerColumnPermission(permission: ColumnPermission): void {
  const key = `${permission.resource}:${permission.column}`;
  columnPermissions.set(key, permission);
}

/**
 * Check if user can read a column.
 */
export function canReadColumn(
  resource: string,
  column: string,
  userRoles: readonly string[]
): boolean {
  const key = `${resource}:${column}`;
  const permission = columnPermissions.get(key);

  if (!permission) {
    return true; // No restriction = readable
  }

  // Admin can always read
  if (userRoles.includes("admin")) {
    return true;
  }

  return permission.read.some((role) => userRoles.includes(role));
}

/**
 * Check if user can write a column.
 */
export function canWriteColumn(
  resource: string,
  column: string,
  userRoles: readonly string[]
): boolean {
  const key = `${resource}:${column}`;
  const permission = columnPermissions.get(key);

  if (!permission) {
    return true; // No restriction = writable
  }

  // Admin can always write
  if (userRoles.includes("admin")) {
    return true;
  }

  return permission.write.some((role) => userRoles.includes(role));
}

/**
 * Filter object to only include readable columns.
 */
export function filterReadableColumns<T extends Record<string, unknown>>(
  resource: string,
  data: T,
  userRoles: readonly string[]
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    if (canReadColumn(resource, key, userRoles)) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

/**
 * Filter object to only include writable columns.
 */
export function filterWritableColumns<T extends Record<string, unknown>>(
  resource: string,
  data: T,
  userRoles: readonly string[]
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    if (canWriteColumn(resource, key, userRoles)) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

// ============================================================
// SENSITIVE FIELD PROTECTION
// ============================================================

// Register column-level permissions for sensitive fields
registerColumnPermission({
  resource: "Client",
  column: "tax_id_last4",
  read: ["admin"], // Only admin can read
  write: ["admin"], // Only admin can write
});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
