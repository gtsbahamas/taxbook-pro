/**
 * Feature Flags Library - taxbook-pro
 * Generated: 2026-01-19
 *
 * Type-safe feature flag system with:
 * - User/role-based targeting
 * - Percentage rollouts
 * - Development overrides
 * - React hook for client components
 * - Server-side flag checking
 * - Pareto-driven priority tiers (80/20 principle)
 *
 * PARETO PRINCIPLE INTEGRATION:
 * Features are classified by impact tier to focus development and rollout
 * on the "vital few" that deliver 80% of user value:
 *
 * - CORE: Essential features (the 20% that delivers 80% of value)
 * - HIGH_IMPACT: Important features that significantly improve UX
 * - ENHANCEMENT: Nice-to-have improvements
 * - EXPERIMENT: Features being validated for impact
 *
 * PARETO INSIGHTS FROM PREP:
 * - 80% of value: booking + reminders + document upload
 * - 20% effort: basic availability settings cover most use cases
 * - Focus on tax season chaos, not year-round edge cases
 */

'use client';

import { useMemo, useSyncExternalStore } from 'react';

// ============================================================
// FEATURE FLAG TYPES
// ============================================================

/**
 * Supported flag value types.
 * Flags can be boolean (on/off), string (variants), or number (thresholds).
 */
export type FlagValue = boolean | string | number;

/**
 * User context for flag evaluation.
 * Used to determine which flags should be enabled for a specific user.
 */
export interface FlagUserContext {
  readonly userId?: string;
  readonly email?: string;
  readonly role?: UserRole;
  readonly attributes?: Record<string, string | number | boolean>;
}

/**
 * User roles for role-based targeting.
 * Extend this type to add project-specific roles.
 */
export type UserRole =
  | 'anonymous'
  | 'user'
  | 'admin'
  | 'super_admin'
  | (string & {});  // Allow custom roles while preserving autocomplete

/**
 * Environment types for conditional flag behavior.
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Pareto-driven priority tiers for feature flags.
 * Based on the 80/20 principle - focus on the vital few.
 *
 * @example
 * // Rollout strategy based on priority:
 * // - CORE: Enable immediately (100% rollout)
 * // - HIGH_IMPACT: Staged rollout (25% → 50% → 100%)
 * // - ENHANCEMENT: Gradual rollout (10% → 25% → 50% → 100%)
 * // - EXPERIMENT: A/B test first (10% → validate → decision)
 */
export type FeaturePriority =
  | 'core'           // Essential - the 20% that delivers 80% of value
  | 'high_impact'    // Important - significantly improves user experience
  | 'enhancement'    // Nice-to-have - incremental improvements
  | 'experiment';    // Validation needed - measuring impact before committing

/**
 * Recommended rollout percentages by priority tier.
 * These are defaults - override based on your specific context.
 */
export const PRIORITY_ROLLOUT_DEFAULTS: Record<FeaturePriority, {
  readonly initialPercentage: number;
  readonly targetPercentage: number;
  readonly incrementStep: number;
}> = {
  core: {
    initialPercentage: 100,
    targetPercentage: 100,
    incrementStep: 0, // Immediate full rollout
  },
  high_impact: {
    initialPercentage: 25,
    targetPercentage: 100,
    incrementStep: 25,
  },
  enhancement: {
    initialPercentage: 10,
    targetPercentage: 100,
    incrementStep: 15,
  },
  experiment: {
    initialPercentage: 10,
    targetPercentage: 50, // Capped until validated
    incrementStep: 10,
  },
};

/**
 * Targeting rule types.
 */
export type TargetingRuleType =
  | 'user_id'
  | 'email'
  | 'role'
  | 'percentage'
  | 'attribute'
  | 'environment';

/**
 * A single targeting rule that determines if a flag is enabled.
 */
export interface TargetingRule {
  readonly type: TargetingRuleType;
  readonly operator: 'equals' | 'contains' | 'in' | 'less_than' | 'greater_than';
  readonly value: string | string[] | number;
}

/**
 * Complete feature flag configuration.
 */
