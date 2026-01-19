/**
 * Dashboard Home Page - taxbook-pro
 * Generated: 2026-01-19
 *
 * Landing page after login. Shows overview and quick navigation to entities.
 * This page exists at /dashboard to handle the post-login redirect.
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Settings,
  Database,
  ArrowRight,
  Plus,
} from 'lucide-react';

// Entity quick access cards
const entityCards = [
  {
    name: 'Profiles',
    description: 'Tax professional profile extending auth.users',
    href: '/profiles',
  },
  {
    name: 'Clients',
    description: 'Tax clients belonging to a practitioner',
    href: '/clients',
  },
  {
    name: 'Services',
    description: 'Service offerings by a tax professional',
    href: '/services',
  },
  {
    name: 'Appointments',
    description: 'Scheduled appointments between practitioners and clients',
    href: '/appointments',
  },
  {
    name: 'Availabilities',
    description: 'Practitioner working hours',
    href: '/availabilities',
  },
  {
    name: 'Documents',
    description: 'Client tax documents',
    href: '/documents',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to taxbook-pro</h1>
        <p className="text-muted-foreground mt-2">
          Manage your data and access all features from here.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" />
              Quick Create
            </CardTitle>
            <CardDescription>
              Create a new Profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/profiles/new">
                New Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Entity Navigation Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Data</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entityCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                    <Database className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{card.name}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-primary">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Settings Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Manage your profile, preferences, and account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/settings">
              Go to Settings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
