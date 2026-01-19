/**
 * Entity Pages - taxbook-pro
 * Generated: 2026-01-19
 *
 * CRUD pages for each entity: List, Detail, Create, and Edit views.
 * Integrates with API hooks, form components, and data display components.
 *
 * Place these in your app directory:
 *   - app/(dashboard)//page.tsx (list)
 *   - app/(dashboard)//[id]/page.tsx (detail)
 *   - app/(dashboard)//new/page.tsx (create)
 *   - app/(dashboard)//[id]/edit/page.tsx (edit)
 *
 * Usage:
 *   // List page
 *   export default function sPage() {
 *     return <ListPage />;
 *   }
 *
 *   // Detail page
 *   export default function Page({ params }: { params: { id: string } }) {
 *     return <DetailPage id={params.id} />;
 *   }
 */

'use client';

import { useState, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

// Auth
import { AuthGuard } from '@/components/auth-guard';

// Data Display
import {
  DataTable,
  Pagination,
  PaginationInfo,
  PageSizeSelect,
  LoadingSpinner,
  LoadingSkeleton,
  EmptyState,
  usePagination,
} from '@/components/data-display';

// Forms
import { FormError, FormSuccess } from '@/components/forms';

// API Hooks for Profile
import {
  useProfileList,
  useProfile,
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
  profileKeys,
} from '@/lib/api-client';


// Forms for Profile
import {
  CreateProfileForm,
  EditProfileForm,
} from '@/components/forms';

// Types for Profile
import type {
  Profile,
  ProfileId,
  ProfileFilters,
} from '@/types/domain';

// API Hooks for Client
import {
  useClientList,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  clientKeys,
} from '@/lib/api-client';


// Forms for Client
import {
  CreateClientForm,
  EditClientForm,
} from '@/components/forms';

// Types for Client
import type {
  Client,
  ClientId,
  ClientFilters,
} from '@/types/domain';

// API Hooks for Service
import {
  useServiceList,
  useService,
  useCreateService,
  useUpdateService,
  useDeleteService,
  serviceKeys,
} from '@/lib/api-client';


// Forms for Service
import {
  CreateServiceForm,
  EditServiceForm,
} from '@/components/forms';

// Types for Service
import type {
  Service,
  ServiceId,
  ServiceFilters,
} from '@/types/domain';

// API Hooks for Appointment
import {
  useAppointmentList,
  useAppointment,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  appointmentKeys,
  useTransitionAppointment,
} from '@/lib/api-client';

// State machine helpers for Appointment (client-safe)
import {
  appointmentStates,
  appointmentTransitions,
  getAppointmentAllowedTransitions,
  type AppointmentTransitionName,
} from '@/lib/state-machines';

// Forms for Appointment
import {
  CreateAppointmentForm,
  EditAppointmentForm,
} from '@/components/forms';

// Types for Appointment
import type {
  Appointment,
  AppointmentId,
  AppointmentFilters,
} from '@/types/domain';

// API Hooks for Availability
import {
  useAvailabilityList,
  useAvailability,
  useCreateAvailability,
  useUpdateAvailability,
  useDeleteAvailability,
  availabilityKeys,
} from '@/lib/api-client';


// Forms for Availability
import {
  CreateAvailabilityForm,
  EditAvailabilityForm,
} from '@/components/forms';

// Types for Availability
import type {
  Availability,
  AvailabilityId,
  AvailabilityFilters,
} from '@/types/domain';

// API Hooks for Document
import {
  useDocumentList,
  useDocument,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  documentKeys,
  useTransitionDocument,
} from '@/lib/api-client';

// State machine helpers for Document (client-safe)
import {
  documentStates,
  documentTransitions,
  getDocumentAllowedTransitions,
  type DocumentTransitionName,
} from '@/lib/state-machines';

// Forms for Document
import {
  CreateDocumentForm,
  EditDocumentForm,
} from '@/components/forms';

// Types for Document
import type {
  Document,
  DocumentId,
  DocumentFilters,
} from '@/types/domain';


// ============================================================
// SHARED ICONS (inline SVGs for zero dependencies)
// ============================================================

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

// ============================================================
// PROFILE LIST PAGE
// Route: /profile
// ============================================================

interface ProfileListPageProps {
  /** Initial filters from server-side props or searchParams */
  initialFilters?: ProfileFilters;
}

/**
 * List page for Profile with pagination, search, and filters.
 * Uses DataTable for consistent data presentation.
 *
 * @example
 * // app/(dashboard)/profile/page.tsx
 * export default function Page() {
 *   return <ProfileListPage />;
 * }
 */
function ProfileListPage({ initialFilters }: ProfileListPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Pagination
  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    getPaginationInfo,
  } = usePagination({ syncWithUrl: true });

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Simple debounce - in production use lodash.debounce or useDebouncedValue
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [setPage]);

  // Build filters
  const filters: ProfileFilters = {
    ...initialFilters,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  // Fetch data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useProfileList(filters, { page, limit: pageSize });

  // Delete state
  const [deleteId, setDeleteId] = useState<ProfileId | null>(null);
  const deleteMutation = useDeleteProfile({
    onSuccess: () => {
      setDeleteId(null);
      refetch();
    },
  });

  // Handle delete
  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  // Calculate pagination info
  const paginationInfo = data
    ? getPaginationInfo(data.total)
    : { from: 0, to: 0, total: 0, totalPages: 0 };

  // Table columns
  const columns = [
    {
      header: '',
      accessor: (row: Profile) => (
        <ProfileRowActions
          profile={row}
          onEdit={() => router.push(`/profile/${row.id}/edit`)}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
      className: 'w-[50px]',
    },
  ];

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profiles</h1>
            <p className="text-muted-foreground">
              Manage your profiles
            </p>
          </div>
          <Button asChild>
            <Link href="/profile/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Profile
            </Link>
          </Button>
        </header>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              aria-label="Search profiles"
            />
          </div>
          {/* Add filter dropdowns here as needed */}
        </div>

        {/* Error State */}
        {isError && (
          <FormError message={error?.message || 'Failed to load profiles'} />
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          loadingRows={pageSize}
          getRowKey={(row) => row.id}
          emptyState={{
            icon: <FileIcon className="h-12 w-12" />,
            title: debouncedSearch
              ? `No profiles found for "${debouncedSearch}"`
              : 'No profiles yet',
            description: debouncedSearch
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first profile.',
            action: !debouncedSearch
              ? {
                  label: 'Create Profile',
                  onClick: () => router.push('/profile/new'),
                }
              : undefined,
          }}
          pagination={{
            currentPage: page,
            totalPages: paginationInfo.totalPages,
            onPageChange: setPage,
            pageSize,
            onPageSizeChange: setPageSize,
            total: paginationInfo.total,
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this profile? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// PROFILE ROW ACTIONS
// ============================================================

interface ProfileRowActionsProps {
  profile: Profile;
  onEdit: () => void;
  onDelete: () => void;
}

function ProfileRowActions({
  profile,
  onEdit,
  onDelete,
}: ProfileRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Open actions menu"
        >
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/profile/${ profile.id }`}>
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <EditIcon className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// PROFILE DETAIL PAGE
// Route: /profile/[id]
// ============================================================

interface ProfileDetailPageProps {
  /** Profile ID from route params */
  id: string;
}

/**
 * Detail page for viewing a single Profile.
 * Displays all fields with edit/delete actions.
 *
 * @example
 * // app/(dashboard)/profile/[id]/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <ProfileDetailPage id={params.id} />;
 * }
 */
function ProfileDetailPage({ id }: ProfileDetailPageProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch Profile data
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useProfile(id as ProfileId);

  // Delete mutation
  const deleteMutation = useDeleteProfile({
    onSuccess: () => {
      router.push('/profile');
    },
  });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id as ProfileId);
  };


  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Profile not found"
                description={error?.message || 'The profile you are looking for does not exist or has been deleted.'}
                action={{
                  label: 'Back to profiles',
                  onClick: () => router.push('/profile'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/profile')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to profiles
        </Button>

        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Profile Details
            </h1>
            <p className="text-muted-foreground">
              View and manage this profile
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/profile/${id}/edit`}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </header>


        {/* Detail Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Created {new Date(profile.createdAt).toLocaleDateString()}
              { profile.updatedAt && (
                <> | Updated {new Date(profile.updatedAt).toLocaleDateString()}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.id || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.userId || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.email || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.name || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.firmName || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.licenseNumber || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.timezone || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.subscriptionTier || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.bookingSlug || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.taxSeasonStart
                    ? new Date(profile.taxSeasonStart).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.taxSeasonEnd
                    ? new Date(profile.taxSeasonEnd).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.maxDailyAppointments || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.maxDailyAppointmentsTaxSeason || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { profile.updatedAt
                    ? new Date(profile.updatedAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this profile? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// PROFILE CREATE PAGE
// Route: /profile/new
// ============================================================

/**
 * Create page for adding a new Profile.
 * Uses CreateProfileForm with validation.
 *
 * @example
 * // app/(dashboard)/profile/new/page.tsx
 * export default function Page() {
 *   return <ProfileCreatePage />;
 * }
 */
function ProfileCreatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createMutation = useCreateProfile({
    onSuccess: (created) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/profile/${created.id}`);
      }, 500);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/profile')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to profiles
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Create Profile</h1>
          <p className="text-muted-foreground">
            Add a new profile to your collection
          </p>
        </header>

        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Fill in the information below to create a new profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Profile created successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <CreateProfileForm
                onSuccess={async (data) => {
                  setError(null);
                  await createMutation.mutateAsync(data);
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push('/profile')}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// PROFILE EDIT PAGE
// Route: /profile/[id]/edit
// ============================================================

interface ProfileEditPageProps {
  /** Profile ID from route params */
  id: string;
}

/**
 * Edit page for updating an existing Profile.
 * Uses EditProfileForm pre-populated with current values.
 *
 * @example
 * // app/(dashboard)/profile/[id]/edit/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <ProfileEditPage id={params.id} />;
 * }
 */
function ProfileEditPage({ id }: ProfileEditPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current Profile data
  const {
    data: profile,
    isLoading,
    isError,
    error: fetchError,
  } = useProfile(id as ProfileId);

  // Update mutation
  const updateMutation = useUpdateProfile({
    onSuccess: (_data, _variables, _context) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/profile/${id}`);
      }, 500);
    },
    onError: (err, _variables, _context) => {
      setError(err.message);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Profile not found"
                description={fetchError?.message || 'The profile you are trying to edit does not exist.'}
                action={{
                  label: 'Back to profiles',
                  onClick: () => router.push('/profile'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/profile/${id}`)}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to profile details
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update the information for this profile
          </p>
        </header>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Make changes to the profile information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Profile updated successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <EditProfileForm
                profile={ profile }
                onSuccess={async (data) => {
                  setError(null);
                  await updateMutation.mutateAsync({ id: id as ProfileId, data });
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push(`/profile/${id}`)}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// PROFILE CARD VIEW (Alternative to Table)
// ============================================================

interface ProfileCardProps {
  profile: Profile;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Card component for displaying a single Profile in a grid view.
 * Alternative to table row for more visual layouts.
 *
 * @example
 * <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 *   { profiles.map((item) => (
 *     <ProfileCard
 *       key={item.id}
 *       profile={item}
 *       onEdit={() => router.push(`/profile/${item.id}/edit`)}
 *       onDelete={() => handleDelete(item.id)}
 *     />
 *   ))}
 * </div>
 */
function ProfileCard({ profile, onEdit, onDelete }: ProfileCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            <Link
              href={`/profile/${ profile.id }`}
              className="hover:underline"
            >
              Profile #{ profile.id.slice(0, 8) }
            </Link>
          </CardTitle>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/profile/${ profile.id }`}>
                  View details
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Created {new Date(profile.createdAt).toLocaleDateString()}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// CLIENT LIST PAGE
// Route: /client
// ============================================================

interface ClientListPageProps {
  /** Initial filters from server-side props or searchParams */
  initialFilters?: ClientFilters;
}

/**
 * List page for Client with pagination, search, and filters.
 * Uses DataTable for consistent data presentation.
 *
 * @example
 * // app/(dashboard)/client/page.tsx
 * export default function Page() {
 *   return <ClientListPage />;
 * }
 */
function ClientListPage({ initialFilters }: ClientListPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Pagination
  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    getPaginationInfo,
  } = usePagination({ syncWithUrl: true });

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Simple debounce - in production use lodash.debounce or useDebouncedValue
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [setPage]);

  // Build filters
  const filters: ClientFilters = {
    ...initialFilters,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  // Fetch data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useClientList(filters, { page, limit: pageSize });

  // Delete state
  const [deleteId, setDeleteId] = useState<ClientId | null>(null);
  const deleteMutation = useDeleteClient({
    onSuccess: () => {
      setDeleteId(null);
      refetch();
    },
  });

  // Handle delete
  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  // Calculate pagination info
  const paginationInfo = data
    ? getPaginationInfo(data.total)
    : { from: 0, to: 0, total: 0, totalPages: 0 };

  // Table columns
  const columns = [
    {
      header: '',
      accessor: (row: Client) => (
        <ClientRowActions
          client={row}
          onEdit={() => router.push(`/client/${row.id}/edit`)}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
      className: 'w-[50px]',
    },
  ];

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">
              Manage your clients
            </p>
          </div>
          <Button asChild>
            <Link href="/client/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Client
            </Link>
          </Button>
        </header>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              aria-label="Search clients"
            />
          </div>
          {/* Add filter dropdowns here as needed */}
        </div>

        {/* Error State */}
        {isError && (
          <FormError message={error?.message || 'Failed to load clients'} />
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          loadingRows={pageSize}
          getRowKey={(row) => row.id}
          emptyState={{
            icon: <FileIcon className="h-12 w-12" />,
            title: debouncedSearch
              ? `No clients found for "${debouncedSearch}"`
              : 'No clients yet',
            description: debouncedSearch
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first client.',
            action: !debouncedSearch
              ? {
                  label: 'Create Client',
                  onClick: () => router.push('/client/new'),
                }
              : undefined,
          }}
          pagination={{
            currentPage: page,
            totalPages: paginationInfo.totalPages,
            onPageChange: setPage,
            pageSize,
            onPageSizeChange: setPageSize,
            total: paginationInfo.total,
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this client? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// CLIENT ROW ACTIONS
// ============================================================

interface ClientRowActionsProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}

function ClientRowActions({
  client,
  onEdit,
  onDelete,
}: ClientRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Open actions menu"
        >
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/client/${ client.id }`}>
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <EditIcon className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// CLIENT DETAIL PAGE
// Route: /client/[id]
// ============================================================

interface ClientDetailPageProps {
  /** Client ID from route params */
  id: string;
}

/**
 * Detail page for viewing a single Client.
 * Displays all fields with edit/delete actions.
 *
 * @example
 * // app/(dashboard)/client/[id]/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <ClientDetailPage id={params.id} />;
 * }
 */
function ClientDetailPage({ id }: ClientDetailPageProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch Client data
  const {
    data: client,
    isLoading,
    isError,
    error,
  } = useClient(id as ClientId);

  // Delete mutation
  const deleteMutation = useDeleteClient({
    onSuccess: () => {
      router.push('/client');
    },
  });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id as ClientId);
  };


  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Client not found"
                description={error?.message || 'The client you are looking for does not exist or has been deleted.'}
                action={{
                  label: 'Back to clients',
                  onClick: () => router.push('/client'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/client')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to clients
        </Button>

        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Client Details
            </h1>
            <p className="text-muted-foreground">
              View and manage this client
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/client/${id}/edit`}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </header>


        {/* Detail Card */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Created {new Date(client.createdAt).toLocaleDateString()}
              { client.updatedAt && (
                <> | Updated {new Date(client.updatedAt).toLocaleDateString()}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.id || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.userId || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.name || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.email || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.phone || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.taxIdLast4 || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.filingStatus || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.preferredContact || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.notes || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.createdAt
                    ? new Date(client.createdAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { client.updatedAt
                    ? new Date(client.updatedAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this client? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// CLIENT CREATE PAGE
// Route: /client/new
// ============================================================

/**
 * Create page for adding a new Client.
 * Uses CreateClientForm with validation.
 *
 * @example
 * // app/(dashboard)/client/new/page.tsx
 * export default function Page() {
 *   return <ClientCreatePage />;
 * }
 */
function ClientCreatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createMutation = useCreateClient({
    onSuccess: (created) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/client/${created.id}`);
      }, 500);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/client')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to clients
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Create Client</h1>
          <p className="text-muted-foreground">
            Add a new client to your collection
          </p>
        </header>

        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>
              Fill in the information below to create a new client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Client created successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <CreateClientForm
                onSuccess={async (data) => {
                  setError(null);
                  await createMutation.mutateAsync(data);
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push('/client')}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// CLIENT EDIT PAGE
// Route: /client/[id]/edit
// ============================================================

interface ClientEditPageProps {
  /** Client ID from route params */
  id: string;
}

/**
 * Edit page for updating an existing Client.
 * Uses EditClientForm pre-populated with current values.
 *
 * @example
 * // app/(dashboard)/client/[id]/edit/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <ClientEditPage id={params.id} />;
 * }
 */
function ClientEditPage({ id }: ClientEditPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current Client data
  const {
    data: client,
    isLoading,
    isError,
    error: fetchError,
  } = useClient(id as ClientId);

  // Update mutation
  const updateMutation = useUpdateClient({
    onSuccess: (_data, _variables, _context) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/client/${id}`);
      }, 500);
    },
    onError: (err, _variables, _context) => {
      setError(err.message);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Client not found"
                description={fetchError?.message || 'The client you are trying to edit does not exist.'}
                action={{
                  label: 'Back to clients',
                  onClick: () => router.push('/client'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/client/${id}`)}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to client details
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
          <p className="text-muted-foreground">
            Update the information for this client
          </p>
        </header>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>
              Make changes to the client information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Client updated successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <EditClientForm
                client={ client }
                onSuccess={async (data) => {
                  setError(null);
                  await updateMutation.mutateAsync({ id: id as ClientId, data });
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push(`/client/${id}`)}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// CLIENT CARD VIEW (Alternative to Table)
// ============================================================

interface ClientCardProps {
  client: Client;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Card component for displaying a single Client in a grid view.
 * Alternative to table row for more visual layouts.
 *
 * @example
 * <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 *   { clients.map((item) => (
 *     <ClientCard
 *       key={item.id}
 *       client={item}
 *       onEdit={() => router.push(`/client/${item.id}/edit`)}
 *       onDelete={() => handleDelete(item.id)}
 *     />
 *   ))}
 * </div>
 */
function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            <Link
              href={`/client/${ client.id }`}
              className="hover:underline"
            >
              Client #{ client.id.slice(0, 8) }
            </Link>
          </CardTitle>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/client/${ client.id }`}>
                  View details
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Created {new Date(client.createdAt).toLocaleDateString()}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// SERVICE LIST PAGE
// Route: /service
// ============================================================

interface ServiceListPageProps {
  /** Initial filters from server-side props or searchParams */
  initialFilters?: ServiceFilters;
}

/**
 * List page for Service with pagination, search, and filters.
 * Uses DataTable for consistent data presentation.
 *
 * @example
 * // app/(dashboard)/service/page.tsx
 * export default function Page() {
 *   return <ServiceListPage />;
 * }
 */
function ServiceListPage({ initialFilters }: ServiceListPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Pagination
  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    getPaginationInfo,
  } = usePagination({ syncWithUrl: true });

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Simple debounce - in production use lodash.debounce or useDebouncedValue
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [setPage]);

  // Build filters
  const filters: ServiceFilters = {
    ...initialFilters,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  // Fetch data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useServiceList(filters, { page, limit: pageSize });

  // Delete state
  const [deleteId, setDeleteId] = useState<ServiceId | null>(null);
  const deleteMutation = useDeleteService({
    onSuccess: () => {
      setDeleteId(null);
      refetch();
    },
  });

  // Handle delete
  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  // Calculate pagination info
  const paginationInfo = data
    ? getPaginationInfo(data.total)
    : { from: 0, to: 0, total: 0, totalPages: 0 };

  // Table columns
  const columns = [
    {
      header: '',
      accessor: (row: Service) => (
        <ServiceRowActions
          service={row}
          onEdit={() => router.push(`/service/${row.id}/edit`)}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
      className: 'w-[50px]',
    },
  ];

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services</h1>
            <p className="text-muted-foreground">
              Manage your services
            </p>
          </div>
          <Button asChild>
            <Link href="/service/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Service
            </Link>
          </Button>
        </header>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              aria-label="Search services"
            />
          </div>
          {/* Add filter dropdowns here as needed */}
        </div>

        {/* Error State */}
        {isError && (
          <FormError message={error?.message || 'Failed to load services'} />
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          loadingRows={pageSize}
          getRowKey={(row) => row.id}
          emptyState={{
            icon: <FileIcon className="h-12 w-12" />,
            title: debouncedSearch
              ? `No services found for "${debouncedSearch}"`
              : 'No services yet',
            description: debouncedSearch
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first service.',
            action: !debouncedSearch
              ? {
                  label: 'Create Service',
                  onClick: () => router.push('/service/new'),
                }
              : undefined,
          }}
          pagination={{
            currentPage: page,
            totalPages: paginationInfo.totalPages,
            onPageChange: setPage,
            pageSize,
            onPageSizeChange: setPageSize,
            total: paginationInfo.total,
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this service? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// SERVICE ROW ACTIONS
// ============================================================

interface ServiceRowActionsProps {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}

function ServiceRowActions({
  service,
  onEdit,
  onDelete,
}: ServiceRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Open actions menu"
        >
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/service/${ service.id }`}>
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <EditIcon className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// SERVICE DETAIL PAGE
// Route: /service/[id]
// ============================================================

interface ServiceDetailPageProps {
  /** Service ID from route params */
  id: string;
}

/**
 * Detail page for viewing a single Service.
 * Displays all fields with edit/delete actions.
 *
 * @example
 * // app/(dashboard)/service/[id]/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <ServiceDetailPage id={params.id} />;
 * }
 */
function ServiceDetailPage({ id }: ServiceDetailPageProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch Service data
  const {
    data: service,
    isLoading,
    isError,
    error,
  } = useService(id as ServiceId);

  // Delete mutation
  const deleteMutation = useDeleteService({
    onSuccess: () => {
      router.push('/service');
    },
  });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id as ServiceId);
  };


  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Service not found"
                description={error?.message || 'The service you are looking for does not exist or has been deleted.'}
                action={{
                  label: 'Back to services',
                  onClick: () => router.push('/service'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/service')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to services
        </Button>

        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Service Details
            </h1>
            <p className="text-muted-foreground">
              View and manage this service
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/service/${id}/edit`}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </header>


        {/* Detail Card */}
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
            <CardDescription>
              Created {new Date(service.createdAt).toLocaleDateString()}
              { service.updatedAt && (
                <> | Updated {new Date(service.updatedAt).toLocaleDateString()}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.id || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.userId || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.name || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.description || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.durationMinutes || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.price || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.taxSeasonOnly ? 'Yes' : 'No' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.requiresDocuments ? 'Yes' : 'No' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.isActive ? 'Yes' : 'No' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.bufferMinutes || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.createdAt
                    ? new Date(service.createdAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { service.updatedAt
                    ? new Date(service.updatedAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this service? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// SERVICE CREATE PAGE
// Route: /service/new
// ============================================================

/**
 * Create page for adding a new Service.
 * Uses CreateServiceForm with validation.
 *
 * @example
 * // app/(dashboard)/service/new/page.tsx
 * export default function Page() {
 *   return <ServiceCreatePage />;
 * }
 */
function ServiceCreatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createMutation = useCreateService({
    onSuccess: (created) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/service/${created.id}`);
      }, 500);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/service')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to services
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Create Service</h1>
          <p className="text-muted-foreground">
            Add a new service to your collection
          </p>
        </header>

        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>
              Fill in the information below to create a new service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Service created successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <CreateServiceForm
                onSuccess={async (data) => {
                  setError(null);
                  await createMutation.mutateAsync(data);
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push('/service')}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// SERVICE EDIT PAGE
// Route: /service/[id]/edit
// ============================================================

interface ServiceEditPageProps {
  /** Service ID from route params */
  id: string;
}

/**
 * Edit page for updating an existing Service.
 * Uses EditServiceForm pre-populated with current values.
 *
 * @example
 * // app/(dashboard)/service/[id]/edit/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <ServiceEditPage id={params.id} />;
 * }
 */
function ServiceEditPage({ id }: ServiceEditPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current Service data
  const {
    data: service,
    isLoading,
    isError,
    error: fetchError,
  } = useService(id as ServiceId);

  // Update mutation
  const updateMutation = useUpdateService({
    onSuccess: (_data, _variables, _context) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/service/${id}`);
      }, 500);
    },
    onError: (err, _variables, _context) => {
      setError(err.message);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Service not found"
                description={fetchError?.message || 'The service you are trying to edit does not exist.'}
                action={{
                  label: 'Back to services',
                  onClick: () => router.push('/service'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/service/${id}`)}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to service details
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Edit Service</h1>
          <p className="text-muted-foreground">
            Update the information for this service
          </p>
        </header>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>
              Make changes to the service information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Service updated successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <EditServiceForm
                service={ service }
                onSuccess={async (data) => {
                  setError(null);
                  await updateMutation.mutateAsync({ id: id as ServiceId, data });
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push(`/service/${id}`)}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// SERVICE CARD VIEW (Alternative to Table)
// ============================================================

interface ServiceCardProps {
  service: Service;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Card component for displaying a single Service in a grid view.
 * Alternative to table row for more visual layouts.
 *
 * @example
 * <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 *   { services.map((item) => (
 *     <ServiceCard
 *       key={item.id}
 *       service={item}
 *       onEdit={() => router.push(`/service/${item.id}/edit`)}
 *       onDelete={() => handleDelete(item.id)}
 *     />
 *   ))}
 * </div>
 */
function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            <Link
              href={`/service/${ service.id }`}
              className="hover:underline"
            >
              Service #{ service.id.slice(0, 8) }
            </Link>
          </CardTitle>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/service/${ service.id }`}>
                  View details
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Created {new Date(service.createdAt).toLocaleDateString()}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// APPOINTMENT LIST PAGE
// Route: /appointment
// ============================================================

interface AppointmentListPageProps {
  /** Initial filters from server-side props or searchParams */
  initialFilters?: AppointmentFilters;
}

/**
 * List page for Appointment with pagination, search, and filters.
 * Uses DataTable for consistent data presentation.
 *
 * @example
 * // app/(dashboard)/appointment/page.tsx
 * export default function Page() {
 *   return <AppointmentListPage />;
 * }
 */
function AppointmentListPage({ initialFilters }: AppointmentListPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Pagination
  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    getPaginationInfo,
  } = usePagination({ syncWithUrl: true });

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Simple debounce - in production use lodash.debounce or useDebouncedValue
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [setPage]);

  // Build filters
  const filters: AppointmentFilters = {
    ...initialFilters,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  // Fetch data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAppointmentList(filters, { page, limit: pageSize });

  // Delete state
  const [deleteId, setDeleteId] = useState<AppointmentId | null>(null);
  const deleteMutation = useDeleteAppointment({
    onSuccess: () => {
      setDeleteId(null);
      refetch();
    },
  });

  // Handle delete
  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  // Calculate pagination info
  const paginationInfo = data
    ? getPaginationInfo(data.total)
    : { from: 0, to: 0, total: 0, totalPages: 0 };

  // Table columns
  const columns = [
    {
      header: '',
      accessor: (row: Appointment) => (
        <AppointmentRowActions
          appointment={row}
          onEdit={() => router.push(`/appointment/${row.id}/edit`)}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
      className: 'w-[50px]',
    },
  ];

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">
              Manage your appointments
            </p>
          </div>
          <Button asChild>
            <Link href="/appointment/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Appointment
            </Link>
          </Button>
        </header>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              aria-label="Search appointments"
            />
          </div>
          {/* Add filter dropdowns here as needed */}
        </div>

        {/* Error State */}
        {isError && (
          <FormError message={error?.message || 'Failed to load appointments'} />
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          loadingRows={pageSize}
          getRowKey={(row) => row.id}
          emptyState={{
            icon: <FileIcon className="h-12 w-12" />,
            title: debouncedSearch
              ? `No appointments found for "${debouncedSearch}"`
              : 'No appointments yet',
            description: debouncedSearch
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first appointment.',
            action: !debouncedSearch
              ? {
                  label: 'Create Appointment',
                  onClick: () => router.push('/appointment/new'),
                }
              : undefined,
          }}
          pagination={{
            currentPage: page,
            totalPages: paginationInfo.totalPages,
            onPageChange: setPage,
            pageSize,
            onPageSizeChange: setPageSize,
            total: paginationInfo.total,
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// APPOINTMENT ROW ACTIONS
// ============================================================

interface AppointmentRowActionsProps {
  appointment: Appointment;
  onEdit: () => void;
  onDelete: () => void;
}

function AppointmentRowActions({
  appointment,
  onEdit,
  onDelete,
}: AppointmentRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Open actions menu"
        >
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/appointment/${ appointment.id }`}>
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <EditIcon className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// APPOINTMENT DETAIL PAGE
// Route: /appointment/[id]
// ============================================================

interface AppointmentDetailPageProps {
  /** Appointment ID from route params */
  id: string;
}

/**
 * Detail page for viewing a single Appointment.
 * Displays all fields with edit/delete actions.
 *
 * @example
 * // app/(dashboard)/appointment/[id]/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <AppointmentDetailPage id={params.id} />;
 * }
 */
function AppointmentDetailPage({ id }: AppointmentDetailPageProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch Appointment data
  const {
    data: appointment,
    isLoading,
    isError,
    error,
  } = useAppointment(id as AppointmentId);

  // Delete mutation
  const deleteMutation = useDeleteAppointment({
    onSuccess: () => {
      router.push('/appointment');
    },
  });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id as AppointmentId);
  };

  // State machine transitions
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const transitionMutation = useTransitionAppointment({
    onSuccess: () => {
      setTransitionError(null);
    },
    onError: (err: Error) => {
      setTransitionError(err.message);
    },
  });

  const handleTransition = async (transition: AppointmentTransitionName) => {
    setTransitionError(null);
    await transitionMutation.mutateAsync({ id: id as AppointmentId, transition });
  };

  // Get current state and allowed transitions
  const currentState = appointment?.status as string | undefined;
  const allowedTransitions = currentState ? getAppointmentAllowedTransitions(currentState) : [];

  // State badge colors
  const stateColors: Record<string, string> = {
    'draft': 'gray',
    'confirmed': 'blue',
    'in_progress': 'yellow',
    'completed': 'green',
    'cancelled': 'red',
    'no_show': 'red',
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Appointment not found"
                description={error?.message || 'The appointment you are looking for does not exist or has been deleted.'}
                action={{
                  label: 'Back to appointments',
                  onClick: () => router.push('/appointment'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/appointment')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to appointments
        </Button>

        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Appointment Details
            </h1>
            <p className="text-muted-foreground">
              View and manage this appointment
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/appointment/${id}/edit`}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </header>

        {/* State Machine Actions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Status</CardTitle>
                {currentState && (
                  <Badge className={stateColors[currentState] || 'bg-gray-100 text-gray-800'}>
                    {currentState}
                  </Badge>
                )}
              </div>
              {allowedTransitions.length > 0 && (
                <div className="flex gap-2">
                  {allowedTransitions.map((transition) => {
                    const transitionInfo = appointmentTransitions[transition];
                    return (
                      <Button
                        key={transition}
                        size="sm"
                        variant="outline"
                        onClick={() => handleTransition(transition)}
                        disabled={transitionMutation.isPending}
                      >
                        {transitionMutation.isPending ? (
                          <LoadingSpinner className="h-4 w-4" />
                        ) : (
                          transition.replace(/([A-Z])/g, ' $1').trim()
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
            {transitionError && (
              <FormError message={transitionError} className="mt-2" />
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              {currentState === 'draft' && 'Appointment being scheduled'}
              {currentState === 'confirmed' && 'Appointment confirmed'}
              {currentState === 'in_progress' && 'Appointment currently happening'}
              {currentState === 'completed' && 'Appointment completed successfully'}
              {currentState === 'cancelled' && 'Appointment cancelled'}
              {currentState === 'no_show' && 'Client did not show up'}
            </p>
          </CardContent>
        </Card>

        {/* Detail Card */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Information</CardTitle>
            <CardDescription>
              Created {new Date(appointment.createdAt).toLocaleDateString()}
              { appointment.updatedAt && (
                <> | Updated {new Date(appointment.updatedAt).toLocaleDateString()}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.id || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.userId || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.clientId || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.serviceId || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.startsAt
                    ? new Date(appointment.startsAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.endsAt
                    ? new Date(appointment.endsAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.status || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.notes || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.meetingLink || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.reminderSent24h ? 'Yes' : 'No' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.reminderSent1h ? 'Yes' : 'No' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.cancellationReason || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.createdAt
                    ? new Date(appointment.createdAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { appointment.updatedAt
                    ? new Date(appointment.updatedAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// APPOINTMENT CREATE PAGE
// Route: /appointment/new
// ============================================================

/**
 * Create page for adding a new Appointment.
 * Uses CreateAppointmentForm with validation.
 *
 * @example
 * // app/(dashboard)/appointment/new/page.tsx
 * export default function Page() {
 *   return <AppointmentCreatePage />;
 * }
 */
function AppointmentCreatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createMutation = useCreateAppointment({
    onSuccess: (created) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/appointment/${created.id}`);
      }, 500);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/appointment')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to appointments
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Create Appointment</h1>
          <p className="text-muted-foreground">
            Add a new appointment to your collection
          </p>
        </header>

        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>
              Fill in the information below to create a new appointment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Appointment created successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <CreateAppointmentForm
                onSuccess={async (data) => {
                  setError(null);
                  await createMutation.mutateAsync(data);
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push('/appointment')}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// APPOINTMENT EDIT PAGE
// Route: /appointment/[id]/edit
// ============================================================

interface AppointmentEditPageProps {
  /** Appointment ID from route params */
  id: string;
}

/**
 * Edit page for updating an existing Appointment.
 * Uses EditAppointmentForm pre-populated with current values.
 *
 * @example
 * // app/(dashboard)/appointment/[id]/edit/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <AppointmentEditPage id={params.id} />;
 * }
 */
function AppointmentEditPage({ id }: AppointmentEditPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current Appointment data
  const {
    data: appointment,
    isLoading,
    isError,
    error: fetchError,
  } = useAppointment(id as AppointmentId);

  // Update mutation
  const updateMutation = useUpdateAppointment({
    onSuccess: (_data, _variables, _context) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/appointment/${id}`);
      }, 500);
    },
    onError: (err, _variables, _context) => {
      setError(err.message);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Appointment not found"
                description={fetchError?.message || 'The appointment you are trying to edit does not exist.'}
                action={{
                  label: 'Back to appointments',
                  onClick: () => router.push('/appointment'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/appointment/${id}`)}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to appointment details
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Edit Appointment</h1>
          <p className="text-muted-foreground">
            Update the information for this appointment
          </p>
        </header>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>
              Make changes to the appointment information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Appointment updated successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <EditAppointmentForm
                appointment={ appointment }
                onSuccess={async (data) => {
                  setError(null);
                  await updateMutation.mutateAsync({ id: id as AppointmentId, data });
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push(`/appointment/${id}`)}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// APPOINTMENT CARD VIEW (Alternative to Table)
// ============================================================

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Card component for displaying a single Appointment in a grid view.
 * Alternative to table row for more visual layouts.
 *
 * @example
 * <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 *   { appointments.map((item) => (
 *     <AppointmentCard
 *       key={item.id}
 *       appointment={item}
 *       onEdit={() => router.push(`/appointment/${item.id}/edit`)}
 *       onDelete={() => handleDelete(item.id)}
 *     />
 *   ))}
 * </div>
 */
function AppointmentCard({ appointment, onEdit, onDelete }: AppointmentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            <Link
              href={`/appointment/${ appointment.id }`}
              className="hover:underline"
            >
              Appointment #{ appointment.id.slice(0, 8) }
            </Link>
          </CardTitle>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/appointment/${ appointment.id }`}>
                  View details
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Created {new Date(appointment.createdAt).toLocaleDateString()}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// AVAILABILITY LIST PAGE
// Route: /availability
// ============================================================

interface AvailabilityListPageProps {
  /** Initial filters from server-side props or searchParams */
  initialFilters?: AvailabilityFilters;
}

/**
 * List page for Availability with pagination, search, and filters.
 * Uses DataTable for consistent data presentation.
 *
 * @example
 * // app/(dashboard)/availability/page.tsx
 * export default function Page() {
 *   return <AvailabilityListPage />;
 * }
 */
function AvailabilityListPage({ initialFilters }: AvailabilityListPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Pagination
  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    getPaginationInfo,
  } = usePagination({ syncWithUrl: true });

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Simple debounce - in production use lodash.debounce or useDebouncedValue
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [setPage]);

  // Build filters
  const filters: AvailabilityFilters = {
    ...initialFilters,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  // Fetch data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAvailabilityList(filters, { page, limit: pageSize });

  // Delete state
  const [deleteId, setDeleteId] = useState<AvailabilityId | null>(null);
  const deleteMutation = useDeleteAvailability({
    onSuccess: () => {
      setDeleteId(null);
      refetch();
    },
  });

  // Handle delete
  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  // Calculate pagination info
  const paginationInfo = data
    ? getPaginationInfo(data.total)
    : { from: 0, to: 0, total: 0, totalPages: 0 };

  // Table columns
  const columns = [
    {
      header: '',
      accessor: (row: Availability) => (
        <AvailabilityRowActions
          availability={row}
          onEdit={() => router.push(`/availability/${row.id}/edit`)}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
      className: 'w-[50px]',
    },
  ];

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Availabilities</h1>
            <p className="text-muted-foreground">
              Manage your availabilities
            </p>
          </div>
          <Button asChild>
            <Link href="/availability/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Availability
            </Link>
          </Button>
        </header>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search availabilities..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              aria-label="Search availabilities"
            />
          </div>
          {/* Add filter dropdowns here as needed */}
        </div>

        {/* Error State */}
        {isError && (
          <FormError message={error?.message || 'Failed to load availabilities'} />
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          loadingRows={pageSize}
          getRowKey={(row) => row.id}
          emptyState={{
            icon: <FileIcon className="h-12 w-12" />,
            title: debouncedSearch
              ? `No availabilities found for "${debouncedSearch}"`
              : 'No availabilities yet',
            description: debouncedSearch
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first availability.',
            action: !debouncedSearch
              ? {
                  label: 'Create Availability',
                  onClick: () => router.push('/availability/new'),
                }
              : undefined,
          }}
          pagination={{
            currentPage: page,
            totalPages: paginationInfo.totalPages,
            onPageChange: setPage,
            pageSize,
            onPageSizeChange: setPageSize,
            total: paginationInfo.total,
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Availability</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this availability? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// AVAILABILITY ROW ACTIONS
// ============================================================

interface AvailabilityRowActionsProps {
  availability: Availability;
  onEdit: () => void;
  onDelete: () => void;
}

function AvailabilityRowActions({
  availability,
  onEdit,
  onDelete,
}: AvailabilityRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Open actions menu"
        >
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/availability/${ availability.id }`}>
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <EditIcon className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// AVAILABILITY DETAIL PAGE
// Route: /availability/[id]
// ============================================================

interface AvailabilityDetailPageProps {
  /** Availability ID from route params */
  id: string;
}

/**
 * Detail page for viewing a single Availability.
 * Displays all fields with edit/delete actions.
 *
 * @example
 * // app/(dashboard)/availability/[id]/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <AvailabilityDetailPage id={params.id} />;
 * }
 */
function AvailabilityDetailPage({ id }: AvailabilityDetailPageProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch Availability data
  const {
    data: availability,
    isLoading,
    isError,
    error,
  } = useAvailability(id as AvailabilityId);

  // Delete mutation
  const deleteMutation = useDeleteAvailability({
    onSuccess: () => {
      router.push('/availability');
    },
  });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id as AvailabilityId);
  };


  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Availability not found"
                description={error?.message || 'The availability you are looking for does not exist or has been deleted.'}
                action={{
                  label: 'Back to availabilities',
                  onClick: () => router.push('/availability'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!availability) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/availability')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to availabilities
        </Button>

        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Availability Details
            </h1>
            <p className="text-muted-foreground">
              View and manage this availability
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/availability/${id}/edit`}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </header>


        {/* Detail Card */}
        <Card>
          <CardHeader>
            <CardTitle>Availability Information</CardTitle>
            <CardDescription>
              Created {new Date(availability.createdAt).toLocaleDateString()}
              { availability.updatedAt && (
                <> | Updated {new Date(availability.updatedAt).toLocaleDateString()}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { availability.id || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { availability.userId || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { availability.dayOfWeek || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { availability.startTime || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { availability.endTime || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { availability.isTaxSeason ? 'Yes' : 'No' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { availability.createdAt
                    ? new Date(availability.createdAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { availability.updatedAt
                    ? new Date(availability.updatedAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Availability</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this availability? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// AVAILABILITY CREATE PAGE
// Route: /availability/new
// ============================================================

/**
 * Create page for adding a new Availability.
 * Uses CreateAvailabilityForm with validation.
 *
 * @example
 * // app/(dashboard)/availability/new/page.tsx
 * export default function Page() {
 *   return <AvailabilityCreatePage />;
 * }
 */
function AvailabilityCreatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createMutation = useCreateAvailability({
    onSuccess: (created) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/availability/${created.id}`);
      }, 500);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/availability')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to availabilities
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Create Availability</h1>
          <p className="text-muted-foreground">
            Add a new availability to your collection
          </p>
        </header>

        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Availability Details</CardTitle>
            <CardDescription>
              Fill in the information below to create a new availability.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Availability created successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <CreateAvailabilityForm
                onSuccess={async (data) => {
                  setError(null);
                  await createMutation.mutateAsync(data);
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push('/availability')}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// AVAILABILITY EDIT PAGE
// Route: /availability/[id]/edit
// ============================================================

interface AvailabilityEditPageProps {
  /** Availability ID from route params */
  id: string;
}

/**
 * Edit page for updating an existing Availability.
 * Uses EditAvailabilityForm pre-populated with current values.
 *
 * @example
 * // app/(dashboard)/availability/[id]/edit/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <AvailabilityEditPage id={params.id} />;
 * }
 */
function AvailabilityEditPage({ id }: AvailabilityEditPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current Availability data
  const {
    data: availability,
    isLoading,
    isError,
    error: fetchError,
  } = useAvailability(id as AvailabilityId);

  // Update mutation
  const updateMutation = useUpdateAvailability({
    onSuccess: (_data, _variables, _context) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/availability/${id}`);
      }, 500);
    },
    onError: (err, _variables, _context) => {
      setError(err.message);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Availability not found"
                description={fetchError?.message || 'The availability you are trying to edit does not exist.'}
                action={{
                  label: 'Back to availabilities',
                  onClick: () => router.push('/availability'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!availability) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/availability/${id}`)}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to availability details
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Edit Availability</h1>
          <p className="text-muted-foreground">
            Update the information for this availability
          </p>
        </header>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Availability Details</CardTitle>
            <CardDescription>
              Make changes to the availability information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Availability updated successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <EditAvailabilityForm
                availability={ availability }
                onSuccess={async (data) => {
                  setError(null);
                  await updateMutation.mutateAsync({ id: id as AvailabilityId, data });
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push(`/availability/${id}`)}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// AVAILABILITY CARD VIEW (Alternative to Table)
// ============================================================

interface AvailabilityCardProps {
  availability: Availability;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Card component for displaying a single Availability in a grid view.
 * Alternative to table row for more visual layouts.
 *
 * @example
 * <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 *   { availabilitys.map((item) => (
 *     <AvailabilityCard
 *       key={item.id}
 *       availability={item}
 *       onEdit={() => router.push(`/availability/${item.id}/edit`)}
 *       onDelete={() => handleDelete(item.id)}
 *     />
 *   ))}
 * </div>
 */
function AvailabilityCard({ availability, onEdit, onDelete }: AvailabilityCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            <Link
              href={`/availability/${ availability.id }`}
              className="hover:underline"
            >
              Availability #{ availability.id.slice(0, 8) }
            </Link>
          </CardTitle>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/availability/${ availability.id }`}>
                  View details
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Created {new Date(availability.createdAt).toLocaleDateString()}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// DOCUMENT LIST PAGE
// Route: /document
// ============================================================

interface DocumentListPageProps {
  /** Initial filters from server-side props or searchParams */
  initialFilters?: DocumentFilters;
}

/**
 * List page for Document with pagination, search, and filters.
 * Uses DataTable for consistent data presentation.
 *
 * @example
 * // app/(dashboard)/document/page.tsx
 * export default function Page() {
 *   return <DocumentListPage />;
 * }
 */
function DocumentListPage({ initialFilters }: DocumentListPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Pagination
  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    getPaginationInfo,
  } = usePagination({ syncWithUrl: true });

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Simple debounce - in production use lodash.debounce or useDebouncedValue
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [setPage]);

  // Build filters
  const filters: DocumentFilters = {
    ...initialFilters,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  // Fetch data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useDocumentList(filters, { page, limit: pageSize });

  // Delete state
  const [deleteId, setDeleteId] = useState<DocumentId | null>(null);
  const deleteMutation = useDeleteDocument({
    onSuccess: () => {
      setDeleteId(null);
      refetch();
    },
  });

  // Handle delete
  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
    }
  };

  // Calculate pagination info
  const paginationInfo = data
    ? getPaginationInfo(data.total)
    : { from: 0, to: 0, total: 0, totalPages: 0 };

  // Table columns
  const columns = [
    {
      header: '',
      accessor: (row: Document) => (
        <DocumentRowActions
          document={row}
          onEdit={() => router.push(`/document/${row.id}/edit`)}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
      className: 'w-[50px]',
    },
  ];

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              Manage your documents
            </p>
          </div>
          <Button asChild>
            <Link href="/document/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Document
            </Link>
          </Button>
        </header>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              aria-label="Search documents"
            />
          </div>
          {/* Add filter dropdowns here as needed */}
        </div>

        {/* Error State */}
        {isError && (
          <FormError message={error?.message || 'Failed to load documents'} />
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          loadingRows={pageSize}
          getRowKey={(row) => row.id}
          emptyState={{
            icon: <FileIcon className="h-12 w-12" />,
            title: debouncedSearch
              ? `No documents found for "${debouncedSearch}"`
              : 'No documents yet',
            description: debouncedSearch
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first document.',
            action: !debouncedSearch
              ? {
                  label: 'Create Document',
                  onClick: () => router.push('/document/new'),
                }
              : undefined,
          }}
          pagination={{
            currentPage: page,
            totalPages: paginationInfo.totalPages,
            onPageChange: setPage,
            pageSize,
            onPageSizeChange: setPageSize,
            total: paginationInfo.total,
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this document? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// DOCUMENT ROW ACTIONS
// ============================================================

interface DocumentRowActionsProps {
  document: Document;
  onEdit: () => void;
  onDelete: () => void;
}

function DocumentRowActions({
  document,
  onEdit,
  onDelete,
}: DocumentRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Open actions menu"
        >
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/document/${ document.id }`}>
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <EditIcon className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================
// DOCUMENT DETAIL PAGE
// Route: /document/[id]
// ============================================================

interface DocumentDetailPageProps {
  /** Document ID from route params */
  id: string;
}

/**
 * Detail page for viewing a single Document.
 * Displays all fields with edit/delete actions.
 *
 * @example
 * // app/(dashboard)/document/[id]/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <DocumentDetailPage id={params.id} />;
 * }
 */
function DocumentDetailPage({ id }: DocumentDetailPageProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch Document data
  const {
    data: document,
    isLoading,
    isError,
    error,
  } = useDocument(id as DocumentId);

  // Delete mutation
  const deleteMutation = useDeleteDocument({
    onSuccess: () => {
      router.push('/document');
    },
  });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id as DocumentId);
  };

  // State machine transitions
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const transitionMutation = useTransitionDocument({
    onSuccess: () => {
      setTransitionError(null);
    },
    onError: (err: Error) => {
      setTransitionError(err.message);
    },
  });

  const handleTransition = async (transition: DocumentTransitionName) => {
    setTransitionError(null);
    await transitionMutation.mutateAsync({ id: id as DocumentId, transition });
  };

  // Get current state and allowed transitions
  const currentState = document?.status as string | undefined;
  const allowedTransitions = currentState ? getDocumentAllowedTransitions(currentState) : [];

  // State badge colors
  const stateColors: Record<string, string> = {
    'requested': 'gray',
    'uploaded': 'blue',
    'reviewed': 'yellow',
    'accepted': 'green',
    'rejected': 'red',
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Document not found"
                description={error?.message || 'The document you are looking for does not exist or has been deleted.'}
                action={{
                  label: 'Back to documents',
                  onClick: () => router.push('/document'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/document')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to documents
        </Button>

        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Document Details
            </h1>
            <p className="text-muted-foreground">
              View and manage this document
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/document/${id}/edit`}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </header>

        {/* State Machine Actions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Status</CardTitle>
                {currentState && (
                  <Badge className={stateColors[currentState] || 'bg-gray-100 text-gray-800'}>
                    {currentState}
                  </Badge>
                )}
              </div>
              {allowedTransitions.length > 0 && (
                <div className="flex gap-2">
                  {allowedTransitions.map((transition) => {
                    const transitionInfo = documentTransitions[transition];
                    return (
                      <Button
                        key={transition}
                        size="sm"
                        variant="outline"
                        onClick={() => handleTransition(transition)}
                        disabled={transitionMutation.isPending}
                      >
                        {transitionMutation.isPending ? (
                          <LoadingSpinner className="h-4 w-4" />
                        ) : (
                          transition.replace(/([A-Z])/g, ' $1').trim()
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
            {transitionError && (
              <FormError message={transitionError} className="mt-2" />
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              {currentState === 'requested' && 'Document requested from client'}
              {currentState === 'uploaded' && 'Document uploaded by client'}
              {currentState === 'reviewed' && 'Document reviewed by practitioner'}
              {currentState === 'accepted' && 'Document accepted'}
              {currentState === 'rejected' && 'Document rejected, needs resubmission'}
            </p>
          </CardContent>
        </Card>

        {/* Detail Card */}
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
            <CardDescription>
              Created {new Date(document.createdAt).toLocaleDateString()}
              { document.updatedAt && (
                <> | Updated {new Date(document.updatedAt).toLocaleDateString()}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.id || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.userId || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.clientId || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.appointmentId || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.documentType || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.fileUrl || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.fileName || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.status || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.taxYear || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.notes || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.rejectionReason || '-' }
                                  </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.createdAt
                    ? new Date(document.createdAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  
                </dt>
                <dd className="text-sm">
                  { document.updatedAt
                    ? new Date(document.updatedAt).toLocaleDateString()
                    : '-' }
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this document? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// DOCUMENT CREATE PAGE
// Route: /document/new
// ============================================================

/**
 * Create page for adding a new Document.
 * Uses CreateDocumentForm with validation.
 *
 * @example
 * // app/(dashboard)/document/new/page.tsx
 * export default function Page() {
 *   return <DocumentCreatePage />;
 * }
 */
function DocumentCreatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createMutation = useCreateDocument({
    onSuccess: (created) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/document/${created.id}`);
      }, 500);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/document')}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to documents
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Create Document</h1>
          <p className="text-muted-foreground">
            Add a new document to your collection
          </p>
        </header>

        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>
              Fill in the information below to create a new document.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Document created successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <CreateDocumentForm
                onSuccess={async (data) => {
                  setError(null);
                  await createMutation.mutateAsync(data);
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push('/document')}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// DOCUMENT EDIT PAGE
// Route: /document/[id]/edit
// ============================================================

interface DocumentEditPageProps {
  /** Document ID from route params */
  id: string;
}

/**
 * Edit page for updating an existing Document.
 * Uses EditDocumentForm pre-populated with current values.
 *
 * @example
 * // app/(dashboard)/document/[id]/edit/page.tsx
 * export default function Page({ params }: { params: { id: string } }) {
 *   return <DocumentEditPage id={params.id} />;
 * }
 */
function DocumentEditPage({ id }: DocumentEditPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current Document data
  const {
    data: document,
    isLoading,
    isError,
    error: fetchError,
  } = useDocument(id as DocumentId);

  // Update mutation
  const updateMutation = useUpdateDocument({
    onSuccess: (_data, _variables, _context) => {
      setSuccess(true);
      // Redirect to detail page after short delay
      setTimeout(() => {
        router.push(`/document/${id}`);
      }, 500);
    },
    onError: (err, _variables, _context) => {
      setError(err.message);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <div className="mb-6">
            <LoadingSkeleton variant="text" count={1} className="w-48 h-8" />
          </div>
          <Card>
            <CardHeader>
              <LoadingSkeleton variant="text" count={2} />
            </CardHeader>
            <CardContent>
              <LoadingSkeleton variant="text" count={5} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (isError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-8 max-w-2xl">
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileIcon className="h-12 w-12" />}
                title="Document not found"
                description={fetchError?.message || 'The document you are trying to edit does not exist.'}
                action={{
                  label: 'Back to documents',
                  onClick: () => router.push('/document'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <AuthGuard>
      <main className="container mx-auto py-8 max-w-2xl space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/document/${id}`)}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to document details
        </Button>

        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Edit Document</h1>
          <p className="text-muted-foreground">
            Update the information for this document
          </p>
        </header>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>
              Make changes to the document information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <FormSuccess message="Document updated successfully! Redirecting..." />
            )}
            {error && <FormError message={error} />}
            {!success && (
              <EditDocumentForm
                document={ document }
                onSuccess={async (data) => {
                  setError(null);
                  await updateMutation.mutateAsync({ id: id as DocumentId, data });
                }}
                onError={(err) => setError(err.message)}
                showCancel
                onCancel={() => router.push(`/document/${id}`)}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}

// ============================================================
// DOCUMENT CARD VIEW (Alternative to Table)
// ============================================================

interface DocumentCardProps {
  document: Document;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Card component for displaying a single Document in a grid view.
 * Alternative to table row for more visual layouts.
 *
 * @example
 * <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 *   { documents.map((item) => (
 *     <DocumentCard
 *       key={item.id}
 *       document={item}
 *       onEdit={() => router.push(`/document/${item.id}/edit`)}
 *       onDelete={() => handleDelete(item.id)}
 *     />
 *   ))}
 * </div>
 */
function DocumentCard({ document, onEdit, onDelete }: DocumentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            <Link
              href={`/document/${ document.id }`}
              className="hover:underline"
            >
              Document #{ document.id.slice(0, 8) }
            </Link>
          </CardTitle>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/document/${ document.id }`}>
                  View details
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <EditIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Created {new Date(document.createdAt).toLocaleDateString()}
      </CardFooter>
    </Card>
  );
}


// ============================================================
// DEFAULT EXPORT - Dynamic Entity Router
// ============================================================

interface PageProps {
  params: Promise<{ entity: string }>;
}

/**
 * Dynamic route handler for entity list pages.
 * Routes /users to UserListPage, /organizations to OrganizationListPage, etc.
 */
export default function EntityPage({ params }: PageProps) {
  const { entity } = use(params);

  // Map entity slug to list component (support both singular and plural URL paths)
  const entityMap: Record<string, React.ComponentType> = {
    'profile': ProfileListPage,
    'profiles': ProfileListPage,
    'client': ClientListPage,
    'clients': ClientListPage,
    'service': ServiceListPage,
    'services': ServiceListPage,
    'appointment': AppointmentListPage,
    'appointments': AppointmentListPage,
    'availability': AvailabilityListPage,
    'availabilities': AvailabilityListPage,
    'document': DocumentListPage,
    'documents': DocumentListPage,
  };

  const ListComponent = entityMap[entity];

  if (!ListComponent) {
    return (
      <AuthGuard>
        <main className="container mx-auto py-6">
          <Card>
            <CardHeader>
              <CardTitle>Entity Not Found</CardTitle>
              <CardDescription>
                The entity &quot;{entity}&quot; does not exist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Available entities: {Object.keys(entityMap).join(', ')}
              </p>
            </CardContent>
          </Card>
        </main>
      </AuthGuard>
    );
  }

  return <ListComponent />;
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