export interface FeatureFlag<T extends FlagValue = boolean> {
  readonly key: string;
  readonly description: string;
  readonly defaultValue: T;
  readonly enabled: boolean;
  readonly targetingRules?: readonly TargetingRule[];
  readonly percentageRollout?: number;  // 0-100
  readonly allowedEnvironments?: readonly Environment[];
  /**
   * Pareto priority tier - drives rollout strategy.
   * Defaults to 'enhancement' if not specified.
   */
  readonly priority?: FeaturePriority;
  /**
   * Expected impact metric (0-100).
   * Used for Pareto analysis: high impact + low effort = ship first.
   */
  readonly expectedImpact?: number;
  /**
   * Pareto insight explaining why this feature exists.
   * Helps future developers understand the 80/20 rationale.
   */
  readonly paretoRationale?: string;
}

/**
 * Feature flag configuration map.
 */
export type FlagConfig = Record<string, FeatureFlag<FlagValue>>;

// ============================================================
// DEFAULT FLAG CONFIGURATION
// ============================================================

/**
 * Define all feature flags here.
 * Each flag has a unique key, description, default value, and optional targeting.
 *
 * @example
 * const flags = {
 *   newDashboard: {
 *     key: 'new_dashboard',
 *     description: 'Enable redesigned dashboard',
 *     defaultValue: false,
 *     enabled: true,
 *     percentageRollout: 25,
 *   },
 * } as const satisfies FlagConfig;
 */
export const FLAGS = {
  // ============================================================
  // PARETO-PRIORITIZED EXAMPLE FLAGS
  // ============================================================
  // Organized by priority tier (core → high_impact → enhancement → experiment)

  // CORE: Essential features (100% rollout immediately)
  authentication: {
    key: 'authentication',
    description: 'User authentication and session management',
    defaultValue: true,
    enabled: true,
    priority: 'core',
    expectedImpact: 100,
    paretoRationale: 'Foundation for all user-specific functionality - the 20% that enables 80% of features',
  },

  // HIGH_IMPACT: Important features (staged rollout)
  newDashboard: {
    key: 'new_dashboard',
    description: 'Enable the redesigned dashboard UI',
    defaultValue: false,
    enabled: true,
    percentageRollout: 25,
    priority: 'high_impact',
    expectedImpact: 75,
    paretoRationale: 'Dashboard is the primary interface - improvements here affect most user sessions',
  },

  // ENHANCEMENT: Nice-to-have (gradual rollout)
  advancedFilters: {
    key: 'advanced_filters',
    description: 'Enable advanced filtering options in lists',
    defaultValue: false,
    enabled: true,
    percentageRollout: 10,
    priority: 'enhancement',
    expectedImpact: 30,
    paretoRationale: 'Power user feature - valuable but used by minority of users',
  },

  // EXPERIMENT: Features being validated
  aiSuggestions: {
    key: 'ai_suggestions',
    description: 'AI-powered suggestions and autocomplete',
    defaultValue: false,
    enabled: true,
    percentageRollout: 10,
    priority: 'experiment',
    expectedImpact: 50, // Unknown - needs validation
    paretoRationale: 'Hypothesis: AI suggestions will reduce time-to-complete by 40%',
    targetingRules: [
      { type: 'role', operator: 'in', value: ['admin', 'beta_tester'] },
    ],
  },

  // Role-based beta features
  betaFeatures: {
    key: 'beta_features',
    description: 'Enable beta features for testers',
    defaultValue: false,
    enabled: true,
    priority: 'experiment',
    targetingRules: [
      { type: 'role', operator: 'in', value: ['admin', 'beta_tester'] },
    ],
  },
} as const satisfies FlagConfig;

/**
 * Type-safe flag keys derived from configuration.
 */
export type FlagKey = keyof typeof FLAGS;

// ============================================================
// FLAG EVALUATION ENGINE
// ============================================================

/**
 * Get current environment.
 */
function getEnvironment(): Environment {
  if (typeof window === 'undefined') {
    return (process.env.NODE_ENV === 'production' ? 'production' : 'development') as Environment;
  }
  // Client-side: check for staging indicator
  if (window.location.hostname.includes('staging')) {
    return 'staging';
  }
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  return 'development';
}

