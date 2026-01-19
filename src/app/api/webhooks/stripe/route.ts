// ============================================================
// STRIPE WEBHOOK HANDLER - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// Stripe-specific webhook handler with signature verification.
// Handles all subscription and payment events.
//
// Route: /api/webhooks/stripe
//
// SETUP:
// 1. Configure STRIPE_WEBHOOK_SECRET in .env.local
// 2. Set webhook endpoint in Stripe Dashboard:
//    https://your-domain.com/api/webhooks/stripe
// 3. Enable events: checkout.session.completed, customer.subscription.*,
//    invoice.*, payment_intent.*
//
// ============================================================

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import {
  verifyWebhookSignature,
  isSubscriptionActive,
  type PaymentError,
} from '@/lib/payments';
import type { Result } from '@/types/errors';
import { ok, err } from '@/types/errors';

// ============================================================
// WEBHOOK EVENT TYPES
// ============================================================

/**
 * Stripe events we handle.
 */
export type StripeEventType =
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.paused'
  | 'customer.subscription.resumed'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'invoice.payment_action_required'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed';

/**
 * Webhook error types.
 */
export type WebhookError =
  | { readonly type: 'verification_failed'; readonly message: string }
  | { readonly type: 'missing_data'; readonly field: string }
  | { readonly type: 'user_not_found'; readonly userId: string }
  | { readonly type: 'database_error'; readonly message: string }
  | { readonly type: 'handler_error'; readonly eventType: string; readonly message: string };

// ============================================================
// WEBHOOK HANDLER RESULTS
// ============================================================

interface WebhookHandlerResult {
  readonly handled: boolean;
  readonly eventType: string;
  readonly message: string;
}

// ============================================================
// ROUTE HANDLER
// ============================================================

/**
 * POST /api/webhooks/stripe
 *
 * Handles incoming Stripe webhooks.
 * Verifies signature, routes to appropriate handler, updates database.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();

  // Get raw body for signature verification
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  // Verify webhook signature
  const verifyResult = await verifyWebhookSignature(payload, signature);
  if (!verifyResult.ok) {
    console.error('[Stripe Webhook] Verification failed:', verifyResult.error);
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const event = verifyResult.value;

  // Log event received
  console.log('[Stripe Webhook] Event received:', {
    id: event.id,
    type: event.type,
    livemode: event.livemode,
  });

  // Route to appropriate handler
  const result = await handleStripeEvent(event);

  const duration = Date.now() - startTime;

  if (!result.ok) {
    console.error('[Stripe Webhook] Handler error:', {
      eventId: event.id,
      eventType: event.type,
      error: result.error,
      duration,
    });

    // Return 500 so Stripe retries
    return new Response(
      JSON.stringify({ error: 'Processing failed', type: result.error.type }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log('[Stripe Webhook] Event processed:', {
    eventId: event.id,
    eventType: event.type,
    handled: result.value.handled,
    message: result.value.message,
    duration,
  });

  return new Response(
    JSON.stringify({ received: true, ...result.value }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// ============================================================
// EVENT ROUTER
// ============================================================

/**
 * Route Stripe event to appropriate handler.
 */
async function handleStripeEvent(
  event: Stripe.Event
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  switch (event.type) {
    // Checkout events
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);

    case 'checkout.session.expired':
      return handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);

    // Subscription events
    case 'customer.subscription.created':
      return handleSubscriptionCreated(event.data.object as Stripe.Subscription);

    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(
        event.data.object as Stripe.Subscription,
        event.data.previous_attributes as Partial<Stripe.Subscription> | undefined
      );

    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

    case 'customer.subscription.paused':
      return handleSubscriptionPaused(event.data.object as Stripe.Subscription);

    case 'customer.subscription.resumed':
      return handleSubscriptionResumed(event.data.object as Stripe.Subscription);

    // Invoice events
    case 'invoice.paid':
      return handleInvoicePaid(event.data.object as Stripe.Invoice);

    case 'invoice.payment_failed':
      return handlePaymentFailed(event.data.object as Stripe.Invoice);

    case 'invoice.payment_action_required':
      return handlePaymentActionRequired(event.data.object as Stripe.Invoice);

    // Payment intent events
    case 'payment_intent.succeeded':
      return handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);

    case 'payment_intent.payment_failed':
      return handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);

    default:
      // Unhandled events are not errors
      return ok({
        handled: false,
        eventType: event.type,
        message: `Event type ${event.type} not handled`,
      });
  }
}

