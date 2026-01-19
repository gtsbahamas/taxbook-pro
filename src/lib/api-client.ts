/**
 * API Client Library - taxbook-pro
 * Generated: 2026-01-19
 *
 * Type-safe API client with React Query hooks for data fetching.
 * Uses TanStack Query for caching, optimistic updates, and request deduplication.
 *
 * Usage:
 *   const { data, isLoading } = useEntityList();
 *   const { mutate: create } = useCreateEntity();
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryClient,
} from '@tanstack/react-query';
import type { ApiResponse, PaginationParams, PaginatedResponse } from '@/types/api';
import type {
  Profile,
  ProfileId,
  CreateProfileInput,
  UpdateProfileInput,
  ProfileFilters,
} from '@/types/domain';
import type {
  Client,
  ClientId,
  CreateClientInput,
  UpdateClientInput,
  ClientFilters,
} from '@/types/domain';
import type {
  Service,
  ServiceId,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceFilters,
} from '@/types/domain';
import type {
  Appointment,
  AppointmentId,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentFilters,
} from '@/types/domain';
import type {
  Availability,
  AvailabilityId,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
  AvailabilityFilters,
} from '@/types/domain';
import type {
  Document,
  DocumentId,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentFilters,
} from '@/types/domain';

// ============================================================
// API CLIENT CONFIGURATION
// ============================================================

export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly getToken?: () => Promise<string | null>;
  readonly onUnauthorized?: () => void;
  readonly retryCount?: number;
  readonly retryDelay?: number;
}

const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  retryCount: 3,
  retryDelay: 1000,
};

let clientConfig: ApiClientConfig = DEFAULT_CONFIG;

/**
 * Configure the API client.
 * Call this once at app initialization.
 */
export function configureApiClient(config: Partial<ApiClientConfig>): void {
  clientConfig = { ...DEFAULT_CONFIG, ...config };
}

// ============================================================
// API CLIENT ERROR TYPES
// ============================================================

export type ApiErrorCode =
  | 'network_error'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'server_error'
  | 'unknown';

export interface ApiClientError {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly status?: number;
  readonly details?: unknown;
}

// ============================================================
// OPTIMISTIC UPDATE TYPES
// ============================================================

/**
 * Marker for temporary IDs used in optimistic updates.
 * Allows distinguishing optimistic items from server-confirmed items.
 */
export const TEMP_ID_PREFIX = '__temp__' as const;

/**
 * Type guard to check if an ID is a temporary optimistic ID.
 */
export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX);
}

/**
 * Generate a unique temporary ID for optimistic items.
 */
