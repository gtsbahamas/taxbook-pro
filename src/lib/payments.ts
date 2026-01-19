/**
 * Stripe Payments Library - taxbook-pro
 * Generated: 2026-01-19
 *
 * Type-safe Stripe integration with Result returns.
 * All payment operations return Result<T, E> for explicit error handling.
 *
 * SETUP REQUIRED:
 * 1. Add STRIPE_SECRET_KEY to .env.local
 * 2. Add STRIPE_WEBHOOK_SECRET to .env.local
 * 3. Configure Stripe products/prices in dashboard
 * 4. Set up webhook endpoint: /api/webhooks/stripe
 */

import Stripe from 'stripe';
import type { Result } from '@/types/errors';
import { ok, err } from '@/types/errors';

// ============================================================
// STRIPE CLIENT
// ============================================================

/**
 * Lazy-initialized Stripe client singleton.
 * Only initializes when first accessed, allowing builds without STRIPE_SECRET_KEY.
 */
let _stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!_stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('[Payments] STRIPE_SECRET_KEY not set');
    }
    _stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }
  return _stripeClient;
}

/**
 * Stripe client accessor.
 * Throws if STRIPE_SECRET_KEY is not configured.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripeClient()[prop as keyof Stripe];
  },
});

// ============================================================
// PAYMENT ERROR TYPES
// ============================================================

export type PaymentErrorCode =
  | 'invalid_card'
  | 'card_declined'
  | 'expired_card'
  | 'insufficient_funds'
  | 'processing_error'
  | 'rate_limit'
  | 'customer_not_found'
  | 'subscription_not_found'
  | 'invalid_price'
  | 'invalid_amount'
  | 'webhook_verification_failed'
  | 'already_subscribed'
  | 'network_error'
  | 'unknown';

export interface PaymentError {
  readonly code: PaymentErrorCode;
  readonly message: string;
  readonly stripeCode?: string;
  readonly declineCode?: string;
}

// ============================================================
// DOMAIN TYPES
// ============================================================

/**
 * Application customer representation.
 * Maps to Stripe Customer with relevant fields.
 */
export interface Customer {
  readonly id: string;
  readonly stripeCustomerId: string;
  readonly email: string;
  readonly name: string | null;
  readonly createdAt: Date;
}

/**
 * Subscription status aligned with Stripe.
 */
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'paused';

/**
 * Application subscription representation.
 */
export interface Subscription {
  readonly id: string;
  readonly stripeSubscriptionId: string;
  readonly customerId: string;
  readonly priceId: string;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: Date;
  readonly currentPeriodEnd: Date;
  readonly cancelAtPeriodEnd: boolean;
  readonly canceledAt: Date | null;
  readonly trialEnd: Date | null;
  readonly createdAt: Date;
}

/**
 * Payment intent representation.
 */
export interface PaymentIntent {
  readonly id: string;
  readonly stripePaymentIntentId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: Stripe.PaymentIntent.Status;
  readonly customerId: string | null;
  readonly clientSecret: string;
  readonly createdAt: Date;
}

/**
 * Checkout session representation.
 */
export interface CheckoutSession {
  readonly id: string;
  readonly stripeSessionId: string;
  readonly customerId: string;
  readonly priceId: string;
  readonly mode: 'payment' | 'subscription' | 'setup';
  readonly url: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly expiresAt: Date;
}

/**
 * Price information for display.
 */
export interface PriceInfo {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly unitAmount: number;
  readonly currency: string;
  readonly interval: 'month' | 'year' | 'week' | 'day' | null;
  readonly intervalCount: number | null;
  readonly active: boolean;
}

// ============================================================
// CREATE CUSTOMER
// ============================================================

export interface CreateCustomerInput {
  readonly userId: string;
  readonly email: string;
  readonly name?: string;
  readonly metadata?: Record<string, string>;
}

/**
 * Create a Stripe customer for a user.
 * Links the user ID in metadata for reference.
 *
 * @example
 * const result = await createCustomer({
 *   userId: user.id,
 *   email: user.email,
 *   name: user.name,
 * });
 * if (!result.ok) {
 *   console.error('Failed to create customer:', result.error);
 * }
 * const customer = result.value;
 */
