/**
 * Email Templates - taxbook-pro
 * Generated: 2026-01-19
 *
 * Type-safe email template definitions with HTML and plain text versions.
 * All user data is properly escaped to prevent XSS.
 * Integrates with Supabase Auth for magic link flows.
 */

// ============================================================
// EMAIL TEMPLATE TYPES
// ============================================================

/**
 * All available email template types.
 * Add new template types here as the union grows.
 */
export type EmailTemplateType =
  | 'welcome'
  | 'password-reset'
  | 'email-verification'
  | 'subscription-confirmation';

/**
 * Base structure for all email templates.
 */
export interface EmailTemplate {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

/**
 * Email sending result with proper error handling.
 */
export type EmailResult =
  | { readonly ok: true; readonly messageId: string }
  | { readonly ok: false; readonly error: EmailError };

export interface EmailError {
  readonly code: EmailErrorCode;
  readonly message: string;
}

export type EmailErrorCode =
  | 'invalid_recipient'
  | 'template_not_found'
  | 'render_failed'
  | 'send_failed'
  | 'rate_limited';

// ============================================================
// TEMPLATE DATA TYPES
// ============================================================

/**
 * Data required for welcome email template.
 */
export interface WelcomeEmailData {
  readonly recipientEmail: string;
  readonly recipientName?: string;
  readonly loginUrl: string;
}

/**
 * Data required for password reset email template.
 */
export interface PasswordResetEmailData {
  readonly recipientEmail: string;
  readonly recipientName?: string;
  readonly resetUrl: string;
  readonly expiresInMinutes: number;
}

/**
 * Data required for email verification template.
 */
export interface EmailVerificationData {
  readonly recipientEmail: string;
  readonly recipientName?: string;
  readonly verificationUrl: string;
  readonly expiresInHours: number;
}

/**
 * Data required for subscription confirmation template.
 */
export interface SubscriptionConfirmationData {
  readonly recipientEmail: string;
  readonly recipientName?: string;
  readonly planName: string;
  readonly amount: string;
  readonly billingCycle: 'monthly' | 'yearly';
  readonly nextBillingDate: string;
  readonly manageSubscriptionUrl: string;
}

/**
 * Union type for all email template data.
 */
export type EmailTemplateData =
  | { type: 'welcome'; data: WelcomeEmailData }
  | { type: 'password-reset'; data: PasswordResetEmailData }
  | { type: 'email-verification'; data: EmailVerificationData }
  | { type: 'subscription-confirmation'; data: SubscriptionConfirmationData };

// ============================================================
// HTML ESCAPING
// ============================================================

/**
 * Escape HTML special characters to prevent XSS attacks.
 * All user-provided data MUST be escaped before insertion into HTML.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape and handle optional values with a fallback.
 */
function escapeOrDefault(value: string | undefined, fallback: string): string {
  return escapeHtml(value ?? fallback);
}

// ============================================================
// EMAIL STYLES (Inline for email client compatibility)
// ============================================================

const emailStyles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    background-color: #ffffff;
    color: #1a1a1a;
  `,
  header: `
    text-align: center;
    padding-bottom: 30px;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 30px;
  `,
  logo: `
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
  `,
  heading: `
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 20px 0;
  `,
  paragraph: `
    font-size: 16px;
    line-height: 1.6;
    color: #4a4a4a;
    margin: 0 0 20px 0;
  `,
  button: `
    display: inline-block;
    padding: 14px 32px;
    background-color: #0066cc;
    color: #ffffff;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 16px;
    margin: 20px 0;
  `,
  footer: `
    margin-top: 40px;
    padding-top: 30px;
    border-top: 1px solid #e5e5e5;
    text-align: center;
    font-size: 14px;
    color: #888888;
  `,
  warning: `
    font-size: 14px;
    color: #666666;
    background-color: #f9f9f9;
    padding: 15px;
    border-radius: 6px;
    margin-top: 20px;
  `,
  detail: `
    font-size: 14px;
    color: #4a4a4a;
    margin: 8px 0;
  `,
  detailLabel: `
    font-weight: 600;
    color: #1a1a1a;
  `,
} as const;

// ============================================================
// TEMPLATE RENDERERS
// ============================================================

/**
 * Render welcome email template.
 */
export function renderWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
  const name = escapeOrDefault(data.recipientName, 'there');
  const loginUrl = escapeHtml(data.loginUrl);

  const subject = `Welcome to taxbook-pro!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="${emailStyles.container}">
    <div style="${emailStyles.header}">
      <div style="${emailStyles.logo}">taxbook-pro</div>
    </div>

    <h1 style="${emailStyles.heading}">Welcome aboard, ${name}!</h1>

    <p style="${emailStyles.paragraph}">
      Thanks for signing up for taxbook-pro. We're excited to have you on board.
    </p>

    <p style="${emailStyles.paragraph}">
      You can sign in to your account anytime using the button below:
    </p>

    <div style="text-align: center;">
      <a href="${loginUrl}" style="${emailStyles.button}">Sign In to Your Account</a>
    </div>