/**
 * Generate a consistent hash for percentage rollout.
 * Uses user ID + flag key to ensure consistent assignment.
 */
function hashForPercentage(userId: string, flagKey: string): number {
  const str = `${userId}:${flagKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash % 100);
}

/**
 * Evaluate a single targeting rule.
 */
function evaluateRule(rule: TargetingRule, context: FlagUserContext): boolean {
  switch (rule.type) {
    case 'user_id':
      if (!context.userId) return false;
      if (rule.operator === 'equals') return context.userId === rule.value;
      if (rule.operator === 'in') return (rule.value as string[]).includes(context.userId);
      return false;

    case 'email':
      if (!context.email) return false;
      if (rule.operator === 'equals') return context.email === rule.value;
      if (rule.operator === 'contains') return context.email.includes(rule.value as string);
      if (rule.operator === 'in') return (rule.value as string[]).includes(context.email);
      return false;

    case 'role':
      if (!context.role) return false;
      if (rule.operator === 'equals') return context.role === rule.value;
      if (rule.operator === 'in') return (rule.value as string[]).includes(context.role);
      return false;

    case 'attribute': {
      // Attributes are passed as "attributeName:value" in the rule value
      const [attrName, expectedValue] = (rule.value as string).split(':');
      const actualValue = context.attributes?.[attrName];
      if (actualValue === undefined) return false;
      if (rule.operator === 'equals') return String(actualValue) === expectedValue;
      return false;
    }

    case 'environment': {
      const env = getEnvironment();
      if (rule.operator === 'equals') return env === rule.value;
      if (rule.operator === 'in') return (rule.value as string[]).includes(env);
      return false;
    }

    case 'percentage':
      // Percentage rules are handled separately
      return true;

    default:
      return false;
  }
}

/**
 * Evaluate all targeting rules for a flag.
 * Returns true if ANY rule matches (OR logic).
 */
function evaluateTargetingRules(
  rules: readonly TargetingRule[] | undefined,
  context: FlagUserContext
): boolean {
  if (!rules || rules.length === 0) return true;
  return rules.some(rule => evaluateRule(rule, context));
}

/**
 * Check if user is within percentage rollout.
 */
function isInPercentageRollout(
  percentage: number | undefined,
  userId: string | undefined,
  flagKey: string
): boolean {
  if (percentage === undefined || percentage >= 100) return true;
  if (percentage <= 0) return false;
  if (!userId) return false;  // Anonymous users don't get percentage rollouts

  const hash = hashForPercentage(userId, flagKey);
  return hash < percentage;
}

/**
 * Check if current environment is allowed for this flag.
 */
function isEnvironmentAllowed(
  allowedEnvironments: readonly Environment[] | undefined
): boolean {
  if (!allowedEnvironments || allowedEnvironments.length === 0) return true;
  return allowedEnvironments.includes(getEnvironment());
}

// ============================================================
// DEVELOPMENT OVERRIDES
// ============================================================

const OVERRIDE_STORAGE_KEY = '_feature_flag_overrides';

/**
 * In-memory override store (server-side compatible).
 */
let overrideStore: Record<string, FlagValue> = {};

/**
 * Load overrides from localStorage (client-side only).
 */
function loadOverrides(): Record<string, FlagValue> {
  if (typeof window === 'undefined') return overrideStore;

  try {
    const stored = localStorage.getItem(OVERRIDE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // localStorage not available or corrupted
  }
  return {};
}

/**
 * Save overrides to localStorage (client-side only).
 */
function saveOverrides(overrides: Record<string, FlagValue>): void {
  overrideStore = overrides;
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage not available
  }
}

/**
 * Set a development override for a flag.
 * Only works in development/staging environments.
 */
export function setFlagOverride<K extends FlagKey>(
  key: K,
  value: typeof FLAGS[K]['defaultValue']
): void {
  const env = getEnvironment();
  if (env === 'production') {
    console.warn('Feature flag overrides are disabled in production');
    return;
  }

  const overrides = loadOverrides();
  overrides[key] = value;
  saveOverrides(overrides);
  notifySubscribers();
}

/**
 * Remove a development override for a flag.
 */
export function clearFlagOverride(key: FlagKey): void {
  const overrides = loadOverrides();
  delete overrides[key];
  saveOverrides(overrides);
  notifySubscribers();
}

/**
 * Remove all development overrides.
 */
export function clearAllFlagOverrides(): void {
  saveOverrides({});
  notifySubscribers();
}

/**
 * Get all current overrides (for debugging).
 */
export function getFlagOverrides(): Record<string, FlagValue> {
  return { ...loadOverrides() };
}

// ============================================================
// FLAG EVALUATION
// ============================================================

/**
 * Evaluate a feature flag for a given user context.
 * This is the core evaluation function.
 *
 * @param key - The flag key to evaluate
 * @param context - User context for targeting
 * @returns The flag value (type-safe based on flag definition)
 *
 * @example
 * const isEnabled = evaluateFlag('newDashboard', { userId: user.id, role: 'admin' });
 */
export function evaluateFlag<K extends FlagKey>(
  key: K,
  context: FlagUserContext = {}
): typeof FLAGS[K]['defaultValue'] {
  const flag = FLAGS[key];

  // Check for development override first
  const overrides = loadOverrides();
  if (key in overrides) {
    return overrides[key] as typeof FLAGS[K]['defaultValue'];
  }

  // If flag is disabled globally, return default
  if (!flag.enabled) {
    return flag.defaultValue;
  }

  // Check environment restrictions (use optional chaining for flags without this property)
  const allowedEnvs = 'allowedEnvironments' in flag ? (flag as unknown as { allowedEnvironments?: readonly Environment[] }).allowedEnvironments : undefined;
  if (!isEnvironmentAllowed(allowedEnvs)) {
    return flag.defaultValue;
  }

  // Check targeting rules (use optional chaining for flags without this property)
  const targetRules = 'targetingRules' in flag ? (flag as unknown as { targetingRules?: TargetingRule[] }).targetingRules : undefined;
  if (!evaluateTargetingRules(targetRules, context)) {
    return flag.defaultValue;
  }

  // Check percentage rollout (use optional chaining for flags without this property)
  const rollout = 'percentageRollout' in flag ? (flag as unknown as { percentageRollout?: number }).percentageRollout : undefined;
  if (!isInPercentageRollout(rollout, context.userId, flag.key)) {
    return flag.defaultValue;
  }

  // All checks passed - flag is enabled
  // For boolean flags, return true; for other types, return the defaultValue
  const enabledValue = FLAGS[key].defaultValue === false ? true : FLAGS[key].defaultValue;
  return enabledValue as typeof FLAGS[K]['defaultValue'];
}

/**
 * Check if a boolean flag is enabled.
 * Convenience function for boolean flags.
 *
 * @example
 * if (isFlagEnabled('betaFeatures', { userId: user.id })) {
 *   // Show beta features
 * }
 */
export function isFlagEnabled(
  key: FlagKey,
  context: FlagUserContext = {}
): boolean {
  const value = evaluateFlag(key, context);
  // Use Boolean() to handle cases where FlagValue might be narrowed to a non-boolean type
  return Boolean(value);
}

/**
 * Get all flag values for a user context.
 * Useful for passing to client components or analytics.
 */
export function getAllFlagValues(
  context: FlagUserContext = {}
): Record<FlagKey, FlagValue> {
  const result: Record<string, FlagValue> = {};

  for (const key of Object.keys(FLAGS) as FlagKey[]) {
    result[key] = evaluateFlag(key, context);
  }

  return result as Record<FlagKey, FlagValue>;
}

// ============================================================
// SERVER-SIDE FLAG CHECKING
// ============================================================

/**
 * Server-side flag evaluation.
 * Use this in Server Components, Route Handlers, and Server Actions.
 *
 * @example
 * // In a Server Component
 * import { getServerFlag } from '@/lib/feature-flags';
 * import { getUser } from '@/lib/auth';
 *
 * export default async function Dashboard() {
 *   const user = await getUser();
 *   const showNewDashboard = getServerFlag('newDashboard', {
 *     userId: user?.value?.id,
 *     role: user?.value?.role,
 *   });
 *
 *   return showNewDashboard ? <NewDashboard /> : <OldDashboard />;
 * }
 */
export function getServerFlag<K extends FlagKey>(
  key: K,
  context: FlagUserContext = {}
): typeof FLAGS[K]['defaultValue'] {
  return evaluateFlag(key, context);
}

/**
 * Server-side check for boolean flags.
 */
export function isServerFlagEnabled(
  key: FlagKey,
  context: FlagUserContext = {}
): boolean {
  return isFlagEnabled(key, context);
}

// ============================================================
// REACT HOOK FOR CLIENT COMPONENTS
// ============================================================

/**
 * Subscribers for flag changes (used by React hook).
 */
const subscribers = new Set<() => void>();

function notifySubscribers(): void {
  subscribers.forEach(callback => callback());
}

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * React hook for accessing feature flags in client components.
 * Automatically re-renders when overrides change.
 *
 * @example
 * 'use client';
 * import { useFeatureFlag } from '@/lib/feature-flags';
 *
 * export function MyComponent() {
 *   const showNewUI = useFeatureFlag('newDashboard', { userId: user.id });
 *
 *   return showNewUI ? <NewUI /> : <OldUI />;
 * }
 */
export function useFeatureFlag<K extends FlagKey>(
  key: K,
  context: FlagUserContext = {}
): typeof FLAGS[K]['defaultValue'] {
  // Destructure context for stable dependencies
  const { userId, email, role, attributes } = context;
  const attributesJson = JSON.stringify(attributes);

  // Memoize context to prevent unnecessary re-evaluations
  // attributesJson tracks changes to attributes object - safe to omit attributes from deps
  const stableContext = useMemo(
    () => ({ userId, email, role, attributes }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, email, role, attributesJson]
  );

  // Use useSyncExternalStore for proper React 18 support
  const value = useSyncExternalStore(
    subscribe,
    () => evaluateFlag(key, stableContext),
    () => evaluateFlag(key, stableContext)  // Server snapshot
  );

  return value;
}

/**
 * React hook for checking if a boolean flag is enabled.
 *
 * @example
 * const isBetaUser = useIsFlagEnabled('betaFeatures', { userId: user.id });
 */
export function useIsFlagEnabled(
  key: FlagKey,
  context: FlagUserContext = {}
): boolean {
  const value = useFeatureFlag(key, context);
  // Use Boolean() to handle cases where FlagValue might be narrowed to a non-boolean type
  return Boolean(value);
}

/**
 * React hook for getting all flag values.
 * Useful for feature flag provider components.
 */
export function useAllFlags(
  context: FlagUserContext = {}
): Record<FlagKey, FlagValue> {
  // Destructure context for stable dependencies
  const { userId, email, role, attributes } = context;
  const attributesJson = JSON.stringify(attributes);

  const stableContext = useMemo(
    () => ({ userId, email, role, attributes }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, email, role, attributesJson]
  );

  return useSyncExternalStore(
    subscribe,
    () => getAllFlagValues(stableContext),
    () => getAllFlagValues(stableContext)
  );
}

// ============================================================
// FLAG METADATA & INTROSPECTION
// ============================================================

/**
 * Get metadata for a flag (description, targeting, etc.).
 * Useful for admin UIs and debugging.
 */
export function getFlagMetadata(key: FlagKey): FeatureFlag<FlagValue> {
  return FLAGS[key];
}

/**
 * Get all flag definitions.
 * Useful for admin UIs.
 */
export function getAllFlagMetadata(): typeof FLAGS {
  return FLAGS;
}

/**
 * List all flag keys.
 */
export function listFlagKeys(): FlagKey[] {
  return Object.keys(FLAGS) as FlagKey[];
}

// ============================================================
// DEBUG UTILITIES (Development Only)
// ============================================================

/**
 * Debug panel data for feature flags.
 * Only returns data in non-production environments.
 */
export function getDebugInfo(context: FlagUserContext = {}): {
  environment: Environment;
  flags: Record<FlagKey, {
    value: FlagValue;
    hasOverride: boolean;
    metadata: FeatureFlag<FlagValue>;
  }>;
  overrides: Record<string, FlagValue>;
} | null {
  if (getEnvironment() === 'production') {
    return null;
  }

  const overrides = loadOverrides();
  const flags: Record<string, {
    value: FlagValue;
    hasOverride: boolean;
    metadata: FeatureFlag<FlagValue>;
  }> = {};

  for (const key of Object.keys(FLAGS) as FlagKey[]) {
    flags[key] = {
      value: evaluateFlag(key, context),
      hasOverride: key in overrides,
      metadata: FLAGS[key],
    };
  }

  return {
    environment: getEnvironment(),
    flags: flags as Record<FlagKey, {
      value: FlagValue;
      hasOverride: boolean;
      metadata: FeatureFlag<FlagValue>;
    }>,
    overrides,
  };
}

// ============================================================
// PARETO ANALYSIS UTILITIES
// ============================================================

/**
 * Get flags grouped by priority tier.
 * Useful for dashboards and prioritization discussions.
 *
 * @example
 * const { core, highImpact, enhancement, experiment } = getFlagsByPriority();
 * console.log(`${core.length} core features enabled`);
 */
export function getFlagsByPriority(): Record<FeaturePriority, FlagKey[]> {
  const result: Record<FeaturePriority, FlagKey[]> = {
    core: [],
    high_impact: [],
    enhancement: [],
    experiment: [],
  };

  for (const key of Object.keys(FLAGS) as FlagKey[]) {
    const flag = FLAGS[key];
    const priority: FeaturePriority = 'priority' in flag
      ? (flag as unknown as { priority: FeaturePriority }).priority ?? 'enhancement'
      : 'enhancement';
    result[priority].push(key);
  }

  return result;
}

/**
 * Get flags sorted by expected impact (highest first).
 * Implements the Pareto principle: focus on high-impact features.
 *
 * @example
 * const topFlags = getHighImpactFlags(3);
 * // Returns the 3 flags with highest expected impact
 */
export function getHighImpactFlags(limit?: number): Array<{
  key: FlagKey;
  impact: number;
  priority: FeaturePriority;
  enabled: boolean;
}> {
  const flagsWithImpact: Array<{
    key: FlagKey;
    impact: number;
    priority: FeaturePriority;
    enabled: boolean;
  }> = [];

  for (const key of Object.keys(FLAGS) as FlagKey[]) {
    const flag = FLAGS[key];
    const impact = 'expectedImpact' in flag
      ? (flag as unknown as { expectedImpact: number }).expectedImpact ?? 50
      : 50;
    const priority: FeaturePriority = 'priority' in flag
      ? (flag as unknown as { priority: FeaturePriority }).priority ?? 'enhancement'
      : 'enhancement';

    flagsWithImpact.push({
      key,
      impact,
      priority,
      enabled: flag.enabled,
    });
  }

  // Sort by impact descending
  flagsWithImpact.sort((a, b) => b.impact - a.impact);

  return limit ? flagsWithImpact.slice(0, limit) : flagsWithImpact;
}

/**
 * Pareto analysis of feature flags.
 * Identifies the "vital few" (high impact) vs "trivial many" (low impact).
 *
 * @example
 * const analysis = getParetoAnalysis();
 * console.log(`Vital few: ${analysis.vitalFew.length} flags deliver ${analysis.vitalFewImpact}% of value`);
 */
export function getParetoAnalysis(): {
  vitalFew: FlagKey[];          // Top 20% by impact
  trivialMany: FlagKey[];       // Bottom 80% by impact
  vitalFewImpact: number;       // % of total impact from vital few
  recommendations: string[];    // Actionable insights
} {
  const sorted = getHighImpactFlags();
  const totalImpact = sorted.reduce((sum, f) => sum + f.impact, 0);

  // Find the vital few (top 20% of flags or flags that deliver 80% of impact)
  const threshold = Math.ceil(sorted.length * 0.2);
  const vitalFew = sorted.slice(0, threshold);
  const trivialMany = sorted.slice(threshold);

  const vitalFewImpact = Math.round(
    (vitalFew.reduce((sum, f) => sum + f.impact, 0) / totalImpact) * 100
  );

  // Generate recommendations
  const recommendations: string[] = [];

  // Check for high-impact flags that aren't fully rolled out
  const underutilized = vitalFew.filter(f => {
    const flag = FLAGS[f.key];
    const rollout = 'percentageRollout' in flag
      ? (flag as unknown as { percentageRollout: number }).percentageRollout
      : 100;
    return rollout < 100;
  });

  if (underutilized.length > 0) {
    recommendations.push(
      `Consider increasing rollout for high-impact flags: ${underutilized.map(f => f.key).join(', ')}`
    );
  }

  // Check for experiments that have been running a while
  const experimentsToValidate = sorted.filter(f => f.priority === 'experiment' && f.enabled);
  if (experimentsToValidate.length > 0) {
    recommendations.push(
      `${experimentsToValidate.length} experiments running - schedule impact reviews`
    );
  }

  // Check for low-impact flags still in development
  const lowImpactEnhancements = trivialMany.filter(f => f.priority === 'enhancement' && !f.enabled);
  if (lowImpactEnhancements.length > 0) {
    recommendations.push(
      `Consider deprioritizing ${lowImpactEnhancements.length} low-impact enhancements`
    );
  }

  return {
    vitalFew: vitalFew.map(f => f.key),
    trivialMany: trivialMany.map(f => f.key),
    vitalFewImpact,
    recommendations,
  };
}

/**
 * Suggest which flags should have their rollout increased.
 * Based on priority tier and current rollout percentage.
 *
 * @example
 * const suggestions = suggestRolloutIncreases();
 * for (const s of suggestions) {
 *   console.log(`${s.key}: ${s.currentRollout}% → ${s.suggestedRollout}%`);
 * }
 */
export function suggestRolloutIncreases(): Array<{
  key: FlagKey;
  priority: FeaturePriority;
  currentRollout: number;
  suggestedRollout: number;
  reason: string;
}> {
  const suggestions: Array<{
    key: FlagKey;
    priority: FeaturePriority;
    currentRollout: number;
    suggestedRollout: number;
    reason: string;
  }> = [];

  for (const key of Object.keys(FLAGS) as FlagKey[]) {
    const flag = FLAGS[key];

    if (!flag.enabled) continue;

    const priority: FeaturePriority = 'priority' in flag
      ? (flag as unknown as { priority: FeaturePriority }).priority ?? 'enhancement'
      : 'enhancement';

    const currentRollout = 'percentageRollout' in flag
      ? (flag as unknown as { percentageRollout: number }).percentageRollout ?? 100
      : 100;

    const defaults = PRIORITY_ROLLOUT_DEFAULTS[priority];

    if (currentRollout < defaults.targetPercentage) {
      const suggestedRollout = Math.min(
        currentRollout + defaults.incrementStep,
        defaults.targetPercentage
      );

      if (suggestedRollout > currentRollout) {
        suggestions.push({
          key,
          priority,
          currentRollout,
          suggestedRollout,
          reason: priority === 'core'
            ? 'Core feature should be at 100%'
            : `${priority} feature ready for expanded rollout`,
        });
      }
    }
  }

  // Sort by priority (core first) then by current rollout (lower first)
  const priorityOrder: Record<FeaturePriority, number> = {
    core: 0,
    high_impact: 1,
    enhancement: 2,
    experiment: 3,
  };

  suggestions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.currentRollout - b.currentRollout;
  });

  return suggestions;
}

/**
 * Get Pareto rationale for a flag.
 * Explains why this feature exists and its expected impact.
 */
export function getFlagRationale(key: FlagKey): {
  priority: FeaturePriority;
  expectedImpact: number;
  rationale: string | null;
} {
  const flag = FLAGS[key];

  const priority: FeaturePriority = 'priority' in flag
    ? (flag as unknown as { priority: FeaturePriority }).priority ?? 'enhancement'
    : 'enhancement';

  const expectedImpact = 'expectedImpact' in flag
    ? (flag as unknown as { expectedImpact: number }).expectedImpact ?? 50
    : 50;

  const rationale = 'paretoRationale' in flag
    ? (flag as unknown as { paretoRationale: string }).paretoRationale ?? null
    : null;

  return { priority, expectedImpact, rationale };
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
