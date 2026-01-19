/**
 * Dashboard Home Page - taxbook-pro
 *
 * Main dashboard with stats overview, quick actions, and entity navigation.
 * Features refined financial aesthetic with animations.
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ============================================================
// ICONS
// ============================================================

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TrendingDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

function DollarSignIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IdCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="14" x="3" y="5" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <path d="M15 9h2" />
      <path d="M15 13h2" />
      <path d="M7 17h10" />
    </svg>
  );
}

// ============================================================
// STATS DATA
// ============================================================

const stats = [
  {
    title: 'Active Clients',
    value: '47',
    change: '+12%',
    trend: 'up' as const,
    icon: UsersIcon,
  },
  {
    title: 'This Month Revenue',
    value: '$12,340',
    change: '+8.2%',
    trend: 'up' as const,
    icon: DollarSignIcon,
  },
  {
    title: 'Appointments Today',
    value: '8',
    change: '+2',
    trend: 'up' as const,
    icon: CalendarIcon,
  },
  {
    title: 'Documents Pending',
    value: '23',
    change: '-15%',
    trend: 'down' as const,
    icon: FileTextIcon,
  },
];

// ============================================================
// ENTITY CARDS DATA
// ============================================================

const entityCards = [
  {
    name: 'Profiles',
    description: 'Manage tax professional profiles',
    href: '/profiles',
    icon: IdCardIcon,
    count: 3,
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    name: 'Clients',
    description: 'View and manage your clients',
    href: '/clients',
    icon: UsersIcon,
    count: 47,
    color: 'bg-green-500/10 text-green-600',
  },
  {
    name: 'Services',
    description: 'Configure service offerings',
    href: '/services',
    icon: BriefcaseIcon,
    count: 8,
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    name: 'Appointments',
    description: 'Schedule and manage meetings',
    href: '/appointments',
    icon: CalendarIcon,
    count: 156,
    color: 'bg-orange-500/10 text-orange-600',
  },
  {
    name: 'Availability',
    description: 'Set your working hours',
    href: '/availabilities',
    icon: ClockIcon,
    count: 5,
    color: 'bg-cyan-500/10 text-cyan-600',
  },
  {
    name: 'Documents',
    description: 'Client tax documents',
    href: '/documents',
    icon: FileTextIcon,
    count: 234,
    color: 'bg-rose-500/10 text-rose-600',
  },
];

// ============================================================
// UPCOMING APPOINTMENTS
// ============================================================

const upcomingAppointments = [
  { client: 'John Smith', service: '1040 Review', time: '9:00 AM', status: 'confirmed' },
  { client: 'Sarah Johnson', service: 'Business Consultation', time: '10:30 AM', status: 'confirmed' },
  { client: 'Mike Brown', service: 'Quarterly Filing', time: '2:00 PM', status: 'pending' },
  { client: 'Emily Davis', service: 'Tax Planning', time: '4:00 PM', status: 'confirmed' },
];

// ============================================================
// DASHBOARD PAGE
// ============================================================

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Good morning
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your practice today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-up stagger-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.trend === 'up' ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${stat.trend === 'up' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                    {stat.trend === 'up' ? (
                      <TrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <TrendingDownIcon className="h-4 w-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions & Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card className="animate-fade-up stagger-3">
            <CardHeader>
              <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Button asChild className="h-auto py-4 flex-col gap-2">
                <Link href="/appointments/new">
                  <PlusIcon className="h-5 w-5" />
                  <span>New Appointment</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href="/clients/new">
                  <UsersIcon className="h-5 w-5" />
                  <span>Add Client</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href="/documents/new">
                  <FileTextIcon className="h-5 w-5" />
                  <span>Upload Document</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card className="animate-fade-up stagger-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg">Today&apos;s Appointments</CardTitle>
                <CardDescription>Your schedule for today</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/appointments" className="flex items-center gap-1">
                  View all <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((apt, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center">
                        <p className="text-sm font-medium text-foreground">{apt.time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{apt.client}</p>
                        <p className="text-sm text-muted-foreground">{apt.service}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      apt.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Tax Season Progress & Settings */}
        <div className="space-y-6">
          {/* Tax Season Progress */}
          <Card className="bg-primary text-primary-foreground animate-fade-up stagger-3">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-white/10">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display font-semibold">Tax Season 2026</p>
                  <p className="text-sm text-primary-foreground/70">April 15 deadline</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>76% complete</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-[76%] bg-accent rounded-full" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">87</p>
                  <p className="text-xs text-primary-foreground/70">Days Left</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">36</p>
                  <p className="text-xs text-primary-foreground/70">Returns Filed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Link */}
          <Card className="animate-fade-up stagger-4">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings" className="flex items-center justify-center gap-2">
                  Go to Settings
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Entity Navigation Cards */}
      <div className="animate-fade-up stagger-5">
        <h2 className="font-display text-xl font-semibold mb-4">Your Data</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entityCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl ${card.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-2xl font-bold text-muted-foreground/50">
                        {card.count}
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {card.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {card.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      View all
                      <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
