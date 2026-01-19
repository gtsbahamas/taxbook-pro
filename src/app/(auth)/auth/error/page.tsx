/**
 * Auth Error Page - taxbook-pro
 * Generated: 2026-01-19
 *
 * Displays authentication error messages to users.
 * Handles errors from OAuth, magic link, and password reset flows.
 * Place this in: app/(auth)/auth/error/page.tsx
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================
// ERROR CODE MAPPING
// ============================================================

interface ErrorInfo {
  readonly title: string;
  readonly description: string;
  readonly action: 'login' | 'signup' | 'forgot-password' | 'support';
}

const ERROR_MAP: Record<string, ErrorInfo> = {
  // OAuth errors
  access_denied: {
    title: 'Access Denied',
    description: 'You cancelled the sign-in process or access was denied by the provider.',
    action: 'login',
  },
  oauth_error: {
    title: 'Sign-in Failed',
    description: 'There was a problem connecting to the authentication provider. Please try again.',
    action: 'login',
  },

  // Code exchange errors
  exchange_failed: {
    title: 'Authentication Failed',
    description: 'We couldn\'t complete the sign-in process. The link may have expired.',
    action: 'login',
  },
  missing_code: {
    title: 'Invalid Link',
    description: 'This authentication link is invalid or incomplete.',
    action: 'login',
  },

  // Session errors
  session_expired: {
    title: 'Session Expired',
    description: 'Your session has expired. Please sign in again.',
    action: 'login',
  },
  invalid_session: {
    title: 'Invalid Session',
    description: 'Your session is no longer valid. Please sign in again.',
    action: 'login',
  },

  // Email/Link errors
  email_link_expired: {
    title: 'Link Expired',
    description: 'This link has expired. Please request a new one.',
    action: 'forgot-password',
  },
  email_link_invalid: {
    title: 'Invalid Link',
    description: 'This link is invalid or has already been used.',
    action: 'forgot-password',
  },

  // Rate limiting
  too_many_requests: {
    title: 'Too Many Attempts',
    description: 'You\'ve made too many requests. Please wait a few minutes and try again.',
    action: 'login',
  },

  // Account errors
  user_not_found: {
    title: 'Account Not Found',
    description: 'We couldn\'t find an account with this email address.',
    action: 'signup',
  },
  email_not_confirmed: {
    title: 'Email Not Confirmed',
    description: 'Please check your inbox and confirm your email address before signing in.',
    action: 'login',
  },

  // Server errors
  server_error: {
    title: 'Server Error',
    description: 'Something went wrong on our end. Please try again later.',
    action: 'support',
  },
  configuration_error: {
    title: 'Configuration Error',
    description: 'The authentication system is not properly configured. Please contact support.',
    action: 'support',
  },

  // Default
  unknown: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred during authentication.',
    action: 'login',
  },
};

// ============================================================
// ACTION BUTTON COMPONENT
// ============================================================

interface ActionButtonProps {
  readonly action: ErrorInfo['action'];
}

function ActionButton({ action }: ActionButtonProps) {
  switch (action) {
    case 'login':
      return (
        <Link href="/login" className="w-full">
          <Button className="w-full">Try signing in again</Button>
        </Link>
      );
    case 'signup':
      return (
        <Link href="/signup" className="w-full">
          <Button className="w-full">Create an account</Button>
        </Link>
      );
    case 'forgot-password':
      return (
        <Link href="/forgot-password" className="w-full">
          <Button className="w-full">Request new link</Button>
        </Link>
      );
    case 'support':
      return (
        <Link href="/contact" className="w-full">
          <Button className="w-full">Contact support</Button>
        </Link>
      );
    default:
      return (
        <Link href="/login" className="w-full">
          <Button className="w-full">Go to sign in</Button>
        </Link>
      );
  }
}

// ============================================================
// ERROR ICON COMPONENT
// ============================================================

function ErrorIcon() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
      <svg
        className="h-6 w-6 text-destructive"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    </div>
  );
}

// ============================================================
// AUTH ERROR CONTENT (wrapped in Suspense)
// ============================================================

function AuthErrorContent() {
  const searchParams = useSearchParams();

  const errorCode = searchParams.get('error') || 'unknown';
  const customMessage = searchParams.get('message');

  // Get error info from map, fallback to unknown
  const errorInfo = ERROR_MAP[errorCode] || ERROR_MAP.unknown;

  // Use custom message if provided, otherwise use default
  const description = customMessage || errorInfo.description;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4 text-center">
        <ErrorIcon />
        <h1 className="text-2xl font-bold">{errorInfo.title}</h1>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <ActionButton action={errorInfo.action} />
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Need help?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="font-mono text-xs">
            Error code: {errorCode}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// LOADING FALLBACK
// ============================================================

function AuthErrorLoading() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4 text-center">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

// ============================================================
// AUTH ERROR PAGE
// ============================================================

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<AuthErrorLoading />}>
        <AuthErrorContent />
      </Suspense>
    </main>
  );
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