export function generateTempId(): string {
  return `${TEMP_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Context for optimistic mutations, storing previous state for rollback.
 */
export interface OptimisticContext<T> {
  readonly previousData: T | undefined;
  readonly previousList: PaginatedResponse<T> | undefined;
}

/**
 * Options for optimistic update behavior.
 */
export interface OptimisticOptions {
  /** Whether to update the list cache optimistically (default: true) */
  readonly updateList?: boolean;
  /** Whether to update the detail cache optimistically (default: true) */
  readonly updateDetail?: boolean;
  /** Custom rollback handler */
  readonly onRollback?: (error: Error) => void;
}

// ============================================================
// OPTIMISTIC UPDATE UTILITIES
// ============================================================

/**
 * Create an optimistic item with temporary ID and timestamps.
 * Use this when creating items before server confirmation.
 */
export function createOptimisticItem<T extends { id: string }>(
  input: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  overrides?: Partial<T>
): T {
  const now = new Date();
  return {
    id: generateTempId(),
    createdAt: now,
    updatedAt: now,
    ...input,
    ...overrides,
  } as unknown as T;
}

/**
 * Rollback optimistic changes by restoring previous cache state.
 * Generic utility for manual rollback scenarios.
 */
export function rollbackOptimistic<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  previousData: T | undefined
): void {
  if (previousData !== undefined) {
    queryClient.setQueryData(queryKey, previousData);
  } else {
    queryClient.removeQueries({ queryKey });
  }
}

/**
 * Add an item optimistically to a paginated list cache.
 * Returns the previous list state for potential rollback.
 */
export function addToListOptimistic<T extends { id: string }>(
  queryClient: QueryClient,
  listQueryKey: readonly unknown[],
  newItem: T,
  position: 'start' | 'end' = 'start'
): PaginatedResponse<T> | undefined {
  const previousList = queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);

  if (previousList) {
    const updatedItems = position === 'start'
      ? [newItem, ...previousList.items]
      : [...previousList.items, newItem];

    queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
      ...previousList,
      items: updatedItems,
      total: previousList.total + 1,
    });
  }

  return previousList;
}

/**
 * Update an item optimistically in a paginated list cache.
 * Returns the previous list state for potential rollback.
 */
export function updateInListOptimistic<T extends { id: string }>(
  queryClient: QueryClient,
  listQueryKey: readonly unknown[],
  id: string,
  updates: Partial<T>
): PaginatedResponse<T> | undefined {
  const previousList = queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);

  if (previousList) {
    queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
      ...previousList,
      items: previousList.items.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    });
  }

  return previousList;
}

/**
 * Remove an item optimistically from a paginated list cache.
 * Returns the previous list state for potential rollback.
 */
export function removeFromListOptimistic<T extends { id: string }>(
  queryClient: QueryClient,
  listQueryKey: readonly unknown[],
  id: string
): PaginatedResponse<T> | undefined {
  const previousList = queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);

  if (previousList) {
    queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
      ...previousList,
      items: previousList.items.filter((item) => item.id !== id),
      total: Math.max(0, previousList.total - 1),
    });
  }

  return previousList;
}

// ============================================================
// OPTIMISTIC UPDATE HOOKS
// ============================================================

/**
 * Hook for optimistically adding items to a list cache.
 * Returns utilities for adding, confirming, and rolling back optimistic items.
 */
export function useOptimisticCreate<T extends { id: string }>(
  listQueryKey: readonly unknown[]
) {
  const queryClient = useQueryClient();

  return {
    /**
     * Add an optimistic item to the list.
     * Returns the temp ID and previous state for rollback.
     */
    addOptimistic: (item: T, position: 'start' | 'end' = 'start') => {
      const previousList = addToListOptimistic<T>(queryClient, listQueryKey, item, position);
      return { tempId: item.id, previousList };
    },

    /**
     * Confirm an optimistic item by replacing it with the server response.
     */
    confirmOptimistic: (tempId: string, confirmedItem: T) => {
      const currentList = queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);
      if (currentList) {
        queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
          ...currentList,
          items: currentList.items.map((item) =>
            item.id === tempId ? confirmedItem : item
          ),
        });
      }
      // Also set the detail cache
      const detailKey = [...listQueryKey.slice(0, 1), 'detail', confirmedItem.id];
      queryClient.setQueryData(detailKey, confirmedItem);
    },

    /**
     * Rollback an optimistic add by restoring previous list state.
     */
    rollback: (previousList: PaginatedResponse<T> | undefined) => {
      rollbackOptimistic(queryClient, listQueryKey, previousList);
    },
  };
}

/**
 * Hook for optimistically updating items in cache.
 * Returns utilities for updating, confirming, and rolling back optimistic updates.
 */
export function useOptimisticUpdate<T extends { id: string }>(
  listQueryKey: readonly unknown[],
  getDetailKey: (id: string) => readonly unknown[]
) {
  const queryClient = useQueryClient();

  return {
    /**
     * Update an item optimistically in both list and detail caches.
     * Returns previous states for rollback.
     */
    updateOptimistic: (id: string, updates: Partial<T>) => {
      const detailKey = getDetailKey(id);

      // Get previous states
      const previousDetail = queryClient.getQueryData<T>(detailKey);
      const previousList = updateInListOptimistic<T>(queryClient, listQueryKey, id, updates);

      // Update detail cache
      if (previousDetail) {
        queryClient.setQueryData<T>(detailKey, {
          ...previousDetail,
          ...updates,
          updatedAt: new Date(),
        });
      }

      return { previousDetail, previousList };
    },

    /**
     * Confirm an optimistic update with server response.
     */
    confirmOptimistic: (confirmedItem: T) => {
      const detailKey = getDetailKey(confirmedItem.id);
      queryClient.setQueryData(detailKey, confirmedItem);

      // Update in list as well
      const currentList = queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);
      if (currentList) {
        queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
          ...currentList,
          items: currentList.items.map((item) =>
            item.id === confirmedItem.id ? confirmedItem : item
          ),
        });
      }
    },

    /**
     * Rollback an optimistic update by restoring previous states.
     */
    rollback: (
      id: string,
      previousDetail: T | undefined,
      previousList: PaginatedResponse<T> | undefined
    ) => {
      const detailKey = getDetailKey(id);
      rollbackOptimistic(queryClient, detailKey, previousDetail);
      rollbackOptimistic(queryClient, listQueryKey, previousList);
    },
  };
}

/**
 * Hook for optimistically deleting items from cache.
 * Returns utilities for removing, confirming, and rolling back optimistic deletes.
 */
export function useOptimisticDelete<T extends { id: string }>(
  listQueryKey: readonly unknown[],
  getDetailKey: (id: string) => readonly unknown[]
) {
  const queryClient = useQueryClient();

  return {
    /**
     * Remove an item optimistically from both list and detail caches.
     * Returns previous states for rollback.
     */
    deleteOptimistic: (id: string) => {
      const detailKey = getDetailKey(id);

      // Get previous states
      const previousDetail = queryClient.getQueryData<T>(detailKey);
      const previousList = removeFromListOptimistic<T>(queryClient, listQueryKey, id);

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: detailKey });

      return { previousDetail, previousList };
    },

    /**
     * Rollback an optimistic delete by restoring previous states.
     */
    rollback: (
      id: string,
      previousDetail: T | undefined,
      previousList: PaginatedResponse<T> | undefined
    ) => {
      const detailKey = getDetailKey(id);
      if (previousDetail) {
        queryClient.setQueryData(detailKey, previousDetail);
      }
      rollbackOptimistic(queryClient, listQueryKey, previousList);
    },
  };
}

// ============================================================
// API CLIENT CLASS
// ============================================================

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * Generic fetch wrapper with error handling, retries, and type safety.
   */
  async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: ApiClientError | null = null;
    const maxRetries = this.config.retryCount ?? 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const headers = new Headers(options.headers);
        headers.set('Content-Type', 'application/json');

        // Add authorization header if token is available
        if (this.config.getToken) {
          const token = await this.config.getToken();
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
        }

        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Handle unauthorized
        if (response.status === 401) {
          this.config.onUnauthorized?.();
          return {
            success: false,
            error: {
              type: 'unauthorized',
              message: 'Authentication required',
            },
          };
        }

        // Handle forbidden
        if (response.status === 403) {
          return {
            success: false,
            error: {
              type: 'forbidden',
              message: 'Access denied',
            },
          };
        }

        // Handle not found
        if (response.status === 404) {
          return {
            success: false,
            error: {
              type: 'not_found',
              message: 'Resource not found',
            },
          };
        }

        // Parse response
        const data = await response.json() as ApiResponse<T>;
        return data;
      } catch (error) {
        lastError = {
          code: 'network_error',
          message: error instanceof Error ? error.message : 'Network request failed',
        };

        // Only retry on network errors, not on HTTP errors
        if (attempt < maxRetries) {
          await this.delay(this.config.retryDelay ?? 1000);
          continue;
        }
      }
    }

    return {
      success: false,
      error: {
        type: lastError?.code ?? 'unknown',
        message: lastError?.message ?? 'Request failed',
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- HTTP Method Helpers ---

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new ApiClient(clientConfig);

// ============================================================
// QUERY KEY FACTORIES
// ============================================================

/**
 * Query keys for Profile queries.
 * Use these to invalidate or prefetch queries.
 */
export const profileKeys = {
  all: ['profile'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filters?: ProfileFilters, pagination?: PaginationParams) =>
    [...profileKeys.lists(), { filters, pagination }] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: ProfileId) => [...profileKeys.details(), id] as const,
};

/**
 * Query keys for Client queries.
 * Use these to invalidate or prefetch queries.
 */
export const clientKeys = {
  all: ['client'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters?: ClientFilters, pagination?: PaginationParams) =>
    [...clientKeys.lists(), { filters, pagination }] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: ClientId) => [...clientKeys.details(), id] as const,
};

/**
 * Query keys for Service queries.
 * Use these to invalidate or prefetch queries.
 */
export const serviceKeys = {
  all: ['service'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters?: ServiceFilters, pagination?: PaginationParams) =>
    [...serviceKeys.lists(), { filters, pagination }] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: ServiceId) => [...serviceKeys.details(), id] as const,
};

/**
 * Query keys for Appointment queries.
 * Use these to invalidate or prefetch queries.
 */
export const appointmentKeys = {
  all: ['appointment'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters?: AppointmentFilters, pagination?: PaginationParams) =>
    [...appointmentKeys.lists(), { filters, pagination }] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: AppointmentId) => [...appointmentKeys.details(), id] as const,
};

/**
 * Query keys for Availability queries.
 * Use these to invalidate or prefetch queries.
 */
export const availabilityKeys = {
  all: ['availability'] as const,
  lists: () => [...availabilityKeys.all, 'list'] as const,
  list: (filters?: AvailabilityFilters, pagination?: PaginationParams) =>
    [...availabilityKeys.lists(), { filters, pagination }] as const,
  details: () => [...availabilityKeys.all, 'detail'] as const,
  detail: (id: AvailabilityId) => [...availabilityKeys.details(), id] as const,
};

/**
 * Query keys for Document queries.
 * Use these to invalidate or prefetch queries.
 */
export const documentKeys = {
  all: ['document'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters?: DocumentFilters, pagination?: PaginationParams) =>
    [...documentKeys.lists(), { filters, pagination }] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: DocumentId) => [...documentKeys.details(), id] as const,
};


// ============================================================
// API FUNCTIONS
// ============================================================

// --- Profile API Functions ---

async function fetchProfileList(
  filters?: ProfileFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Profile>> {
  const params = new URLSearchParams();

  if (pagination?.page) params.set('page', String(pagination.page));
  if (pagination?.limit) params.set('limit', String(pagination.limit));
  if (pagination?.cursor) params.set('cursor', pagination.cursor);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
  }

  const query = params.toString();
  const endpoint = `/profile${query ? `?${query}` : ''}`;
  const response = await apiClient.get<PaginatedResponse<Profile>>(endpoint);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to fetch Profile list');
  }

  return response.data;
}

async function fetchProfile(id: ProfileId): Promise<Profile> {
  const response = await apiClient.get<Profile>(`/profile/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Profile not found');
  }

  return response.data;
}

async function createProfile(input: CreateProfileInput): Promise<Profile> {
  const response = await apiClient.post<Profile>('/profile', input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to create Profile');
  }

  return response.data;
}

async function updateProfile(
  id: ProfileId,
  input: UpdateProfileInput
): Promise<Profile> {
  const response = await apiClient.patch<Profile>(`/profile/${id}`, input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to update Profile');
  }

  return response.data;
}

async function deleteProfile(id: ProfileId): Promise<void> {
  const response = await apiClient.delete<{ deleted: true }>(`/profile/${id}`);

  if (!response.success) {
    throw new Error(response.error?.message ?? 'Failed to delete Profile');
  }
}


// --- Client API Functions ---

async function fetchClientList(
  filters?: ClientFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Client>> {
  const params = new URLSearchParams();

  if (pagination?.page) params.set('page', String(pagination.page));
  if (pagination?.limit) params.set('limit', String(pagination.limit));
  if (pagination?.cursor) params.set('cursor', pagination.cursor);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
  }

  const query = params.toString();
  const endpoint = `/client${query ? `?${query}` : ''}`;
  const response = await apiClient.get<PaginatedResponse<Client>>(endpoint);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to fetch Client list');
  }

  return response.data;
}

async function fetchClient(id: ClientId): Promise<Client> {
  const response = await apiClient.get<Client>(`/client/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Client not found');
  }

  return response.data;
}

async function createClient(input: CreateClientInput): Promise<Client> {
  const response = await apiClient.post<Client>('/client', input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to create Client');
  }

  return response.data;
}

async function updateClient(
  id: ClientId,
  input: UpdateClientInput
): Promise<Client> {
  const response = await apiClient.patch<Client>(`/client/${id}`, input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to update Client');
  }

  return response.data;
}

async function deleteClient(id: ClientId): Promise<void> {
  const response = await apiClient.delete<{ deleted: true }>(`/client/${id}`);

  if (!response.success) {
    throw new Error(response.error?.message ?? 'Failed to delete Client');
  }
}


// --- Service API Functions ---

async function fetchServiceList(
  filters?: ServiceFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Service>> {
  const params = new URLSearchParams();

  if (pagination?.page) params.set('page', String(pagination.page));
  if (pagination?.limit) params.set('limit', String(pagination.limit));
  if (pagination?.cursor) params.set('cursor', pagination.cursor);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
  }

  const query = params.toString();
  const endpoint = `/service${query ? `?${query}` : ''}`;
  const response = await apiClient.get<PaginatedResponse<Service>>(endpoint);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to fetch Service list');
  }

  return response.data;
}

async function fetchService(id: ServiceId): Promise<Service> {
  const response = await apiClient.get<Service>(`/service/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Service not found');
  }

  return response.data;
}

