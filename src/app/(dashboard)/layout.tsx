/**
 * Dashboard Route Layout - taxbook-pro
 * Generated: 2026-01-19
 *
 * Layout for the (dashboard) route group. Wraps all dashboard pages
 * with authentication protection via AuthGuard and the dashboard shell.
 *
 * AuthProvider is already available from root layout Providers.
 * This layout adds route-level protection via AuthGuard.
 *
 * Place this in: app/(dashboard)/layout.tsx
 */

import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/layouts/dashboard";

export const metadata: Metadata = {
  title: {
    template: "%s | taxbook-pro",
    default: "Dashboard | taxbook-pro",
  },
  description: "Manage your taxbook-pro account and data",
  robots: {
    index: false,
    follow: false,
  },
};

interface DashboardRouteLayoutProps {
  children: React.ReactNode;
}

export default function DashboardRouteLayout({
  children,
}: Readonly<DashboardRouteLayoutProps>) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
