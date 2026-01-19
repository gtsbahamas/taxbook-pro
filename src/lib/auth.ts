/**
 * Client-Side Authentication - taxbook-pro
 * Generated: 2026-01-19
 *
 * Browser/client-safe Supabase authentication.
 * Use this in 'use client' components for auth operations.
 *
 * For server-side auth (Server Components, Route Handlers, Server Actions),
 * use '@/lib/auth-server' instead.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Result } from '@/types/errors';

// ============================================================
// AUTH ERROR TYPES
// ============================================================

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_not_found'
  | 'email_taken'
  | 'weak_password'
  | 'session_expired'
  | 'network_error'
  | 'unknown';

export interface AuthError {
  readonly code: AuthErrorCode;
  readonly message: string;
}

// ============================================================
// USER TYPE
// ============================================================

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly emailConfirmed: boolean;
  readonly createdAt: Date;
}

// ============================================================
// BROWSER CLIENT
// ============================================================

/**
 * Create Supabase client for browser/client components.
 * Use this in 'use client' components.
 *
 * @example
 * const supabase = createClient();
 * const { data } = await supabase.from('posts').select();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ============================================================
// GET USER (CLIENT)
// ============================================================

/**
 * Get the currently authenticated user (client-side).
 * Returns Result with user or error.
 *
 * @example
 * const result = await getUser();
 * if (!result.ok) {
 *   router.push('/login');
 * }
 * const user = result.value;
 */
export async function getUser(): Promise<Result<AuthUser, AuthError>> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }

    if (!user) {
      return {
        ok: false,
        error: { code: 'user_not_found', message: 'No authenticated user' },
      };
    }

    return {
      ok: true,
      value: {
        id: user.id,
        email: user.email!,
        emailConfirmed: !!user.email_confirmed_at,
        createdAt: new Date(user.created_at),
      },
    };
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: 'Failed to check authentication' },
    };
  }
}

// ============================================================
// SIGN IN
// ============================================================

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}

/**
 * Sign in with email and password.
 */
export async function signIn(input: SignInInput): Promise<Result<AuthUser, AuthError>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }

    if (!data.user) {
      return {
        ok: false,
        error: { code: 'user_not_found', message: 'Sign in failed' },
      };
    }

    return {
      ok: true,
      value: {
        id: data.user.id,
        email: data.user.email!,
        emailConfirmed: !!data.user.email_confirmed_at,
        createdAt: new Date(data.user.created_at),
      },
    };
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: 'Failed to sign in' },
    };
  }
}

// ============================================================
// SIGN UP
// ============================================================

export interface SignUpInput {
  readonly email: string;
  readonly password: string;
  readonly name?: string;
}

/**
 * Sign up with email and password.
 */
export async function signUp(input: SignUpInput): Promise<Result<AuthUser, AuthError>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
        },
      },
    });

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }

    if (!data.user) {
      return {
        ok: false,
        error: { code: 'unknown', message: 'Sign up failed' },
      };
    }

    return {
      ok: true,
      value: {
        id: data.user.id,
        email: data.user.email!,
        emailConfirmed: !!data.user.email_confirmed_at,
        createdAt: new Date(data.user.created_at),
      },
    };
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: 'Failed to sign up' },
    };
  }
}

// ============================================================
// SIGN OUT
// ============================================================

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<Result<void, AuthError>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }

    return { ok: true, value: undefined };
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: 'Failed to sign out' },
    };
  }
}

// ============================================================
// OAUTH PROVIDERS
// ============================================================

export type OAuthProvider = 'google' | 'github' | 'discord' | 'apple' | 'azure' | 'twitter';

/**
 * Sign in with an OAuth provider.
 * Redirects the user to the provider's authentication page.
 *
 * @example
 * await signInWithProvider('google');
 * // User is redirected to Google's OAuth page
 */