// ============================================================
// CHECKOUT HANDLERS
// ============================================================

/**
 * Handle successful checkout session.
 * This is triggered when a customer completes the Checkout flow.
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  const userId = session.metadata?.userId;

  if (!userId) {
    return err({
      type: 'missing_data',
      field: 'metadata.userId',
    });
  }

  const supabase = await createClient();

  // Update user's subscription status
  if (session.mode === 'subscription' && session.subscription) {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;

    // Type assertion: subscriptions table may not exist in generated types yet
    const { error: updateError } = await (supabase as any)
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        status: 'active',
        price_id: session.metadata?.priceId ?? null,
        current_period_end: null, // Will be set by subscription.updated event
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (updateError) {
      console.error('[Stripe Webhook] Failed to update subscription:', updateError);
      return err({
        type: 'database_error',
        message: updateError.message,
      });
    }
  }

  // For one-time payments
  if (session.mode === 'payment') {
    // Type assertion: purchases table may not exist in generated types yet
    const { error: insertError } = await (supabase as any)
      .from('purchases')
      .insert({
        user_id: userId,
        stripe_session_id: session.id,
        stripe_customer_id: session.customer as string,
        amount: session.amount_total,
        currency: session.currency,
        status: 'completed',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[Stripe Webhook] Failed to record purchase:', insertError);
      // Non-critical - don't fail the webhook
    }
  }

  return ok({
    handled: true,
    eventType: 'checkout.session.completed',
    message: `Checkout completed for user ${userId}`,
  });
}

/**
 * Handle expired checkout session.
 */
async function handleCheckoutExpired(
  session: Stripe.Checkout.Session
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  const userId = session.metadata?.userId;

  console.log('[Stripe Webhook] Checkout expired:', {
    sessionId: session.id,
    userId,
  });

  // Optionally: Send reminder email, track analytics, etc.

  return ok({
    handled: true,
    eventType: 'checkout.session.expired',
    message: `Checkout expired for session ${session.id}`,
  });
}

// ============================================================
// SUBSCRIPTION HANDLERS
// ============================================================

/**
 * Handle new subscription created.
 */
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find user by customer ID
    console.log('[Stripe Webhook] Subscription created without userId metadata');
    return ok({
      handled: true,
      eventType: 'customer.subscription.created',
      message: 'Subscription created (no userId in metadata)',
    });
  }

  const supabase = await createClient();
  const priceId = subscription.items.data[0]?.price.id;

  // Type assertion: subscriptions table may not exist in generated types yet
  const { error } = await (supabase as any)
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      price_id: priceId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    return err({
      type: 'database_error',
      message: error.message,
    });
  }

  return ok({
    handled: true,
    eventType: 'customer.subscription.created',
    message: `Subscription created for user ${userId}`,
  });
}