export async function createCustomer(
  input: CreateCustomerInput
): Promise<Result<Customer, PaymentError>> {
  try {
    const stripeCustomer = await stripe.customers.create({
      email: input.email,
      name: input.name,
      metadata: {
        userId: input.userId,
        ...input.metadata,
      },
    });

    return ok({
      id: input.userId,
      stripeCustomerId: stripeCustomer.id,
      email: stripeCustomer.email ?? input.email,
      name: stripeCustomer.name ?? null,
      createdAt: new Date(stripeCustomer.created * 1000),
    });
  } catch (error) {
    return err(mapStripeError(error));
  }
}

// ============================================================
// GET CUSTOMER
// ============================================================

/**
 * Retrieve a Stripe customer by their Stripe customer ID.
 */
export async function getCustomer(
  stripeCustomerId: string
): Promise<Result<Customer, PaymentError>> {
  try {
    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);

    if (stripeCustomer.deleted) {
      return err({
        code: 'customer_not_found',
        message: 'Customer has been deleted',
      });
    }

    const userId = stripeCustomer.metadata?.userId;
    if (!userId) {
      return err({
        code: 'customer_not_found',
        message: 'Customer metadata missing userId',
      });
    }

    return ok({
      id: userId,
      stripeCustomerId: stripeCustomer.id,
      email: stripeCustomer.email ?? '',
      name: stripeCustomer.name ?? null,
      createdAt: new Date(stripeCustomer.created * 1000),
    });
  } catch (error) {
    return err(mapStripeError(error));
  }
}

/**
 * Find a Stripe customer by email address.
 */
export async function getCustomerByEmail(
  email: string
): Promise<Result<Customer | null, PaymentError>> {
  try {
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return ok(null);
    }

    const stripeCustomer = customers.data[0];
    const userId = stripeCustomer.metadata?.userId;

    if (!userId) {
      return ok(null);
    }

    return ok({
      id: userId,
      stripeCustomerId: stripeCustomer.id,
      email: stripeCustomer.email ?? email,
      name: stripeCustomer.name ?? null,
      createdAt: new Date(stripeCustomer.created * 1000),
    });
  } catch (error) {
    return err(mapStripeError(error));
  }
}

// ============================================================
// CREATE CHECKOUT SESSION
// ============================================================

export interface CreateCheckoutSessionInput {
  readonly customerId: string;
  readonly stripeCustomerId: string;
  readonly priceId: string;
  readonly mode?: 'subscription' | 'payment';
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly trialPeriodDays?: number;
  readonly metadata?: Record<string, string>;
}

/**
 * Create a Stripe Checkout session for subscription or one-time payment.
 *
 * @example
 * const result = await createCheckoutSession({
 *   customerId: user.id,
 *   stripeCustomerId: user.stripeCustomerId,
 *   priceId: 'price_xxx',
 *   successUrl: `${origin}/dashboard?success=true`,
 *   cancelUrl: `${origin}/pricing?canceled=true`,
 * });
 * if (result.ok) {
 *   redirect(result.value.url);
 * }
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<Result<CheckoutSession, PaymentError>> {
  try {
    const mode = input.mode ?? 'subscription';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: input.stripeCustomerId,
      line_items: [
        {
          price: input.priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        userId: input.customerId,
        ...input.metadata,
      },
    };

    if (mode === 'subscription' && input.trialPeriodDays) {
      sessionParams.subscription_data = {
        trial_period_days: input.trialPeriodDays,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return err({
        code: 'processing_error',
        message: 'Checkout session created but no URL returned',
      });
    }

    return ok({
      id: session.id,
      stripeSessionId: session.id,
      customerId: input.customerId,
      priceId: input.priceId,
      mode,
      url: session.url,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      expiresAt: new Date(session.expires_at * 1000),
    });
  } catch (error) {
    return err(mapStripeError(error));
  }
}

// ============================================================
// CREATE SUBSCRIPTION
// ============================================================

export interface CreateSubscriptionInput {
  readonly customerId: string;
  readonly stripeCustomerId: string;
  readonly priceId: string;
  readonly trialPeriodDays?: number;
  readonly defaultPaymentMethod?: string;
  readonly metadata?: Record<string, string>;
}

/**
 * Create a subscription directly (when customer already has payment method).
 *
 * @example
 * const result = await createSubscription({
 *   customerId: user.id,
 *   stripeCustomerId: user.stripeCustomerId,
 *   priceId: 'price_xxx',
 * });
 */
