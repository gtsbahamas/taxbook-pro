/**
 * Dashboard Layout - taxbook-pro
 *
 * Refined dashboard layout with collapsible sidebar navigation.
 * Features unique entity icons, premium styling, and smooth animations.
 */

'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-guard';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  requiredPermission?: string;
  children?: NavItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  showNotifications?: boolean;
  headerContent?: React.ReactNode;
  contentClassName?: string;
}

// ============================================================
// UNIQUE ENTITY ICONS
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

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function UserAvatarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

// Profile - User with card/badge
function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="14" x="3" y="7" rx="2" />
      <circle cx="12" cy="13" r="2" />
      <path d="M12 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7V5a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

// Clients - Multiple users
function ClientIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// Services - Briefcase with dollar sign
function ServiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <path d="M12 11v4" />
      <path d="M10 13h4" />
    </svg>
  );
}

// Appointments - Calendar with clock
function AppointmentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <circle cx="12" cy="15" r="2" />
      <path d="M12 13v2" />
    </svg>
  );
}

// Availabilities - Clock with checkmark
function AvailabilityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
      <path d="m9 17 2 2 4-4" />
    </svg>
  );
}

// Documents - File with lines
function DocumentIcon({ className }: { className?: string }) {
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

// ============================================================
// DEFAULT NAVIGATION ITEMS
// ============================================================

const defaultNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Profiles', href: '/profiles', icon: ProfileIcon },
  { label: 'Clients', href: '/clients', icon: ClientIcon },
  { label: 'Services', href: '/services', icon: ServiceIcon },
  { label: 'Appointments', href: '/appointments', icon: AppointmentIcon },
  { label: 'Availability', href: '/availabilities', icon: AvailabilityIcon },
  { label: 'Documents', href: '/documents', icon: DocumentIcon },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
];

// ============================================================
// SIDEBAR COMPONENT
// ============================================================

interface SidebarProps {
  navItems: NavItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pathname: string;
}

