/**
 * Loading & Skeleton Components - taxbook-pro
 * Generated: 2026-01-19
 *
 * Reusable skeleton components for loading states.
 * Uses Tailwind CSS animate-pulse for skeleton effect.
 *
 * Place in: components/loading/
 *
 * @example
 * // In a Suspense boundary or loading.tsx
 * <SkeletonCard />
 *
 * @example
 * // While data is loading
 * {isLoading ? <SkeletonTable rows={5} columns={4} /> : <DataTable data={data} />}
 */

import * as React from 'react';

// ============================================================
// GENERIC SKELETON WRAPPER
// ============================================================

interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Children elements */
  children?: React.ReactNode;
}

/**
 * Generic skeleton wrapper with animate-pulse effect.
 * Use for custom skeleton layouts.
 *
 * @example
 * <Skeleton className="h-4 w-[200px]" />
 *
 * @example
 * <Skeleton className="h-12 w-12 rounded-full" />
 */
export function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-muted rounded ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

// ============================================================
// SKELETON TEXT
// ============================================================

interface SkeletonTextProps {
  /** Additional CSS classes */
  className?: string;
  /** Width of the text line (Tailwind width class or CSS value) */
  width?: string;
  /** Height of the text line */
  height?: 'xs' | 'sm' | 'md' | 'lg';
}

const textHeights = {
  xs: 'h-3',
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-6',
};

/**
 * Skeleton for a single line of text.
 *
 * @example
 * <SkeletonText width="w-3/4" />
 *
 * @example
 * <SkeletonText width="w-1/2" height="lg" />
 */
export function SkeletonText({
  className = '',
  width = 'w-full',
  height = 'sm',
}: SkeletonTextProps) {
  return (
    <Skeleton className={`${textHeights[height]} ${width} rounded ${className}`} />
  );
}

// ============================================================
// SKELETON PARAGRAPH
// ============================================================

interface SkeletonParagraphProps {
  /** Additional CSS classes */
  className?: string;
  /** Number of lines in the paragraph */
  lines?: number;
  /** Height of each line */
  lineHeight?: 'xs' | 'sm' | 'md' | 'lg';
  /** Gap between lines */
  gap?: 'sm' | 'md' | 'lg';
}

const gapSizes = {
  sm: 'space-y-1',
  md: 'space-y-2',
  lg: 'space-y-3',
};

/**
 * Skeleton for a paragraph of text.
 * Last line is shorter for a natural appearance.
 *
 * @example
 * <SkeletonParagraph lines={3} />
 *
 * @example
 * <SkeletonParagraph lines={5} lineHeight="md" gap="lg" />
 */