export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<Result<Subscription, PaymentError>> {
  try {
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: input.stripeCustomerId,
      items: [{ price: input.priceId }],
      metadata: {
        userId: input.customerId,
        ...input.metadata,
      },
    };

    if (input.trialPeriodDays) {
      subscriptionParams.trial_period_days = input.trialPeriodDays;
    }

    if (input.defaultPaymentMethod) {
      subscriptionParams.default_payment_method = input.defaultPaymentMethod;
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    return ok(mapStripeSubscription(subscription, input.customerId));
  } catch (error) {
    return err(mapStripeError(error));
  }
}

// ============================================================
// GET SUBSCRIPTION
// ============================================================

/**
 * Get subscription by Stripe subscription ID.
 */
export async function getSubscription(
  stripeSubscriptionId: string
): Promise<Result<Subscription, PaymentError>> {
  try {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const userId = subscription.metadata?.userId;
    if (!userId) {
      return err({
        code: 'subscription_not_found',
        message: 'Subscription metadata missing userId',
      });
    }

    return ok(mapStripeSubscription(subscription, userId));
  } catch (error) {
    return err(mapStripeError(error));
  }
}

/**
 * Get subscription status for a customer.
 */
export async function getSubscriptionStatus(
  stripeSubscriptionId: string
): Promise<Result<SubscriptionStatus, PaymentError>> {
  const result = await getSubscription(stripeSubscriptionId);
  if (!result.ok) {
    return result;
  }
  return ok(result.value.status);
}

/**
 * Get all subscriptions for a customer.
 */
export async function getCustomerSubscriptions(
  stripeCustomerId: string
): Promise<Result<Subscription[], PaymentError>> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
    });

    return ok(
      subscriptions.data
        .filter((sub) => sub.metadata?.userId)
        .map((sub) => mapStripeSubscription(sub, sub.metadata.userId!))
    );
  } catch (error) {
    return err(mapStripeError(error));
  }
}

// ============================================================
// CANCEL SUBSCRIPTION
// ============================================================

export interface CancelSubscriptionOptions {
  readonly immediately?: boolean;
  readonly reason?: string;
}

/**
 * Cancel a subscription.
 * By default, cancels at period end. Set immediately=true for immediate cancellation.
 *
 * @example
 * // Cancel at period end (user keeps access until then)
 * await cancelSubscription(subscriptionId);
 *
 * // Cancel immediately
 * await cancelSubscription(subscriptionId, { immediately: true });
 */
export async function cancelSubscription(
  stripeSubscriptionId: string,
  options: CancelSubscriptionOptions = {}
): Promise<Result<Subscription, PaymentError>> {
  try {
    let subscription: Stripe.Subscription;

    if (options.immediately) {
      subscription = await stripe.subscriptions.cancel(stripeSubscriptionId, {
        cancellation_details: options.reason
          ? { comment: options.reason }
          : undefined,
      });
    } else {
      subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
        cancellation_details: options.reason
          ? { comment: options.reason }
          : undefined,
      });
    }

    const userId = subscription.metadata?.userId;
    if (!userId) {
      return err({
        code: 'subscription_not_found',
        message: 'Subscription metadata missing userId',
      });
    }

    return ok(mapStripeSubscription(subscription, userId));
  } catch (error) {
    return err(mapStripeError(error));
  }
}

/**
 * Resume a subscription that was set to cancel at period end.
 */
export async function resumeSubscription(
  stripeSubscriptionId: string
): Promise<Result<Subscription, PaymentError>> {
  try {
    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    const userId = subscription.metadata?.userId;
    if (!userId) {
      return err({
        code: 'subscription_not_found',
        message: 'Subscription metadata missing userId',
      });
    }

    return ok(mapStripeSubscription(subscription, userId));
  } catch (error) {
    return err(mapStripeError(error));
  }
}

// ============================================================
// UPDATE SUBSCRIPTION
// ============================================================

