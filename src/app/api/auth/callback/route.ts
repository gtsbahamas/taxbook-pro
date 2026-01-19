// ============================================================
// AUTH CALLBACK ROUTE - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// Handles OAuth and Magic Link callback flows for Supabase Auth.
// Exchanges authorization codes for sessions and redirects users
// to the appropriate page based on the auth flow type.
//
// Supported flows:
//   - OAuth (Google, GitHub, etc.)
//   - Magic Link email authentication
//   - Email confirmation (type=email)
//   - Password recovery (type=recovery)
//   - User invite (type=invite)
//
// File: src/app/api/auth/callback/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// CONFIGURATION
// ============================================================

/**
 * Redirect paths for different auth flow outcomes.
 * Customize these paths based on your application structure.
 */
const REDIRECT_PATHS = {
  /** Default redirect after successful authentication */
  afterLogin: "/dashboard",
  /** Redirect after email confirmation */
  afterEmailConfirm: "/dashboard",
  /** Redirect after password recovery - user sets new password */
  afterRecovery: "/auth/reset-password",
  /** Redirect after accepting an invite */
  afterInvite: "/onboarding",
  /** Redirect on any auth error */
  error: "/auth/error",
  /** Redirect to login if no valid flow detected */
  login: "/login",
} as const;

/**
 * Auth flow types supported by Supabase.
 */
type AuthFlowType =
  | "email"      // Email confirmation
  | "recovery"   // Password recovery
  | "invite"     // Team/org invite
  | "signup"     // Sign up confirmation
  | "magiclink"; // Magic link login

// ============================================================
// ROUTE HANDLER
// ============================================================

/**
 * GET /api/auth/callback
 *
 * Handles the OAuth/Magic Link callback from Supabase Auth.
 * This route is called by Supabase after a user:
 *   - Completes OAuth flow (Google, GitHub, etc.)
 *   - Clicks a magic link in their email
 *   - Confirms their email address
 *   - Clicks a password reset link
 *   - Accepts an invite link
 *
 * Query Parameters:
 *   - code: Authorization code to exchange for session
 *   - type: Type of auth flow (email, recovery, invite)
 *   - next: Optional redirect path after authentication
 *   - error: Error code if auth failed
 *   - error_description: Human-readable error message
 *
 * @returns Redirect to appropriate page based on auth outcome
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);

  // Extract callback parameters
  const code = searchParams.get("code");
  const type = searchParams.get("type") as AuthFlowType | null;
  const next = searchParams.get("next");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // ============================================================
  // ERROR HANDLING - Check for upstream auth errors
  // ============================================================

  if (error) {
    console.error("[Auth Callback] Upstream error:", {
      error,
      description: errorDescription,
    });

    const errorUrl = new URL(REDIRECT_PATHS.error, origin);
    errorUrl.searchParams.set("error", error);
    if (errorDescription) {
      errorUrl.searchParams.set("message", errorDescription);
    }
    return NextResponse.redirect(errorUrl);
  }

  // ============================================================
  // CODE EXCHANGE - Exchange auth code for session
  // ============================================================

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] Code exchange failed:", {
        error: exchangeError.message,
        code: exchangeError.code,
        status: exchangeError.status,
      });

      const errorUrl = new URL(REDIRECT_PATHS.error, origin);
      errorUrl.searchParams.set("error", "exchange_failed");
      errorUrl.searchParams.set(
        "message",
        exchangeError.message || "Failed to complete authentication"
      );
      return NextResponse.redirect(errorUrl);
    }

    // Log successful authentication for debugging
    if (data.user) {
      console.log("[Auth Callback] Authentication successful:", {
        userId: data.user.id,
        email: data.user.email,
        type: type || "oauth",
        provider: data.user.app_metadata?.provider,
      });
    }

    // ============================================================
    // FLOW-SPECIFIC REDIRECTS
    // ============================================================

    // Determine the redirect path based on the auth flow type
    let redirectPath: string;

    switch (type) {
      case "email":
        // Email confirmation flow - user confirmed their email address
        // Typically after sign up with email/password
        redirectPath = REDIRECT_PATHS.afterEmailConfirm;
        break;

      case "recovery":
        // Password recovery flow - user clicked reset password link
        // Redirect to password reset form where they can set new password
        redirectPath = REDIRECT_PATHS.afterRecovery;
        break;

      case "invite":
        // Invite flow - user accepted an invitation
        // Redirect to onboarding or setup page
        redirectPath = REDIRECT_PATHS.afterInvite;
        break;

      case "signup":
        // Signup confirmation - same as email confirmation
        redirectPath = REDIRECT_PATHS.afterEmailConfirm;
        break;

      case "magiclink":
        // Magic link login - user clicked passwordless login link
        redirectPath = next || REDIRECT_PATHS.afterLogin;
        break;

      default:
        // OAuth flow or unspecified type
        // Use 'next' param if provided, otherwise default to afterLogin
        redirectPath = next || REDIRECT_PATHS.afterLogin;
    }

    // Validate redirect path to prevent open redirect vulnerability
    const finalRedirectPath = isValidRedirectPath(redirectPath)
      ? redirectPath
      : REDIRECT_PATHS.afterLogin;

    return NextResponse.redirect(new URL(finalRedirectPath, origin));
  }

  // ============================================================
  // NO CODE - Invalid callback request
  // ============================================================

  // No code and no error - this is an invalid callback request
  console.warn("[Auth Callback] Invalid request - no code or error present");

  const errorUrl = new URL(REDIRECT_PATHS.error, origin);
  errorUrl.searchParams.set("error", "missing_code");
  errorUrl.searchParams.set(
    "message",
    "Invalid authentication callback - missing authorization code"
  );
  return NextResponse.redirect(errorUrl);
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Validate that a redirect path is safe to use.
 * Prevents open redirect vulnerabilities by ensuring the path:
 *   - Starts with a forward slash (relative path)
 *   - Does not contain protocol or domain indicators
 *   - Does not contain double slashes
 *
 * @param path - The redirect path to validate
 * @returns True if the path is safe for redirecting
 */
function isValidRedirectPath(path: string): boolean {
  // Must start with / for relative paths
  if (!path.startsWith("/")) {
    return false;
  }

  // Reject paths that could be interpreted as absolute URLs
  // e.g., //evil.com, /\evil.com
  if (path.startsWith("//") || path.includes("\\")) {
    return false;
  }

  // Reject paths with protocol indicators
  if (path.includes("://")) {
    return false;
  }

  // Reject paths with encoded characters that could bypass checks
  const decoded = decodeURIComponent(path);
  if (decoded !== path && !isValidRedirectPath(decoded)) {
    return false;
  }

  return true;
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
