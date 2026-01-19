/**
 * Search & Filter Components - taxbook-pro
 * Generated: 2026-01-19
 *
 * Reusable search and filter components with debouncing, URL sync, and accessibility.
 * Uses Tailwind CSS for styling and shadcn/ui components.
 *
 * Place in: components/search-filter/
 */

'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// ============================================================
// DATE FORMATTING UTILITIES (no external dependencies)
// ============================================================

/**
 * Format a date as "MMM d, yyyy" (e.g., "Jan 15, 2024")
 */
function formatDate(date: Date, pattern: 'short' | 'full' = 'full'): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  if (pattern === 'short') {
    return `${month} ${day}`;
  }
  return `${month} ${day}, ${year}`;
}

/**
 * Format a date as "yyyy-MM-dd" for URL parameters
 */
function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse an ISO date string (yyyy-MM-dd) into a Date object
 */
function parseISODate(dateString: string): Date | undefined {
  const parts = dateString.split('-');
  if (parts.length !== 3) return undefined;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);

  // Validate the date is valid
  if (isNaN(date.getTime())) return undefined;
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return undefined; // Invalid date like Feb 30
  }

  return date;
}

// ============================================================
// SEARCH INPUT
// ============================================================

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Whether to show loading indicator */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the input */
  'aria-label'?: string;
}

/**
 * Search input with debouncing, clear button, and search icon.
 *
 * @example
 * const [search, setSearch] = useState('');
 *
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Search products..."
 * />
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  loading = false,
  className,
  'aria-label': ariaLabel = 'Search',
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync local value with external value
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounced update
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  const handleClear = React.useCallback(() => {
    setLocalValue('');
    onChange('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, [onChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClear();
      }
    },
    [handleClear]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Search icon */}
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <Input
        type="search"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-10 pr-10"
        aria-label={ariaLabel}
      />

      {/* Loading or clear button */}
      {(loading || localValue) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <svg
              className="h-4 w-4 animate-spin text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              aria-label="Clear search"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// FILTER SELECT
// ============================================================

interface FilterSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FilterSelectProps {
  /** Filter label */
  label: string;
  /** Current value */
  value: string | undefined;
  /** Callback when value changes */
  onChange: (value: string | undefined) => void;
  /** Available options */
  options: FilterSelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show "All" option */
  showAllOption?: boolean;
  /** Label for "All" option */
  allOptionLabel?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Dropdown filter for single-select filtering.
 *
 * @example
 * <FilterSelect
 *   label="Status"
 *   value={statusFilter}
 *   onChange={setStatusFilter}
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' },
 *   ]}
 *   showAllOption
 * />
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  showAllOption = true,
  allOptionLabel = 'All',
  className,
}: FilterSelectProps) {
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      onChange(newValue === '__all__' ? undefined : newValue);
    },
    [onChange]
  );

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={`filter-${label}`} className="text-sm font-medium">
        {label}
      </Label>
      <Select
        value={value ?? '__all__'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger id={`filter-${label}`} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="__all__">{allOptionLabel}</SelectItem>
          )}
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================================
// FILTER CHECKBOX GROUP
// ============================================================