export interface UpdateSubscriptionInput {
  readonly newPriceId?: string;
  readonly prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

/**
 * Update a subscription (e.g., change plan).
 */
export async function updateSubscription(
  stripeSubscriptionId: string,
  input: UpdateSubscriptionInput
): Promise<Result<Subscription, PaymentError>> {
  try {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const updateParams: Stripe.SubscriptionUpdateParams = {
      proration_behavior: input.prorationBehavior ?? 'create_prorations',
    };

    if (input.newPriceId) {
      updateParams.items = [
        {
          id: subscription.items.data[0].id,
          price: input.newPriceId,
        },
      ];
    }

    const updatedSubscription = await stripe.subscriptions.update(
      stripeSubscriptionId,
      updateParams
    );

    const userId = updatedSubscription.metadata?.userId;
    if (!userId) {
      return err({
        code: 'subscription_not_found',
        message: 'Subscription metadata missing userId',
      });
    }

    return ok(mapStripeSubscription(updatedSubscription, userId));
  } catch (error) {
    return err(mapStripeError(error));
  }
}

// ============================================================
// PAYMENT INTENTS (One-time payments)
// ============================================================

export interface CreatePaymentIntentInput {
  readonly amount: number;
  readonly currency?: string;
  readonly customerId?: string;
  readonly stripeCustomerId?: string;
  readonly metadata?: Record<string, string>;
  readonly description?: string;
}

/**
 * Create a payment intent for one-time payment.
 * Returns client secret for frontend confirmation.
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<Result<PaymentIntent, PaymentError>> {
  try {
    if (input.amount < 50) {
      return err({
        code: 'invalid_amount',
        message: 'Amount must be at least 50 cents',
      });
    }

    const params: Stripe.PaymentIntentCreateParams = {
      amount: input.amount,
      currency: input.currency ?? 'usd',
      metadata: input.metadata ?? {},
    };

    if (input.stripeCustomerId) {
      params.customer = input.stripeCustomerId;
    }

    if (input.description) {
      params.description = input.description;
    }

    const paymentIntent = await stripe.paymentIntents.create(params);

    return ok({
      id: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      customerId: input.customerId ?? null,
      clientSecret: paymentIntent.client_secret!,
      createdAt: new Date(paymentIntent.created * 1000),
    });
  } catch (error) {
    return err(mapStripeError(error));
  }
}

// ============================================================
// BILLING PORTAL
// ============================================================

export interface CreateBillingPortalInput {
  readonly stripeCustomerId: string;
  readonly returnUrl: string;
}

/**
 * Create a billing portal session for customer self-service.
 * Customer can update payment methods, view invoices, cancel subscription.
 */
export async function createBillingPortalSession(
  input: CreateBillingPortalInput
): Promise<Result<{ url: string }, PaymentError>> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: input.stripeCustomerId,
      return_url: input.returnUrl,
    });

    return ok({ url: session.url });
  } catch (error) {
    return err(mapStripeError(error));
  }
}

// ============================================================
// PRICES
// ============================================================

/**
 * Get all active prices for products.
 */
export async function getActivePrices(): Promise<Result<PriceInfo[], PaymentError>> {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    return ok(
      prices.data
        .filter((price) => {
          const product = price.product as Stripe.Product;
          return product.active;
        })
        .map((price) => {
          const product = price.product as Stripe.Product;
          return {
            id: price.id,
            productId: product.id,
            productName: product.name,
            unitAmount: price.unit_amount ?? 0,
            currency: price.currency,
            interval: price.recurring?.interval ?? null,
            intervalCount: price.recurring?.interval_count ?? null,
            active: price.active,
          };
        })
    );
  } catch (error) {
    return err(mapStripeError(error));
  }
}

/**
 * Get a specific price by ID.
 */
export async function getPrice(priceId: string): Promise<Result<PriceInfo, PaymentError>> {
  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    });

    const product = price.product as Stripe.Product;

    return ok({
      id: price.id,
      productId: product.id,
      productName: product.name,
      unitAmount: price.unit_amount ?? 0,
      currency: price.currency,
      interval: price.recurring?.interval ?? null,
      intervalCount: price.recurring?.interval_count ?? null,
      active: price.active,
    });
  } catch (error) {
    return err(mapStripeError(error));
  }
}

// ============================================================
// WEBHOOK VERIFICATION
// ============================================================

