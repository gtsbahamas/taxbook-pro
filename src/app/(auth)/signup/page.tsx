/**
 * Signup Page - taxbook-pro
 *
 * Refined split-layout signup matching login page design.
 * Features: Password strength indicator, email confirmation flow, animations.
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
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

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

// ============================================================
// PASSWORD STRENGTH
// ============================================================

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score, label: 'Weak', color: 'text-destructive', bgColor: 'bg-destructive' };
  }
  if (score <= 2) {
    return { score, label: 'Fair', color: 'text-orange-500', bgColor: 'bg-orange-500' };
  }
  if (score <= 3) {
    return { score, label: 'Good', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
  }
  return { score, label: 'Strong', color: 'text-green-500', bgColor: 'bg-green-500' };
}

// ============================================================
// SUCCESS STATE
// ============================================================

function EmailConfirmationSuccess({ email, onRetry }: { email: string; onRetry: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md text-center animate-scale-up">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <MailIcon className="h-10 w-10 text-primary" />
        </div>

        {/* Header */}
        <h1 className="font-display text-3xl font-semibold text-foreground mb-3">
          Check your email
        </h1>
        <p className="text-muted-foreground mb-8">
          We&apos;ve sent a confirmation link to{' '}
          <span className="font-medium text-foreground">{email}</span>.
          Please check your inbox and click the link to activate your account.
        </p>

        {/* Tips */}
        <div className="bg-muted/50 rounded-xl p-6 mb-8 text-left">
          <p className="text-sm font-medium text-foreground mb-3">Didn&apos;t receive the email?</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Check your spam or junk folder
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Make sure you entered the correct email
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <button
                type="button"
                onClick={onRetry}
                className="text-primary hover:underline"
              >
                Try signing up again
              </button>
            </li>
          </ul>
        </div>

        {/* Back to Login */}
        <Link href="/login">
          <Button variant="outline" className="w-full h-12 rounded-lg">
            Back to sign in
          </Button>
        </Link>
      </div>
    </main>
  );
}

// ============================================================
// SIGNUP PAGE
// ============================================================

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const isPasswordValid = password.length >= 8;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const result = await signUp({ email, password, name: name || undefined });

    if (!result.ok) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    if (!result.value.emailConfirmed) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }, [email, password, name, isPasswordValid, passwordsMatch, router]);

  if (success) {
    return (
      <EmailConfirmationSuccess
        email={email}
        onRetry={() => {
          setSuccess(false);
          setError(null);
        }}
      />
    );
  }

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
                Join thousands of tax professionals who trust TaxBook Pro.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-6 animate-fade-up stagger-2">
              <h3 className="font-display text-xl font-semibold text-primary-foreground">
                Start your free trial today
              </h3>
              {[
                { title: 'No credit card required', desc: 'Start immediately, upgrade when ready' },
                { title: '14-day free trial', desc: 'Full access to all features' },
                { title: 'Cancel anytime', desc: 'No long-term commitments' },
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-primary-foreground">{benefit.title}</p>
                    <p className="text-sm text-primary-foreground/70">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="animate-fade-up stagger-3">
              <div className="glass rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <SparklesIcon className="h-6 w-6 text-accent" />
                  <span className="font-medium text-primary-foreground">Trusted by professionals</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-accent">10k+</p>
                    <p className="text-xs text-primary-foreground/60">Active users</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">500k+</p>
                    <p className="text-xs text-primary-foreground/60">Returns filed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">99.9%</p>
                    <p className="text-xs text-primary-foreground/60">Uptime</p>
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
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background overflow-y-auto">
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
                Create your account
              </h1>
              <p className="mt-2 text-muted-foreground">
                Start your free 14-day trial. No credit card required.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-scale-up" role="alert">
                {error}
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Name Field */}
              <div className="space-y-2 animate-fade-up stagger-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  disabled={loading}
                  className="h-12 px-4 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2 animate-fade-up stagger-3">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="h-12 px-4 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2 animate-fade-up stagger-4">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  minLength={8}
                  className="h-12 px-4 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
                {password.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.score
                              ? passwordStrength.bgColor
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2 animate-fade-up stagger-5">
                <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                  Confirm password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-12 px-4 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {confirmPassword.length > 0 && (
                  <p className={`text-xs font-medium ${passwordsMatch ? 'text-green-500' : 'text-destructive'}`}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-[1.01] animate-fade-up stagger-6"
                disabled={loading || !email || !isPasswordValid || !passwordsMatch}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating account...
                  </span>
                ) : (
                  'Create account'
                )}
              </Button>

              {/* Terms */}
              <p className="text-xs text-center text-muted-foreground animate-fade-up stagger-6">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </form>

            {/* Sign In Link */}
            <p className="mt-8 text-center text-sm text-muted-foreground animate-fade-up">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </GuestGuard>
  );
}
