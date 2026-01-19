// ============================================================
// WEBHOOK HANDLERS - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// WEBHOOK SECURITY: All incoming webhooks are verified before processing.
// - HMAC-SHA256 signature verification
// - Idempotency handling with event ID tracking
// - Proper HTTP status codes for webhook providers
//
// File: src/app/api/webhooks/[provider]/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { Result } from "@/types/errors";
import { ok, err } from "@/types/errors";

// ============================================================
// WEBHOOK PROVIDER TYPES
// ============================================================

/**
 * Supported webhook providers.
 * Add new providers here as needed.
 */
export type WebhookProvider =
  | "stripe"
  | "github"
  | "supabase"
;

/**
 * Provider-specific configuration for signature verification.
 */
interface ProviderConfig {
  readonly headerName: string;
  readonly secretEnvVar: string;
  readonly signaturePrefix?: string;
  readonly timestampHeader?: string;
  readonly timestampTolerance?: number; // seconds
}

const PROVIDER_CONFIGS: Record<WebhookProvider, ProviderConfig> = {
  stripe: {
    headerName: "stripe-signature",
    secretEnvVar: "STRIPE_WEBHOOK_SECRET",
    timestampHeader: "stripe-signature", // Stripe includes timestamp in signature header
    timestampTolerance: 300, // 5 minutes
  },
  github: {
    headerName: "x-hub-signature-256",
    secretEnvVar: "GITHUB_WEBHOOK_SECRET",
    signaturePrefix: "sha256=",
  },
  supabase: {
    headerName: "x-supabase-signature",
    secretEnvVar: "SUPABASE_WEBHOOK_SECRET",
  },
};

// ============================================================
// WEBHOOK EVENT TYPES
// ============================================================

/**
 * Base webhook event structure.
 * All provider events extend this.
 */
interface BaseWebhookEvent {
  readonly id: string;
  readonly type: string;
  readonly created: number;
  readonly data: unknown;
}

/**
 * Stripe webhook event types.
 */
export type StripeEventType =
  | "checkout.session.completed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed";

export interface StripeWebhookEvent extends BaseWebhookEvent {
  readonly type: StripeEventType;
  readonly data: {
    readonly object: Record<string, unknown>;
    readonly previous_attributes?: Record<string, unknown>;
  };
  readonly livemode: boolean;
  readonly api_version: string;
}

/**
 * GitHub webhook event types.
 */
export type GitHubEventType =
  | "push"
  | "pull_request"
  | "pull_request_review"
  | "issues"
  | "issue_comment"
  | "workflow_run"
  | "release";

export interface GitHubWebhookEvent extends BaseWebhookEvent {
  readonly action?: string;
  readonly sender: { readonly login: string; readonly id: number };
  readonly repository: { readonly full_name: string; readonly id: number };
}

/**
 * Supabase webhook event types (Database webhooks).
 */
export type SupabaseEventType =
  | "INSERT"
  | "UPDATE"
  | "DELETE";

export interface SupabaseWebhookEvent extends BaseWebhookEvent {
  readonly type: SupabaseEventType;
  readonly table: string;
  readonly schema: string;
  readonly record: Record<string, unknown> | null;
  readonly old_record: Record<string, unknown> | null;
}

/**
 * Union of all webhook event types.
 */
export type WebhookEvent =
  | StripeWebhookEvent
  | GitHubWebhookEvent
  | SupabaseWebhookEvent;

// ============================================================
// WEBHOOK ERRORS
// ============================================================

export type WebhookError =
  | { readonly type: "missing_signature"; readonly provider: WebhookProvider }
  | { readonly type: "invalid_signature"; readonly provider: WebhookProvider }
  | { readonly type: "missing_secret"; readonly provider: WebhookProvider; readonly envVar: string }
  | { readonly type: "timestamp_expired"; readonly provider: WebhookProvider; readonly age: number }
  | { readonly type: "invalid_payload"; readonly message: string }
  | { readonly type: "duplicate_event"; readonly eventId: string }
  | { readonly type: "handler_error"; readonly eventType: string; readonly message: string }
  | { readonly type: "unknown_event_type"; readonly eventType: string };