function Sidebar({ navItems, isCollapsed, onToggleCollapse, pathname }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-3 transition-opacity duration-200',
            isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          )}
        >
          <LogoIcon className="h-8 w-8 text-primary flex-shrink-0" />
          <span className="font-display text-lg font-semibold text-foreground whitespace-nowrap">
            TaxBook Pro
          </span>
        </Link>
        {isCollapsed && (
          <LogoIcon className="h-8 w-8 text-primary mx-auto" />
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!isCollapsed}
        className={cn(
          'absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full',
          'border border-border bg-card text-muted-foreground shadow-sm',
          'hover:bg-muted hover:text-foreground transition-colors duration-200'
        )}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-3 w-3" />
        ) : (
          <ChevronLeftIcon className="h-3 w-3" />
        )}
      </button>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-1 p-3 mt-2" aria-label="Sidebar navigation">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'hover:bg-primary/10 hover:text-primary',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground',
                isCollapsed && 'justify-center px-2'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {Icon && (
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                  'group-hover:scale-110'
                )} />
              )}
              <span className={cn(
                'transition-all duration-200',
                isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 border-t border-border p-4',
        isCollapsed && 'px-2'
      )}>
        <div className={cn(
          'rounded-lg bg-primary/5 p-3 transition-all duration-200',
          isCollapsed && 'p-2'
        )}>
          {!isCollapsed ? (
            <div className="text-xs">
              <p className="font-medium text-foreground">Tax Season 2026</p>
              <p className="text-muted-foreground mt-1">87 days remaining</p>
            </div>
          ) : (
            <div className="text-center text-xs font-bold text-primary">87</div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ============================================================
// HEADER COMPONENT
// ============================================================

interface HeaderProps {
  sidebarCollapsed: boolean;
  showNotifications: boolean;
  headerContent?: React.ReactNode;
  onOpenMobileNav: () => void;
}

function Header({
  sidebarCollapsed,
  showNotifications,
  headerContent,
  onOpenMobileNav,
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileClick = () => {
    router.push('/settings/profile');
  };

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 transition-all duration-300',
        sidebarCollapsed ? 'left-[72px]' : 'left-64',
        'max-lg:left-0'
      )}
      role="banner"
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
      >
        <MenuIcon className="h-5 w-5" />
      </Button>

      {/* Custom header content or spacer */}
      <div className="flex-1">
        {headerContent}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        {showNotifications && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="View notifications"
            className="relative hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </Button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 transition-colors"
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserAvatarIcon className="h-4 w-4 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
              <UserAvatarIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer focus:text-destructive">
              <LogOutIcon className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ============================================================
// MOBILE NAVIGATION COMPONENT
// ============================================================

interface MobileNavProps {
  navItems: NavItem[];
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}

function MobileNav({ navItems, isOpen, onClose, pathname }: MobileNavProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0 border-r border-border">
        {/* Logo / Brand */}
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={onClose}
          >
            <LogoIcon className="h-8 w-8 text-primary" />
            <span className="font-display text-lg font-semibold text-foreground">
              TaxBook Pro
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 p-3" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'hover:bg-primary/10 hover:text-primary',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <div className="rounded-lg bg-primary/5 p-3">
            <p className="text-xs font-medium text-foreground">Tax Season 2026</p>
            <p className="text-xs text-muted-foreground mt-1">87 days remaining</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// MOBILE BOTTOM NAVIGATION COMPONENT
// ============================================================

interface MobileBottomNavProps {
  navItems: NavItem[];
  pathname: string;
}

export function MobileBottomNav({ navItems, pathname }: MobileBottomNavProps) {
  const displayItems = navItems.slice(0, 5);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm lg:hidden"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {displayItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
                'hover:text-primary',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon && <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />}
              <span className="truncate font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// MAIN CONTENT COMPONENT
// ============================================================

interface MainContentProps {
  children: React.ReactNode;
  sidebarCollapsed: boolean;
  className?: string;
}

function MainContent({ children, sidebarCollapsed, className }: MainContentProps) {
  return (
    <main
      className={cn(
        'min-h-screen pt-16 transition-all duration-300 bg-background',
        sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64',
        'pb-20 lg:pb-0',
        className
      )}
      role="main"
      id="main-content"
    >
      <div className="p-4 md:p-6 lg:p-8">
        {children}
      </div>
    </main>
  );
}

// ============================================================
// SKIP LINK COMPONENT
// ============================================================

function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        'fixed left-4 top-4 z-[100] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
        'opacity-0 focus:opacity-100',
        'transition-opacity duration-200',
        '-translate-y-full focus:translate-y-0'
      )}
    >
      Skip to main content
    </a>
  );
}

// ============================================================
// DASHBOARD LAYOUT COMPONENT
// ============================================================

export function DashboardLayout({
  children,
  navItems = defaultNavItems,
  showNotifications = true,
  headerContent,
  contentClassName,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setSidebarCollapsed(stored === 'true');
    }
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebar-collapsed', String(newState));
      return newState;
    });
  }, []);

  const handleOpenMobileNav = useCallback(() => {
    setMobileNavOpen(true);
  }, []);

  const handleCloseMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <SkipLink />

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            navItems={navItems}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            pathname={pathname}
          />
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileNav
          navItems={navItems}
          isOpen={mobileNavOpen}
          onClose={handleCloseMobileNav}
          pathname={pathname}
        />

        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          showNotifications={showNotifications}
          headerContent={headerContent}
          onOpenMobileNav={handleOpenMobileNav}
        />

        {/* Main Content */}
        <MainContent
          sidebarCollapsed={sidebarCollapsed}
          className={contentClassName}
        >
          {children}
        </MainContent>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav navItems={navItems} pathname={pathname} />
      </div>
    </AuthGuard>
  );
}

// ============================================================
// EXPORTS
// ============================================================

export {
  Sidebar,
  Header,
  MobileNav,
  MainContent,
  SkipLink,
};

export type { NavItem, DashboardLayoutProps };
