/**
 * Auth Guard Component - taxbook-pro
 * Generated: 2026-01-19
 *
 * Protects routes that require authentication.
 * Redirects to /login if user is not authenticated.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient, type AuthUser } from '@/lib/auth';

// ============================================================
// AUTH CONTEXT
// ============================================================

import { createContext, useContext } from 'react';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================
// AUTH PROVIDER
// ============================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Check initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          id: user.id,
          email: user.email!,
          emailConfirmed: !!user.email_confirmed_at,
          createdAt: new Date(user.created_at),
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            emailConfirmed: !!session.user.email_confirmed_at,
            createdAt: new Date(session.user.created_at),
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// AUTH GUARD
// ============================================================

interface AuthGuardProps {
  children: React.ReactNode;
  /** URL to redirect to if not authenticated. Default: /login */
  redirectTo?: string;
  /** Show loading state while checking auth. Default: true */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
}

/**
 * Protects content that requires authentication.
 *
 * @example
 * <AuthGuard>
 *   <DashboardContent />
 * </AuthGuard>
 *
 * @example
 * <AuthGuard redirectTo="/signin" loadingComponent={<CustomSpinner />}>
 *   <ProtectedContent />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  redirectTo = '/login',
  showLoading = true,
  loadingComponent,
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Store intended destination for redirect after login
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
    }
  }, [loading, user, router, pathname, redirectTo]);

  if (loading) {
    if (!showLoading) {
      return null;
    }

    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

// ============================================================
// GUEST GUARD (Redirect if already logged in)
// ============================================================

interface GuestGuardProps {
  children: React.ReactNode;
  /** URL to redirect to if authenticated. Default: /dashboard */
  redirectTo?: string;
}

/**
 * Protects content that should only be shown to guests (non-authenticated users).
 * Use this for login/signup pages to redirect authenticated users.
 *
 * @example
 * <GuestGuard>
 *   <LoginForm />
 * </GuestGuard>
 */
export function GuestGuard({ children, redirectTo = '/dashboard' }: GuestGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