/**
 * Handle subscription update (plan change, renewal, etc.)
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  previousAttributes?: Partial<Stripe.Subscription>
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    return ok({
      handled: true,
      eventType: 'customer.subscription.updated',
      message: 'Subscription updated (no userId in metadata)',
    });
  }

  const supabase = await createClient();
  const priceId = subscription.items.data[0]?.price.id;

  // Determine what changed
  const statusChanged = previousAttributes?.status !== undefined;
  const planChanged = previousAttributes?.items !== undefined;
  const cancelChanged = previousAttributes?.cancel_at_period_end !== undefined;

  // Type assertion: subscriptions table may not exist in generated types yet
  const { error } = await (supabase as any)
    .from('subscriptions')
    .update({
      status: subscription.status,
      price_id: priceId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    return err({
      type: 'database_error',
      message: error.message,
    });
  }

  // Log what changed for debugging
  console.log('[Stripe Webhook] Subscription updated:', {
    userId,
    subscriptionId: subscription.id,
    status: subscription.status,
    statusChanged,
    planChanged,
    cancelChanged,
  });

  return ok({
    handled: true,
    eventType: 'customer.subscription.updated',
    message: `Subscription updated for user ${userId}`,
  });
}

/**
 * Handle subscription deletion (canceled or ended).
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    return ok({
      handled: true,
      eventType: 'customer.subscription.deleted',
      message: 'Subscription deleted (no userId in metadata)',
    });
  }

  const supabase = await createClient();

  // Type assertion: subscriptions table may not exist in generated types yet
  const { error } = await (supabase as any)
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    return err({
      type: 'database_error',
      message: error.message,
    });
  }

  // Revoke premium access - downgrade user to free tier
  const { error: profileError } = await (supabase as any)
    .from('profiles')
    .update({
      role: 'free',
      is_premium: false,
      premium_features: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    console.error('[Stripe Webhook] Failed to revoke user access:', profileError);
    // Continue - subscription status already updated, this is secondary
  }

  // Log cancellation event for analytics
  const { error: eventError } = await (supabase as any)
    .from('billing_events')
    .insert({
      user_id: userId,
      event_type: 'subscription_canceled',
      stripe_subscription_id: subscription.id,
      metadata: {
        canceled_at: new Date().toISOString(),
        reason: subscription.cancellation_details?.reason ?? 'unknown',
        feedback: subscription.cancellation_details?.feedback ?? null,
      },
      created_at: new Date().toISOString(),
    });

  if (eventError) {
    console.error('[Stripe Webhook] Failed to log cancellation event:', eventError);
  }

  // Fetch user email for cancellation notification
  const { data: userData, error: userError } = await (supabase as any)
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (!userError && userData?.email) {
    // Send cancellation email via Resend
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'noreply@taxbook-pro.com',
        to: userData.email,
        subject: 'Your subscription has been canceled',
        html: `
          <h1>Subscription Canceled</h1>
          <p>Hi ${userData.full_name ?? 'there'},</p>
          <p>Your subscription has been canceled. You will continue to have access to your current features until the end of your billing period.</p>
          <p>We're sorry to see you go! If you have any feedback or would like to resubscribe, please visit your account settings.</p>
          <p>Thank you for being a customer.</p>
        `,
      });
    } catch (emailError) {
      console.error('[Stripe Webhook] Failed to send cancellation email:', emailError);
      // Non-critical - don't fail the webhook
    }
  }

  console.log('[Stripe Webhook] Subscription canceled and access revoked for user:', userId);

  return ok({
    handled: true,
    eventType: 'customer.subscription.deleted',
    message: `Subscription canceled for user ${userId}`,
  });
}

/**
 * Handle subscription paused.
 */
async function handleSubscriptionPaused(
  subscription: Stripe.Subscription
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    return ok({
      handled: true,
      eventType: 'customer.subscription.paused',
      message: 'Subscription paused (no userId in metadata)',
    });
  }

  const supabase = await createClient();

  // Type assertion: subscriptions table may not exist in generated types yet
  const { error } = await (supabase as any)
    .from('subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    return err({
      type: 'database_error',
      message: error.message,
    });
  }

  return ok({
    handled: true,
    eventType: 'customer.subscription.paused',
    message: `Subscription paused for user ${userId}`,
  });
}

/**
 * Handle subscription resumed.
 */
async function handleSubscriptionResumed(
  subscription: Stripe.Subscription
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    return ok({
      handled: true,
      eventType: 'customer.subscription.resumed',
      message: 'Subscription resumed (no userId in metadata)',
    });
  }

  const supabase = await createClient();

  // Type assertion: subscriptions table may not exist in generated types yet
  const { error } = await (supabase as any)
    .from('subscriptions')
    .update({
      status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    return err({
      type: 'database_error',
      message: error.message,
    });
  }

  return ok({
    handled: true,
    eventType: 'customer.subscription.resumed',
    message: `Subscription resumed for user ${userId}`,
  });
}

// ============================================================
// INVOICE HANDLERS
// ============================================================

/**
 * Handle successful invoice payment.
 */
async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  const subscriptionId = invoice.subscription as string | null;

  console.log('[Stripe Webhook] Invoice paid:', {
    invoiceId: invoice.id,
    subscriptionId,
    amount: invoice.amount_paid,
    currency: invoice.currency,
  });

  // Invoice payment extends subscription - already handled by subscription.updated
  // This is a good place to:
  // - Send receipt email
  // - Track revenue analytics
  // - Update billing history

  return ok({
    handled: true,
    eventType: 'invoice.paid',
    message: `Invoice paid: ${invoice.id}`,
  });
}