export function SkeletonParagraph({
  className = '',
  lines = 3,
  lineHeight = 'sm',
  gap = 'md',
}: SkeletonParagraphProps) {
  return (
    <div className={`${gapSizes[gap]} ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonText
          key={index}
          height={lineHeight}
          // Last line is shorter for natural appearance
          width={index === lines - 1 ? 'w-2/3' : 'w-full'}
        />
      ))}
    </div>
  );
}

// ============================================================
// SKELETON AVATAR
// ============================================================

interface SkeletonAvatarProps {
  /** Additional CSS classes */
  className?: string;
  /** Size of the avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Shape of the avatar */
  shape?: 'circle' | 'square';
}

const avatarSizes = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

/**
 * Skeleton for an avatar image.
 *
 * @example
 * <SkeletonAvatar size="md" />
 *
 * @example
 * <SkeletonAvatar size="lg" shape="square" />
 */
export function SkeletonAvatar({
  className = '',
  size = 'md',
  shape = 'circle',
}: SkeletonAvatarProps) {
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-md';

  return (
    <Skeleton className={`${avatarSizes[size]} ${shapeClass} ${className}`} />
  );
}

// ============================================================
// SKELETON CARD
// ============================================================

interface SkeletonCardProps {
  /** Additional CSS classes */
  className?: string;
  /** Show image placeholder at top */
  showImage?: boolean;
  /** Show avatar in header */
  showAvatar?: boolean;
  /** Number of text lines in body */
  lines?: number;
  /** Show action buttons at bottom */
  showActions?: boolean;
}

/**
 * Skeleton for a card component.
 *
 * @example
 * <SkeletonCard />
 *
 * @example
 * <SkeletonCard showImage showAvatar lines={3} showActions />
 *
 * @example
 * // In a grid
 * <div className="grid grid-cols-3 gap-4">
 *   {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
 * </div>
 */
export function SkeletonCard({
  className = '',
  showImage = false,
  showAvatar = false,
  lines = 2,
  showActions = false,
}: SkeletonCardProps) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 ${className}`}
      aria-hidden="true"
    >
      {/* Image placeholder */}
      {showImage && (
        <Skeleton className="h-48 w-full rounded-md mb-4" />
      )}

      {/* Header with optional avatar */}
      <div className="flex items-center gap-3 mb-4">
        {showAvatar && <SkeletonAvatar size="md" />}
        <div className="flex-1 space-y-2">
          <SkeletonText width="w-1/2" height="md" />
          <SkeletonText width="w-1/4" height="xs" />
        </div>
      </div>

      {/* Body text */}
      <SkeletonParagraph lines={lines} className="mb-4" />

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2 pt-2 border-t">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// SKELETON TABLE
// ============================================================

interface SkeletonTableProps {
  /** Additional CSS classes */
  className?: string;
  /** Number of rows to display */
  rows?: number;
  /** Number of columns to display */
  columns?: number;
  /** Show header row */
  showHeader?: boolean;
  /** Show checkbox column */
  showCheckbox?: boolean;
}

/**
 * Skeleton for a data table.
 *
 * @example
 * <SkeletonTable rows={5} columns={4} />
 *
 * @example
 * <SkeletonTable rows={10} columns={6} showHeader showCheckbox />
 */
export function SkeletonTable({
  className = '',
  rows = 5,
  columns = 4,
  showHeader = true,
  showCheckbox = false,
}: SkeletonTableProps) {
  const totalColumns = showCheckbox ? columns + 1 : columns;

  return (
    <div className={`w-full ${className}`} aria-hidden="true">
      <div className="rounded-md border">
        <div className="overflow-hidden">
          {/* Header */}
          {showHeader && (
            <div className="flex items-center gap-4 border-b bg-muted/50 px-4 py-3">
              {showCheckbox && (
                <Skeleton className="h-4 w-4 rounded" />
              )}
              {Array.from({ length: columns }).map((_, index) => (
                <div key={index} className="flex-1">
                  <SkeletonText width="w-24" height="sm" />
                </div>
              ))}
            </div>
          )}

          {/* Body rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-center gap-4 border-b last:border-0 px-4 py-3"
            >
              {showCheckbox && (
                <Skeleton className="h-4 w-4 rounded" />
              )}
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  <SkeletonText
                    width={colIndex === 0 ? 'w-3/4' : 'w-1/2'}
                    height="sm"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SKELETON LIST
// ============================================================

interface SkeletonListProps {
  /** Additional CSS classes */
  className?: string;
  /** Number of list items */
  items?: number;
  /** Show avatar/icon on left */
  showAvatar?: boolean;
  /** Show action on right */
  showAction?: boolean;
  /** Number of text lines per item */
  lines?: number;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
}

const listGapSizes = {
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
};

/**
 * Skeleton for a list of items.
 *
 * @example
 * <SkeletonList items={5} />
 *
 * @example
 * <SkeletonList items={3} showAvatar showAction lines={2} />
 */
export function SkeletonList({
  className = '',
  items = 5,
  showAvatar = false,
  showAction = false,
  lines = 1,
  gap = 'md',
}: SkeletonListProps) {
  return (
    <div className={`${listGapSizes[gap]} ${className}`} aria-hidden="true">
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 rounded-lg border"
        >
          {showAvatar && <SkeletonAvatar size="md" />}
          <div className="flex-1 space-y-2">
            <SkeletonText width="w-3/4" height="sm" />
            {lines > 1 && <SkeletonText width="w-1/2" height="xs" />}
            {lines > 2 && <SkeletonText width="w-2/3" height="xs" />}
          </div>
          {showAction && (
            <Skeleton className="h-8 w-8 rounded-md" />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SKELETON FORM
// ============================================================

interface SkeletonFormProps {
  /** Additional CSS classes */
  className?: string;
  /** Number of form fields */
  fields?: number;
  /** Show submit button */
  showSubmit?: boolean;
  /** Show cancel button */
  showCancel?: boolean;
}

/**
 * Skeleton for a form.
 *
 * @example
 * <SkeletonForm fields={4} />
 *
 * @example
 * <SkeletonForm fields={6} showSubmit showCancel />
 */
export function SkeletonForm({
  className = '',
  fields = 4,
  showSubmit = true,
  showCancel = false,
}: SkeletonFormProps) {
  return (
    <div className={`space-y-6 ${className}`} aria-hidden="true">
      {/* Form fields */}
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          {/* Label */}
          <SkeletonText width="w-24" height="sm" />
          {/* Input */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}

      {/* Action buttons */}
      {(showSubmit || showCancel) && (
        <div className="flex gap-4 pt-2">
          {showSubmit && (
            <Skeleton className="h-10 w-28 rounded-md" />
          )}
          {showCancel && (
            <Skeleton className="h-10 w-20 rounded-md" />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SKELETON PAGE HEADER
// ============================================================

interface SkeletonPageHeaderProps {
  /** Additional CSS classes */
  className?: string;
  /** Show breadcrumbs */
  showBreadcrumbs?: boolean;
  /** Show action buttons */
  showActions?: boolean;
}

/**
 * Skeleton for a page header with title and optional elements.
 *
 * @example
 * <SkeletonPageHeader />
 *
 * @example
 * <SkeletonPageHeader showBreadcrumbs showActions />
 */
export function SkeletonPageHeader({
  className = '',
  showBreadcrumbs = false,
  showActions = false,
}: SkeletonPageHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`} aria-hidden="true">
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <div className="flex items-center gap-2">
          <SkeletonText width="w-16" height="xs" />
          <span className="text-muted-foreground">/</span>
          <SkeletonText width="w-20" height="xs" />
          <span className="text-muted-foreground">/</span>
          <SkeletonText width="w-24" height="xs" />
        </div>
      )}

      {/* Title and actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonText width="w-48" height="lg" />
          <SkeletonText width="w-64" height="sm" />
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SKELETON STATS GRID
// ============================================================

interface SkeletonStatsGridProps {
  /** Additional CSS classes */
  className?: string;
  /** Number of stat cards */
  count?: number;
  /** Grid columns */
  columns?: 2 | 3 | 4;
}

const gridColumnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Skeleton for a grid of stat cards.
 *
 * @example
 * <SkeletonStatsGrid count={4} />
 *
 * @example
 * <SkeletonStatsGrid count={3} columns={3} />
 */
export function SkeletonStatsGrid({
  className = '',
  count = 4,
  columns = 4,
}: SkeletonStatsGridProps) {
  return (
    <div
      className={`grid gap-4 ${gridColumnClasses[columns]} ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <SkeletonText width="w-24" height="sm" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <SkeletonText width="w-16" height="lg" className="mb-1" />
          <SkeletonText width="w-20" height="xs" />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// FULL PAGE SKELETON LAYOUTS
// ============================================================

interface SkeletonDashboardProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Full page skeleton for a dashboard layout.
 *
 * @example
 * // In loading.tsx
 * export default function Loading() {
 *   return <SkeletonDashboard />;
 * }
 */
export function SkeletonDashboard({ className = '' }: SkeletonDashboardProps) {
  return (
    <div className={`space-y-8 ${className}`} aria-hidden="true">
      <SkeletonPageHeader showActions />
      <SkeletonStatsGrid count={4} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
      <SkeletonTable rows={5} columns={5} showHeader />
    </div>
  );
}

interface SkeletonDetailPageProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Full page skeleton for a detail/view page.
 *
 * @example
 * // In [id]/loading.tsx
 * export default function Loading() {
 *   return <SkeletonDetailPage />;
 * }
 */
export function SkeletonDetailPage({ className = '' }: SkeletonDetailPageProps) {
  return (
    <div className={`space-y-8 ${className}`} aria-hidden="true">
      <SkeletonPageHeader showBreadcrumbs showActions />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard showAvatar lines={4} />
          <SkeletonCard lines={6} />
        </div>
        {/* Sidebar */}
        <div className="space-y-6">
          <SkeletonCard lines={3} />
          <SkeletonList items={4} showAvatar />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
