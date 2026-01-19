/**
 * Not Found Page - taxbook-pro
 * Generated: 2026-01-19
 *
 * This is the Next.js App Router 404 page.
 * Displayed when a route doesn't match any defined pages.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4"
      role="main"
      aria-labelledby="not-found-heading"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg text-center">
        {/* 404 Visual */}
        <div className="mb-8" aria-hidden="true">
          <span className="text-8xl font-bold tracking-tighter text-slate-800 sm:text-9xl">
            404
          </span>
        </div>

        {/* Heading */}
        <h1
          id="not-found-heading"
          className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Page Not Found
        </h1>

        {/* Description */}
        <p className="mb-8 text-lg text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist. It might have been moved, deleted, or you may have mistyped the URL.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="w-full bg-primary px-8 text-primary-foreground hover:bg-primary/90 sm:w-auto"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" aria-hidden="true" />
              Go Home
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full border-slate-700 bg-transparent px-8 text-slate-300 hover:bg-slate-800 hover:text-white sm:w-auto"
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        {/* Popular Links Section */}
        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="mb-4 flex items-center justify-center gap-2 text-slate-300">
            <Search className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">Popular Pages</span>
          </div>
          <nav aria-label="Popular pages">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-slate-400 transition-colors hover:text-primary hover:underline"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-slate-400 transition-colors hover:text-primary hover:underline"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-400 transition-colors hover:text-primary hover:underline"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-slate-400 transition-colors hover:text-primary hover:underline"
                >
                  Support
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}
