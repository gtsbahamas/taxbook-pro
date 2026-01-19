/**
 * Error Boundary Components - taxbook-pro
 * Generated: 2026-01-19
 *
 * Error handling components for graceful error recovery.
 * Includes class-based ErrorBoundary and functional fallback components.
 */

'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================
// TYPES
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Custom reset handler */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
  /** Show detailed error in development */
  showDetails?: boolean;
  /** Show "Go Home" link */
  showHomeLink?: boolean;
}

// ============================================================
// ERROR BOUNDARY (Class Component)
// ============================================================

/**
 * React Error Boundary that catches JavaScript errors in child components.
 * Displays a fallback UI instead of crashing the entire app.
 *
 * @example
 * <ErrorBoundary onError={(error) => logError(error)}>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================
// ERROR FALLBACK (Functional Component)
// ============================================================

/**
 * Default error fallback UI component.
 * Shows error message in development, generic message in production.
 *
 * @example
 * <ErrorFallback
 *   error={error}
 *   resetErrorBoundary={reset}
 *   showDetails={true}
 *   showHomeLink={true}
 * />
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
  showDetails = process.env.NODE_ENV === 'development',
  showHomeLink = false,
}: ErrorFallbackProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-destructive">Something went wrong</CardTitle>
        <CardDescription>
          {showDetails && error
            ? error.message
            : 'An unexpected error occurred. Please try again.'}
        </CardDescription>
      </CardHeader>

      {showDetails && error?.stack && (
        <CardContent>
          <pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
            {error.stack}
          </pre>
        </CardContent>
      )}

      <CardFooter className="flex gap-2">
        <Button onClick={resetErrorBoundary} variant="default">
          Try Again
        </Button>
        {showHomeLink && (
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// PAGE ERROR BOUNDARY
// ============================================================

interface PageErrorBoundaryProps {
  children: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Full-page error boundary wrapper.
 * Use in layout.tsx to catch errors at the page level.
 *
 * @example
 * // In app/layout.tsx or app/(dashboard)/layout.tsx
 * <PageErrorBoundary onError={logError}>
 *   {children}
 * </PageErrorBoundary>
 */
export function PageErrorBoundary({ children, onError }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={onError}
      fallback={<PageErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
}

function PageErrorFallback() {
  const router = useRouter();

  const handleReset = () => {
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle>Page Error</CardTitle>
          <CardDescription>
            Something went wrong loading this page. Please try refreshing.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center gap-2">
          <Button onClick={handleReset}>Refresh Page</Button>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ============================================================
// COMPONENT ERROR BOUNDARY
// ============================================================

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  /** Name of the component for error messages */
  componentName?: string;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Inline error boundary for individual components.
 * Uses smaller fallback UI that fits within page content.
 *
 * @example
 * <ComponentErrorBoundary componentName="UserProfile">
 *   <UserProfile />
 * </ComponentErrorBoundary>
 */
export function ComponentErrorBoundary({
  children,
  componentName,
  onError,
}: ComponentErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={onError}
      fallback={<ComponentErrorFallback componentName={componentName} />}
    >
      {children}
    </ErrorBoundary>
  );
}

interface ComponentErrorFallbackProps {
  componentName?: string;
  onRetry?: () => void;
}

function ComponentErrorFallback({ componentName, onRetry }: ComponentErrorFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex items-center gap-2 text-sm text-destructive">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          {componentName
            ? `Failed to load ${componentName}`
            : 'Failed to load component'}
        </span>
      </div>
      <Button
        onClick={handleRetry}
        variant="ghost"
        size="sm"
        className="mt-2"
      >
        Try Again
      </Button>
    </div>
  );
}

// ============================================================
// QUERY ERROR BOUNDARY (React Query Integration)
// ============================================================

interface QueryErrorBoundaryProps {
  children: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Error boundary that integrates with React Query.
 * Provides reset functionality for query errors.
 *
 * @example
 * <QueryErrorBoundary>
 *   <QueryProvider>
 *     <MyComponent />
 *   </QueryProvider>
 * </QueryErrorBoundary>
 */
export function QueryErrorBoundary({ children, onError }: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onError={onError}
      onReset={reset}
      fallback={<QueryErrorFallback onReset={reset} />}
    >
      {children}
    </ErrorBoundary>
  );
}

interface QueryErrorFallbackProps {
  onReset: () => void;
}

function QueryErrorFallback({ onReset }: QueryErrorFallbackProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-destructive">Failed to Load Data</CardTitle>
        <CardDescription>
          There was a problem fetching the data. This could be a network issue or
          the server may be temporarily unavailable.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={onReset}>Retry</Button>
      </CardFooter>
    </Card>
  );
}

// ============================================================
// NOT FOUND PAGE (404)
// ============================================================

interface NotFoundPageProps {
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
}

/**
 * 404 Not Found page component.
 * Use in app/not-found.tsx
 *
 * @example
 * // In app/not-found.tsx
 * export default function NotFound() {
 *   return <NotFoundPage />;
 * }
 */
export function NotFoundPage({
  title = 'Page Not Found',
  description = "The page you're looking for doesn't exist or has been moved.",
}: NotFoundPageProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 text-6xl font-bold text-muted-foreground">
            404
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center gap-2">
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ============================================================
// ERROR PAGE (500)
// ============================================================

interface ErrorPageProps {
  /** The error object from Next.js error boundary */
  error: Error & { digest?: string };
  /** Reset function from Next.js error boundary */
  reset: () => void;
}

/**
 * 500 Error page component.
 * Use in app/error.tsx or app/(dashboard)/error.tsx
 *
 * @example
 * // In app/error.tsx
 * 'use client';
 *
 * export default function Error({ error, reset }: ErrorPageProps) {
 *   return <ErrorPage error={error} reset={reset} />;
 * }
 */
export function ErrorPage({ error, reset }: ErrorPageProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle>Something Went Wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Our team has been notified.
          </CardDescription>
        </CardHeader>

        {isDev && (
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-destructive">{error.message}</p>
              {error.digest && (
                <p className="text-muted-foreground">
                  Error ID: {error.digest}
                </p>
              )}
              {error.stack && (
                <pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
                  {error.stack}
                </pre>
              )}
            </div>
          </CardContent>
        )}

        <CardFooter className="flex justify-center gap-2">
          <Button onClick={reset}>Try Again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
