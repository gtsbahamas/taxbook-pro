/**
 * Dashboard Layout - taxbook-pro
 * Generated: 2026-01-19
 *
 * Responsive dashboard layout with collapsible sidebar navigation.
 * Includes header with user menu, mobile navigation, and main content area.
 *
 * Place in: components/layout/
 *
 * @example
 * // In app/(dashboard)/layout.tsx:
 * import { DashboardLayout } from '@/components/layout/dashboard-layout';
 *
 * export default function Layout({ children }: { children: React.ReactNode }) {
 *   return <DashboardLayout>{children}</DashboardLayout>;
 * }
 *
 * @example
 * // With custom navigation items:
 * <DashboardLayout
 *   navItems={[
 *     { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
 *     { label: 'Settings', href: '/settings', icon: SettingsIcon },
 *   ]}
 * >
 *   {children}
 * </DashboardLayout>
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

interface NavItem {
  /** Display label for the navigation item */
  label: string;
  /** URL path for the navigation link */
  href: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Whether this item requires specific permissions */
  requiredPermission?: string;
  /** Child navigation items for nested menus */
  children?: NavItem[];
}

interface DashboardLayoutProps {
  /** Page content */
  children: React.ReactNode;
  /** Custom navigation items (overrides default entity navigation) */
  navItems?: NavItem[];
  /** Whether to show the notifications button */
  showNotifications?: boolean;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Additional CSS classes for the main content area */
  contentClassName?: string;
}

// ============================================================
// DEFAULT NAVIGATION ITEMS (Generated from entities)
// ============================================================

/**
 * Default navigation items based on project entities.
 * Override by passing navItems prop to DashboardLayout.
 */
const defaultNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    label: 'Profiles',
    href: '/profiles',
    icon: ProfileIcon,
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: ClientIcon,
  },
  {
    label: 'Services',
    href: '/services',
    icon: ServiceIcon,
  },
  {
    label: 'Appointments',
    href: '/appointments',
    icon: AppointmentIcon,
  },
  {
    label: 'Availabilities',
    href: '/availabilities',
    icon: AvailabilityIcon,
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: DocumentIcon,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

// ============================================================
// ICON COMPONENTS
// ============================================================

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function UserAvatarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h10" />
    </svg>
  );
}

function ClientIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h10" />
    </svg>
  );
}

function ServiceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h10" />
    </svg>
  );
}

function AppointmentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h10" />
    </svg>
  );
}

function AvailabilityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h10" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h10" />
    </svg>
  );
}


// ============================================================
// SIDEBAR COMPONENT
// ============================================================

interface SidebarProps {
  /** Navigation items to display */
  navItems: NavItem[];
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback to toggle collapsed state */
  onToggleCollapse: () => void;
  /** Current pathname for active state */
  pathname: string;
}

/**
 * Collapsible sidebar with navigation items.
 * Shows icons only when collapsed, full labels when expanded.
 */
function Sidebar({ navItems, isCollapsed, onToggleCollapse, pathname }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <span className="text-xl">taxbook-pro</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          className={cn(isCollapsed && 'mx-auto')}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-1 p-2" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
                isCollapsed && 'justify-center px-2'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
            >
              {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// ============================================================
// HEADER COMPONENT
// ============================================================

interface HeaderProps {
  /** Whether the sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Whether to show notifications button */
  showNotifications: boolean;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Callback to open mobile navigation */
  onOpenMobileNav: () => void;
}

/**
 * Top header bar with user menu and optional notifications.
 */
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
        'fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64',
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
            className="relative"
          >
            <BellIcon className="h-5 w-5" />
            {/* Notification badge - customize as needed */}
            {/* <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" /> */}
          </Button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="User menu"
            >
              <UserAvatarIcon className="h-5 w-5" />
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
            <DropdownMenuItem onClick={handleProfileClick}>
              <UserAvatarIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
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
  /** Navigation items to display */
  navItems: NavItem[];
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback to close the sheet */
  onClose: () => void;
  /** Current pathname for active state */
  pathname: string;
}

/**
 * Mobile navigation drawer that slides in from the left.
 * Used on small screens instead of the sidebar.
 */
function MobileNav({ navItems, isOpen, onClose, pathname }: MobileNavProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0">
        {/* Logo / Brand */}
        <div className="flex h-16 items-center border-b px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
            onClick={onClose}
          >
            <span className="text-xl">taxbook-pro</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 p-2" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-accent text-accent-foreground'
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
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// MOBILE BOTTOM NAVIGATION COMPONENT
// ============================================================

interface MobileBottomNavProps {
  /** Navigation items to display (max 5 recommended) */
  navItems: NavItem[];
  /** Current pathname for active state */
  pathname: string;
}

/**
 * Fixed bottom navigation bar for mobile devices.
 * Shows only on small screens (< lg breakpoint).
 *
 * @example
 * <MobileBottomNav navItems={navItems.slice(0, 5)} pathname={pathname} />
 */
export function MobileBottomNav({ navItems, pathname }: MobileBottomNavProps) {
  // Limit to 5 items for bottom nav
  const displayItems = navItems.slice(0, 5);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden"
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
              {Icon && <Icon className="h-5 w-5" />}
              <span className="truncate">{item.label}</span>
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
  /** Page content */
  children: React.ReactNode;
  /** Whether the sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Main content area with proper padding and responsive margins.
 */
function MainContent({ children, sidebarCollapsed, className }: MainContentProps) {
  return (
    <main
      className={cn(
        'min-h-screen pt-16 transition-all duration-300',
        // Desktop: margin for sidebar
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64',
        // Mobile: no margin, but add bottom padding for bottom nav
        'pb-20 lg:pb-0',
        className
      )}
      role="main"
      id="main-content"
    >
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </div>
    </main>
  );
}

// ============================================================
// SKIP LINK COMPONENT
// ============================================================

/**
 * Accessibility skip link to bypass navigation.
 */
function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        'fixed left-4 top-4 z-[100] rounded-md bg-primary px-4 py-2 text-primary-foreground',
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

/**
 * Main dashboard layout wrapper with sidebar, header, and responsive navigation.
 * Wraps content in AuthGuard to require authentication.
 *
 * @example
 * // Basic usage in app/(dashboard)/layout.tsx:
 * import { DashboardLayout } from '@/components/layout/dashboard-layout';
 *
 * export default function Layout({ children }: { children: React.ReactNode }) {
 *   return <DashboardLayout>{children}</DashboardLayout>;
 * }
 *
 * @example
 * // With custom navigation:
 * <DashboardLayout
 *   navItems={[
 *     { label: 'Home', href: '/dashboard', icon: HomeIcon },
 *     { label: 'Analytics', href: '/analytics', icon: ChartIcon },
 *   ]}
 *   showNotifications
 * >
 *   {children}
 * </DashboardLayout>
 */
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

  // Persist sidebar state in localStorage
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

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <SkipLink />

        {/* Desktop Sidebar - hidden on mobile */}
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
// EXPORTED COMPONENTS
// ============================================================

export {
  Sidebar,
  Header,
  MobileNav,
  MainContent,
  SkipLink,
};

export type { NavItem, DashboardLayoutProps };

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