async function createService(input: CreateServiceInput): Promise<Service> {
  const response = await apiClient.post<Service>('/service', input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to create Service');
  }

  return response.data;
}

async function updateService(
  id: ServiceId,
  input: UpdateServiceInput
): Promise<Service> {
  const response = await apiClient.patch<Service>(`/service/${id}`, input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to update Service');
  }

  return response.data;
}

async function deleteService(id: ServiceId): Promise<void> {
  const response = await apiClient.delete<{ deleted: true }>(`/service/${id}`);

  if (!response.success) {
    throw new Error(response.error?.message ?? 'Failed to delete Service');
  }
}


// --- Appointment API Functions ---

async function fetchAppointmentList(
  filters?: AppointmentFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Appointment>> {
  const params = new URLSearchParams();

  if (pagination?.page) params.set('page', String(pagination.page));
  if (pagination?.limit) params.set('limit', String(pagination.limit));
  if (pagination?.cursor) params.set('cursor', pagination.cursor);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
  }

  const query = params.toString();
  const endpoint = `/appointment${query ? `?${query}` : ''}`;
  const response = await apiClient.get<PaginatedResponse<Appointment>>(endpoint);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to fetch Appointment list');
  }

  return response.data;
}

async function fetchAppointment(id: AppointmentId): Promise<Appointment> {
  const response = await apiClient.get<Appointment>(`/appointment/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Appointment not found');
  }

  return response.data;
}

async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  const response = await apiClient.post<Appointment>('/appointment', input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to create Appointment');
  }

  return response.data;
}

async function updateAppointment(
  id: AppointmentId,
  input: UpdateAppointmentInput
): Promise<Appointment> {
  const response = await apiClient.patch<Appointment>(`/appointment/${id}`, input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to update Appointment');
  }

  return response.data;
}

async function deleteAppointment(id: AppointmentId): Promise<void> {
  const response = await apiClient.delete<{ deleted: true }>(`/appointment/${id}`);

  if (!response.success) {
    throw new Error(response.error?.message ?? 'Failed to delete Appointment');
  }
}

async function transitionAppointment(
  id: AppointmentId,
  transition: string
): Promise<Appointment> {
  const response = await apiClient.patch<Appointment>(`/appointment/${id}/transition`, {
    transition,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to transition Appointment');
  }

  return response.data;
}

// --- Availability API Functions ---

async function fetchAvailabilityList(
  filters?: AvailabilityFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Availability>> {
  const params = new URLSearchParams();

  if (pagination?.page) params.set('page', String(pagination.page));
  if (pagination?.limit) params.set('limit', String(pagination.limit));
  if (pagination?.cursor) params.set('cursor', pagination.cursor);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
  }

  const query = params.toString();
  const endpoint = `/availability${query ? `?${query}` : ''}`;
  const response = await apiClient.get<PaginatedResponse<Availability>>(endpoint);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to fetch Availability list');
  }

  return response.data;
}

async function fetchAvailability(id: AvailabilityId): Promise<Availability> {
  const response = await apiClient.get<Availability>(`/availability/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Availability not found');
  }

  return response.data;
}

async function createAvailability(input: CreateAvailabilityInput): Promise<Availability> {
  const response = await apiClient.post<Availability>('/availability', input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to create Availability');
  }

  return response.data;
}

async function updateAvailability(
  id: AvailabilityId,
  input: UpdateAvailabilityInput
): Promise<Availability> {
  const response = await apiClient.patch<Availability>(`/availability/${id}`, input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to update Availability');
  }

  return response.data;
}

async function deleteAvailability(id: AvailabilityId): Promise<void> {
  const response = await apiClient.delete<{ deleted: true }>(`/availability/${id}`);

  if (!response.success) {
    throw new Error(response.error?.message ?? 'Failed to delete Availability');
  }
}


// --- Document API Functions ---

async function fetchDocumentList(
  filters?: DocumentFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Document>> {
  const params = new URLSearchParams();

  if (pagination?.page) params.set('page', String(pagination.page));
  if (pagination?.limit) params.set('limit', String(pagination.limit));
  if (pagination?.cursor) params.set('cursor', pagination.cursor);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
  }

  const query = params.toString();
  const endpoint = `/document${query ? `?${query}` : ''}`;
  const response = await apiClient.get<PaginatedResponse<Document>>(endpoint);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to fetch Document list');
  }

  return response.data;
}

