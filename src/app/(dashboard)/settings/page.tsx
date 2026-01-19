/**
 * Settings Page - taxbook-pro
 * Generated: 2026-01-19
 *
 * User settings page with multiple sections including:
 * - Profile settings (name, email, avatar)
 * - Account settings (password change, email preferences)
 * - Notification settings (email/push toggles)
 * - Appearance settings (theme toggle)
 * - Danger zone (delete account)
 *
 * Place in: app/(dashboard)/settings/page.tsx
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/components/auth-guard';
import { AuthGuard } from '@/components/auth-guard';
import { createClient } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FormField, FormError, FormSuccess, SubmitButton } from '@/components/forms';
import { FileUpload, type UploadedFile } from '@/components/files';
import Image from 'next/image';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const ProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
});

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const NotificationSchema = z.object({
  emailNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  securityAlerts: z.boolean(),
  productUpdates: z.boolean(),
  pushNotifications: z.boolean(),
  pushNewMessages: z.boolean(),
  pushMentions: z.boolean(),
});

type ProfileFormData = z.infer<typeof ProfileSchema>;
type PasswordFormData = z.infer<typeof PasswordSchema>;
type NotificationFormData = z.infer<typeof NotificationSchema>;
type ThemeValue = 'light' | 'dark' | 'system';

// ============================================================
// SETTINGS PAGE COMPONENT
// ============================================================

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <AccountSettings />
            <DangerZone />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <AppearanceSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

// ============================================================
// PROFILE SETTINGS
// ============================================================

function ProfileSettings() {
  const { user } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
    },
  });

  // Load user profile data
  React.useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user?.id)
        .single();

      if (data) {
        form.setValue('name', data.name || '');
        setAvatarUrl(data.avatar_url);
      }
    }

    if (user?.id) {
      loadProfile();
    }
  }, [user?.id, form]);

  async function handleSubmit(data: ProfileFormData) {
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          name: data.name,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Update email if changed
      if (data.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        });

        if (emailError) {
          setError(emailError.message);
          return;
        }

        setSuccess('Profile updated. Please check your email to confirm the address change.');
        return;
      }

      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  }

  async function handleAvatarUpload(files: UploadedFile[]) {
    if (files.length === 0) return;

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: files[0].url })
      .eq('id', user?.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setAvatarUrl(files[0].url);
    setSuccess('Avatar updated successfully.');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your personal information and profile picture.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent className="space-y-6">
          <FormError message={error} />
          <FormSuccess message={success} />

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-6">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-muted-foreground">
                    {user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <FileUpload
                  bucket="avatars"
                  pathPrefix={user?.id}
                  allowedTypes={['image/*']}
                  maxSizeMB={2}
                  maxFiles={1}
                  onUploadComplete={handleAvatarUpload}
                  onError={(err) => setError(err.type === 'file_too_large' ? 'Image must be less than 2MB' : 'Failed to upload image')}
                  placeholder="Click or drag to upload a new avatar"
                  showProgress={false}
                  className="max-w-xs"
                />
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              {...form.register('name')}
              disabled={form.formState.isSubmitting}
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={form.formState.errors.name ? 'name-error' : undefined}
            />
            {form.formState.errors.name && (
              <p id="name-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...form.register('email')}
              disabled={form.formState.isSubmitting}
              aria-invalid={!!form.formState.errors.email}
              aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
            />
            {form.formState.errors.email && (
              <p id="email-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Changing your email requires verification.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton isSubmitting={form.formState.isSubmitting}>
            Save Changes
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}

// ============================================================
// ACCOUNT SETTINGS
// ============================================================

function AccountSettings() {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function handleSubmit(data: PasswordFormData) {
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      // Verify current password by attempting sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: data.currentPassword,
      });

      if (signInError) {
        setError('Current password is incorrect');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess('Password updated successfully.');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent className="space-y-4">
          <FormError message={error} />
          <FormSuccess message={success} />

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...form.register('currentPassword')}
              disabled={form.formState.isSubmitting}
              aria-invalid={!!form.formState.errors.currentPassword}
              aria-describedby={form.formState.errors.currentPassword ? 'currentPassword-error' : undefined}
            />
            {form.formState.errors.currentPassword && (
              <p id="currentPassword-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...form.register('newPassword')}
              disabled={form.formState.isSubmitting}
              aria-invalid={!!form.formState.errors.newPassword}
              aria-describedby={form.formState.errors.newPassword ? 'newPassword-error' : 'newPassword-help'}
            />
            {form.formState.errors.newPassword ? (
              <p id="newPassword-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.newPassword.message}
              </p>
            ) : (
              <p id="newPassword-help" className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
              disabled={form.formState.isSubmitting}
              aria-invalid={!!form.formState.errors.confirmPassword}
              aria-describedby={form.formState.errors.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            {form.formState.errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton isSubmitting={form.formState.isSubmitting}>
            Update Password
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}

// ============================================================
// NOTIFICATION SETTINGS
// ============================================================

function NotificationSettings() {
  const { user } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(NotificationSchema),
    defaultValues: {
      emailNotifications: true,
      marketingEmails: false,
      securityAlerts: true,
      productUpdates: true,
      pushNotifications: false,
      pushNewMessages: true,
      pushMentions: true,
    },
  });

  // Load notification preferences
  React.useEffect(() => {
    async function loadPreferences() {
      const supabase = createClient();
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        form.reset({
          emailNotifications: data.email_notifications ?? true,
          marketingEmails: data.marketing_emails ?? false,
          securityAlerts: data.security_alerts ?? true,
          productUpdates: data.product_updates ?? true,
          pushNotifications: data.push_notifications ?? false,
          pushNewMessages: data.push_new_messages ?? true,
          pushMentions: data.push_mentions ?? true,
        });
      }
    }

    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id, form]);

  async function handleSubmit(data: NotificationFormData) {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const supabase = createClient();

      const { error: upsertError } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          email_notifications: data.emailNotifications,
          marketing_emails: data.marketingEmails,
          security_alerts: data.securityAlerts,
          product_updates: data.productUpdates,
          push_notifications: data.pushNotifications,
          push_new_messages: data.pushNewMessages,
          push_mentions: data.pushMentions,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        setError(upsertError.message);
        return;
      }

      setSuccess('Notification preferences saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  const NotificationToggle = ({
    name,
    label,
    description,
  }: {
    name: keyof NotificationFormData;
    label: string;
    description: string;
  }) => {
    const value = form.watch(name);
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={name} className="text-base">
            {label}
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch
          id={name}
          checked={value}
          onCheckedChange={(checked) => form.setValue(name, checked)}
          aria-describedby={`${name}-description`}
        />
      </div>
    );
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose what emails you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormError message={error} />
          <FormSuccess message={success} />

          <NotificationToggle
            name="emailNotifications"
            label="Email Notifications"
            description="Receive email notifications for important updates"
          />
          <NotificationToggle
            name="marketingEmails"
            label="Marketing Emails"
            description="Receive emails about new features and promotions"
          />
          <NotificationToggle
            name="securityAlerts"
            label="Security Alerts"
            description="Get notified about security-related events"
          />
          <NotificationToggle
            name="productUpdates"
            label="Product Updates"
            description="Receive updates about product changes and improvements"
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Manage push notification preferences for your devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <NotificationToggle
            name="pushNotifications"
            label="Push Notifications"
            description="Enable push notifications on this device"
          />
          <NotificationToggle
            name="pushNewMessages"
            label="New Messages"
            description="Get notified when you receive new messages"
          />
          <NotificationToggle
            name="pushMentions"
            label="Mentions"
            description="Get notified when someone mentions you"
          />
        </CardContent>
        <CardFooter>
          <SubmitButton isSubmitting={saving}>
            Save Preferences
          </SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}

// ============================================================
// APPEARANCE SETTINGS
// ============================================================

function AppearanceSettings() {
  const [theme, setTheme] = React.useState<ThemeValue>('system');
  const [success, setSuccess] = React.useState<string | null>(null);

  // Load theme preference from localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeValue | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme to document
  React.useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  function handleThemeChange(newTheme: ThemeValue) {
    setTheme(newTheme);
    setSuccess('Theme preference saved.');
    setTimeout(() => setSuccess(null), 3000);
  }

  const ThemeOption = ({
    value,
    label,
    icon,
  }: {
    value: ThemeValue;
    label: string;
    icon: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => handleThemeChange(value)}
      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
        theme === value
          ? 'border-primary bg-primary/5'
          : 'border-muted hover:border-primary/50'
      }`}
      aria-pressed={theme === value}
      aria-label={`Select ${label} theme`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how the application looks on your device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormSuccess message={success} />

        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-4">
            <ThemeOption
              value="light"
              label="Light"
              icon={
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              }
            />
            <ThemeOption
              value="dark"
              label="Dark"
              icon={
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              }
            />
            <ThemeOption
              value="system"
              label="System"
              icon={
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Select a theme preference. System will automatically switch based on your device settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// DANGER ZONE
// ============================================================

function DangerZone() {
  const { signOut } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('No user found');
        return;
      }

      // Delete user data (cascading deletes should handle related data)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Sign out (account deletion via Supabase requires admin or Edge Function)
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible and destructive actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormError message={error} />

        <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
          <div className="space-y-1">
            <p className="font-medium">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    This action cannot be undone. This will permanently delete your
                    account and remove all of your data from our servers.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-delete">
                      Type <strong>DELETE</strong> to confirm
                    </Label>
                    <Input
                      id="confirm-delete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      disabled={isDeleting}
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || confirmText !== 'DELETE'}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