// ============================================================
// SIGNATURE VERIFICATION
// ============================================================

/**
 * Verify HMAC-SHA256 signature for webhook payload.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  prefix?: string
): boolean {
  const expectedSignature = createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  const expectedWithPrefix = prefix ? `${prefix}${expectedSignature}` : expectedSignature;

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedWithPrefix)
    );
  } catch {
    // Lengths don't match
    return false;
  }
}

/**
 * Parse and verify Stripe signature (includes timestamp).
 */
function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  tolerance: number = 300
): Result<true, WebhookError> {
  // Parse the signature header: t=timestamp,v1=signature
  const parts = signatureHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const signature = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !signature) {
    return err({ type: "invalid_signature", provider: "stripe" });
  }

  // Check timestamp is within tolerance
  const timestampNum = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestampNum;

  if (age > tolerance) {
    return err({ type: "timestamp_expired", provider: "stripe", age });
  }

  // Verify signature: Stripe signs "timestamp.payload"
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  try {
    const isValid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    return isValid ? ok(true) : err({ type: "invalid_signature", provider: "stripe" });
  } catch {
    return err({ type: "invalid_signature", provider: "stripe" });
  }
}

/**
 * Verify webhook signature based on provider.
 */
async function verifyWebhook(
  request: NextRequest,
  provider: WebhookProvider,
  rawBody: string
): Promise<Result<true, WebhookError>> {
  const config = PROVIDER_CONFIGS[provider];

  // Get secret from environment
  const secret = process.env[config.secretEnvVar];
  if (!secret) {
    return err({
      type: "missing_secret",
      provider,
      envVar: config.secretEnvVar,
    });
  }

  // Get signature from header
  const signature = request.headers.get(config.headerName);
  if (!signature) {
    return err({ type: "missing_signature", provider });
  }

  // Provider-specific verification
  if (provider === "stripe") {
    return verifyStripeSignature(
      rawBody,
      signature,
      secret,
      config.timestampTolerance
    );
  }

  // Standard HMAC-SHA256 verification
  const isValid = verifySignature(
    rawBody,
    signature,
    secret,
    config.signaturePrefix
  );

  return isValid
    ? ok(true)
    : err({ type: "invalid_signature", provider });
}

// ============================================================
// IDEMPOTENCY HANDLING
// ============================================================

/**
 * Track processed webhook events to ensure idempotency.
 * Uses Supabase to store processed event IDs.
 *
 * NOTE: Requires 'webhook_events' table. See migration SQL at bottom of file.
 * Type assertion used because table may not exist in generated types yet.
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const supabase = await createClient();

  // Type assertion: webhook_events table may not be in generated types
  // Run the migration at the bottom of this file to create the table
  const { data } = await (supabase as any)
    .from("webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();

  return data !== null;
}

/**
 * Mark an event as processed.
 *
 * NOTE: Requires 'webhook_events' table. See migration SQL at bottom of file.
 * Type assertion used because table may not exist in generated types yet.
 */
async function markEventProcessed(
  eventId: string,
  provider: WebhookProvider,
  eventType: string,
  processedAt: Date = new Date()
): Promise<Result<true, WebhookError>> {
  const supabase = await createClient();

  // Type assertion: webhook_events table may not be in generated types
  // Run the migration at the bottom of this file to create the table
  const { error } = await (supabase as any).from("webhook_events").insert({
    event_id: eventId,
    provider,
    event_type: eventType,
    processed_at: processedAt.toISOString(),
  });

  if (error) {
    // Unique constraint violation means already processed
    if (error.code === "23505") {
      return err({ type: "duplicate_event", eventId });
    }
    console.error("[Webhook] Failed to mark event processed:", error);
  }

  return ok(true);
}

// ============================================================
// WEBHOOK LOGGING
// ============================================================

interface WebhookLogEntry {
  readonly provider: WebhookProvider;
  readonly eventId: string;
  readonly eventType: string;
  readonly status: "received" | "processing" | "completed" | "failed";
  readonly error?: string;
  readonly durationMs?: number;
  readonly timestamp: string;
}

/**
 * Log webhook event for debugging and monitoring.
 */
