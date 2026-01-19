/**
 * Data Display Components - taxbook-pro
 * Generated: 2026-01-19
 *
 * Pagination, loading states, and empty state components.
 * Uses shadcn/ui components for consistent styling.
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ============================================================
// PAGINATION
// ============================================================

interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Maximum number of page buttons to show */
  maxVisiblePages?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pagination component with page numbers and navigation buttons.
 *
 * @example
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => setPage(page)}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  className,
}: PaginationProps) {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Calculate visible page range
  const pageNumbers = useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - halfVisible);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (end === totalPages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxVisiblePages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        aria-label="Go to previous page"
      >
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers[0] > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              aria-label="Go to page 1"
            >
              1
            </Button>
            {pageNumbers[0] > 2 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
          </>
        )}

        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
        ))}

        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              aria-label={`Go to page ${totalPages}`}
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        aria-label="Go to next page"
      >
        Next
      </Button>

      <span className="ml-2 text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
    </nav>
  );
}

// ============================================================
// PAGINATION INFO
// ============================================================

interface PaginationInfoProps {
  /** First item index (1-indexed) */
  from: number;
  /** Last item index (1-indexed) */
  to: number;
  /** Total number of items */
  total: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Shows "Showing X-Y of Z results" info text.
 *
 * @example
 * <PaginationInfo from={1} to={10} total={100} />
 */
export function PaginationInfo({ from, to, total, className }: PaginationInfoProps) {
  if (total === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No results found
      </p>
    );
  }

  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      Showing <span className="font-medium">{from}</span> to{' '}
      <span className="font-medium">{to}</span> of{' '}
      <span className="font-medium">{total}</span> results
    </p>
  );
}

// ============================================================
// PAGE SIZE SELECT
// ============================================================

