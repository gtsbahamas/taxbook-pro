/**
 * Landing Page - taxbook-pro
 * Generated: 2026-01-19
 *
 * IMPORTANT: All buttons MUST have navigation targets.
 * - Use `asChild` with `Link` for internal navigation
 * - Use `href` for external links
 * - Use `onClick` handlers for actions (with proper implementation)
 *
 * NEVER create a button that does nothing when clicked.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
              <span className="text-lg font-bold text-primary-foreground">t</span>
            </div>
            <span className="text-xl font-bold text-white">taxbook-pro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-slate-300 transition-colors hover:text-white">
              Features
            </Link>
            <Link href="/login" className="text-sm text-slate-300 transition-colors hover:text-white">
              Sign In
            </Link>
          </div>

          {/* Auth Buttons - MUST have Link wrappers */}
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-slate-300 hover:bg-slate-800 hover:text-white">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center pt-16">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-32 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Build Something
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {' '}Amazing
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400">
              Get started with taxbook-pro today. Build faster, ship sooner, and delight your users.
            </p>

            {/* CTA Buttons - All MUST have navigation targets */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full bg-primary px-8 text-lg text-primary-foreground hover:bg-primary/90 sm:w-auto"
              >
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border-slate-700 bg-transparent px-8 text-lg text-slate-300 hover:bg-slate-800 hover:text-white sm:w-auto"
              >
                <Link href="#features">Learn About Features</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Why Choose taxbook-pro
            </h2>
            <p className="mx-auto max-w-2xl text-slate-400">
              Everything you need to build and scale your project.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-primary/30 hover:bg-slate-900/80">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Fast Setup</h3>
              <p className="text-slate-400">Get started in minutes with our streamlined onboarding process.</p>
            </div>
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-primary/30 hover:bg-slate-900/80">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Secure by Default</h3>
              <p className="text-slate-400">Built with security best practices from the ground up.</p>
            </div>
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-primary/30 hover:bg-slate-900/80">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Always Improving</h3>
              <p className="text-slate-400">Regular updates and new features based on user feedback.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mb-10 text-lg text-slate-400">
            Join thousands of users who trust taxbook-pro for their needs.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary px-12 py-6 text-lg text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/signup">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                <span className="text-lg font-bold text-primary-foreground">t</span>
              </div>
              <span className="text-lg font-bold text-white">taxbook-pro</span>
            </div>

            {/* Footer links - All reference sections on this page or auth routes */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <Link href="#features" className="hover:text-white">Features</Link>
              <Link href="/login" className="hover:text-white">Sign In</Link>
              <Link href="/signup" className="hover:text-white">Get Started</Link>
            </div>

            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} taxbook-pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