function logWebhookEvent(entry: WebhookLogEntry): void {
  const logData = {
    ...entry,
    service: "webhook",
  };

  if (entry.status === "failed") {
    console.error("[Webhook]", JSON.stringify(logData));
  } else {
    console.log("[Webhook]", JSON.stringify(logData));
  }
}

// ============================================================
// EVENT HANDLERS
// ============================================================

/**
 * Handler function type for webhook events.
 */
type WebhookHandler<T = unknown> = (
  event: T,
  provider: WebhookProvider
) => Promise<Result<void, WebhookError>>;

/**
 * Stripe event handlers.
 */
const stripeHandlers: Partial<Record<StripeEventType, WebhookHandler<StripeWebhookEvent>>> = {
  "checkout.session.completed": async (event) => {
    const session = event.data.object;
    const supabase = await createClient();

    // Extract session data
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const customerEmail = session.customer_email as string;
    const metadata = session.metadata as Record<string, string> | undefined;
    const userId = metadata?.user_id;

    if (!userId) {
      console.error("[Stripe] checkout.session.completed: No user_id in metadata");
      return err({
        type: "handler_error",
        eventType: "checkout.session.completed",
        message: "Missing user_id in session metadata",
      });
    }

    // Update user with Stripe customer ID and subscription
    const { error: userError } = await (supabase as any)
      .from("users")
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (userError) {
      console.error("[Stripe] Failed to update user:", userError);
      return err({
        type: "handler_error",
        eventType: "checkout.session.completed",
        message: `Failed to update user: ${userError.message}`,
      });
    }

    // Create or update subscription record
    const { error: subError } = await (supabase as any)
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          status: "active",
          current_period_start: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (subError) {
      console.error("[Stripe] Failed to upsert subscription:", subError);
      return err({
        type: "handler_error",
        eventType: "checkout.session.completed",
        message: `Failed to upsert subscription: ${subError.message}`,
      });
    }

    console.log("[Stripe] Checkout completed successfully:", {
      userId,
      customerId,
      subscriptionId,
    });
    return ok(undefined);
  },

  "customer.subscription.created": async (event) => {
    const subscription = event.data.object;
    const supabase = await createClient();

    // Extract subscription data from Stripe
    const stripeSubscriptionId = subscription.id as string;
    const customerId = subscription.customer as string;
    const status = subscription.status as string;
    const priceId = (subscription.items as any)?.data?.[0]?.price?.id as string;
    const productId = (subscription.items as any)?.data?.[0]?.price?.product as string;
    const currentPeriodStart = subscription.current_period_start as number;
    const currentPeriodEnd = subscription.current_period_end as number;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean;
    const metadata = subscription.metadata as Record<string, string> | undefined;

    // Look up user by Stripe customer ID
    const { data: user, error: userLookupError } = await (supabase as any)
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (userLookupError || !user) {
      console.error("[Stripe] subscription.created: User not found for customer:", customerId);
      return err({
        type: "handler_error",
        eventType: "customer.subscription.created",
        message: `User not found for customer: ${customerId}`,
      });
    }

    // Insert subscription record
    const { error: insertError } = await (supabase as any)
      .from("subscriptions")
      .insert({
        user_id: user.id,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: customerId,
        stripe_price_id: priceId,
        stripe_product_id: productId,
        status,
        current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
        current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
        cancel_at_period_end: cancelAtPeriodEnd,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[Stripe] Failed to insert subscription:", insertError);
      return err({
        type: "handler_error",
        eventType: "customer.subscription.created",
        message: `Failed to insert subscription: ${insertError.message}`,
      });
    }

    // Update user's plan based on the product
    const { error: updateUserError } = await (supabase as any)
      .from("users")
      .update({
        plan: productId,
        subscription_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateUserError) {
      console.error("[Stripe] Failed to update user plan:", updateUserError);
    }

    console.log("[Stripe] Subscription created successfully:", {
      userId: user.id,
      subscriptionId: stripeSubscriptionId,
      status,
    });
    return ok(undefined);
  },

  "customer.subscription.updated": async (event) => {
    const subscription = event.data.object;
    const previousAttributes = event.data.previous_attributes;
    const supabase = await createClient();

    // Extract updated subscription data
    const stripeSubscriptionId = subscription.id as string;
    const status = subscription.status as string;
    const priceId = (subscription.items as any)?.data?.[0]?.price?.id as string;
    const productId = (subscription.items as any)?.data?.[0]?.price?.product as string;
    const currentPeriodStart = subscription.current_period_start as number;
    const currentPeriodEnd = subscription.current_period_end as number;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean;
    const canceledAt = subscription.canceled_at as number | null;

    // Update subscription record
    const { error: updateError } = await (supabase as any)
      .from("subscriptions")
      .update({
        status,
        stripe_price_id: priceId,
        stripe_product_id: productId,
        current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
        current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: canceledAt ? new Date(canceledAt * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", stripeSubscriptionId);

    if (updateError) {
      console.error("[Stripe] Failed to update subscription:", updateError);
      return err({
        type: "handler_error",
        eventType: "customer.subscription.updated",
        message: `Failed to update subscription: ${updateError.message}`,
      });
    }

    // Also update user's subscription status and plan
    const { data: sub } = await (supabase as any)
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .single();

    if (sub?.user_id) {
      await (supabase as any)
        .from("users")
        .update({
          plan: productId,
          subscription_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.user_id);
    }

    console.log("[Stripe] Subscription updated successfully:", {
      subscriptionId: stripeSubscriptionId,
      status,
      cancelAtPeriodEnd,
      previousStatus: previousAttributes?.status,
    });
    return ok(undefined);
  },

  "customer.subscription.deleted": async (event) => {
    const subscription = event.data.object;
    const supabase = await createClient();

    const stripeSubscriptionId = subscription.id as string;
    const canceledAt = subscription.canceled_at as number | null;
    const endedAt = subscription.ended_at as number | null;

    // Mark subscription as canceled in database
    const { data: sub, error: updateError } = await (supabase as any)
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: canceledAt ? new Date(canceledAt * 1000).toISOString() : new Date().toISOString(),
        ended_at: endedAt ? new Date(endedAt * 1000).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .select("user_id")
      .single();

    if (updateError) {
      console.error("[Stripe] Failed to cancel subscription:", updateError);
      return err({
        type: "handler_error",
        eventType: "customer.subscription.deleted",
        message: `Failed to cancel subscription: ${updateError.message}`,
      });
    }

    // Revoke access by updating user plan to free tier
    if (sub?.user_id) {
      const { error: userUpdateError } = await (supabase as any)
        .from("users")
        .update({
          plan: "free",
          subscription_status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.user_id);

      if (userUpdateError) {
        console.error("[Stripe] Failed to revoke user access:", userUpdateError);
      }
    }

    console.log("[Stripe] Subscription canceled successfully:", {
      subscriptionId: stripeSubscriptionId,
      userId: sub?.user_id,
    });
    return ok(undefined);
  },

  "invoice.paid": async (event) => {
    const invoice = event.data.object;
    const supabase = await createClient();

    const invoiceId = invoice.id as string;
    const subscriptionId = invoice.subscription as string;
    const customerId = invoice.customer as string;
    const amountPaid = invoice.amount_paid as number;
    const currency = invoice.currency as string;
    const periodStart = invoice.period_start as number;
    const periodEnd = invoice.period_end as number;
    const invoiceUrl = invoice.hosted_invoice_url as string;

    // Record the payment
    const { error: paymentError } = await (supabase as any)
      .from("payments")
      .insert({
        stripe_invoice_id: invoiceId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        amount: amountPaid,
        currency,
        status: "paid",
        period_start: new Date(periodStart * 1000).toISOString(),
        period_end: new Date(periodEnd * 1000).toISOString(),
        invoice_url: invoiceUrl,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error("[Stripe] Failed to record payment:", paymentError);
      return err({
        type: "handler_error",
        eventType: "invoice.paid",
        message: `Failed to record payment: ${paymentError.message}`,
      });
    }

    // Extend the subscription period in our database
    if (subscriptionId) {
      const { error: subUpdateError } = await (supabase as any)
        .from("subscriptions")
        .update({
          status: "active",
          current_period_start: new Date(periodStart * 1000).toISOString(),
          current_period_end: new Date(periodEnd * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionId);

      if (subUpdateError) {
        console.error("[Stripe] Failed to extend subscription period:", subUpdateError);
      }
    }

    console.log("[Stripe] Invoice paid recorded successfully:", {
      invoiceId,
      subscriptionId,
      amountPaid,
      currency,
    });
    return ok(undefined);
  },

  "invoice.payment_failed": async (event) => {
    const invoice = event.data.object;
    const supabase = await createClient();

    const invoiceId = invoice.id as string;
    const subscriptionId = invoice.subscription as string;
    const customerId = invoice.customer as string;
    const amountDue = invoice.amount_due as number;
    const currency = invoice.currency as string;
    const attemptCount = invoice.attempt_count as number;
    const nextPaymentAttempt = invoice.next_payment_attempt as number | null;

    // Record the failed payment attempt
    const { error: paymentError } = await (supabase as any)
      .from("payments")
      .insert({
        stripe_invoice_id: invoiceId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        amount: amountDue,
        currency,
        status: "failed",
        attempt_count: attemptCount,
        next_attempt_at: nextPaymentAttempt
          ? new Date(nextPaymentAttempt * 1000).toISOString()
          : null,
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error("[Stripe] Failed to record failed payment:", paymentError);
    }

    // Update subscription to past_due status
    if (subscriptionId) {
      const { data: sub, error: subUpdateError } = await (supabase as any)
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionId)
        .select("user_id")
        .single();

      if (subUpdateError) {
        console.error("[Stripe] Failed to update subscription status:", subUpdateError);
        return err({
          type: "handler_error",
          eventType: "invoice.payment_failed",
          message: `Failed to update subscription status: ${subUpdateError.message}`,
        });
      }

      // Update user subscription status
      if (sub?.user_id) {
        await (supabase as any)
          .from("users")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.user_id);
      }
    }

    console.log("[Stripe] Payment failure recorded:", {
      invoiceId,
      subscriptionId,
      attemptCount,
      nextPaymentAttempt: nextPaymentAttempt
        ? new Date(nextPaymentAttempt * 1000).toISOString()
        : null,
    });
    return ok(undefined);
  },
};

/**
 * GitHub event handlers.
 */
const githubHandlers: Partial<Record<GitHubEventType, WebhookHandler<GitHubWebhookEvent>>> = {
  push: async (event) => {
    const supabase = await createClient();
    const eventData = event as any;

    const repositoryId = event.repository?.id;
    const repositoryName = event.repository?.full_name;
    const pusherLogin = event.sender?.login;
    const pusherGithubId = event.sender?.id;
    const ref = eventData.ref as string;
    const before = eventData.before as string;
    const after = eventData.after as string;
    const commits = eventData.commits as any[];
    const commitCount = commits?.length ?? 0;

    // Record push event for audit trail
    const { error: insertError } = await (supabase as any)
      .from("github_events")
      .insert({
        event_type: "push",
        repository_id: repositoryId,
        repository_name: repositoryName,
        actor_login: pusherLogin,
        actor_github_id: pusherGithubId,
        ref,
        before_sha: before,
        after_sha: after,
        commit_count: commitCount,
        payload: {
          commits: commits?.map((c: any) => ({
            id: c.id,
            message: c.message,
            author: c.author?.name,
            timestamp: c.timestamp,
          })),
        },
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[GitHub] Failed to record push event:", insertError);
      return err({
        type: "handler_error",
        eventType: "push",
        message: `Failed to record push event: ${insertError.message}`,
      });
    }

    console.log("[GitHub] Push event recorded:", {
      repository: repositoryName,
      ref,
      commits: commitCount,
      pusher: pusherLogin,
    });
    return ok(undefined);
  },

  pull_request: async (event) => {
    const supabase = await createClient();
    const eventData = event as any;
    const action = event.action;

    const repositoryId = event.repository?.id;
    const repositoryName = event.repository?.full_name;
    const actorLogin = event.sender?.login;
    const actorGithubId = event.sender?.id;

    const pr = eventData.pull_request;
    const prNumber = pr?.number as number;
    const prTitle = pr?.title as string;
    const prState = pr?.state as string;
    const prMerged = pr?.merged as boolean;
    const headBranch = pr?.head?.ref as string;
    const baseBranch = pr?.base?.ref as string;

    // Record PR event for audit trail
    const { error: insertError } = await (supabase as any)
      .from("github_events")
      .insert({
        event_type: "pull_request",
        action,
        repository_id: repositoryId,
        repository_name: repositoryName,
        actor_login: actorLogin,
        actor_github_id: actorGithubId,
        pr_number: prNumber,
        payload: {
          title: prTitle,
          state: prState,
          merged: prMerged,
          head_branch: headBranch,
          base_branch: baseBranch,
        },
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[GitHub] Failed to record PR event:", insertError);
      return err({
        type: "handler_error",
        eventType: "pull_request",
        message: `Failed to record PR event: ${insertError.message}`,
      });
    }

    // Handle specific PR actions
    if (action === "closed" && prMerged) {
      // PR was merged - could trigger deployment, update tracking, etc.
      console.log("[GitHub] PR merged:", {
        repository: repositoryName,
        prNumber,
        title: prTitle,
        mergedBy: actorLogin,
      });
    } else if (action === "opened") {
      // New PR opened
      console.log("[GitHub] PR opened:", {
        repository: repositoryName,
        prNumber,
        title: prTitle,
        author: actorLogin,
      });
    }

    console.log("[GitHub] PR event recorded:", {
      repository: repositoryName,
      action,
      prNumber,
    });
    return ok(undefined);
  },

  workflow_run: async (event) => {
    const supabase = await createClient();
    const eventData = event as any;
    const action = event.action;

    const repositoryId = event.repository?.id;
    const repositoryName = event.repository?.full_name;
    const actorLogin = event.sender?.login;
    const actorGithubId = event.sender?.id;

    const workflowRun = eventData.workflow_run;
    const runId = workflowRun?.id as number;
    const workflowName = workflowRun?.name as string;
    const conclusion = workflowRun?.conclusion as string;
    const status = workflowRun?.status as string;
    const headBranch = workflowRun?.head_branch as string;
    const headSha = workflowRun?.head_sha as string;
    const runAttempt = workflowRun?.run_attempt as number;

    // Record workflow run event
    const { error: insertError } = await (supabase as any)
      .from("github_events")
      .insert({
        event_type: "workflow_run",
        action,
        repository_id: repositoryId,
        repository_name: repositoryName,
        actor_login: actorLogin,
        actor_github_id: actorGithubId,
        workflow_run_id: runId,
        payload: {
          workflow_name: workflowName,
          status,
          conclusion,
          head_branch: headBranch,
          head_sha: headSha,
          run_attempt: runAttempt,
        },
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[GitHub] Failed to record workflow run:", insertError);
      return err({
        type: "handler_error",
        eventType: "workflow_run",
        message: `Failed to record workflow run: ${insertError.message}`,
      });
    }

    // Log completed workflows with their conclusion
    if (action === "completed") {
      console.log("[GitHub] Workflow completed:", {
        repository: repositoryName,
        workflow: workflowName,
        conclusion,
        branch: headBranch,
        runId,
      });
    }

    return ok(undefined);
  },
};

/**
 * Supabase database webhook handlers.
 */
const supabaseHandlers: Partial<Record<string, WebhookHandler<SupabaseWebhookEvent>>> = {
  // Format: "table_name.EVENT_TYPE"
  "users.INSERT": async (event) => {
    const supabase = await createClient();
    const newUser = event.record;

    if (!newUser) {
      return err({
        type: "handler_error",
        eventType: "users.INSERT",
        message: "No record in event payload",
      });
    }

    const userId = newUser.id as string;
    const email = newUser.email as string;
    const createdAt = newUser.created_at as string;

    // Initialize user profile with default settings
    const { error: profileError } = await (supabase as any)
      .from("user_profiles")
      .insert({
        user_id: userId,
        email,
        display_name: email?.split("@")[0] ?? "User",
        plan: "free",
        subscription_status: null,
        onboarding_completed: false,
        email_notifications: true,
        created_at: createdAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      // If profile already exists (race condition), just log and continue
      if (profileError.code !== "23505") {
        console.error("[Supabase] Failed to create user profile:", profileError);
        return err({
          type: "handler_error",
          eventType: "users.INSERT",
          message: `Failed to create user profile: ${profileError.message}`,
        });
      }
    }

    // Record user creation event for analytics/audit
    const { error: eventError } = await (supabase as any)
      .from("user_events")
      .insert({
        user_id: userId,
        event_type: "user_created",
        metadata: {
          email,
          signup_source: (newUser.app_metadata as { provider?: string })?.provider ?? "email",
        },
        created_at: new Date().toISOString(),
      });

    if (eventError) {
      console.error("[Supabase] Failed to record user creation event:", eventError);
    }

    console.log("[Supabase] User created and profile initialized:", {
      userId,
      email,
    });
    return ok(undefined);
  },

  "users.UPDATE": async (event) => {
    const supabase = await createClient();
    const updatedUser = event.record;
    const previousUser = event.old_record;

    if (!updatedUser) {
      return err({
        type: "handler_error",
        eventType: "users.UPDATE",
        message: "No record in event payload",
      });
    }

    const userId = updatedUser.id as string;
    const newEmail = updatedUser.email as string;
    const oldEmail = previousUser?.email as string | undefined;

    // Sync profile updates if email changed
    if (newEmail && oldEmail && newEmail !== oldEmail) {
      const { error: profileUpdateError } = await (supabase as any)
        .from("user_profiles")
        .update({
          email: newEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (profileUpdateError) {
        console.error("[Supabase] Failed to sync email to profile:", profileUpdateError);
      }

      // Record email change event
      const { error: eventError } = await (supabase as any)
        .from("user_events")
        .insert({
          user_id: userId,
          event_type: "email_changed",
          metadata: {
            old_email: oldEmail,
            new_email: newEmail,
          },
          created_at: new Date().toISOString(),
        });

      if (eventError) {
        console.error("[Supabase] Failed to record email change event:", eventError);
      }

      console.log("[Supabase] User email updated:", {
        userId,
        oldEmail,
        newEmail,
      });
    }

    // Check for email verification status change
    const wasVerified = previousUser?.email_confirmed_at;
    const isVerified = updatedUser.email_confirmed_at;

    if (!wasVerified && isVerified) {
      // User just verified their email
      const { error: profileUpdateError } = await (supabase as any)
        .from("user_profiles")
        .update({
          email_verified: true,
          email_verified_at: isVerified,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (profileUpdateError) {
        console.error("[Supabase] Failed to update verification status:", profileUpdateError);
      }

      // Record verification event
      const { error: eventError } = await (supabase as any)
        .from("user_events")
        .insert({
          user_id: userId,
          event_type: "email_verified",
          metadata: {
            verified_at: isVerified,
          },
          created_at: new Date().toISOString(),
        });

      if (eventError) {
        console.error("[Supabase] Failed to record verification event:", eventError);
      }

      console.log("[Supabase] User email verified:", { userId });
    }

    // Sync any other relevant user metadata changes
    const { error: syncError } = await (supabase as any)
      .from("user_profiles")
      .update({
        last_sign_in_at: updatedUser.last_sign_in_at,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (syncError) {
      console.error("[Supabase] Failed to sync user metadata:", syncError);
    }

    return ok(undefined);
  },
};

/**
 * Route event to appropriate handler.
 */
async function handleWebhookEvent(
  provider: WebhookProvider,
  event: WebhookEvent
): Promise<Result<void, WebhookError>> {
  switch (provider) {
    case "stripe": {
      const stripeEvent = event as StripeWebhookEvent;
      const handler = stripeHandlers[stripeEvent.type as StripeEventType];
      if (!handler) {
        // Unknown events are not errors - just log and acknowledge
        console.log(`[Stripe] Unhandled event type: ${stripeEvent.type}`);
        return ok(undefined);
      }
      return handler(stripeEvent, provider);
    }

    case "github": {
      const githubEvent = event as GitHubWebhookEvent;
      const handler = githubHandlers[githubEvent.type as GitHubEventType];
      if (!handler) {
        console.log(`[GitHub] Unhandled event type: ${githubEvent.type}`);
        return ok(undefined);
      }
      return handler(githubEvent, provider);
    }

    case "supabase": {
      const supabaseEvent = event as SupabaseWebhookEvent;
      const handlerKey = `${supabaseEvent.table}.${supabaseEvent.type}`;
      const handler = supabaseHandlers[handlerKey];
      if (!handler) {
        console.log(`[Supabase] Unhandled event: ${handlerKey}`);
        return ok(undefined);
      }
      return handler(supabaseEvent, provider);
    }

    default: {
      console.log(`[Webhook] Unknown provider: ${provider}`);
      return ok(undefined);
    }
  }
}

// ============================================================
// ROUTE HANDLER
// ============================================================

/**
 * Dynamic route handler for webhooks.
 * Route: /api/webhooks/[provider]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
): Promise<Response> {
  const startTime = Date.now();
  const { provider: providerParam } = await params;
  const provider = providerParam as WebhookProvider;

  // Validate provider
  if (!PROVIDER_CONFIGS[provider]) {
    return new Response(
      JSON.stringify({ error: "Unknown webhook provider" }),
      { status: 400 }
    );
  }

  // Read raw body for signature verification
  const rawBody = await request.text();

  // Parse event for logging
  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400 }
    );
  }

  const eventId = event.id ?? `${provider}-${Date.now()}`;
  const eventType = event.type ?? "unknown";

  // Log received
  logWebhookEvent({
    provider,
    eventId,
    eventType,
    status: "received",
    timestamp: new Date().toISOString(),
  });

  // Verify signature
  const verifyResult = await verifyWebhook(request, provider, rawBody);
  if (!verifyResult.ok) {
    const error = verifyResult.error;
    logWebhookEvent({
      provider,
      eventId,
      eventType,
      status: "failed",
      error: error.type,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    // Return appropriate status code
    switch (error.type) {
      case "missing_signature":
      case "invalid_signature":
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401 }
        );
      case "timestamp_expired":
        return new Response(
          JSON.stringify({ error: "Request expired" }),
          { status: 400 }
        );
      case "missing_secret":
        console.error(`[Webhook] Missing secret: ${error.envVar}`);
        return new Response(
          JSON.stringify({ error: "Server configuration error" }),
          { status: 500 }
        );
      default:
        return new Response(
          JSON.stringify({ error: "Verification failed" }),
          { status: 400 }
        );
    }
  }

  // Check idempotency
  const alreadyProcessed = await isEventProcessed(eventId);
  if (alreadyProcessed) {
    logWebhookEvent({
      provider,
      eventId,
      eventType,
      status: "completed",
      error: "duplicate",
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
    // Return 200 for duplicates - webhook was already handled
    return new Response(
      JSON.stringify({ received: true, duplicate: true }),
      { status: 200 }
    );
  }

  // Log processing
  logWebhookEvent({
    provider,
    eventId,
    eventType,
    status: "processing",
    timestamp: new Date().toISOString(),
  });

  // Handle the event
  const handleResult = await handleWebhookEvent(provider, event);

  if (!handleResult.ok) {
    const error = handleResult.error;
    logWebhookEvent({
      provider,
      eventId,
      eventType,
      status: "failed",
      error: error.type,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    // Return 500 so provider retries
    return new Response(
      JSON.stringify({ error: "Processing failed" }),
      { status: 500 }
    );
  }

  // Mark as processed
  await markEventProcessed(eventId, provider, eventType);

  // Log completion
  logWebhookEvent({
    provider,
    eventId,
    eventType,
    status: "completed",
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });

  // Return success
  return new Response(
    JSON.stringify({ received: true }),
    { status: 200 }
  );
}

// ============================================================
// DATABASE MIGRATION (Run this to create webhook_events table)
// ============================================================

/*
-- Webhook events table for idempotency tracking
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);

-- Index for cleanup queries
CREATE INDEX idx_webhook_events_processed_at ON webhook_events(processed_at);

-- Cleanup old events (optional - run periodically)
-- DELETE FROM webhook_events WHERE processed_at < NOW() - INTERVAL '30 days';

-- RLS policy (if using Supabase RLS)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events
CREATE POLICY "Service role only" ON webhook_events
  FOR ALL
  USING (auth.role() = 'service_role');
*/

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
