/**
 * Global Error Page - taxbook-pro
 * Generated: 2026-01-19
 *
 * Next.js App Router error.tsx boundary.
 * Catches runtime errors and displays a user-friendly recovery UI.
 *
 * IMPORTANT: This file MUST have 'use client' directive.
 * error.tsx is always a Client Component in Next.js.
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error);
    }
  }, [error]);

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      role="main"
      aria-labelledby="error-title"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"
            aria-hidden="true"
          >
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle id="error-title" className="text-xl">
            Something went wrong
          </CardTitle>
          <CardDescription>
            We encountered an unexpected error. Please try again, or return to the home page if the problem persists.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            If this issue continues, please contact support.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="w-full sm:w-auto"
            aria-label="Try again to reload the page"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="/" aria-label="Return to home page">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Go home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