    <p style="${emailStyles.paragraph}">
      If the button doesn't work, copy and paste this link into your browser:
      <br>
      <a href="${loginUrl}" style="color: #0066cc; word-break: break-all;">${loginUrl}</a>
    </p>

    <div style="${emailStyles.footer}">
      <p>&copy; 2026 taxbook-pro. All rights reserved.</p>
      <p style="margin-top: 10px;">
        You received this email because you signed up for taxbook-pro.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Welcome to taxbook-pro!

Hi ${name},

Thanks for signing up for taxbook-pro. We're excited to have you on board.

You can sign in to your account using this link:
${data.loginUrl}

---
(c) 2026 taxbook-pro. All rights reserved.
You received this email because you signed up for taxbook-pro.
  `.trim();

  return { subject, html, text };
}

/**
 * Render password reset email template.
 */
export function renderPasswordResetEmail(data: PasswordResetEmailData): EmailTemplate {
  const name = escapeOrDefault(data.recipientName, 'there');
  const resetUrl = escapeHtml(data.resetUrl);
  const expiresIn = data.expiresInMinutes;

  const subject = `Reset your taxbook-pro password`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="${emailStyles.container}">
    <div style="${emailStyles.header}">
      <div style="${emailStyles.logo}">taxbook-pro</div>
    </div>

    <h1 style="${emailStyles.heading}">Reset Your Password</h1>

    <p style="${emailStyles.paragraph}">
      Hi ${name},
    </p>

    <p style="${emailStyles.paragraph}">
      We received a request to reset your password. Click the button below to create a new password:
    </p>

    <div style="text-align: center;">
      <a href="${resetUrl}" style="${emailStyles.button}">Reset Password</a>
    </div>

    <p style="${emailStyles.paragraph}">
      If the button doesn't work, copy and paste this link into your browser:
      <br>
      <a href="${resetUrl}" style="color: #0066cc; word-break: break-all;">${resetUrl}</a>
    </p>

    <div style="${emailStyles.warning}">
      <strong>This link will expire in ${expiresIn} minutes.</strong>
      <br><br>
      If you didn't request a password reset, you can safely ignore this email.
      Your password will not be changed.
    </div>

    <div style="${emailStyles.footer}">
      <p>&copy; 2026 taxbook-pro. All rights reserved.</p>
      <p style="margin-top: 10px;">
        This is an automated security email from taxbook-pro.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Reset your taxbook-pro password

Hi ${name},

We received a request to reset your password. Use the link below to create a new password:

${data.resetUrl}

This link will expire in ${expiresIn} minutes.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

---
(c) 2026 taxbook-pro. All rights reserved.
This is an automated security email from taxbook-pro.
  `.trim();

  return { subject, html, text };
}

/**
 * Render email verification template.
 */
