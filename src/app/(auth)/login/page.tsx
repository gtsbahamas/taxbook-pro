/**
 * Login Page - taxbook-pro
 *
 * Refined split-layout login with brand panel and testimonial.
 * Features: Glass effects, animations, premium typography.
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, signInWithGoogle, signInWithGitHub, signInWithDiscord, type OAuthProvider } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GuestGuard } from '@/components/auth-guard';

// ============================================================
// ICONS
// ============================================================

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.1" />
      <path d="M12 14h16M12 20h12M12 26h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="28" cy="26" r="4" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.318.142-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.945-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 6.5 10zm11 0c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 17.5 10z"/>
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

// ============================================================
// OAUTH COMPONENTS
// ============================================================

interface OAuthButtonsProps {
  readonly loading: boolean;
  readonly onOAuthClick: (provider: OAuthProvider) => void;
  readonly loadingProvider: OAuthProvider | null;
}

function OAuthButtons({ loading, onOAuthClick, loadingProvider }: OAuthButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={() => onOAuthClick('google')}
        disabled={loading}
        aria-label="Sign in with Google"
        className="flex items-center justify-center h-12 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
      >
        {loadingProvider === 'google' ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        ) : (
          <GoogleIcon className="h-5 w-5" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onOAuthClick('github')}
        disabled={loading}
        aria-label="Sign in with GitHub"
        className="flex items-center justify-center h-12 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
      >
        {loadingProvider === 'github' ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        ) : (
          <GitHubIcon className="h-5 w-5" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onOAuthClick('discord')}
        disabled={loading}
        aria-label="Sign in with Discord"
        className="flex items-center justify-center h-12 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
      >
        {loadingProvider === 'discord' ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        ) : (
          <DiscordIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

// ============================================================
// LOGIN PAGE CONTENT
// ============================================================

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  const authError = searchParams.get('error');
  const errorMessage = authError === 'auth_failed'
    ? 'Authentication failed. Please try again.'
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn({ email, password });

    if (!result.ok) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    router.push(returnUrl);
  }

  async function handleOAuthClick(provider: OAuthProvider) {
    setError(null);
    setOauthLoading(provider);

    let result;
    switch (provider) {
      case 'google':
        result = await signInWithGoogle(returnUrl);
        break;
      case 'github':
        result = await signInWithGitHub(returnUrl);
        break;
      case 'discord':
        result = await signInWithDiscord(returnUrl);
        break;
      default:
        return;
    }

    if (!result.ok) {
      setError(result.error.message);
      setOauthLoading(null);
    }
  }

  const isLoading = loading || oauthLoading !== null;

  return (
    <GuestGuard>
      <main className="min-h-screen flex">
        {/* Brand Panel - Left Side */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-pattern opacity-10" />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary/30" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
            {/* Logo & Tagline */}
            <div className="animate-fade-up">
              <Link href="/" className="flex items-center gap-3 group">
                <LogoIcon className="h-10 w-10 text-primary-foreground" />
                <span className="font-display text-2xl font-semibold">TaxBook Pro</span>
              </Link>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-sm">
                The intelligent platform for modern tax professionals.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 animate-fade-up stagger-2">
              {[
                'Smart scheduling that adapts to your workflow',
                'Secure document management & client portal',
                'Real-time insights and deadline tracking',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-accent flex-shrink-0" />
                  <span className="text-primary-foreground/90">{feature}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="animate-fade-up stagger-3">
              <div className="glass rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10">
                <QuoteIcon className="h-8 w-8 text-accent/60 mb-4" />
                <blockquote className="text-lg text-primary-foreground/90 leading-relaxed">
                  &ldquo;TaxBook Pro transformed how I manage my practice. I&apos;ve saved 10+ hours every week during tax season.&rdquo;
                </blockquote>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-accent">SM</span>
                  </div>
                  <div>
                    <p className="font-medium text-primary-foreground">Sarah Mitchell</p>
                    <p className="text-sm text-primary-foreground/60">CPA, Mitchell & Associates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/4 -left-10 w-40 h-40 bg-secondary/20 rounded-full blur-2xl" />
        </div>

        {/* Form Panel - Right Side */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 animate-fade-up">
              <Link href="/" className="flex items-center gap-3">
                <LogoIcon className="h-10 w-10 text-primary" />
                <span className="font-display text-2xl font-semibold text-foreground">TaxBook Pro</span>
              </Link>
            </div>

            {/* Form Header */}
            <div className="mb-8 animate-fade-up">
              <h1 className="font-display text-3xl font-semibold text-foreground">
                Welcome back
              </h1>
              <p className="mt-2 text-muted-foreground">
                Sign in to your account to continue
              </p>
            </div>

            {/* Error Message */}
            {(error || errorMessage) && (
              <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-scale-up" role="alert">
                {error || errorMessage}
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="animate-fade-up stagger-2">
              <OAuthButtons
                loading={isLoading}
                onOAuthClick={handleOAuthClick}
                loadingProvider={oauthLoading}
              />
            </div>

            {/* Divider */}
            <div className="relative my-8 animate-fade-up stagger-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up stagger-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  className="h-12 px-4 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="h-12 px-4 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-[1.01]"
                disabled={isLoading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-muted-foreground animate-fade-up stagger-5">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Create an account
              </Link>
            </p>

            {/* Trust Indicators */}
            <div className="mt-8 pt-8 border-t border-border animate-fade-up stagger-6">
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  256-bit encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  SOC 2 compliant
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </GuestGuard>
  );
}

// ============================================================
// LOADING FALLBACK
// ============================================================

function LoginPageLoading() {
  return (
    <main className="min-h-screen flex">
      {/* Brand Panel Skeleton */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary" />

      {/* Form Panel Skeleton */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </main>
  );
}

// ============================================================
// EXPORTED PAGE
// ============================================================

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}