interface FilterCheckboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FilterCheckboxGroupProps {
  /** Filter group label */
  label: string;
  /** Currently selected values */
  values: string[];
  /** Callback when values change */
  onChange: (values: string[]) => void;
  /** Available options */
  options: FilterCheckboxOption[];
  /** Maximum items to show before "Show more" */
  maxVisible?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Multi-select checkbox filter group.
 *
 * @example
 * <FilterCheckboxGroup
 *   label="Categories"
 *   values={selectedCategories}
 *   onChange={setSelectedCategories}
 *   options={[
 *     { value: 'electronics', label: 'Electronics' },
 *     { value: 'clothing', label: 'Clothing' },
 *     { value: 'books', label: 'Books' },
 *   ]}
 * />
 */
export function FilterCheckboxGroup({
  label,
  values,
  onChange,
  options,
  maxVisible = 5,
  className,
}: FilterCheckboxGroupProps) {
  const [showAll, setShowAll] = React.useState(false);

  const visibleOptions = showAll ? options : options.slice(0, maxVisible);
  const hasMore = options.length > maxVisible;

  const handleCheckedChange = React.useCallback(
    (optionValue: string, checked: boolean) => {
      if (checked) {
        onChange([...values, optionValue]);
      } else {
        onChange(values.filter((v) => v !== optionValue));
      }
    },
    [values, onChange]
  );

  const handleSelectAll = React.useCallback(() => {
    const allValues = options.filter((o) => !o.disabled).map((o) => o.value);
    onChange(allValues);
  }, [options, onChange]);

  const handleClearAll = React.useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <fieldset className={cn('space-y-3', className)}>
      <legend className="text-sm font-medium">{label}</legend>

      {/* Select/Clear all buttons */}
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          Select all
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          type="button"
          onClick={handleClearAll}
          className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          Clear
        </button>
      </div>

      {/* Checkbox options */}
      <div className="space-y-2">
        {visibleOptions.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`filter-${label}-${option.value}`}
              checked={values.includes(option.value)}
              onCheckedChange={(checked) =>
                handleCheckedChange(option.value, checked === true)
              }
              disabled={option.disabled}
            />
            <Label
              htmlFor={`filter-${label}-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>

      {/* Show more/less toggle */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          {showAll ? 'Show less' : `Show ${options.length - maxVisible} more`}
        </button>
      )}
    </fieldset>
  );
}

// ============================================================
// FILTER DATE RANGE
// ============================================================

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface FilterDateRangeProps {
  /** Filter label */
  label: string;
  /** Current date range */
  value: DateRange;
  /** Callback when range changes */
  onChange: (range: DateRange) => void;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Placeholder text when no date selected */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Date range picker filter.
 *
 * @example
 * <FilterDateRange
 *   label="Created Date"
 *   value={dateRange}
 *   onChange={setDateRange}
 *   maxDate={new Date()}
 * />
 */
export function FilterDateRange({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date range',
  className,
}: FilterDateRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatDateRangeDisplay = () => {
    if (value.from && value.to) {
      return `${formatDate(value.from)} - ${formatDate(value.to)}`;
    }
    if (value.from) {
      return `From ${formatDate(value.from)}`;
    }
    if (value.to) {
      return `Until ${formatDate(value.to)}`;
    }
    return placeholder;
  };

  const handleClear = React.useCallback(() => {
    onChange({ from: undefined, to: undefined });
  }, [onChange]);

  const hasValue = value.from || value.to;

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !hasValue && 'text-muted-foreground'
            )}
          >
            <svg
              className="mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDateRangeDisplay()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Select range</span>
              {hasValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex">
            <div className="p-3 border-r">
              <Label className="text-xs text-muted-foreground mb-2 block">
                From
              </Label>
              <Calendar
                {...{
                  mode: "single",
                  selected: value.from,
                  onSelect: (date: Date | undefined) => onChange({ ...value, from: date }),
                  disabled: (date: Date) => {
                    if (minDate && date < minDate) return true;
                    if (value.to && date > value.to) return true;
                    return false;
                  },
                } as React.ComponentProps<typeof Calendar>}
              />
            </div>
            <div className="p-3">
              <Label className="text-xs text-muted-foreground mb-2 block">
                To
              </Label>
              <Calendar
                {...{
                  mode: "single",
                  selected: value.to,
                  onSelect: (date: Date | undefined) => onChange({ ...value, to: date }),
                  disabled: (date: Date) => {
                    if (maxDate && date > maxDate) return true;
                    if (value.from && date < value.from) return true;
                    return false;
                  },
                } as React.ComponentProps<typeof Calendar>}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ============================================================
// FILTER PANEL
// ============================================================

interface FilterPanelProps {
  /** Panel title */
  title?: string;
  /** Child filter components */
  children: React.ReactNode;
  /** Callback when filters are cleared */
  onClearAll?: () => void;
  /** Whether any filters are active */
  hasActiveFilters?: boolean;
  /** Whether panel is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Container for grouping multiple filter components.
 *
 * @example
 * <FilterPanel
 *   title="Filters"
 *   hasActiveFilters={hasFilters}
 *   onClearAll={clearAllFilters}
 *   collapsible
 * >
 *   <FilterSelect ... />
 *   <FilterCheckboxGroup ... />
 *   <FilterDateRange ... />
 * </FilterPanel>
 */
export function FilterPanel({
  title = 'Filters',
  children,
  onClearAll,
  hasActiveFilters = false,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
            >
              <svg
                className={cn(
                  'h-4 w-4 transition-transform',
                  isCollapsed && '-rotate-90'
                )}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
          <h3 className="font-semibold text-sm">{title}</h3>
          {hasActiveFilters && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              !
            </span>
          )}
        </div>

        {hasActiveFilters && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter content */}
      {!isCollapsed && (
        <div className="space-y-6">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ACTIVE FILTERS DISPLAY
// ============================================================

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface ActiveFiltersProps {
  /** List of active filters */
  filters: ActiveFilter[];
  /** Callback to remove a single filter */
  onRemove: (key: string) => void;
  /** Callback to clear all filters */
  onClearAll: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays currently active filters as removable chips.
 *
 * @example
 * <ActiveFilters
 *   filters={[
 *     { key: 'status', label: 'Status', value: 'Active' },
 *     { key: 'category', label: 'Category', value: 'Electronics' },
 *   ]}
 *   onRemove={(key) => removeFilter(key)}
 *   onClearAll={clearAllFilters}
 * />
 */
export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
        >
          <span className="text-muted-foreground">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            type="button"
            onClick={() => onRemove(filter.key)}
            className="ml-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
            aria-label={`Remove ${filter.label} filter`}
          >
            <svg
              className="h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
      >
        Clear all
      </button>
    </div>
  );
}

// ============================================================
// USE SEARCH HOOK
// ============================================================

interface UseSearchOptions {
  /** Initial search value */
  initialValue?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Whether to sync with URL search params */
  syncWithUrl?: boolean;
  /** URL parameter name */
  paramName?: string;
}

interface UseSearchReturn {
  /** Current search value (debounced) */
  value: string;
  /** Immediate input value */
  inputValue: string;
  /** Set the search value */
  setValue: (value: string) => void;
  /** Clear the search */
  clear: () => void;
  /** Whether search is pending (debounce in progress) */
  isPending: boolean;
}

/**
 * Hook for managing debounced search state.
 * Optionally syncs with URL search params.
 *
 * @example
 * const { value, inputValue, setValue, clear, isPending } = useSearch({
 *   syncWithUrl: true,
 *   paramName: 'q',
 * });
 *
 * // Use inputValue for the input, value for API calls
 * const { data } = useQuery(['items', value], () => searchItems(value));
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    initialValue = '',
    debounceMs = 300,
    syncWithUrl = false,
    paramName = 'search',
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial value from URL or default
  const getInitialValue = () => {
    if (syncWithUrl) {
      const urlValue = searchParams.get(paramName);
      if (urlValue) return urlValue;
    }
    return initialValue;
  };

  const [inputValue, setInputValue] = React.useState(getInitialValue);
  const [debouncedValue, setDebouncedValue] = React.useState(getInitialValue);
  const [isPending, setIsPending] = React.useState(false);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Update URL when debounced value changes
  const updateUrl = React.useCallback(
    (value: string) => {
      if (!syncWithUrl) return;

      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramName, value);
      } else {
        params.delete(paramName);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [syncWithUrl, searchParams, paramName, router, pathname]
  );

  const setValue = React.useCallback(
    (value: string) => {
      setInputValue(value);
      setIsPending(true);

      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounced update
      debounceRef.current = setTimeout(() => {
        setDebouncedValue(value);
        setIsPending(false);
        updateUrl(value);
      }, debounceMs);
    },
    [debounceMs, updateUrl]
  );

  const clear = React.useCallback(() => {
    setInputValue('');
    setDebouncedValue('');
    setIsPending(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    updateUrl('');
  }, [updateUrl]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    value: debouncedValue,
    inputValue,
    setValue,
    clear,
    isPending,
  };
}

// ============================================================
// USE FILTERS HOOK
// ============================================================

type FilterValue = string | string[] | DateRange | undefined;

interface FilterDefinition {
  /** Default value */
  defaultValue?: FilterValue;
  /** URL parameter name (for URL sync) */
  paramName?: string;
  /** Whether to serialize as array in URL */
  isArray?: boolean;
  /** Whether this is a date range filter */
  isDateRange?: boolean;
}

interface UseFiltersOptions<T extends Record<string, FilterDefinition>> {
  /** Filter definitions */
  filters: T;
  /** Whether to sync with URL search params */
  syncWithUrl?: boolean;
}

type FilterValues<T extends Record<string, FilterDefinition>> = {
  [K in keyof T]: T[K]['isArray'] extends true
    ? string[]
    : T[K]['isDateRange'] extends true
    ? DateRange
    : string | undefined;
};

interface UseFiltersReturn<T extends Record<string, FilterDefinition>> {
  /** Current filter values */
  values: FilterValues<T>;
  /** Set a single filter value */
  setFilter: <K extends keyof T>(key: K, value: FilterValues<T>[K]) => void;
  /** Clear a single filter */
  clearFilter: (key: keyof T) => void;
  /** Clear all filters */
  clearAll: () => void;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Get active filters as display items */
  getActiveFilters: () => ActiveFilter[];
}

/**
 * Hook for managing filter state.
 * Optionally syncs with URL search params.
 *
 * @example
 * const { values, setFilter, clearFilter, clearAll, hasActiveFilters } = useFilters({
 *   filters: {
 *     status: { defaultValue: undefined, paramName: 'status' },
 *     categories: { defaultValue: [], paramName: 'cat', isArray: true },
 *     dateRange: { defaultValue: { from: undefined, to: undefined }, isDateRange: true },
 *   },
 *   syncWithUrl: true,
 * });
 */
export function useFilters<T extends Record<string, FilterDefinition>>(
  options: UseFiltersOptions<T>
): UseFiltersReturn<T> {
  const { filters, syncWithUrl = false } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse initial values from URL or defaults
  const getInitialValues = React.useCallback((): FilterValues<T> => {
    const values: Record<string, FilterValue> = {};

    for (const [key, definition] of Object.entries(filters)) {
      const paramName = definition.paramName || key;

      if (syncWithUrl) {
        if (definition.isDateRange) {
          const fromStr = searchParams.get(`${paramName}_from`);
          const toStr = searchParams.get(`${paramName}_to`);
          values[key] = {
            from: fromStr ? parseISODate(fromStr) : undefined,
            to: toStr ? parseISODate(toStr) : undefined,
          };
        } else if (definition.isArray) {
          const urlValue = searchParams.getAll(paramName);
          values[key] = urlValue.length > 0 ? urlValue : (definition.defaultValue ?? []);
        } else {
          const urlValue = searchParams.get(paramName);
          values[key] = urlValue ?? definition.defaultValue;
        }
      } else {
        values[key] = definition.defaultValue;
      }
    }

    return values as FilterValues<T>;
  }, [filters, syncWithUrl, searchParams]);

  const [values, setValues] = React.useState<FilterValues<T>>(getInitialValues);

  // Update URL when values change
  const updateUrl = React.useCallback(
    (newValues: FilterValues<T>) => {
      if (!syncWithUrl) return;

      const params = new URLSearchParams();

      // Preserve non-filter params
      for (const [key, value] of searchParams.entries()) {
        const isFilterParam = Object.entries(filters).some(([filterKey, def]) => {
          const paramName = def.paramName || filterKey;
          return key === paramName || key === `${paramName}_from` || key === `${paramName}_to`;
        });
        if (!isFilterParam) {
          params.append(key, value);
        }
      }

      // Add filter params
      for (const [key, definition] of Object.entries(filters)) {
        const paramName = definition.paramName || key;
        const value = newValues[key as keyof T];

        if (definition.isDateRange) {
          const dateRange = value as DateRange;
          if (dateRange?.from) {
            params.set(`${paramName}_from`, formatDateISO(dateRange.from));
          }
          if (dateRange?.to) {
            params.set(`${paramName}_to`, formatDateISO(dateRange.to));
          }
        } else if (definition.isArray) {
          const arrayValue = value as string[];
          arrayValue?.forEach((v) => params.append(paramName, v));
        } else if (value !== undefined && value !== '') {
          params.set(paramName, value as string);
        }
      }

      const paramString = params.toString();
      router.replace(`${pathname}${paramString ? `?${paramString}` : ''}`, { scroll: false });
    },
    [syncWithUrl, searchParams, filters, router, pathname]
  );

  const setFilter = React.useCallback(
    <K extends keyof T>(key: K, value: FilterValues<T>[K]) => {
      setValues((prev) => {
        const newValues = { ...prev, [key]: value };
        updateUrl(newValues);
        return newValues;
      });
    },
    [updateUrl]
  );

  const clearFilter = React.useCallback(
    (key: keyof T) => {
      const definition = filters[key as string];
      const defaultValue = definition.isArray
        ? []
        : definition.isDateRange
        ? { from: undefined, to: undefined }
        : undefined;

      setFilter(key, defaultValue as FilterValues<T>[typeof key]);
    },
    [filters, setFilter]
  );

  const clearAll = React.useCallback(() => {
    const defaults: Record<string, FilterValue> = {};

    for (const [key, definition] of Object.entries(filters)) {
      if (definition.isArray) {
        defaults[key] = [];
      } else if (definition.isDateRange) {
        defaults[key] = { from: undefined, to: undefined };
      } else {
        defaults[key] = undefined;
      }
    }

    const newValues = defaults as FilterValues<T>;
    setValues(newValues);
    updateUrl(newValues);
  }, [filters, updateUrl]);

  const hasActiveFilters = React.useMemo(() => {
    return Object.entries(values).some(([key, value]) => {
      const definition = filters[key];
      if (definition.isArray) {
        return (value as string[])?.length > 0;
      }
      if (definition.isDateRange) {
        const range = value as DateRange;
        return range?.from !== undefined || range?.to !== undefined;
      }
      return value !== undefined && value !== '';
    });
  }, [values, filters]);

  const getActiveFilters = React.useCallback((): ActiveFilter[] => {
    const active: ActiveFilter[] = [];

    for (const [key, value] of Object.entries(values)) {
      const definition = filters[key];

      if (definition.isArray) {
        const arrayValue = value as string[];
        if (arrayValue?.length > 0) {
          active.push({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: arrayValue.join(', '),
          });
        }
      } else if (definition.isDateRange) {
        const range = value as DateRange;
        if (range?.from || range?.to) {
          let displayValue = '';
          if (range.from && range.to) {
            displayValue = `${formatDate(range.from, 'short')} - ${formatDate(range.to, 'short')}`;
          } else if (range.from) {
            displayValue = `From ${formatDate(range.from, 'short')}`;
          } else if (range.to) {
            displayValue = `Until ${formatDate(range.to, 'short')}`;
          }
          active.push({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: displayValue,
          });
        }
      } else if (value !== undefined && value !== '') {
        active.push({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          value: value as string,
        });
      }
    }

    return active;
  }, [values, filters]);

  return {
    values,
    setFilter,
    clearFilter,
    clearAll,
    hasActiveFilters,
    getActiveFilters,
  };
}

// ============================================================
// COMBINED SEARCH AND FILTER HOOK
// ============================================================

interface UseSearchAndFiltersOptions<T extends Record<string, FilterDefinition>> {
  /** Search options */
  search?: UseSearchOptions;
  /** Filter definitions */
  filters?: T;
  /** Whether to sync with URL */
  syncWithUrl?: boolean;
}

/**
 * Combined hook for managing both search and filters together.
 *
 * @example
 * const { search, filters } = useSearchAndFilters({
 *   syncWithUrl: true,
 *   search: { paramName: 'q' },
 *   filters: {
 *     status: { paramName: 'status' },
 *     category: { paramName: 'cat', isArray: true },
 *   },
 * });
 *
 * // Use in query
 * const { data } = useQuery(
 *   ['products', search.value, filters.values],
 *   () => fetchProducts({ search: search.value, ...filters.values })
 * );
 */
export function useSearchAndFilters<T extends Record<string, FilterDefinition>>(
  options: UseSearchAndFiltersOptions<T>
) {
  const { search: searchOptions = {}, filters: filterDefs, syncWithUrl = false } = options;

  const search = useSearch({
    ...searchOptions,
    syncWithUrl,
  });

  const filters = useFilters({
    filters: filterDefs ?? ({} as T),
    syncWithUrl,
  });

  const clearAll = React.useCallback(() => {
    search.clear();
    filters.clearAll();
  }, [search, filters]);

  const hasAnyActive = search.value !== '' || filters.hasActiveFilters;

  return {
    search,
    filters,
    clearAll,
    hasAnyActive,
  };
}

// ============================================================
// USAGE EXAMPLES
// ============================================================

/**
 * BASIC SEARCH EXAMPLE:
 *
 * function ProductSearch() {
 *   const { value, inputValue, setValue, isPending } = useSearch({
 *     syncWithUrl: true,
 *     paramName: 'q',
 *   });
 *
 *   return (
 *     <SearchInput
 *       value={inputValue}
 *       onChange={setValue}
 *       placeholder="Search products..."
 *       loading={isPending}
 *     />
 *   );
 * }
 */

/**
 * FULL FILTER PANEL EXAMPLE:
 *
 * function ProductFilters() {
 *   const { search, filters, clearAll, hasAnyActive } = useSearchAndFilters({
 *     syncWithUrl: true,
 *     search: { paramName: 'q' },
 *     filters: {
 *       status: { paramName: 'status' },
 *       categories: { paramName: 'cat', isArray: true },
 *       priceRange: { isDateRange: true },
 *     },
 *   });
 *
 *   return (
 *     <div className="space-y-4">
 *       <SearchInput
 *         value={search.inputValue}
 *         onChange={search.setValue}
 *         placeholder="Search..."
 *         loading={search.isPending}
 *       />
 *
 *       <ActiveFilters
 *         filters={filters.getActiveFilters()}
 *         onRemove={(key) => filters.clearFilter(key)}
 *         onClearAll={clearAll}
 *       />
 *
 *       <FilterPanel
 *         hasActiveFilters={hasAnyActive}
 *         onClearAll={clearAll}
 *         collapsible
 *       >
 *         <FilterSelect
 *           label="Status"
 *           value={filters.values.status}
 *           onChange={(value) => filters.setFilter('status', value)}
 *           options={[
 *             { value: 'active', label: 'Active' },
 *             { value: 'inactive', label: 'Inactive' },
 *           ]}
 *         />
 *
 *         <FilterCheckboxGroup
 *           label="Categories"
 *           values={filters.values.categories}
 *           onChange={(values) => filters.setFilter('categories', values)}
 *           options={[
 *             { value: 'electronics', label: 'Electronics' },
 *             { value: 'clothing', label: 'Clothing' },
 *           ]}
 *         />
 *
 *         <FilterDateRange
 *           label="Created Date"
 *           value={filters.values.priceRange}
 *           onChange={(range) => filters.setFilter('priceRange', range)}
 *           maxDate={new Date()}
 *         />
 *       </FilterPanel>
 *     </div>
 *   );
 * }
 */

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