export async function signInWithProvider(
  provider: OAuthProvider,
  options?: { redirectTo?: string }
): Promise<Result<void, AuthError>> {
  try {
    const supabase = createClient();
    const redirectTo = options?.redirectTo || `${window.location.origin}/api/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: {
          // Request additional scopes if needed
          ...(provider === 'google' && { access_type: 'offline', prompt: 'consent' }),
        },
      },
    });

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }

    // OAuth redirects, so we won't reach here in normal flow
    return { ok: true, value: undefined };
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: `Failed to initiate ${provider} sign in` },
    };
  }
}

/**
 * Sign in with Google OAuth.
 * Convenience function that calls signInWithProvider('google').
 */
export async function signInWithGoogle(redirectTo?: string): Promise<Result<void, AuthError>> {
  return signInWithProvider('google', { redirectTo });
}

/**
 * Sign in with GitHub OAuth.
 * Convenience function that calls signInWithProvider('github').
 */
export async function signInWithGitHub(redirectTo?: string): Promise<Result<void, AuthError>> {
  return signInWithProvider('github', { redirectTo });
}

/**
 * Sign in with Discord OAuth.
 * Convenience function that calls signInWithProvider('discord').
 */
export async function signInWithDiscord(redirectTo?: string): Promise<Result<void, AuthError>> {
  return signInWithProvider('discord', { redirectTo });
}

/**
 * Link an OAuth provider to the current user's account.
 * User must be authenticated first.
 */
export async function linkProvider(provider: OAuthProvider): Promise<Result<void, AuthError>> {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }

    return { ok: true, value: undefined };
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: `Failed to link ${provider} account` },
    };
  }
}

/**
 * Unlink an OAuth provider from the current user's account.
 * User must have at least one other sign-in method (email or another provider).
 */
export async function unlinkProvider(identityId: string): Promise<Result<void, AuthError>> {
  try {
    const supabase = createClient();

    // First get the user to find the identity object
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { ok: false, error: mapAuthError(userError || { message: 'No authenticated user' }) };
    }

    // Find the identity by ID
    const identity = user.identities?.find((i) => i.id === identityId);
    if (!identity) {
      return { ok: false, error: { code: 'user_not_found', message: 'Identity not found' } };
    }

    const { error } = await supabase.auth.unlinkIdentity(identity);

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }

    return { ok: true, value: undefined };
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: 'Failed to unlink account' },
    };
  }
}

/**
 * Get linked OAuth identities for the current user.
 */
export async function getLinkedIdentities(): Promise<Result<readonly OAuthIdentity[], AuthError>> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }

    if (!user) {
      return { ok: false, error: { code: 'user_not_found', message: 'No authenticated user' } };
    }

    const identities: OAuthIdentity[] = (user.identities || []).map((identity) => ({
      id: identity.id,
      provider: identity.provider as OAuthProvider,
      email: identity.identity_data?.email as string | undefined,
      createdAt: identity.created_at ? new Date(identity.created_at) : new Date(),
    }));

    return { ok: true, value: identities };
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: 'Failed to get linked identities' },
    };
  }
}

export interface OAuthIdentity {
  readonly id: string;
  readonly provider: OAuthProvider;
  readonly email?: string;
  readonly createdAt: Date;
}

// ============================================================
// PASSWORD RESET
// ============================================================

/**
 * Send password reset email.
 */
export async function resetPassword(email: string): Promise<Result<void, AuthError>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }

    return { ok: true, value: undefined };
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: 'Failed to send reset email' },
    };
  }
}

/**
 * Update password for the currently authenticated user.
 * Used after user clicks the reset link from their email.
 */
export async function updatePassword(newPassword: string): Promise<Result<void, AuthError>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { ok: false, error: mapAuthError(error) };
    }

    return { ok: true, value: undefined };
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: 'Failed to update password' },
    };
  }
}

// ============================================================
// ERROR MAPPING
// ============================================================

export function mapAuthError(error: { message: string; status?: number }): AuthError {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid password')) {
    return { code: 'invalid_credentials', message: 'Invalid email or password' };
  }

  if (message.includes('email not confirmed')) {
    return { code: 'email_not_confirmed', message: 'Please confirm your email address' };
  }

  if (message.includes('user not found') || message.includes('no user')) {
    return { code: 'user_not_found', message: 'User not found' };
  }

  if (message.includes('already registered') || message.includes('already exists')) {
    return { code: 'email_taken', message: 'An account with this email already exists' };
  }

  if (message.includes('password') && message.includes('weak')) {
    return { code: 'weak_password', message: 'Password is too weak. Use at least 8 characters.' };
  }

  if (message.includes('session') || message.includes('expired') || message.includes('refresh')) {
    return { code: 'session_expired', message: 'Your session has expired. Please sign in again.' };
  }

  return { code: 'unknown', message: error.message };
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