interface PageSizeSelectProps {
  /** Current page size */
  pageSize: number;
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;
  /** Available page size options */
  options?: number[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Dropdown to select items per page.
 *
 * @example
 * <PageSizeSelect
 *   pageSize={10}
 *   onPageSizeChange={(size) => setPageSize(size)}
 * />
 */
export function PageSizeSelect({
  pageSize,
  onPageSizeChange,
  options = [10, 25, 50, 100],
  className,
}: PageSizeSelectProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">Show</span>
      <Select
        value={String(pageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger className="w-[70px]" aria-label="Select page size">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground">per page</span>
    </div>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

type SkeletonVariant = 'text' | 'card' | 'table-row' | 'avatar';

interface LoadingSkeletonProps {
  /** Skeleton variant */
  variant?: SkeletonVariant;
  /** Number of skeleton items to show */
  count?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated placeholder while loading data.
 *
 * @example
 * <LoadingSkeleton variant="card" count={3} />
 */
export function LoadingSkeleton({
  variant = 'text',
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  switch (variant) {
    case 'avatar':
      return (
        <div className={cn('flex flex-wrap gap-4', className)}>
          {items.map((i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-full" />
          ))}
        </div>
      );

    case 'card':
      return (
        <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
          {items.map((i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'table-row':
      return (
        <div className={cn('space-y-2', className)}>
          {items.map((i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[80px] ml-auto" />
            </div>
          ))}
        </div>
      );

    case 'text':
    default:
      return (
        <div className={cn('space-y-2', className)}>
          {items.map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      );
  }
}

// ============================================================
// LOADING SPINNER
// ============================================================

interface LoadingSpinnerProps {
  /** Optional message to display */
  message?: string;
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Centered loading spinner with optional message.
 *
 * @example
 * <LoadingSpinner message="Loading data..." />
 */
export function LoadingSpinner({
  message,
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-4', className)}
      role="status"
      aria-label={message || 'Loading'}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-4 border-primary border-t-transparent',
          sizeClasses[size]
        )}
      />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

interface EmptyStateProps {
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button */
  action?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty state component with icon, title, description, and optional action.
 *
 * @example
 * <EmptyState
 *   icon={<FileIcon />}
 *   title="No items"
 *   description="Get started by creating your first item."
 *   action={{
 *     label: "Create item",
 *     onClick: () => router.push('/dashboard')
 *   }}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || 'default'}
          className="mt-6"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ============================================================
// DATA TABLE
// ============================================================

interface DataTableColumn<T> {
  /** Column header */
  header: string;
  /** Key to access data or render function */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** Additional CSS classes for the column */
  className?: string;
}

interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Data rows */
  data: readonly T[];
  /** Whether data is loading */
  loading?: boolean;
  /** Number of skeleton rows to show when loading */
  loadingRows?: number;
  /** Key extractor for rows */
  getRowKey: (row: T) => string;
  /** Empty state configuration */
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: EmptyStateAction;
  };
  /** Pagination configuration */
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize: number;
    onPageSizeChange?: (size: number) => void;
    total: number;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Data table with loading state, empty state, and pagination.
 *
 * @example
 * <DataTable
 *   columns={[
 *     { header: 'Name', accessor: 'name' },
 *     { header: 'Email', accessor: 'email' },
 *     { header: 'Actions', accessor: (row) => <ActionButtons row={row} /> },
 *   ]}
 *   data={users}
 *   loading={isLoading}
 *   getRowKey={(row) => row.id}
 *   emptyState={{
 *     title: "No users yet",
 *     description: "Create your first user to get started.",
 *     action: { label: "Add user", onClick: () => {} }
 *   }}
 *   pagination={{
 *     currentPage: 1,
 *     totalPages: 10,
 *     onPageChange: setPage,
 *     pageSize: 10,
 *     onPageSizeChange: setPageSize,
 *     total: 100,
 *   }}
 * />
 */
export function DataTable<T>({
  columns,
  data,
  loading = false,
  loadingRows = 5,
  getRowKey,
  emptyState,
  pagination,
  className,
}: DataTableProps<T>) {
  // Render cell content
  const renderCell = (row: T, column: DataTableColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    const value = row[column.accessor];
    return String(value ?? '');
  };

  // Calculate pagination info
  const paginationInfo = pagination
    ? {
        from: (pagination.currentPage - 1) * pagination.pageSize + 1,
        to: Math.min(pagination.currentPage * pagination.pageSize, pagination.total),
        total: pagination.total,
      }
    : null;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading state - skeleton rows
              Array.from({ length: loadingRows }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48">
                  {emptyState ? (
                    <EmptyState {...emptyState} />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              data.map((row) => (
                <TableRow key={getRowKey(row)}>
                  {columns.map((column, index) => (
                    <TableCell key={index} className={column.className}>
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      {pagination && !loading && data.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {paginationInfo && (
              <PaginationInfo
                from={paginationInfo.from}
                to={paginationInfo.to}
                total={paginationInfo.total}
              />
            )}
            {pagination.onPageSizeChange && (
              <PageSizeSelect
                pageSize={pagination.pageSize}
                onPageSizeChange={pagination.onPageSizeChange}
              />
            )}
          </div>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// USE PAGINATION HOOK
// ============================================================

interface UsePaginationOptions {
  /** Initial page (1-indexed). Default: 1 */
  initialPage?: number;
  /** Initial page size. Default: 10 */
  initialPageSize?: number;
  /** Whether to sync with URL search params */
  syncWithUrl?: boolean;
  /** Page query parameter name */
  pageParam?: string;
  /** Page size query parameter name */
  pageSizeParam?: string;
}

interface UsePaginationReturn {
  /** Current page (1-indexed) */
  page: number;
  /** Current page size */
  pageSize: number;
  /** Set the current page */
  setPage: (page: number) => void;
  /** Set the page size (resets to page 1) */
  setPageSize: (size: number) => void;
  /** Go to the next page */
  nextPage: () => void;
  /** Go to the previous page */
  prevPage: () => void;
  /** Calculate pagination info from total count */
  getPaginationInfo: (totalCount: number) => {
    from: number;
    to: number;
    total: number;
    totalPages: number;
  };
  /** Get query params for API calls */
  getQueryParams: () => { offset: number; limit: number };
}

/**
 * Hook for managing pagination state.
 * Optionally syncs with URL search params.
 *
 * @example
 * const { page, pageSize, setPage, setPageSize, getPaginationInfo } = usePagination({
 *   syncWithUrl: true,
 * });
 *
 * const { data, total } = useQuery(['items', page, pageSize], fetchItems);
 * const info = getPaginationInfo(total);
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 10,
    syncWithUrl = false,
    pageParam = 'page',
    pageSizeParam = 'pageSize',
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial values from URL or defaults
  const getInitialPage = () => {
    if (syncWithUrl) {
      const urlPage = searchParams.get(pageParam);
      if (urlPage) {
        const parsed = parseInt(urlPage, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return initialPage;
  };

  const getInitialPageSize = () => {
    if (syncWithUrl) {
      const urlPageSize = searchParams.get(pageSizeParam);
      if (urlPageSize) {
        const parsed = parseInt(urlPageSize, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return initialPageSize;
  };

  const [page, setPageState] = useState(getInitialPage);
  const [pageSize, setPageSizeState] = useState(getInitialPageSize);

  // Update URL when state changes
  const updateUrl = useCallback(
    (newPage: number, newPageSize: number) => {
      if (!syncWithUrl) return;

      const params = new URLSearchParams(searchParams.toString());
      params.set(pageParam, String(newPage));
      params.set(pageSizeParam, String(newPageSize));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [syncWithUrl, searchParams, pageParam, pageSizeParam, router, pathname]
  );

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage);
      updateUrl(newPage, pageSize);
    },
    [pageSize, updateUrl]
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setPageSizeState(newPageSize);
      setPageState(1); // Reset to first page
      updateUrl(1, newPageSize);
    },
    [updateUrl]
  );

  const nextPage = useCallback(() => {
    setPage(page + 1);
  }, [page, setPage]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page, setPage]);

  const getPaginationInfo = useCallback(
    (totalCount: number) => {
      const totalPages = Math.ceil(totalCount / pageSize);
      const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
      const to = Math.min(page * pageSize, totalCount);

      return {
        from,
        to,
        total: totalCount,
        totalPages,
      };
    },
    [page, pageSize]
  );

  const getQueryParams = useCallback(() => {
    return {
      offset: (page - 1) * pageSize,
      limit: pageSize,
    };
  }, [page, pageSize]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    getPaginationInfo,
    getQueryParams,
  };
}

// ============================================================
// ENTITY-SPECIFIC EXPORTS
// ============================================================

/**
 * Empty state for Profile list
 */
export function ProfileEmptyState({
  onCreateClick,
}: {
  onCreateClick?: () => void;
}) {
  return (
    <EmptyState
      title="No profiles yet"
      description="Get started by creating your first profile."
      action={
        onCreateClick
          ? {
              label: "Create profile",
              onClick: onCreateClick,
            }
          : undefined
      }
    />
  );
}

/**
 * Empty state for Client list
 */
export function ClientEmptyState({
  onCreateClick,
}: {
  onCreateClick?: () => void;
}) {
  return (
    <EmptyState
      title="No clients yet"
      description="Get started by creating your first client."
      action={
        onCreateClick
          ? {
              label: "Create client",
              onClick: onCreateClick,
            }
          : undefined
      }
    />
  );
}

/**
 * Empty state for Service list
 */
export function ServiceEmptyState({
  onCreateClick,
}: {
  onCreateClick?: () => void;
}) {
  return (
    <EmptyState
      title="No services yet"
      description="Get started by creating your first service."
      action={
        onCreateClick
          ? {
              label: "Create service",
              onClick: onCreateClick,
            }
          : undefined
      }
    />
  );
}

/**
 * Empty state for Appointment list
 */
export function AppointmentEmptyState({
  onCreateClick,
}: {
  onCreateClick?: () => void;
}) {
  return (
    <EmptyState
      title="No appointments yet"
      description="Get started by creating your first appointment."
      action={
        onCreateClick
          ? {
              label: "Create appointment",
              onClick: onCreateClick,
            }
          : undefined
      }
    />
  );
}

/**
 * Empty state for Availability list
 */
export function AvailabilityEmptyState({
  onCreateClick,
}: {
  onCreateClick?: () => void;
}) {
  return (
    <EmptyState
      title="No availabilities yet"
      description="Get started by creating your first availability."
      action={
        onCreateClick
          ? {
              label: "Create availability",
              onClick: onCreateClick,
            }
          : undefined
      }
    />
  );
}

/**
 * Empty state for Document list
 */
export function DocumentEmptyState({
  onCreateClick,
}: {
  onCreateClick?: () => void;
}) {
  return (
    <EmptyState
      title="No documents yet"
      description="Get started by creating your first document."
      action={
        onCreateClick
          ? {
              label: "Create document",
              onClick: onCreateClick,
            }
          : undefined
      }
    />
  );
}


// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