/**
 * Verify Stripe webhook signature.
 * Use this in your webhook handler before processing events.
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const payload = await request.text();
 *   const signature = request.headers.get('stripe-signature');
 *
 *   const result = await verifyWebhookSignature(payload, signature);
 *   if (!result.ok) {
 *     return new Response('Invalid signature', { status: 401 });
 *   }
 *
 *   const event = result.value;
 *   // Handle event...
 * }
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string | null
): Promise<Result<Stripe.Event, PaymentError>> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Payments] STRIPE_WEBHOOK_SECRET not configured');
    return err({
      code: 'webhook_verification_failed',
      message: 'Webhook secret not configured',
    });
  }

  if (!signature) {
    return err({
      code: 'webhook_verification_failed',
      message: 'Missing stripe-signature header',
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return ok(event);
  } catch (error) {
    console.error('[Payments] Webhook verification failed:', error);
    return err({
      code: 'webhook_verification_failed',
      message: error instanceof Error ? error.message : 'Signature verification failed',
    });
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Map Stripe subscription to application Subscription type.
 */
function mapStripeSubscription(
  sub: Stripe.Subscription,
  userId: string
): Subscription {
  const priceId = sub.items.data[0]?.price.id ?? '';

  return {
    id: sub.id,
    stripeSubscriptionId: sub.id,
    customerId: userId,
    priceId,
    status: sub.status as SubscriptionStatus,
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    createdAt: new Date(sub.created * 1000),
  };
}

/**
 * Map Stripe errors to PaymentError.
 */
function mapStripeError(error: unknown): PaymentError {
  if (error instanceof Stripe.errors.StripeError) {
    const stripeError = error as Stripe.errors.StripeError;

    // Handle card errors
    if (stripeError.type === 'StripeCardError') {
      const declineCode = (stripeError as Stripe.errors.StripeCardError).decline_code;

      if (declineCode === 'insufficient_funds') {
        return {
          code: 'insufficient_funds',
          message: 'Your card has insufficient funds',
          stripeCode: stripeError.code,
          declineCode,
        };
      }

      if (declineCode === 'expired_card' || stripeError.code === 'expired_card') {
        return {
          code: 'expired_card',
          message: 'Your card has expired',
          stripeCode: stripeError.code,
          declineCode,
        };
      }

      return {
        code: 'card_declined',
        message: stripeError.message,
        stripeCode: stripeError.code,
        declineCode,
      };
    }

    // Handle invalid request errors
    if (stripeError.type === 'StripeInvalidRequestError') {
      if (stripeError.message.includes('No such customer')) {
        return {
          code: 'customer_not_found',
          message: 'Customer not found',
          stripeCode: stripeError.code,
        };
      }

      if (stripeError.message.includes('No such subscription')) {
        return {
          code: 'subscription_not_found',
          message: 'Subscription not found',
          stripeCode: stripeError.code,
        };
      }

      if (stripeError.message.includes('No such price')) {
        return {
          code: 'invalid_price',
          message: 'Invalid price ID',
          stripeCode: stripeError.code,
        };
      }

      return {
        code: 'processing_error',
        message: stripeError.message,
        stripeCode: stripeError.code,
      };
    }

    // Handle rate limit errors
    if (stripeError.type === 'StripeRateLimitError') {
      return {
        code: 'rate_limit',
        message: 'Too many requests. Please try again later.',
        stripeCode: stripeError.code,
      };
    }

    // Handle API errors
    if (stripeError.type === 'StripeAPIError') {
      return {
        code: 'processing_error',
        message: 'An error occurred with the payment processor',
        stripeCode: stripeError.code,
      };
    }

    // Handle connection errors
    if (stripeError.type === 'StripeConnectionError') {
      return {
        code: 'network_error',
        message: 'Unable to connect to payment processor',
        stripeCode: stripeError.code,
      };
    }

    return {
      code: 'unknown',
      message: stripeError.message,
      stripeCode: stripeError.code,
    };
  }

  // Handle non-Stripe errors
  if (error instanceof Error) {
    return {
      code: 'unknown',
      message: error.message,
    };
  }

  return {
    code: 'unknown',
    message: 'An unexpected error occurred',
  };
}

// ============================================================
// SUBSCRIPTION HELPERS
// ============================================================

/**
 * Check if a subscription status is considered "active" (can access features).
 */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Check if subscription needs attention (payment issue).
 */
export function subscriptionNeedsAttention(status: SubscriptionStatus): boolean {
  return status === 'past_due' || status === 'unpaid' || status === 'incomplete';
}

/**
 * Format price for display.
 */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