/**
 * Handle failed payment.
 * This is critical - subscription may be at risk.
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string | null;

  console.error('[Stripe Webhook] Payment failed:', {
    invoiceId: invoice.id,
    customerId,
    subscriptionId,
    amount: invoice.amount_due,
    attemptCount: invoice.attempt_count,
  });

  const supabase = await createClient();

  // Log failed payment event for analytics
  const { error: eventError } = await (supabase as any)
    .from('billing_events')
    .insert({
      event_type: 'payment_failed',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      metadata: {
        invoice_id: invoice.id,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
        attempt_count: invoice.attempt_count,
        next_payment_attempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000).toISOString()
          : null,
        failure_reason: invoice.last_finalization_error?.message ?? 'unknown',
      },
      created_at: new Date().toISOString(),
    });

  if (eventError) {
    console.error('[Stripe Webhook] Failed to log payment failed event:', eventError);
  }

  // If this is a subscription, update status and restrict features
  if (subscriptionId) {
    // Update subscription status to past_due
    const { error: subError } = await (supabase as any)
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (subError) {
      console.error('[Stripe Webhook] Failed to update subscription status:', subError);
    }

    // Find user by customer ID and send notification
    const { data: subData } = await (supabase as any)
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subData?.user_id) {
      // Optionally restrict premium features on repeated failures
      if (invoice.attempt_count && invoice.attempt_count >= 2) {
        await (supabase as any)
          .from('profiles')
          .update({
            premium_features_paused: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subData.user_id);
      }

      // Get user email for notification
      const { data: userData } = await (supabase as any)
        .from('profiles')
        .select('email, full_name')
        .eq('id', subData.user_id)
        .single();

      if (userData?.email) {
        // Send payment failed email via Resend
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);

          await resend.emails.send({
            from: process.env.EMAIL_FROM ?? 'noreply@taxbook-pro.com',
            to: userData.email,
            subject: 'Payment Failed - Action Required',
            html: `
              <h1>Payment Failed</h1>
              <p>Hi ${userData.full_name ?? 'there'},</p>
              <p>We were unable to process your payment of ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency?.toUpperCase()}.</p>
              <p>This was attempt ${invoice.attempt_count} of 4. Please update your payment method to avoid service interruption.</p>
              ${invoice.hosted_invoice_url ? `<p><a href="${invoice.hosted_invoice_url}">Click here to update your payment</a></p>` : ''}
              <p>If you have any questions, please contact support.</p>
            `,
          });
        } catch (emailError) {
          console.error('[Stripe Webhook] Failed to send payment failed email:', emailError);
        }
      }
    }
  }

  return ok({
    handled: true,
    eventType: 'invoice.payment_failed',
    message: `Payment failed for invoice ${invoice.id}`,
  });
}

/**
 * Handle payment requiring action (3D Secure, etc.)
 */
async function handlePaymentActionRequired(
  invoice: Stripe.Invoice
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  console.log('[Stripe Webhook] Payment action required:', {
    invoiceId: invoice.id,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
  });

  const supabase = await createClient();
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string | null;

  // Log payment action required event
  const { error: eventError } = await (supabase as any)
    .from('billing_events')
    .insert({
      event_type: 'payment_action_required',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      metadata: {
        invoice_id: invoice.id,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
        hosted_invoice_url: invoice.hosted_invoice_url,
      },
      created_at: new Date().toISOString(),
    });

  if (eventError) {
    console.error('[Stripe Webhook] Failed to log payment action event:', eventError);
  }

  // Find user by subscription or customer ID to send notification
  let userEmail: string | null = null;
  let userName: string | null = null;

  if (subscriptionId) {
    const { data: subData } = await (supabase as any)
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subData?.user_id) {
      const { data: userData } = await (supabase as any)
        .from('profiles')
        .select('email, full_name')
        .eq('id', subData.user_id)
        .single();

      userEmail = userData?.email;
      userName = userData?.full_name;
    }
  }

  // Fallback: try to find user by customer ID
  if (!userEmail) {
    const { data: subData } = await (supabase as any)
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (subData?.user_id) {
      const { data: userData } = await (supabase as any)
        .from('profiles')
        .select('email, full_name')
        .eq('id', subData.user_id)
        .single();

      userEmail = userData?.email;
      userName = userData?.full_name;
    }
  }

  // Send email to customer with link to complete payment
  if (userEmail && invoice.hosted_invoice_url) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'noreply@taxbook-pro.com',
        to: userEmail,
        subject: 'Action Required: Complete Your Payment',
        html: `
          <h1>Payment Authentication Required</h1>
          <p>Hi ${userName ?? 'there'},</p>
          <p>Your recent payment of ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency?.toUpperCase()} requires additional authentication (such as 3D Secure).</p>
          <p>Please complete the payment to avoid any interruption to your service.</p>
          <p><a href="${invoice.hosted_invoice_url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Complete Payment</a></p>
          <p>This link will expire in 24 hours. If you have any questions, please contact support.</p>
        `,
      });

      console.log('[Stripe Webhook] Payment action required email sent to:', userEmail);
    } catch (emailError) {
      console.error('[Stripe Webhook] Failed to send payment action email:', emailError);
      // Non-critical - don't fail the webhook
    }
  } else {
    console.warn('[Stripe Webhook] Could not send payment action email - no user email or invoice URL');
  }

  return ok({
    handled: true,
    eventType: 'invoice.payment_action_required',
    message: `Payment action required for invoice ${invoice.id}`,
  });
}

