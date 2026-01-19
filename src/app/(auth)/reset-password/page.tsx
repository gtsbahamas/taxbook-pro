/**
 * Reset Password Page - taxbook-pro
 * Generated: 2026-01-19
 *
 * Password reset page for users who clicked the reset link in their email.
 * Place this in: app/(auth)/reset-password/page.tsx
 */

'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { updatePassword } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';

// ============================================================
// PASSWORD STRENGTH VALIDATION
// ============================================================

interface PasswordStrength {
  readonly score: 0 | 1 | 2 | 3 | 4;
  readonly label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  readonly requirements: readonly PasswordRequirement[];
}

interface PasswordRequirement {
  readonly label: string;
  readonly met: boolean;
}

function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains number', met: /\d/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.met).length;

  const scoreMap: Record<number, { score: PasswordStrength['score']; label: PasswordStrength['label'] }> = {
    0: { score: 0, label: 'Very Weak' },
    1: { score: 1, label: 'Weak' },
    2: { score: 2, label: 'Fair' },
    3: { score: 3, label: 'Strong' },
    4: { score: 4, label: 'Very Strong' },
    5: { score: 4, label: 'Very Strong' },
  };

  const { score, label } = scoreMap[metCount] ?? { score: 0, label: 'Very Weak' };

  return { score, label, requirements };
}

// ============================================================
// PASSWORD STRENGTH INDICATOR COMPONENT
// ============================================================

interface PasswordStrengthIndicatorProps {
  readonly strength: PasswordStrength;
  readonly showRequirements: boolean;
}

function PasswordStrengthIndicator({ strength, showRequirements }: PasswordStrengthIndicatorProps) {
  const colorMap: Record<PasswordStrength['score'], string> = {
    0: 'bg-destructive',
    1: 'bg-orange-500',
    2: 'bg-yellow-500',
    3: 'bg-lime-500',
    4: 'bg-green-500',
  };

  const barColor = colorMap[strength.score];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={strength.score}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label={`Password strength: ${strength.label}`}
        >
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${(strength.score / 4) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground min-w-[80px] text-right">
          {strength.label}
        </span>
      </div>

      {showRequirements && (
        <ul className="space-y-1" aria-label="Password requirements">
          {strength.requirements.map((req) => (
            <li
              key={req.label}
              className={`text-xs flex items-center gap-1.5 ${
                req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              }`}
            >
              <span aria-hidden="true">{req.met ? '\u2713' : '\u2022'}</span>
              <span>{req.label}</span>
              <span className="sr-only">{req.met ? '(met)' : '(not met)'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// RESET PASSWORD CONTENT
// ============================================================

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

  const isValidPassword = passwordStrength.score >= 2 && password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = isValidPassword && passwordsMatch && confirmPassword.length > 0;

  // Check for error params from auth callback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      setError(errorDescription || 'Password reset link is invalid or has expired. Please request a new one.');
    }
  }, [searchParams]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!isValidPassword) {
        setError('Please choose a stronger password');
        return;
      }

      if (!passwordsMatch) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);

      const result = await updatePassword(password);

      if (!result.ok) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to login after showing success message
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    },
    [password, isValidPassword, passwordsMatch, router]
  );

  // Success state
  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <h1 className="text-2xl font-bold">Password updated</h1>
            <CardDescription>
              Your password has been successfully reset. You will be redirected to the login page shortly.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Go to sign in
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <CardDescription>
            Enter a new password for your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {error && (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowRequirements(true)}
                onBlur={() => setShowRequirements(password.length === 0 ? false : showRequirements)}
                required
                autoComplete="new-password"
                disabled={loading}
                aria-describedby="password-strength password-requirements"
                aria-invalid={password.length > 0 && !isValidPassword}
                minLength={8}
              />
              {password.length > 0 && (
                <div id="password-strength">
                  <PasswordStrengthIndicator
                    strength={passwordStrength}
                    showRequirements={showRequirements}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                aria-describedby="password-match-status"
                aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
              />
              {confirmPassword.length > 0 && (
                <p
                  id="password-match-status"
                  className={`text-xs ${
                    passwordsMatch
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-destructive'
                  }`}
                  aria-live="polite"
                >
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !canSubmit}
              aria-describedby={!canSubmit ? 'submit-requirements' : undefined}
            >
              {loading ? 'Updating password...' : 'Update password'}
            </Button>
            {!canSubmit && password.length > 0 && (
              <p id="submit-requirements" className="sr-only">
                {!isValidPassword && 'Password is not strong enough. '}
                {!passwordsMatch && confirmPassword.length > 0 && 'Passwords do not match.'}
              </p>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

// ============================================================
// LOADING FALLBACK
// ============================================================

function ResetPasswordLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    </main>
  );
}

// ============================================================
// RESET PASSWORD PAGE
// ============================================================

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