export function renderEmailVerificationEmail(data: EmailVerificationData): EmailTemplate {
  const name = escapeOrDefault(data.recipientName, 'there');
  const verificationUrl = escapeHtml(data.verificationUrl);
  const expiresIn = data.expiresInHours;

  const subject = `Verify your email for taxbook-pro`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="${emailStyles.container}">
    <div style="${emailStyles.header}">
      <div style="${emailStyles.logo}">taxbook-pro</div>
    </div>

    <h1 style="${emailStyles.heading}">Verify Your Email Address</h1>

    <p style="${emailStyles.paragraph}">
      Hi ${name},
    </p>

    <p style="${emailStyles.paragraph}">
      Please verify your email address to complete your taxbook-pro account setup:
    </p>

    <div style="text-align: center;">
      <a href="${verificationUrl}" style="${emailStyles.button}">Verify Email Address</a>
    </div>

    <p style="${emailStyles.paragraph}">
      If the button doesn't work, copy and paste this link into your browser:
      <br>
      <a href="${verificationUrl}" style="color: #0066cc; word-break: break-all;">${verificationUrl}</a>
    </p>

    <div style="${emailStyles.warning}">
      <strong>This link will expire in ${expiresIn} hour${expiresIn === 1 ? '' : 's'}.</strong>
      <br><br>
      If you didn't create an account with taxbook-pro, you can safely ignore this email.
    </div>

    <div style="${emailStyles.footer}">
      <p>&copy; 2026 taxbook-pro. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Verify your email for taxbook-pro

Hi ${name},

Please verify your email address to complete your taxbook-pro account setup.

Click the link below to verify:
${data.verificationUrl}

This link will expire in ${expiresIn} hour${expiresIn === 1 ? '' : 's'}.

If you didn't create an account with taxbook-pro, you can safely ignore this email.

---
(c) 2026 taxbook-pro. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Render subscription confirmation email template.
 */
export function renderSubscriptionConfirmationEmail(data: SubscriptionConfirmationData): EmailTemplate {
  const name = escapeOrDefault(data.recipientName, 'there');
  const planName = escapeHtml(data.planName);
  const amount = escapeHtml(data.amount);
  const billingCycle = data.billingCycle;
  const nextBillingDate = escapeHtml(data.nextBillingDate);
  const manageUrl = escapeHtml(data.manageSubscriptionUrl);

  const subject = `Your taxbook-pro ${planName} subscription is confirmed`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="${emailStyles.container}">
    <div style="${emailStyles.header}">
      <div style="${emailStyles.logo}">taxbook-pro</div>
    </div>

    <h1 style="${emailStyles.heading}">Subscription Confirmed!</h1>

    <p style="${emailStyles.paragraph}">
      Hi ${name},
    </p>

    <p style="${emailStyles.paragraph}">
      Thank you for subscribing to taxbook-pro! Your subscription is now active.
    </p>

    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="${emailStyles.detail}">
        <span style="${emailStyles.detailLabel}">Plan:</span> ${planName}
      </p>
      <p style="${emailStyles.detail}">
        <span style="${emailStyles.detailLabel}">Amount:</span> ${amount}/${billingCycle === 'monthly' ? 'month' : 'year'}
      </p>
      <p style="${emailStyles.detail}">
        <span style="${emailStyles.detailLabel}">Next billing date:</span> ${nextBillingDate}
      </p>
    </div>

    <p style="${emailStyles.paragraph}">
      You can manage your subscription settings, update payment methods, or cancel anytime:
    </p>

    <div style="text-align: center;">
      <a href="${manageUrl}" style="${emailStyles.button}">Manage Subscription</a>
    </div>

    <p style="${emailStyles.paragraph}">
      If the button doesn't work, copy and paste this link into your browser:
      <br>
      <a href="${manageUrl}" style="color: #0066cc; word-break: break-all;">${manageUrl}</a>
    </p>

    <div style="${emailStyles.footer}">
      <p>&copy; 2026 taxbook-pro. All rights reserved.</p>
      <p style="margin-top: 10px;">
        Questions about your subscription? Reply to this email or visit our help center.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Your taxbook-pro ${planName} subscription is confirmed

Hi ${name},

Thank you for subscribing to taxbook-pro! Your subscription is now active.

Subscription Details:
- Plan: ${planName}
- Amount: ${amount}/${billingCycle === 'monthly' ? 'month' : 'year'}
- Next billing date: ${nextBillingDate}

Manage your subscription:
${data.manageSubscriptionUrl}

Questions about your subscription? Reply to this email or visit our help center.

---
(c) 2026 taxbook-pro. All rights reserved.
  `.trim();

  return { subject, html, text };
}

// ============================================================
// MAIN RENDER FUNCTION
// ============================================================

/**
 * Render an email template by type.
 * Returns a Result type for explicit error handling.
 */
export function renderEmailTemplate(
  template: EmailTemplateData
): EmailTemplate {
  switch (template.type) {
    case 'welcome':
      return renderWelcomeEmail(template.data);
    case 'password-reset':
      return renderPasswordResetEmail(template.data);
    case 'email-verification':
      return renderEmailVerificationEmail(template.data);
    case 'subscription-confirmation':
      return renderSubscriptionConfirmationEmail(template.data);
    default: {
      // Exhaustive check - this should never happen with proper typing
      const _exhaustive: never = template;
      throw new Error(`Unknown template type: ${(_exhaustive as EmailTemplateData).type}`);
    }
  }
}

// ============================================================
// SUPABASE AUTH INTEGRATION HELPERS
// ============================================================

/**
 * Build a Supabase magic link URL for password reset.
 * Use this with Supabase Auth's resetPasswordForEmail flow.
 */
export function buildPasswordResetUrl(
  baseUrl: string,
  token: string,
  redirectPath = '/auth/reset-password'
): string {
  const url = new URL(redirectPath, baseUrl);
  url.searchParams.set('token', token);
  url.searchParams.set('type', 'recovery');
  return url.toString();
}

/**
 * Build a Supabase email verification URL.
 * Use this with Supabase Auth's email confirmation flow.
 */
export function buildEmailVerificationUrl(
  baseUrl: string,
  token: string,
  redirectPath = '/auth/verify-email'
): string {
  const url = new URL(redirectPath, baseUrl);
  url.searchParams.set('token', token);
  url.searchParams.set('type', 'email');
  return url.toString();
}

/**
 * Build a magic link sign-in URL.
 * Use this with Supabase Auth's signInWithOtp flow.
 */
export function buildMagicLinkUrl(
  baseUrl: string,
  token: string,
  redirectPath = '/auth/callback'
): string {
  const url = new URL(redirectPath, baseUrl);
  url.searchParams.set('token', token);
  url.searchParams.set('type', 'magiclink');
  return url.toString();
}

// ============================================================
// CONFIGURATION
// ============================================================

/**
 * Email configuration for the project.
 * Customize sender details and URLs here.
 */
export const emailConfig = {
  from: {
    name: 'taxbook-pro',
    email: 'noreply@example.com',
  },
  replyTo: 'support@example.com',
  defaultExpirations: {
    passwordReset: 60, // minutes
    emailVerification: 24, // hours
  },
} as const;

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