async function fetchDocument(id: DocumentId): Promise<Document> {
  const response = await apiClient.get<Document>(`/document/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Document not found');
  }

  return response.data;
}

async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const response = await apiClient.post<Document>('/document', input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to create Document');
  }

  return response.data;
}

async function updateDocument(
  id: DocumentId,
  input: UpdateDocumentInput
): Promise<Document> {
  const response = await apiClient.patch<Document>(`/document/${id}`, input);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to update Document');
  }

  return response.data;
}

async function deleteDocument(id: DocumentId): Promise<void> {
  const response = await apiClient.delete<{ deleted: true }>(`/document/${id}`);

  if (!response.success) {
    throw new Error(response.error?.message ?? 'Failed to delete Document');
  }
}

async function transitionDocument(
  id: DocumentId,
  transition: string
): Promise<Document> {
  const response = await apiClient.patch<Document>(`/document/${id}/transition`, {
    transition,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message ?? 'Failed to transition Document');
  }

  return response.data;
}


// ============================================================
// REACT QUERY HOOKS
// ============================================================

// --- Profile Hooks ---

/**
 * Fetch paginated list of Profile.
 */
export function useProfileList(
  filters?: ProfileFilters,
  pagination?: PaginationParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Profile>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: profileKeys.list(filters, pagination),
    queryFn: () => fetchProfileList(filters, pagination),
    ...options,
  });
}

/**
 * Fetch single Profile by ID.
 */
export function useProfile(
  id: ProfileId | undefined,
  options?: Omit<UseQueryOptions<Profile>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: profileKeys.detail(id!),
    queryFn: () => fetchProfile(id!),
    enabled: !!id,
    ...options,
  });
}

/**
 * Context type for Profile create mutation optimistic updates.
 */
interface ProfileCreateContext {
  tempId: string;
  previousList: PaginatedResponse<Profile> | undefined;
}

/**
 * Create a new Profile.
 * Uses optimistic updates to immediately show the new item in lists.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useCreateProfile(
  options?: Omit<
    UseMutationOptions<Profile, Error, CreateProfileInput, ProfileCreateContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<Profile, Error, CreateProfileInput, ProfileCreateContext>({
    mutationFn: createProfile,
    onMutate: async (input) => {
      if (!updateList) {
        return { tempId: '', previousList: undefined };
      }

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: profileKeys.lists() });

      // Create optimistic item
      const optimisticItem = createOptimisticItem<Profile>(
        input as unknown as Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>
      );

      // Add to list cache optimistically
      const previousList = addToListOptimistic<Profile>(
        queryClient,
        profileKeys.lists(),
        optimisticItem,
        'start'
      );

      return { tempId: optimisticItem.id, previousList };
    },
    onError: (error, _input, context) => {
      // Rollback optimistic update on error
      if (context?.previousList) {
        rollbackOptimistic(queryClient, profileKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data, _variables, context) => {
      // Replace optimistic item with server response
      if (context?.tempId) {
        const currentList = queryClient.getQueryData<PaginatedResponse<Profile>>(
          profileKeys.lists()
        );
        if (currentList) {
          queryClient.setQueryData<PaginatedResponse<Profile>>(
            profileKeys.lists(),
            {
              ...currentList,
              items: currentList.items.map((item) =>
                item.id === context.tempId ? data : item
              ),
            }
          );
        }
      }
      // Set the detail cache with server response
      queryClient.setQueryData(profileKeys.detail(data.id), data);
    },
    onSettled: () => {
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

/**
 * Context type for Profile update mutation optimistic updates.
 */
interface ProfileUpdateContext {
  previousDetail: Profile | undefined;
  previousList: PaginatedResponse<Profile> | undefined;
}

/**
 * Update an existing Profile.
 * Uses optimistic updates to immediately reflect changes.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useUpdateProfile(
  options?: Omit<
    UseMutationOptions<
      Profile,
      Error,
      { id: ProfileId; data: UpdateProfileInput },
      ProfileUpdateContext
    >,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, updateDetail = true, onRollback } = options ?? {};

  return useMutation<Profile, Error, { id: ProfileId; data: UpdateProfileInput }, ProfileUpdateContext>({
    mutationFn: ({ id, data }) => updateProfile(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: profileKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Profile>(
        profileKeys.detail(id)
      );

      let previousList: PaginatedResponse<Profile> | undefined;

      // Optimistically update detail cache
      if (updateDetail && previousDetail) {
        queryClient.setQueryData<Profile>(profileKeys.detail(id), {
          ...previousDetail,
          ...data,
          updatedAt: new Date(),
        });
      }

      // Optimistically update list cache
      if (updateList) {
        previousList = updateInListOptimistic<Profile>(
          queryClient,
          profileKeys.lists(),
          id,
          data as Partial<Profile>
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(profileKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, profileKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data) => {
      // Update caches with confirmed server data
      queryClient.setQueryData(profileKeys.detail(data.id), data);
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

/**
 * Context type for Profile delete mutation optimistic updates.
 */
interface ProfileDeleteContext {
  previousDetail: Profile | undefined;
  previousList: PaginatedResponse<Profile> | undefined;
}

/**
 * Delete a Profile.
 * Uses optimistic updates to immediately remove from cache.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useDeleteProfile(
  options?: Omit<
    UseMutationOptions<void, Error, ProfileId, ProfileDeleteContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<void, Error, ProfileId, ProfileDeleteContext>({
    mutationFn: deleteProfile,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: profileKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Profile>(
        profileKeys.detail(id)
      );

      let previousList: PaginatedResponse<Profile> | undefined;

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: profileKeys.detail(id) });

      // Optimistically remove from list cache
      if (updateList) {
        previousList = removeFromListOptimistic<Profile>(
          queryClient,
          profileKeys.lists(),
          id
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(profileKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, profileKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSettled: () => {
      // Refetch lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}


// --- Client Hooks ---

/**
 * Fetch paginated list of Client.
 */
export function useClientList(
  filters?: ClientFilters,
  pagination?: PaginationParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Client>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: clientKeys.list(filters, pagination),
    queryFn: () => fetchClientList(filters, pagination),
    ...options,
  });
}

/**
 * Fetch single Client by ID.
 */
export function useClient(
  id: ClientId | undefined,
  options?: Omit<UseQueryOptions<Client>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: clientKeys.detail(id!),
    queryFn: () => fetchClient(id!),
    enabled: !!id,
    ...options,
  });
}

/**
 * Context type for Client create mutation optimistic updates.
 */
interface ClientCreateContext {
  tempId: string;
  previousList: PaginatedResponse<Client> | undefined;
}

/**
 * Create a new Client.
 * Uses optimistic updates to immediately show the new item in lists.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useCreateClient(
  options?: Omit<
    UseMutationOptions<Client, Error, CreateClientInput, ClientCreateContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<Client, Error, CreateClientInput, ClientCreateContext>({
    mutationFn: createClient,
    onMutate: async (input) => {
      if (!updateList) {
        return { tempId: '', previousList: undefined };
      }

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: clientKeys.lists() });

      // Create optimistic item
      const optimisticItem = createOptimisticItem<Client>(
        input as unknown as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
      );

      // Add to list cache optimistically
      const previousList = addToListOptimistic<Client>(
        queryClient,
        clientKeys.lists(),
        optimisticItem,
        'start'
      );

      return { tempId: optimisticItem.id, previousList };
    },
    onError: (error, _input, context) => {
      // Rollback optimistic update on error
      if (context?.previousList) {
        rollbackOptimistic(queryClient, clientKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data, _variables, context) => {
      // Replace optimistic item with server response
      if (context?.tempId) {
        const currentList = queryClient.getQueryData<PaginatedResponse<Client>>(
          clientKeys.lists()
        );
        if (currentList) {
          queryClient.setQueryData<PaginatedResponse<Client>>(
            clientKeys.lists(),
            {
              ...currentList,
              items: currentList.items.map((item) =>
                item.id === context.tempId ? data : item
              ),
            }
          );
        }
      }
      // Set the detail cache with server response
      queryClient.setQueryData(clientKeys.detail(data.id), data);
    },
    onSettled: () => {
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Context type for Client update mutation optimistic updates.
 */
interface ClientUpdateContext {
  previousDetail: Client | undefined;
  previousList: PaginatedResponse<Client> | undefined;
}

/**
 * Update an existing Client.
 * Uses optimistic updates to immediately reflect changes.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useUpdateClient(
  options?: Omit<
    UseMutationOptions<
      Client,
      Error,
      { id: ClientId; data: UpdateClientInput },
      ClientUpdateContext
    >,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, updateDetail = true, onRollback } = options ?? {};

  return useMutation<Client, Error, { id: ClientId; data: UpdateClientInput }, ClientUpdateContext>({
    mutationFn: ({ id, data }) => updateClient(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: clientKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: clientKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Client>(
        clientKeys.detail(id)
      );

      let previousList: PaginatedResponse<Client> | undefined;

      // Optimistically update detail cache
      if (updateDetail && previousDetail) {
        queryClient.setQueryData<Client>(clientKeys.detail(id), {
          ...previousDetail,
          ...data,
          updatedAt: new Date(),
        });
      }

      // Optimistically update list cache
      if (updateList) {
        previousList = updateInListOptimistic<Client>(
          queryClient,
          clientKeys.lists(),
          id,
          data as Partial<Client>
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(clientKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, clientKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data) => {
      // Update caches with confirmed server data
      queryClient.setQueryData(clientKeys.detail(data.id), data);
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Context type for Client delete mutation optimistic updates.
 */
interface ClientDeleteContext {
  previousDetail: Client | undefined;
  previousList: PaginatedResponse<Client> | undefined;
}

/**
 * Delete a Client.
 * Uses optimistic updates to immediately remove from cache.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useDeleteClient(
  options?: Omit<
    UseMutationOptions<void, Error, ClientId, ClientDeleteContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<void, Error, ClientId, ClientDeleteContext>({
    mutationFn: deleteClient,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: clientKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: clientKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Client>(
        clientKeys.detail(id)
      );

      let previousList: PaginatedResponse<Client> | undefined;

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: clientKeys.detail(id) });

      // Optimistically remove from list cache
      if (updateList) {
        previousList = removeFromListOptimistic<Client>(
          queryClient,
          clientKeys.lists(),
          id
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(clientKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, clientKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSettled: () => {
      // Refetch lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}


// --- Service Hooks ---

/**
 * Fetch paginated list of Service.
 */
export function useServiceList(
  filters?: ServiceFilters,
  pagination?: PaginationParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Service>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: serviceKeys.list(filters, pagination),
    queryFn: () => fetchServiceList(filters, pagination),
    ...options,
  });
}

/**
 * Fetch single Service by ID.
 */
export function useService(
  id: ServiceId | undefined,
  options?: Omit<UseQueryOptions<Service>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: serviceKeys.detail(id!),
    queryFn: () => fetchService(id!),
    enabled: !!id,
    ...options,
  });
}

/**
 * Context type for Service create mutation optimistic updates.
 */
interface ServiceCreateContext {
  tempId: string;
  previousList: PaginatedResponse<Service> | undefined;
}

/**
 * Create a new Service.
 * Uses optimistic updates to immediately show the new item in lists.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useCreateService(
  options?: Omit<
    UseMutationOptions<Service, Error, CreateServiceInput, ServiceCreateContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<Service, Error, CreateServiceInput, ServiceCreateContext>({
    mutationFn: createService,
    onMutate: async (input) => {
      if (!updateList) {
        return { tempId: '', previousList: undefined };
      }

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: serviceKeys.lists() });

      // Create optimistic item
      const optimisticItem = createOptimisticItem<Service>(
        input as unknown as Omit<Service, 'id' | 'createdAt' | 'updatedAt'>
      );

      // Add to list cache optimistically
      const previousList = addToListOptimistic<Service>(
        queryClient,
        serviceKeys.lists(),
        optimisticItem,
        'start'
      );

      return { tempId: optimisticItem.id, previousList };
    },
    onError: (error, _input, context) => {
      // Rollback optimistic update on error
      if (context?.previousList) {
        rollbackOptimistic(queryClient, serviceKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data, _variables, context) => {
      // Replace optimistic item with server response
      if (context?.tempId) {
        const currentList = queryClient.getQueryData<PaginatedResponse<Service>>(
          serviceKeys.lists()
        );
        if (currentList) {
          queryClient.setQueryData<PaginatedResponse<Service>>(
            serviceKeys.lists(),
            {
              ...currentList,
              items: currentList.items.map((item) =>
                item.id === context.tempId ? data : item
              ),
            }
          );
        }
      }
      // Set the detail cache with server response
      queryClient.setQueryData(serviceKeys.detail(data.id), data);
    },
    onSettled: () => {
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

/**
 * Context type for Service update mutation optimistic updates.
 */
interface ServiceUpdateContext {
  previousDetail: Service | undefined;
  previousList: PaginatedResponse<Service> | undefined;
}

/**
 * Update an existing Service.
 * Uses optimistic updates to immediately reflect changes.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useUpdateService(
  options?: Omit<
    UseMutationOptions<
      Service,
      Error,
      { id: ServiceId; data: UpdateServiceInput },
      ServiceUpdateContext
    >,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, updateDetail = true, onRollback } = options ?? {};

  return useMutation<Service, Error, { id: ServiceId; data: UpdateServiceInput }, ServiceUpdateContext>({
    mutationFn: ({ id, data }) => updateService(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: serviceKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: serviceKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Service>(
        serviceKeys.detail(id)
      );

      let previousList: PaginatedResponse<Service> | undefined;

      // Optimistically update detail cache
      if (updateDetail && previousDetail) {
        queryClient.setQueryData<Service>(serviceKeys.detail(id), {
          ...previousDetail,
          ...data,
          updatedAt: new Date(),
        });
      }

      // Optimistically update list cache
      if (updateList) {
        previousList = updateInListOptimistic<Service>(
          queryClient,
          serviceKeys.lists(),
          id,
          data as Partial<Service>
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(serviceKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, serviceKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data) => {
      // Update caches with confirmed server data
      queryClient.setQueryData(serviceKeys.detail(data.id), data);
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

/**
 * Context type for Service delete mutation optimistic updates.
 */
interface ServiceDeleteContext {
  previousDetail: Service | undefined;
  previousList: PaginatedResponse<Service> | undefined;
}

/**
 * Delete a Service.
 * Uses optimistic updates to immediately remove from cache.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useDeleteService(
  options?: Omit<
    UseMutationOptions<void, Error, ServiceId, ServiceDeleteContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<void, Error, ServiceId, ServiceDeleteContext>({
    mutationFn: deleteService,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: serviceKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: serviceKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Service>(
        serviceKeys.detail(id)
      );

      let previousList: PaginatedResponse<Service> | undefined;

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: serviceKeys.detail(id) });

      // Optimistically remove from list cache
      if (updateList) {
        previousList = removeFromListOptimistic<Service>(
          queryClient,
          serviceKeys.lists(),
          id
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(serviceKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, serviceKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSettled: () => {
      // Refetch lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}


// --- Appointment Hooks ---

/**
 * Fetch paginated list of Appointment.
 */
export function useAppointmentList(
  filters?: AppointmentFilters,
  pagination?: PaginationParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Appointment>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: appointmentKeys.list(filters, pagination),
    queryFn: () => fetchAppointmentList(filters, pagination),
    ...options,
  });
}

/**
 * Fetch single Appointment by ID.
 */
export function useAppointment(
  id: AppointmentId | undefined,
  options?: Omit<UseQueryOptions<Appointment>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: appointmentKeys.detail(id!),
    queryFn: () => fetchAppointment(id!),
    enabled: !!id,
    ...options,
  });
}

/**
 * Context type for Appointment create mutation optimistic updates.
 */
interface AppointmentCreateContext {
  tempId: string;
  previousList: PaginatedResponse<Appointment> | undefined;
}

/**
 * Create a new Appointment.
 * Uses optimistic updates to immediately show the new item in lists.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useCreateAppointment(
  options?: Omit<
    UseMutationOptions<Appointment, Error, CreateAppointmentInput, AppointmentCreateContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<Appointment, Error, CreateAppointmentInput, AppointmentCreateContext>({
    mutationFn: createAppointment,
    onMutate: async (input) => {
      if (!updateList) {
        return { tempId: '', previousList: undefined };
      }

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: appointmentKeys.lists() });

      // Create optimistic item
      const optimisticItem = createOptimisticItem<Appointment>(
        input as unknown as Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
      );

      // Add to list cache optimistically
      const previousList = addToListOptimistic<Appointment>(
        queryClient,
        appointmentKeys.lists(),
        optimisticItem,
        'start'
      );

      return { tempId: optimisticItem.id, previousList };
    },
    onError: (error, _input, context) => {
      // Rollback optimistic update on error
      if (context?.previousList) {
        rollbackOptimistic(queryClient, appointmentKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data, _variables, context) => {
      // Replace optimistic item with server response
      if (context?.tempId) {
        const currentList = queryClient.getQueryData<PaginatedResponse<Appointment>>(
          appointmentKeys.lists()
        );
        if (currentList) {
          queryClient.setQueryData<PaginatedResponse<Appointment>>(
            appointmentKeys.lists(),
            {
              ...currentList,
              items: currentList.items.map((item) =>
                item.id === context.tempId ? data : item
              ),
            }
          );
        }
      }
      // Set the detail cache with server response
      queryClient.setQueryData(appointmentKeys.detail(data.id), data);
    },
    onSettled: () => {
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Context type for Appointment update mutation optimistic updates.
 */
interface AppointmentUpdateContext {
  previousDetail: Appointment | undefined;
  previousList: PaginatedResponse<Appointment> | undefined;
}

/**
 * Update an existing Appointment.
 * Uses optimistic updates to immediately reflect changes.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useUpdateAppointment(
  options?: Omit<
    UseMutationOptions<
      Appointment,
      Error,
      { id: AppointmentId; data: UpdateAppointmentInput },
      AppointmentUpdateContext
    >,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, updateDetail = true, onRollback } = options ?? {};

  return useMutation<Appointment, Error, { id: AppointmentId; data: UpdateAppointmentInput }, AppointmentUpdateContext>({
    mutationFn: ({ id, data }) => updateAppointment(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: appointmentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: appointmentKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Appointment>(
        appointmentKeys.detail(id)
      );

      let previousList: PaginatedResponse<Appointment> | undefined;

      // Optimistically update detail cache
      if (updateDetail && previousDetail) {
        queryClient.setQueryData<Appointment>(appointmentKeys.detail(id), {
          ...previousDetail,
          ...data,
          updatedAt: new Date(),
        });
      }

      // Optimistically update list cache
      if (updateList) {
        previousList = updateInListOptimistic<Appointment>(
          queryClient,
          appointmentKeys.lists(),
          id,
          data as Partial<Appointment>
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(appointmentKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, appointmentKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data) => {
      // Update caches with confirmed server data
      queryClient.setQueryData(appointmentKeys.detail(data.id), data);
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Context type for Appointment delete mutation optimistic updates.
 */
interface AppointmentDeleteContext {
  previousDetail: Appointment | undefined;
  previousList: PaginatedResponse<Appointment> | undefined;
}

/**
 * Delete a Appointment.
 * Uses optimistic updates to immediately remove from cache.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useDeleteAppointment(
  options?: Omit<
    UseMutationOptions<void, Error, AppointmentId, AppointmentDeleteContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<void, Error, AppointmentId, AppointmentDeleteContext>({
    mutationFn: deleteAppointment,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: appointmentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: appointmentKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Appointment>(
        appointmentKeys.detail(id)
      );

      let previousList: PaginatedResponse<Appointment> | undefined;

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: appointmentKeys.detail(id) });

      // Optimistically remove from list cache
      if (updateList) {
        previousList = removeFromListOptimistic<Appointment>(
          queryClient,
          appointmentKeys.lists(),
          id
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(appointmentKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, appointmentKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSettled: () => {
      // Refetch lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Context type for Appointment transition mutation.
 */
interface AppointmentTransitionContext {
  previousDetail: Appointment | undefined;
  previousList: PaginatedResponse<Appointment> | undefined;
}

/**
 * Transition a Appointment to a new state.
 * Uses optimistic updates to immediately reflect the state change.
 * Automatically rolls back on error if the transition is invalid.
 */
export function useTransitionAppointment(
  options?: Omit<
    UseMutationOptions<
      Appointment,
      Error,
      { id: AppointmentId; transition: string },
      AppointmentTransitionContext
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<Appointment, Error, { id: AppointmentId; transition: string }, AppointmentTransitionContext>({
    mutationFn: ({ id, transition }) => transitionAppointment(id, transition),
    onMutate: async ({ id, transition }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: appointmentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: appointmentKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Appointment>(
        appointmentKeys.detail(id)
      );

      // Get the target state from transition definition
      const transitionDef = (await import('@/lib/state-machines')).appointmentTransitions;
      const transitionConfig = transitionDef[transition as keyof typeof transitionDef];
      const targetState = previousDetail && transitionConfig
        ? transitionConfig.toState(previousDetail.status)
        : undefined;

      let previousList: PaginatedResponse<Appointment> | undefined;

      // Optimistically update detail cache
      if (previousDetail && targetState) {
        queryClient.setQueryData<Appointment>(appointmentKeys.detail(id), {
          ...previousDetail,
          status: targetState,
          updatedAt: new Date(),
        });
      }

      // Optimistically update list cache
      if (targetState) {
        previousList = updateInListOptimistic<Appointment>(
          queryClient,
          appointmentKeys.lists(),
          id,
          { status: targetState } as Partial<Appointment>
        );
      }

      return { previousDetail, previousList };
    },
    onError: (_error, { id }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(appointmentKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, appointmentKeys.lists(), context.previousList);
      }
    },
    onSuccess: (data) => {
      // Update caches with confirmed server data
      queryClient.setQueryData(appointmentKeys.detail(data.id), data);
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
    ...options,
  });
}

// --- Availability Hooks ---

/**
 * Fetch paginated list of Availability.
 */
export function useAvailabilityList(
  filters?: AvailabilityFilters,
  pagination?: PaginationParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Availability>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: availabilityKeys.list(filters, pagination),
    queryFn: () => fetchAvailabilityList(filters, pagination),
    ...options,
  });
}

/**
 * Fetch single Availability by ID.
 */
export function useAvailability(
  id: AvailabilityId | undefined,
  options?: Omit<UseQueryOptions<Availability>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: availabilityKeys.detail(id!),
    queryFn: () => fetchAvailability(id!),
    enabled: !!id,
    ...options,
  });
}

/**
 * Context type for Availability create mutation optimistic updates.
 */
interface AvailabilityCreateContext {
  tempId: string;
  previousList: PaginatedResponse<Availability> | undefined;
}

/**
 * Create a new Availability.
 * Uses optimistic updates to immediately show the new item in lists.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useCreateAvailability(
  options?: Omit<
    UseMutationOptions<Availability, Error, CreateAvailabilityInput, AvailabilityCreateContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<Availability, Error, CreateAvailabilityInput, AvailabilityCreateContext>({
    mutationFn: createAvailability,
    onMutate: async (input) => {
      if (!updateList) {
        return { tempId: '', previousList: undefined };
      }

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: availabilityKeys.lists() });

      // Create optimistic item
      const optimisticItem = createOptimisticItem<Availability>(
        input as unknown as Omit<Availability, 'id' | 'createdAt' | 'updatedAt'>
      );

      // Add to list cache optimistically
      const previousList = addToListOptimistic<Availability>(
        queryClient,
        availabilityKeys.lists(),
        optimisticItem,
        'start'
      );

      return { tempId: optimisticItem.id, previousList };
    },
    onError: (error, _input, context) => {
      // Rollback optimistic update on error
      if (context?.previousList) {
        rollbackOptimistic(queryClient, availabilityKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data, _variables, context) => {
      // Replace optimistic item with server response
      if (context?.tempId) {
        const currentList = queryClient.getQueryData<PaginatedResponse<Availability>>(
          availabilityKeys.lists()
        );
        if (currentList) {
          queryClient.setQueryData<PaginatedResponse<Availability>>(
            availabilityKeys.lists(),
            {
              ...currentList,
              items: currentList.items.map((item) =>
                item.id === context.tempId ? data : item
              ),
            }
          );
        }
      }
      // Set the detail cache with server response
      queryClient.setQueryData(availabilityKeys.detail(data.id), data);
    },
    onSettled: () => {
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: availabilityKeys.lists() });
    },
  });
}

/**
 * Context type for Availability update mutation optimistic updates.
 */
interface AvailabilityUpdateContext {
  previousDetail: Availability | undefined;
  previousList: PaginatedResponse<Availability> | undefined;
}

/**
 * Update an existing Availability.
 * Uses optimistic updates to immediately reflect changes.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useUpdateAvailability(
  options?: Omit<
    UseMutationOptions<
      Availability,
      Error,
      { id: AvailabilityId; data: UpdateAvailabilityInput },
      AvailabilityUpdateContext
    >,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, updateDetail = true, onRollback } = options ?? {};

  return useMutation<Availability, Error, { id: AvailabilityId; data: UpdateAvailabilityInput }, AvailabilityUpdateContext>({
    mutationFn: ({ id, data }) => updateAvailability(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: availabilityKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: availabilityKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Availability>(
        availabilityKeys.detail(id)
      );

      let previousList: PaginatedResponse<Availability> | undefined;

      // Optimistically update detail cache
      if (updateDetail && previousDetail) {
        queryClient.setQueryData<Availability>(availabilityKeys.detail(id), {
          ...previousDetail,
          ...data,
          updatedAt: new Date(),
        });
      }

      // Optimistically update list cache
      if (updateList) {
        previousList = updateInListOptimistic<Availability>(
          queryClient,
          availabilityKeys.lists(),
          id,
          data as Partial<Availability>
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(availabilityKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, availabilityKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data) => {
      // Update caches with confirmed server data
      queryClient.setQueryData(availabilityKeys.detail(data.id), data);
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: availabilityKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: availabilityKeys.lists() });
    },
  });
}

/**
 * Context type for Availability delete mutation optimistic updates.
 */
interface AvailabilityDeleteContext {
  previousDetail: Availability | undefined;
  previousList: PaginatedResponse<Availability> | undefined;
}

/**
 * Delete a Availability.
 * Uses optimistic updates to immediately remove from cache.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useDeleteAvailability(
  options?: Omit<
    UseMutationOptions<void, Error, AvailabilityId, AvailabilityDeleteContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<void, Error, AvailabilityId, AvailabilityDeleteContext>({
    mutationFn: deleteAvailability,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: availabilityKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: availabilityKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Availability>(
        availabilityKeys.detail(id)
      );

      let previousList: PaginatedResponse<Availability> | undefined;

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: availabilityKeys.detail(id) });

      // Optimistically remove from list cache
      if (updateList) {
        previousList = removeFromListOptimistic<Availability>(
          queryClient,
          availabilityKeys.lists(),
          id
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(availabilityKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, availabilityKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSettled: () => {
      // Refetch lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: availabilityKeys.lists() });
    },
  });
}


// --- Document Hooks ---

/**
 * Fetch paginated list of Document.
 */
export function useDocumentList(
  filters?: DocumentFilters,
  pagination?: PaginationParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Document>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: documentKeys.list(filters, pagination),
    queryFn: () => fetchDocumentList(filters, pagination),
    ...options,
  });
}

/**
 * Fetch single Document by ID.
 */
export function useDocument(
  id: DocumentId | undefined,
  options?: Omit<UseQueryOptions<Document>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: documentKeys.detail(id!),
    queryFn: () => fetchDocument(id!),
    enabled: !!id,
    ...options,
  });
}

/**
 * Context type for Document create mutation optimistic updates.
 */
interface DocumentCreateContext {
  tempId: string;
  previousList: PaginatedResponse<Document> | undefined;
}

/**
 * Create a new Document.
 * Uses optimistic updates to immediately show the new item in lists.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useCreateDocument(
  options?: Omit<
    UseMutationOptions<Document, Error, CreateDocumentInput, DocumentCreateContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<Document, Error, CreateDocumentInput, DocumentCreateContext>({
    mutationFn: createDocument,
    onMutate: async (input) => {
      if (!updateList) {
        return { tempId: '', previousList: undefined };
      }

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });

      // Create optimistic item
      const optimisticItem = createOptimisticItem<Document>(
        input as unknown as Omit<Document, 'id' | 'createdAt' | 'updatedAt'>
      );

      // Add to list cache optimistically
      const previousList = addToListOptimistic<Document>(
        queryClient,
        documentKeys.lists(),
        optimisticItem,
        'start'
      );

      return { tempId: optimisticItem.id, previousList };
    },
    onError: (error, _input, context) => {
      // Rollback optimistic update on error
      if (context?.previousList) {
        rollbackOptimistic(queryClient, documentKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data, _variables, context) => {
      // Replace optimistic item with server response
      if (context?.tempId) {
        const currentList = queryClient.getQueryData<PaginatedResponse<Document>>(
          documentKeys.lists()
        );
        if (currentList) {
          queryClient.setQueryData<PaginatedResponse<Document>>(
            documentKeys.lists(),
            {
              ...currentList,
              items: currentList.items.map((item) =>
                item.id === context.tempId ? data : item
              ),
            }
          );
        }
      }
      // Set the detail cache with server response
      queryClient.setQueryData(documentKeys.detail(data.id), data);
    },
    onSettled: () => {
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

/**
 * Context type for Document update mutation optimistic updates.
 */
interface DocumentUpdateContext {
  previousDetail: Document | undefined;
  previousList: PaginatedResponse<Document> | undefined;
}

/**
 * Update an existing Document.
 * Uses optimistic updates to immediately reflect changes.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useUpdateDocument(
  options?: Omit<
    UseMutationOptions<
      Document,
      Error,
      { id: DocumentId; data: UpdateDocumentInput },
      DocumentUpdateContext
    >,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, updateDetail = true, onRollback } = options ?? {};

  return useMutation<Document, Error, { id: DocumentId; data: UpdateDocumentInput }, DocumentUpdateContext>({
    mutationFn: ({ id, data }) => updateDocument(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: documentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Document>(
        documentKeys.detail(id)
      );

      let previousList: PaginatedResponse<Document> | undefined;

      // Optimistically update detail cache
      if (updateDetail && previousDetail) {
        queryClient.setQueryData<Document>(documentKeys.detail(id), {
          ...previousDetail,
          ...data,
          updatedAt: new Date(),
        });
      }

      // Optimistically update list cache
      if (updateList) {
        previousList = updateInListOptimistic<Document>(
          queryClient,
          documentKeys.lists(),
          id,
          data as Partial<Document>
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(documentKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, documentKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSuccess: (data) => {
      // Update caches with confirmed server data
      queryClient.setQueryData(documentKeys.detail(data.id), data);
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch after mutation to ensure consistency
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

/**
 * Context type for Document delete mutation optimistic updates.
 */
interface DocumentDeleteContext {
  previousDetail: Document | undefined;
  previousList: PaginatedResponse<Document> | undefined;
}

/**
 * Delete a Document.
 * Uses optimistic updates to immediately remove from cache.
 * Automatically rolls back on error and invalidates caches on success.
 */
export function useDeleteDocument(
  options?: Omit<
    UseMutationOptions<void, Error, DocumentId, DocumentDeleteContext>,
    'mutationFn'
  > & OptimisticOptions
) {
  const queryClient = useQueryClient();
  const { updateList = true, onRollback } = options ?? {};

  return useMutation<void, Error, DocumentId, DocumentDeleteContext>({
    mutationFn: deleteDocument,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: documentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Document>(
        documentKeys.detail(id)
      );

      let previousList: PaginatedResponse<Document> | undefined;

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });

      // Optimistically remove from list cache
      if (updateList) {
        previousList = removeFromListOptimistic<Document>(
          queryClient,
          documentKeys.lists(),
          id
        );
      }

      return { previousDetail, previousList };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(documentKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, documentKeys.lists(), context.previousList);
      }
      onRollback?.(error);
    },
    onSettled: () => {
      // Refetch lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

/**
 * Context type for Document transition mutation.
 */
interface DocumentTransitionContext {
  previousDetail: Document | undefined;
  previousList: PaginatedResponse<Document> | undefined;
}

/**
 * Transition a Document to a new state.
 * Uses optimistic updates to immediately reflect the state change.
 * Automatically rolls back on error if the transition is invalid.
 */
export function useTransitionDocument(
  options?: Omit<
    UseMutationOptions<
      Document,
      Error,
      { id: DocumentId; transition: string },
      DocumentTransitionContext
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<Document, Error, { id: DocumentId; transition: string }, DocumentTransitionContext>({
    mutationFn: ({ id, transition }) => transitionDocument(id, transition),
    onMutate: async ({ id, transition }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: documentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<Document>(
        documentKeys.detail(id)
      );

      // Get the target state from transition definition
      const transitionDef = (await import('@/lib/state-machines')).documentTransitions;
      const transitionConfig = transitionDef[transition as keyof typeof transitionDef];
      const targetState = previousDetail && transitionConfig
        ? transitionConfig.toState(previousDetail.status)
        : undefined;

      let previousList: PaginatedResponse<Document> | undefined;

      // Optimistically update detail cache
      if (previousDetail && targetState) {
        queryClient.setQueryData<Document>(documentKeys.detail(id), {
          ...previousDetail,
          status: targetState,
          updatedAt: new Date(),
        });
      }

      // Optimistically update list cache
      if (targetState) {
        previousList = updateInListOptimistic<Document>(
          queryClient,
          documentKeys.lists(),
          id,
          { status: targetState } as Partial<Document>
        );
      }

      return { previousDetail, previousList };
    },
    onError: (_error, { id }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(documentKeys.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        rollbackOptimistic(queryClient, documentKeys.lists(), context.previousList);
      }
    },
    onSuccess: (data) => {
      // Update caches with confirmed server data
      queryClient.setQueryData(documentKeys.detail(data.id), data);
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    ...options,
  });
}


// ============================================================
// PREFETCH UTILITIES
// ============================================================

/**
 * Prefetch Profile list for faster navigation.
 */
export async function prefetchProfileList(
  queryClient: ReturnType<typeof useQueryClient>,
  filters?: ProfileFilters,
  pagination?: PaginationParams
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: profileKeys.list(filters, pagination),
    queryFn: () => fetchProfileList(filters, pagination),
  });
}

/**
 * Prefetch single Profile for faster navigation.
 */
export async function prefetchProfile(
  queryClient: ReturnType<typeof useQueryClient>,
  id: ProfileId
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: profileKeys.detail(id),
    queryFn: () => fetchProfile(id),
  });
}

/**
 * Prefetch Client list for faster navigation.
 */
export async function prefetchClientList(
  queryClient: ReturnType<typeof useQueryClient>,
  filters?: ClientFilters,
  pagination?: PaginationParams
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: clientKeys.list(filters, pagination),
    queryFn: () => fetchClientList(filters, pagination),
  });
}

/**
 * Prefetch single Client for faster navigation.
 */
export async function prefetchClient(
  queryClient: ReturnType<typeof useQueryClient>,
  id: ClientId
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => fetchClient(id),
  });
}

/**
 * Prefetch Service list for faster navigation.
 */
export async function prefetchServiceList(
  queryClient: ReturnType<typeof useQueryClient>,
  filters?: ServiceFilters,
  pagination?: PaginationParams
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: serviceKeys.list(filters, pagination),
    queryFn: () => fetchServiceList(filters, pagination),
  });
}

/**
 * Prefetch single Service for faster navigation.
 */
export async function prefetchService(
  queryClient: ReturnType<typeof useQueryClient>,
  id: ServiceId
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => fetchService(id),
  });
}

/**
 * Prefetch Appointment list for faster navigation.
 */
export async function prefetchAppointmentList(
  queryClient: ReturnType<typeof useQueryClient>,
  filters?: AppointmentFilters,
  pagination?: PaginationParams
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: appointmentKeys.list(filters, pagination),
    queryFn: () => fetchAppointmentList(filters, pagination),
  });
}

/**
 * Prefetch single Appointment for faster navigation.
 */
export async function prefetchAppointment(
  queryClient: ReturnType<typeof useQueryClient>,
  id: AppointmentId
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => fetchAppointment(id),
  });
}

/**
 * Prefetch Availability list for faster navigation.
 */
export async function prefetchAvailabilityList(
  queryClient: ReturnType<typeof useQueryClient>,
  filters?: AvailabilityFilters,
  pagination?: PaginationParams
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: availabilityKeys.list(filters, pagination),
    queryFn: () => fetchAvailabilityList(filters, pagination),
  });
}

/**
 * Prefetch single Availability for faster navigation.
 */
export async function prefetchAvailability(
  queryClient: ReturnType<typeof useQueryClient>,
  id: AvailabilityId
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: availabilityKeys.detail(id),
    queryFn: () => fetchAvailability(id),
  });
}

/**
 * Prefetch Document list for faster navigation.
 */
export async function prefetchDocumentList(
  queryClient: ReturnType<typeof useQueryClient>,
  filters?: DocumentFilters,
  pagination?: PaginationParams
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: documentKeys.list(filters, pagination),
    queryFn: () => fetchDocumentList(filters, pagination),
  });
}

/**
 * Prefetch single Document for faster navigation.
 */
export async function prefetchDocument(
  queryClient: ReturnType<typeof useQueryClient>,
  id: DocumentId
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => fetchDocument(id),
  });
}


// ============================================================
// CACHE MANIPULATION UTILITIES
// ============================================================

/**
 * Set Profile data directly in cache.
 * Useful for setting data from SSR or after socket updates.
 */
export function setProfileCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: ProfileId,
  data: Profile
): void {
  queryClient.setQueryData(profileKeys.detail(id), data);
}

/**
 * Get Profile from cache without fetching.
 */
export function getProfileCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: ProfileId
): Profile | undefined {
  return queryClient.getQueryData(profileKeys.detail(id));
}

/**
 * Invalidate all Profile queries.
 * Forces refetch on next access.
 */
export function invalidateProfileQueries(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: profileKeys.all });
}

/**
 * Get optimistic update utilities for Profile.
 * Returns hooks for create, update, and delete operations.
 */
export function useProfileOptimisticUtils() {
  const createUtils = useOptimisticCreate<Profile>(profileKeys.lists());
  const updateUtils = useOptimisticUpdate<Profile>(
    profileKeys.lists(),
    (id) => profileKeys.detail(id as ProfileId)
  );
  const deleteUtils = useOptimisticDelete<Profile>(
    profileKeys.lists(),
    (id) => profileKeys.detail(id as ProfileId)
  );

  return {
    create: createUtils,
    update: updateUtils,
    delete: deleteUtils,
  };
}

/**
 * Set Client data directly in cache.
 * Useful for setting data from SSR or after socket updates.
 */
export function setClientCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: ClientId,
  data: Client
): void {
  queryClient.setQueryData(clientKeys.detail(id), data);
}

/**
 * Get Client from cache without fetching.
 */
export function getClientCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: ClientId
): Client | undefined {
  return queryClient.getQueryData(clientKeys.detail(id));
}

/**
 * Invalidate all Client queries.
 * Forces refetch on next access.
 */
export function invalidateClientQueries(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: clientKeys.all });
}

/**
 * Get optimistic update utilities for Client.
 * Returns hooks for create, update, and delete operations.
 */
export function useClientOptimisticUtils() {
  const createUtils = useOptimisticCreate<Client>(clientKeys.lists());
  const updateUtils = useOptimisticUpdate<Client>(
    clientKeys.lists(),
    (id) => clientKeys.detail(id as ClientId)
  );
  const deleteUtils = useOptimisticDelete<Client>(
    clientKeys.lists(),
    (id) => clientKeys.detail(id as ClientId)
  );

  return {
    create: createUtils,
    update: updateUtils,
    delete: deleteUtils,
  };
}

/**
 * Set Service data directly in cache.
 * Useful for setting data from SSR or after socket updates.
 */
export function setServiceCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: ServiceId,
  data: Service
): void {
  queryClient.setQueryData(serviceKeys.detail(id), data);
}

/**
 * Get Service from cache without fetching.
 */
export function getServiceCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: ServiceId
): Service | undefined {
  return queryClient.getQueryData(serviceKeys.detail(id));
}

/**
 * Invalidate all Service queries.
 * Forces refetch on next access.
 */
export function invalidateServiceQueries(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: serviceKeys.all });
}

/**
 * Get optimistic update utilities for Service.
 * Returns hooks for create, update, and delete operations.
 */
export function useServiceOptimisticUtils() {
  const createUtils = useOptimisticCreate<Service>(serviceKeys.lists());
  const updateUtils = useOptimisticUpdate<Service>(
    serviceKeys.lists(),
    (id) => serviceKeys.detail(id as ServiceId)
  );
  const deleteUtils = useOptimisticDelete<Service>(
    serviceKeys.lists(),
    (id) => serviceKeys.detail(id as ServiceId)
  );

  return {
    create: createUtils,
    update: updateUtils,
    delete: deleteUtils,
  };
}

/**
 * Set Appointment data directly in cache.
 * Useful for setting data from SSR or after socket updates.
 */
export function setAppointmentCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: AppointmentId,
  data: Appointment
): void {
  queryClient.setQueryData(appointmentKeys.detail(id), data);
}

/**
 * Get Appointment from cache without fetching.
 */
export function getAppointmentCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: AppointmentId
): Appointment | undefined {
  return queryClient.getQueryData(appointmentKeys.detail(id));
}

/**
 * Invalidate all Appointment queries.
 * Forces refetch on next access.
 */
export function invalidateAppointmentQueries(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
}

/**
 * Get optimistic update utilities for Appointment.
 * Returns hooks for create, update, and delete operations.
 */
export function useAppointmentOptimisticUtils() {
  const createUtils = useOptimisticCreate<Appointment>(appointmentKeys.lists());
  const updateUtils = useOptimisticUpdate<Appointment>(
    appointmentKeys.lists(),
    (id) => appointmentKeys.detail(id as AppointmentId)
  );
  const deleteUtils = useOptimisticDelete<Appointment>(
    appointmentKeys.lists(),
    (id) => appointmentKeys.detail(id as AppointmentId)
  );

  return {
    create: createUtils,
    update: updateUtils,
    delete: deleteUtils,
  };
}

/**
 * Set Availability data directly in cache.
 * Useful for setting data from SSR or after socket updates.
 */
export function setAvailabilityCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: AvailabilityId,
  data: Availability
): void {
  queryClient.setQueryData(availabilityKeys.detail(id), data);
}

/**
 * Get Availability from cache without fetching.
 */
export function getAvailabilityCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: AvailabilityId
): Availability | undefined {
  return queryClient.getQueryData(availabilityKeys.detail(id));
}

/**
 * Invalidate all Availability queries.
 * Forces refetch on next access.
 */
export function invalidateAvailabilityQueries(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
}

/**
 * Get optimistic update utilities for Availability.
 * Returns hooks for create, update, and delete operations.
 */
export function useAvailabilityOptimisticUtils() {
  const createUtils = useOptimisticCreate<Availability>(availabilityKeys.lists());
  const updateUtils = useOptimisticUpdate<Availability>(
    availabilityKeys.lists(),
    (id) => availabilityKeys.detail(id as AvailabilityId)
  );
  const deleteUtils = useOptimisticDelete<Availability>(
    availabilityKeys.lists(),
    (id) => availabilityKeys.detail(id as AvailabilityId)
  );

  return {
    create: createUtils,
    update: updateUtils,
    delete: deleteUtils,
  };
}

/**
 * Set Document data directly in cache.
 * Useful for setting data from SSR or after socket updates.
 */
export function setDocumentCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: DocumentId,
  data: Document
): void {
  queryClient.setQueryData(documentKeys.detail(id), data);
}

/**
 * Get Document from cache without fetching.
 */
export function getDocumentCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: DocumentId
): Document | undefined {
  return queryClient.getQueryData(documentKeys.detail(id));
}

/**
 * Invalidate all Document queries.
 * Forces refetch on next access.
 */
export function invalidateDocumentQueries(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: documentKeys.all });
}

/**
 * Get optimistic update utilities for Document.
 * Returns hooks for create, update, and delete operations.
 */
export function useDocumentOptimisticUtils() {
  const createUtils = useOptimisticCreate<Document>(documentKeys.lists());
  const updateUtils = useOptimisticUpdate<Document>(
    documentKeys.lists(),
    (id) => documentKeys.detail(id as DocumentId)
  );
  const deleteUtils = useOptimisticDelete<Document>(
    documentKeys.lists(),
    (id) => documentKeys.detail(id as DocumentId)
  );

  return {
    create: createUtils,
    update: updateUtils,
    delete: deleteUtils,
  };
}


// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
