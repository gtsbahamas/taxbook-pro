/**
 * Profile Settings Page - /settings/profile
 * Generated: 2026-01-19
 *
 * Redirects to main settings page with profile tab active.
 * This route exists for backwards compatibility and deep linking.
 *
 * Place in: app/(dashboard)/settings/profile/page.tsx
 */

import { redirect } from 'next/navigation';

export default function ProfileSettingsPage() {
  // Redirect to main settings page - profile is the default tab
  redirect('/settings');
}