// ============================================================
// PAYMENT INTENT HANDLERS
// ============================================================

/**
 * Handle successful payment intent (one-time payments).
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  const userId = paymentIntent.metadata?.userId;

  console.log('[Stripe Webhook] Payment intent succeeded:', {
    paymentIntentId: paymentIntent.id,
    userId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  });

  const supabase = await createClient();
  const productId = paymentIntent.metadata?.productId;
  const productType = paymentIntent.metadata?.productType;

  // Record the purchase in the database
  const { error: purchaseError } = await (supabase as any)
    .from('purchases')
    .insert({
      user_id: userId ?? null,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: paymentIntent.customer as string,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'completed',
      product_id: productId ?? null,
      product_type: productType ?? null,
      metadata: paymentIntent.metadata ?? {},
      created_at: new Date().toISOString(),
    });

  if (purchaseError) {
    console.error('[Stripe Webhook] Failed to record purchase:', purchaseError);
    return err({
      type: 'database_error',
      message: purchaseError.message,
    });
  }

  // Log successful payment event for analytics
  const { error: eventError } = await (supabase as any)
    .from('billing_events')
    .insert({
      user_id: userId ?? null,
      event_type: 'payment_succeeded',
      stripe_customer_id: paymentIntent.customer as string,
      metadata: {
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        product_id: productId,
        product_type: productType,
      },
      created_at: new Date().toISOString(),
    });

  if (eventError) {
    console.error('[Stripe Webhook] Failed to log payment event:', eventError);
  }

  // Fulfill the order based on product type
  if (userId && productType) {
    switch (productType) {
      case 'credits':
        // Add credits to user account
        const creditAmount = parseInt(paymentIntent.metadata?.creditAmount ?? '0', 10);
        if (creditAmount > 0) {
          const { error: creditError } = await (supabase as any).rpc('add_user_credits', {
            p_user_id: userId,
            p_amount: creditAmount,
          });
          if (creditError) {
            console.error('[Stripe Webhook] Failed to add credits:', creditError);
          }
        }
        break;

      case 'lifetime':
        // Grant lifetime access
        await (supabase as any)
          .from('profiles')
          .update({
            role: 'lifetime',
            is_premium: true,
            lifetime_access: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        break;

      case 'feature':
        // Unlock specific feature
        const featureId = paymentIntent.metadata?.featureId;
        if (featureId) {
          await (supabase as any)
            .from('user_features')
            .insert({
              user_id: userId,
              feature_id: featureId,
              purchased_at: new Date().toISOString(),
            });
        }
        break;

      default:
        console.log('[Stripe Webhook] No specific fulfillment for product type:', productType);
    }
  }

  // Send confirmation email if we have user info
  if (userId) {
    const { data: userData } = await (supabase as any)
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userData?.email) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'noreply@taxbook-pro.com',
          to: userData.email,
          subject: 'Payment Confirmation',
          html: `
            <h1>Payment Successful</h1>
            <p>Hi ${userData.full_name ?? 'there'},</p>
            <p>Thank you for your purchase! Your payment of ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()} has been processed successfully.</p>
            ${productType ? `<p>Product: ${productType}${productId ? ` (${productId})` : ''}</p>` : ''}
            <p>If you have any questions about your purchase, please contact support.</p>
          `,
        });
      } catch (emailError) {
        console.error('[Stripe Webhook] Failed to send confirmation email:', emailError);
        // Non-critical - don't fail the webhook
      }
    }
  }

  return ok({
    handled: true,
    eventType: 'payment_intent.succeeded',
    message: `Payment succeeded: ${paymentIntent.id}`,
  });
}

/**
 * Handle failed payment intent.
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<Result<WebhookHandlerResult, WebhookError>> {
  console.error('[Stripe Webhook] Payment intent failed:', {
    paymentIntentId: paymentIntent.id,
    lastPaymentError: paymentIntent.last_payment_error?.message,
  });

  const supabase = await createClient();
  const userId = paymentIntent.metadata?.userId;
  const productId = paymentIntent.metadata?.productId;
  const productType = paymentIntent.metadata?.productType;

  // Log failed payment event for analytics
  const { error: eventError } = await (supabase as any)
    .from('billing_events')
    .insert({
      user_id: userId ?? null,
      event_type: 'payment_intent_failed',
      stripe_customer_id: paymentIntent.customer as string,
      metadata: {
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        product_id: productId,
        product_type: productType,
        error_code: paymentIntent.last_payment_error?.code ?? null,
        error_message: paymentIntent.last_payment_error?.message ?? null,
        error_type: paymentIntent.last_payment_error?.type ?? null,
        decline_code: paymentIntent.last_payment_error?.decline_code ?? null,
      },
      created_at: new Date().toISOString(),
    });

  if (eventError) {
    console.error('[Stripe Webhook] Failed to log payment failed event:', eventError);
  }

  // Record the failed purchase attempt
  const { error: purchaseError } = await (supabase as any)
    .from('purchases')
    .insert({
      user_id: userId ?? null,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: paymentIntent.customer as string,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'failed',
      product_id: productId ?? null,
      product_type: productType ?? null,
      failure_reason: paymentIntent.last_payment_error?.message ?? 'Payment failed',
      metadata: paymentIntent.metadata ?? {},
      created_at: new Date().toISOString(),
    });

  if (purchaseError) {
    console.error('[Stripe Webhook] Failed to record failed purchase:', purchaseError);
  }

  // Track analytics for failed payment patterns
  if (userId) {
    // Get user's failed payment count for pattern analysis
    const { data: failedPayments } = await (supabase as any)
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const failedCount = failedPayments?.length ?? 0;

    // If multiple failures, flag for review
    if (failedCount >= 3) {
      await (supabase as any)
        .from('billing_events')
        .insert({
          user_id: userId,
          event_type: 'payment_pattern_alert',
          metadata: {
            alert_type: 'multiple_failures',
            failed_count: failedCount,
            period_days: 30,
            latest_error: paymentIntent.last_payment_error?.message,
          },
          created_at: new Date().toISOString(),
        });
    }
  }

  return ok({
    handled: true,
    eventType: 'payment_intent.payment_failed',
    message: `Payment failed: ${paymentIntent.id}`,
  });
}

// ============================================================
// DATABASE MIGRATION
// ============================================================

/*
-- Subscriptions table for tracking user subscriptions
-- Run this migration to enable subscription tracking

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_user_id_key UNIQUE (user_id)
);

-- Index for looking up by Stripe IDs
CREATE INDEX idx_subscriptions_stripe_subscription_id
  ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer_id
  ON subscriptions(stripe_customer_id);

-- RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (from webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Purchases table for one-time payments
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_customer_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  product_id TEXT,
  product_type TEXT,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_stripe_session_id ON purchases(stripe_session_id);
CREATE INDEX idx_purchases_stripe_payment_intent_id ON purchases(stripe_payment_intent_id);
CREATE INDEX idx_purchases_status ON purchases(status);

-- RLS policies
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can read their own purchases
CREATE POLICY "Users can read own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (from webhooks)
CREATE POLICY "Service role can manage purchases"
  ON purchases FOR ALL
  USING (auth.role() = 'service_role');

-- Billing events table for analytics and audit trail
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for billing events
CREATE INDEX idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX idx_billing_events_event_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_stripe_customer_id ON billing_events(stripe_customer_id);
CREATE INDEX idx_billing_events_created_at ON billing_events(created_at);

-- RLS policies for billing events
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own billing events
CREATE POLICY "Users can read own billing events"
  ON billing_events FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (from webhooks)
CREATE POLICY "Service role can manage billing events"
  ON billing_events FOR ALL
  USING (auth.role() = 'service_role');

-- User features table for purchased features
CREATE TABLE IF NOT EXISTS user_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT user_features_unique UNIQUE (user_id, feature_id)
);

-- Indexes for user features
CREATE INDEX idx_user_features_user_id ON user_features(user_id);
CREATE INDEX idx_user_features_feature_id ON user_features(feature_id);

-- RLS policies for user features
ALTER TABLE user_features ENABLE ROW LEVEL SECURITY;

-- Users can read their own features
CREATE POLICY "Users can read own features"
  ON user_features FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (from webhooks)
CREATE POLICY "Service role can manage user features"
  ON user_features FOR ALL
  USING (auth.role() = 'service_role');

-- Function to add credits to user (called by payment webhook)
CREATE OR REPLACE FUNCTION add_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credits = COALESCE(credits, 0) + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
