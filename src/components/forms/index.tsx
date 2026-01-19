/**
 * Form Components - taxbook-pro
 * Generated: 2026-01-19
 *
 * Reusable form components with validation, accessibility, and loading states.
 * Uses react-hook-form with Zod validation for type-safe forms.
 *
 * Place in: components/forms/
 */

'use client';

import * as React from 'react';
import { useForm, UseFormReturn, FieldValues, Path, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ============================================================
// FORM FIELD COMPONENT
// ============================================================

interface FormFieldProps<T extends FieldValues> {
  /** Field name matching the form schema */
  name: Path<T>;
  /** Field label */
  label: string;
  /** Field type */
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  /** Placeholder text */
  placeholder?: string;
  /** Form instance from useForm */
  form: UseFormReturn<T>;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Help text shown below the field */
  helpText?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Minimum value for number inputs */
  min?: number;
  /** Maximum value for number inputs */
  max?: number;
  /** Number of rows for textarea */
  rows?: number;
}

/**
 * Accessible form field with label, input, and error display.
 *
 * @example
 * <FormField
 *   name="email"
 *   label="Email"
 *   type="email"
 *   placeholder="you@example.com"
 *   form={form}
 * />
 */
export function FormField<T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  form,
  disabled,
  helpText,
  autoComplete,
  min,
  max,
  rows = 4,
}: FormFieldProps<T>) {
  const { register, formState: { errors } } = form;
  const error = errors[name] as FieldError | undefined;
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;
  const hasError = !!error;

  const inputProps = {
    id: name,
    placeholder,
    disabled,
    autoComplete,
    'aria-invalid': hasError,
    'aria-describedby': [
      hasError ? errorId : null,
      helpText ? helpId : null,
    ].filter(Boolean).join(' ') || undefined,
    ...register(name, { valueAsNumber: type === 'number' }),
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={hasError ? 'text-destructive' : undefined}>
        {label}
      </Label>

      {type === 'textarea' ? (
        <Textarea {...inputProps} rows={rows} />
      ) : (
        <Input
          {...inputProps}
          type={type}
          min={min}
          max={max}
        />
      )}

      {helpText && !hasError && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}

      {hasError && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// ============================================================
// FORM SELECT COMPONENT
// ============================================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps<T extends FieldValues> {
  /** Field name matching the form schema */
  name: Path<T>;
  /** Field label */
  label: string;
  /** Select options */
  options: SelectOption[];
  /** Form instance from useForm */
  form: UseFormReturn<T>;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Help text shown below the field */
  helpText?: string;
}

/**
 * Accessible select dropdown with label and error display.
 *
 * @example
 * <FormSelect
 *   name="status"
 *   label="Status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' },
 *   ]}
 *   form={form}
 * />
 */
export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
  form,
  placeholder = 'Select an option',
  disabled,
  helpText,
}: FormSelectProps<T>) {
  const { setValue, watch, formState: { errors } } = form;
  const error = errors[name] as FieldError | undefined;
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;
  const hasError = !!error;
  const value = watch(name) as string | undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={hasError ? 'text-destructive' : undefined}>
        {label}
      </Label>

      <Select
        value={value}
        onValueChange={(val) => setValue(name, val as T[Path<T>], { shouldValidate: true })}
        disabled={disabled}
      >
        <SelectTrigger
          id={name}
          aria-invalid={hasError}
          aria-describedby={[
            hasError ? errorId : null,
            helpText ? helpId : null,
          ].filter(Boolean).join(' ') || undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
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

      {helpText && !hasError && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}

      {hasError && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// ============================================================
// FORM CHECKBOX COMPONENT
// ============================================================

interface FormCheckboxProps<T extends FieldValues> {
  /** Field name matching the form schema */
  name: Path<T>;
  /** Checkbox label */
  label: string;
  /** Form instance from useForm */
  form: UseFormReturn<T>;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Help text shown below the checkbox */
  helpText?: string;
}

/**
 * Accessible checkbox with label and error display.
 *
 * @example
 * <FormCheckbox
 *   name="acceptTerms"
 *   label="I accept the terms and conditions"
 *   form={form}
 * />
 */
export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  form,
  disabled,
  helpText,
}: FormCheckboxProps<T>) {
  const { setValue, watch, formState: { errors } } = form;
  const error = errors[name] as FieldError | undefined;
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;
  const hasError = !!error;
  const checked = watch(name) as boolean;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          checked={checked}
          onCheckedChange={(val) => setValue(name, val as T[Path<T>], { shouldValidate: true })}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={[
            hasError ? errorId : null,
            helpText ? helpId : null,
          ].filter(Boolean).join(' ') || undefined}
        />
        <Label
          htmlFor={name}
          className={`text-sm font-normal cursor-pointer ${hasError ? 'text-destructive' : ''}`}
        >
          {label}
        </Label>
      </div>

      {helpText && !hasError && (
        <p id={helpId} className="text-xs text-muted-foreground ml-6">
          {helpText}
        </p>
      )}

      {hasError && (
        <p id={errorId} className="text-xs text-destructive ml-6" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// ============================================================
// FORM RADIO GROUP COMPONENT
// ============================================================

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface FormRadioGroupProps<T extends FieldValues> {
  /** Field name matching the form schema */
  name: Path<T>;
  /** Field label */
  label: string;
  /** Radio options */
  options: RadioOption[];
  /** Form instance from useForm */
  form: UseFormReturn<T>;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Help text shown below the group */
  helpText?: string;
  /** Layout direction */
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Accessible radio group with keyboard navigation and proper ARIA labels.
 * Supports arrow key navigation between options.
 *
 * @example
 * <FormRadioGroup
 *   name="exportFormat"
 *   label="Export Format"
 *   options={[
 *     { value: 'markdown', label: 'Markdown', description: 'For GitHub, docs, wikis' },
 *     { value: 'html', label: 'HTML', description: 'Standalone web page' },
 *   ]}
 *   form={form}
 * />
 */
export function FormRadioGroup<T extends FieldValues>({
  name,
  label,
  options,
  form,
  disabled,
  helpText,
  orientation = 'vertical',
}: FormRadioGroupProps<T>) {
  const { setValue, watch, formState: { errors } } = form;
  const error = errors[name] as FieldError | undefined;
  const errorId = `${name}-error`;
  const helpId = `${name}-help`;
  const labelId = `${name}-label`;
  const hasError = !!error;
  const value = watch(name) as string | undefined;

  const handleKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    const enabledOptions = options.filter(opt => !opt.disabled);
    const currentEnabledIdx = enabledOptions.findIndex(opt => opt.value === options[currentIdx].value);

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (currentEnabledIdx + 1) % enabledOptions.length;
      setValue(name, enabledOptions[nextIdx].value as T[Path<T>], { shouldValidate: true });
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (currentEnabledIdx - 1 + enabledOptions.length) % enabledOptions.length;
      setValue(name, enabledOptions[prevIdx].value as T[Path<T>], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-2">
      <Label id={labelId} className={hasError ? 'text-destructive' : undefined}>
        {label}
      </Label>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={[
          hasError ? errorId : null,
          helpText ? helpId : null,
        ].filter(Boolean).join(' ') || undefined}
        className={orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}
      >
        {options.map((option, idx) => (
          <label
            key={option.value}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
              value === option.value
                ? 'bg-primary/10 border-primary'
                : 'bg-muted/50 border-border hover:border-muted-foreground/50'
            } ${option.disabled || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => setValue(name, option.value as T[Path<T>], { shouldValidate: true })}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              disabled={option.disabled || disabled}
              className="mt-1"
              aria-describedby={option.description ? `${name}-${option.value}-desc` : undefined}
            />
            <div>
              <span className="font-medium text-sm">{option.label}</span>
              {option.description && (
                <p
                  id={`${name}-${option.value}-desc`}
                  className="text-xs text-muted-foreground"
                >
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>

      {helpText && !hasError && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}

      {hasError && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// ============================================================
// SUBMIT BUTTON COMPONENT
// ============================================================

interface SubmitButtonProps {
  /** Button text when idle */
  children: React.ReactNode;
  /** Button text when loading */
  loadingText?: string;
  /** Whether the form is submitting */
  isSubmitting: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * Submit button with loading spinner and disabled state.
 *
 * @example
 * <SubmitButton isSubmitting={form.formState.isSubmitting}>
 *   Create Account
 * </SubmitButton>
 */
export function SubmitButton({
  children,
  loadingText = 'Saving...',
  isSubmitting,
  disabled,
  variant = 'default',
  fullWidth = false,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={isSubmitting || disabled}
      className={fullWidth ? 'w-full' : undefined}
    >
      {isSubmitting ? (
        <>
          <svg
            className="mr-2 h-4 w-4 animate-spin"
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
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

// ============================================================
// FORM ERROR DISPLAY
// ============================================================

interface FormErrorProps {
  /** Error message to display */
  message: string | null | undefined;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays a form-level error message.
 *
 * @example
 * <FormError message={error} />
 * <FormError message={error} className="mt-2" />
 */
export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={cn("rounded-md bg-destructive/10 p-3 text-sm text-destructive", className)}
      role="alert"
    >
      {message}
    </div>
  );
}

// ============================================================
// FORM SUCCESS DISPLAY
// ============================================================

interface FormSuccessProps {
  /** Success message to display */
  message: string | null | undefined;
}

/**
 * Displays a form-level success message.
 *
 * @example
 * <FormSuccess message="Changes saved successfully!" />
 */
export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;

  return (
    <div
      className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400"
      role="status"
    >
      {message}
    </div>
  );
}

// ============================================================
// ENTITY-SPECIFIC FORMS
// ============================================================

// ------------------------------------------------------------
// Profile Forms
// ------------------------------------------------------------

import {
  CreateProfileSchema,
  UpdateProfileSchema,
} from '@/lib/validation';
import type {
  CreateProfileInput,
  UpdateProfileInput,
  Profile,
} from '@/types/domain';

type CreateProfileFormData = z.infer<typeof CreateProfileSchema>;
type UpdateProfileFormData = z.infer<typeof UpdateProfileSchema>;

interface CreateProfileFormProps {
  /** Called when form is submitted successfully */
  onSuccess: (data: CreateProfileInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateProfileFormData>;
}

/**
 * Form for creating a new Profile.
 * Uses Zod schema validation from lib/validation.ts.
 *
 * @example
 * <CreateProfileForm
 *   onSuccess={(data) => createProfile(data)}
 *   onCancel={() => router.back()}
 * />
 */
export function CreateProfileForm({
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
  defaultValues,
}: CreateProfileFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CreateProfileFormData>({
    resolver: zodResolver(CreateProfileSchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = async (data: CreateProfileFormData) => {
    setError(null);

    try {
      await onSuccess(data as CreateProfileInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="email"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="firmName"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="licenseNumber"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="timezone"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="subscriptionTier"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="bookingSlug"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="taxSeasonStart"
        label=""
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
            <FormField
        name="taxSeasonEnd"
        label=""
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
            <FormField
        name="maxDailyAppointments"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="maxDailyAppointmentsTaxSeason"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Creating..."
        >
          Create Profile
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface EditProfileFormProps {
  /** The Profile being edited */
  profile: Profile;
  /** Called when form is submitted successfully */
  onSuccess: (data: UpdateProfileInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Form for editing an existing Profile.
 * Pre-populates with current values.
 *
 * @example
 * <EditProfileForm
 *   profile={ profileData }
 *   onSuccess={(data) => updateProfile(data)}
 *   onCancel={() => setIsEditing(false)}
 *   showCancel
 * />
 */
export function EditProfileForm({
  profile,
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
}: EditProfileFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      userId: profile.userId ?? undefined,
      email: profile.email ?? undefined,
      name: profile.name ?? undefined,
      firmName: profile.firmName ?? undefined,
      licenseNumber: profile.licenseNumber ?? undefined,
      timezone: profile.timezone ?? undefined,
      subscriptionTier: profile.subscriptionTier ?? undefined,
      bookingSlug: profile.bookingSlug ?? undefined,
      taxSeasonStart: profile.taxSeasonStart ?? undefined,
      taxSeasonEnd: profile.taxSeasonEnd ?? undefined,
      maxDailyAppointments: profile.maxDailyAppointments ?? undefined,
      maxDailyAppointmentsTaxSeason: profile.maxDailyAppointmentsTaxSeason ?? undefined,
    },
  });

  const handleSubmit = async (data: UpdateProfileFormData) => {
    setError(null);

    try {
      await onSuccess(data as UpdateProfileInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="email"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="firmName"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="licenseNumber"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="timezone"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="subscriptionTier"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="bookingSlug"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="taxSeasonStart"
        label=""
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
            <FormField
        name="taxSeasonEnd"
        label=""
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
            <FormField
        name="maxDailyAppointments"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="maxDailyAppointmentsTaxSeason"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// Client Forms
// ------------------------------------------------------------

import {
  CreateClientSchema,
  UpdateClientSchema,
} from '@/lib/validation';
import type {
  CreateClientInput,
  UpdateClientInput,
  Client,
} from '@/types/domain';

type CreateClientFormData = z.infer<typeof CreateClientSchema>;
type UpdateClientFormData = z.infer<typeof UpdateClientSchema>;

interface CreateClientFormProps {
  /** Called when form is submitted successfully */
  onSuccess: (data: CreateClientInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateClientFormData>;
}

/**
 * Form for creating a new Client.
 * Uses Zod schema validation from lib/validation.ts.
 *
 * @example
 * <CreateClientForm
 *   onSuccess={(data) => createClient(data)}
 *   onCancel={() => router.back()}
 * />
 */
export function CreateClientForm({
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
  defaultValues,
}: CreateClientFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CreateClientFormData>({
    resolver: zodResolver(CreateClientSchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = async (data: CreateClientFormData) => {
    setError(null);

    try {
      await onSuccess(data as CreateClientInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="email"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="phone"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="taxIdLast4"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="filingStatus"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="preferredContact"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Creating..."
        >
          Create Client
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface EditClientFormProps {
  /** The Client being edited */
  client: Client;
  /** Called when form is submitted successfully */
  onSuccess: (data: UpdateClientInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Form for editing an existing Client.
 * Pre-populates with current values.
 *
 * @example
 * <EditClientForm
 *   client={ clientData }
 *   onSuccess={(data) => updateClient(data)}
 *   onCancel={() => setIsEditing(false)}
 *   showCancel
 * />
 */
export function EditClientForm({
  client,
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
}: EditClientFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<UpdateClientFormData>({
    resolver: zodResolver(UpdateClientSchema),
    defaultValues: {
      userId: client.userId ?? undefined,
      name: client.name ?? undefined,
      email: client.email ?? undefined,
      phone: client.phone ?? undefined,
      taxIdLast4: client.taxIdLast4 ?? undefined,
      filingStatus: client.filingStatus ?? undefined,
      preferredContact: client.preferredContact ?? undefined,
      notes: client.notes ?? undefined,
    },
  });

  const handleSubmit = async (data: UpdateClientFormData) => {
    setError(null);

    try {
      await onSuccess(data as UpdateClientInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="email"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="phone"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="taxIdLast4"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="filingStatus"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="preferredContact"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// Service Forms
// ------------------------------------------------------------

import {
  CreateServiceSchema,
  UpdateServiceSchema,
} from '@/lib/validation';
import type {
  CreateServiceInput,
  UpdateServiceInput,
  Service,
} from '@/types/domain';

type CreateServiceFormData = z.infer<typeof CreateServiceSchema>;
type UpdateServiceFormData = z.infer<typeof UpdateServiceSchema>;

interface CreateServiceFormProps {
  /** Called when form is submitted successfully */
  onSuccess: (data: CreateServiceInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateServiceFormData>;
}

/**
 * Form for creating a new Service.
 * Uses Zod schema validation from lib/validation.ts.
 *
 * @example
 * <CreateServiceForm
 *   onSuccess={(data) => createService(data)}
 *   onCancel={() => router.back()}
 * />
 */
export function CreateServiceForm({
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
  defaultValues,
}: CreateServiceFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CreateServiceFormData>({
    resolver: zodResolver(CreateServiceSchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = async (data: CreateServiceFormData) => {
    setError(null);

    try {
      await onSuccess(data as CreateServiceInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="description"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="durationMinutes"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="price"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="taxSeasonOnly"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="requiresDocuments"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="isActive"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="bufferMinutes"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Creating..."
        >
          Create Service
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface EditServiceFormProps {
  /** The Service being edited */
  service: Service;
  /** Called when form is submitted successfully */
  onSuccess: (data: UpdateServiceInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Form for editing an existing Service.
 * Pre-populates with current values.
 *
 * @example
 * <EditServiceForm
 *   service={ serviceData }
 *   onSuccess={(data) => updateService(data)}
 *   onCancel={() => setIsEditing(false)}
 *   showCancel
 * />
 */
export function EditServiceForm({
  service,
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
}: EditServiceFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<UpdateServiceFormData>({
    resolver: zodResolver(UpdateServiceSchema),
    defaultValues: {
      userId: service.userId ?? undefined,
      name: service.name ?? undefined,
      description: service.description ?? undefined,
      durationMinutes: service.durationMinutes ?? undefined,
      price: service.price ?? undefined,
      taxSeasonOnly: service.taxSeasonOnly ?? undefined,
      requiresDocuments: service.requiresDocuments ?? undefined,
      isActive: service.isActive ?? undefined,
      bufferMinutes: service.bufferMinutes ?? undefined,
    },
  });

  const handleSubmit = async (data: UpdateServiceFormData) => {
    setError(null);

    try {
      await onSuccess(data as UpdateServiceInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="description"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="durationMinutes"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="price"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="taxSeasonOnly"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="requiresDocuments"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="isActive"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="bufferMinutes"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// Appointment Forms
// ------------------------------------------------------------

import {
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
} from '@/lib/validation';
import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  Appointment,
} from '@/types/domain';

type CreateAppointmentFormData = z.infer<typeof CreateAppointmentSchema>;
type UpdateAppointmentFormData = z.infer<typeof UpdateAppointmentSchema>;

interface CreateAppointmentFormProps {
  /** Called when form is submitted successfully */
  onSuccess: (data: CreateAppointmentInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateAppointmentFormData>;
}

/**
 * Form for creating a new Appointment.
 * Uses Zod schema validation from lib/validation.ts.
 *
 * @example
 * <CreateAppointmentForm
 *   onSuccess={(data) => createAppointment(data)}
 *   onCancel={() => router.back()}
 * />
 */
export function CreateAppointmentForm({
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
  defaultValues,
}: CreateAppointmentFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CreateAppointmentFormData>({
    resolver: zodResolver(CreateAppointmentSchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = async (data: CreateAppointmentFormData) => {
    setError(null);

    try {
      await onSuccess(data as CreateAppointmentInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="clientId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="serviceId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="startsAt"
        label=""
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
            <FormField
        name="endsAt"
        label=""
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
            <FormField
        name="status"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="meetingLink"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="reminderSent24h"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="reminderSent1h"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="cancellationReason"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Creating..."
        >
          Create Appointment
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface EditAppointmentFormProps {
  /** The Appointment being edited */
  appointment: Appointment;
  /** Called when form is submitted successfully */
  onSuccess: (data: UpdateAppointmentInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Form for editing an existing Appointment.
 * Pre-populates with current values.
 *
 * @example
 * <EditAppointmentForm
 *   appointment={ appointmentData }
 *   onSuccess={(data) => updateAppointment(data)}
 *   onCancel={() => setIsEditing(false)}
 *   showCancel
 * />
 */
export function EditAppointmentForm({
  appointment,
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
}: EditAppointmentFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<UpdateAppointmentFormData>({
    resolver: zodResolver(UpdateAppointmentSchema),
    defaultValues: {
      userId: appointment.userId ?? undefined,
      clientId: appointment.clientId ?? undefined,
      serviceId: appointment.serviceId ?? undefined,
      startsAt: appointment.startsAt ?? undefined,
      endsAt: appointment.endsAt ?? undefined,
      status: appointment.status ?? undefined,
      notes: appointment.notes ?? undefined,
      meetingLink: appointment.meetingLink ?? undefined,
      reminderSent24h: appointment.reminderSent24h ?? undefined,
      reminderSent1h: appointment.reminderSent1h ?? undefined,
      cancellationReason: appointment.cancellationReason ?? undefined,
    },
  });

  const handleSubmit = async (data: UpdateAppointmentFormData) => {
    setError(null);

    try {
      await onSuccess(data as UpdateAppointmentInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="clientId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="serviceId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="startsAt"
        label=""
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
            <FormField
        name="endsAt"
        label=""
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
            <FormField
        name="status"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="meetingLink"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="reminderSent24h"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="reminderSent1h"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="cancellationReason"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// Availability Forms
// ------------------------------------------------------------

import {
  CreateAvailabilitySchema,
  UpdateAvailabilitySchema,
} from '@/lib/validation';
import type {
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
  Availability,
} from '@/types/domain';

type CreateAvailabilityFormData = z.infer<typeof CreateAvailabilitySchema>;
type UpdateAvailabilityFormData = z.infer<typeof UpdateAvailabilitySchema>;

interface CreateAvailabilityFormProps {
  /** Called when form is submitted successfully */
  onSuccess: (data: CreateAvailabilityInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateAvailabilityFormData>;
}

/**
 * Form for creating a new Availability.
 * Uses Zod schema validation from lib/validation.ts.
 *
 * @example
 * <CreateAvailabilityForm
 *   onSuccess={(data) => createAvailability(data)}
 *   onCancel={() => router.back()}
 * />
 */
export function CreateAvailabilityForm({
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
  defaultValues,
}: CreateAvailabilityFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CreateAvailabilityFormData>({
    resolver: zodResolver(CreateAvailabilitySchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = async (data: CreateAvailabilityFormData) => {
    setError(null);

    try {
      await onSuccess(data as CreateAvailabilityInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="dayOfWeek"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="startTime"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="endTime"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="isTaxSeason"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Creating..."
        >
          Create Availability
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface EditAvailabilityFormProps {
  /** The Availability being edited */
  availability: Availability;
  /** Called when form is submitted successfully */
  onSuccess: (data: UpdateAvailabilityInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Form for editing an existing Availability.
 * Pre-populates with current values.
 *
 * @example
 * <EditAvailabilityForm
 *   availability={ availabilityData }
 *   onSuccess={(data) => updateAvailability(data)}
 *   onCancel={() => setIsEditing(false)}
 *   showCancel
 * />
 */
export function EditAvailabilityForm({
  availability,
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
}: EditAvailabilityFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<UpdateAvailabilityFormData>({
    resolver: zodResolver(UpdateAvailabilitySchema),
    defaultValues: {
      userId: availability.userId ?? undefined,
      dayOfWeek: availability.dayOfWeek ?? undefined,
      startTime: availability.startTime ?? undefined,
      endTime: availability.endTime ?? undefined,
      isTaxSeason: availability.isTaxSeason ?? undefined,
    },
  });

  const handleSubmit = async (data: UpdateAvailabilityFormData) => {
    setError(null);

    try {
      await onSuccess(data as UpdateAvailabilityInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="dayOfWeek"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="startTime"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="endTime"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormCheckbox
        name="isTaxSeason"
        label=""
        form={form}
        
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// Document Forms
// ------------------------------------------------------------

import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
} from '@/lib/validation';
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  Document,
} from '@/types/domain';

type CreateDocumentFormData = z.infer<typeof CreateDocumentSchema>;
type UpdateDocumentFormData = z.infer<typeof UpdateDocumentSchema>;

interface CreateDocumentFormProps {
  /** Called when form is submitted successfully */
  onSuccess: (data: CreateDocumentInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateDocumentFormData>;
}

/**
 * Form for creating a new Document.
 * Uses Zod schema validation from lib/validation.ts.
 *
 * @example
 * <CreateDocumentForm
 *   onSuccess={(data) => createDocument(data)}
 *   onCancel={() => router.back()}
 * />
 */
export function CreateDocumentForm({
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
  defaultValues,
}: CreateDocumentFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CreateDocumentFormData>({
    resolver: zodResolver(CreateDocumentSchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = async (data: CreateDocumentFormData) => {
    setError(null);

    try {
      await onSuccess(data as CreateDocumentInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="clientId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="appointmentId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="documentType"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="fileUrl"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="fileName"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="status"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="taxYear"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="rejectionReason"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Creating..."
        >
          Create Document
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface EditDocumentFormProps {
  /** The Document being edited */
  document: Document;
  /** Called when form is submitted successfully */
  onSuccess: (data: UpdateDocumentInput) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (error: Error) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Form for editing an existing Document.
 * Pre-populates with current values.
 *
 * @example
 * <EditDocumentForm
 *   document={ documentData }
 *   onSuccess={(data) => updateDocument(data)}
 *   onCancel={() => setIsEditing(false)}
 *   showCancel
 * />
 */
export function EditDocumentForm({
  document,
  onSuccess,
  onError,
  showCancel = false,
  onCancel,
}: EditDocumentFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<UpdateDocumentFormData>({
    resolver: zodResolver(UpdateDocumentSchema),
    defaultValues: {
      userId: document.userId ?? undefined,
      clientId: document.clientId ?? undefined,
      appointmentId: document.appointmentId ?? undefined,
      documentType: document.documentType ?? undefined,
      fileUrl: document.fileUrl ?? undefined,
      fileName: document.fileName ?? undefined,
      status: document.status ?? undefined,
      taxYear: document.taxYear ?? undefined,
      notes: document.notes ?? undefined,
      rejectionReason: document.rejectionReason ?? undefined,
    },
  });

  const handleSubmit = async (data: UpdateDocumentFormData) => {
    setError(null);

    try {
      await onSuccess(data as UpdateDocumentInput);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormError message={error} />

      <FormField
        name="userId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="clientId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="appointmentId"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="documentType"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="fileUrl"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="fileName"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="status"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="taxYear"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />
      <FormField
        name="rejectionReason"
        label=""
        type="text"
        
        
        form={form}
        disabled={form.formState.isSubmitting}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={form.formState.isSubmitting}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}


// ============================================================
// GENERIC FORM WRAPPER HOOK
// ============================================================

interface UseFormSubmitOptions<TData, TResponse> {
  /** Async function to call with form data */
  submitFn: (data: TData) => Promise<TResponse>;
  /** Called on successful submission */
  onSuccess?: (response: TResponse) => void;
  /** Called on failed submission */
  onError?: (error: Error) => void;
}

/**
 * Hook for handling form submission with loading and error states.
 *
 * @example
 * const { submit, isSubmitting, error } = useFormSubmit({
 *   submitFn: (data) => api.createUser(data),
 *   onSuccess: (user) => router.push(`/users/${user.id}`),
 * });
 */
export function useFormSubmit<TData, TResponse>({
  submitFn,
  onSuccess,
  onError,
}: UseFormSubmitOptions<TData, TResponse>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = React.useCallback(
    async (data: TData) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await submitFn(data);
        onSuccess?.(response);
        return response;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
        setError(errorMessage);
        onError?.(e instanceof Error ? e : new Error(errorMessage));
        throw e;
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitFn, onSuccess, onError]
  );

  const clearError = React.useCallback(() => setError(null), []);

  return { submit, isSubmitting, error, clearError };
}

// ============================================================
// MUTATION-INTEGRATED FORM HOOK
// ============================================================

import { UseMutationResult } from '@tanstack/react-query';
import { toastSuccess, toastError } from '@/components/ui/toast';

/**
 * Toast messages configuration for form operations.
 */
interface FormToastMessages {
  /** Message shown on successful submission */
  success: string;
  /** Message shown on failed submission (error message appended) */
  error?: string;
  /** Message shown while submitting (for optimistic feedback) */
  loading?: string;
}

/**
 * Default toast messages by operation type.
 */
const DEFAULT_TOAST_MESSAGES = {
  create: {
    success: 'Created successfully',
    error: 'Failed to create',
    loading: 'Creating...',
  },
  update: {
    success: 'Saved successfully',
    error: 'Failed to save changes',
    loading: 'Saving...',
  },
  delete: {
    success: 'Deleted successfully',
    error: 'Failed to delete',
    loading: 'Deleting...',
  },
} as const;

type OperationType = keyof typeof DEFAULT_TOAST_MESSAGES;

interface UseMutationFormOptions<TFormData, TMutationData, TResponse> {
  /** The React Query mutation to use */
  mutation: UseMutationResult<TResponse, Error, TMutationData>;
  /** Transform form data to mutation input (optional, defaults to identity) */
  transformData?: (data: TFormData) => TMutationData;
  /** Toast messages configuration */
  toastMessages?: FormToastMessages;
  /** Operation type for default toast messages */
  operationType?: OperationType;
  /** Callback after successful mutation */
  onSuccess?: (response: TResponse) => void;
  /** Callback after failed mutation */
  onError?: (error: Error) => void;
  /** Whether to show toast notifications (default: true) */
  showToast?: boolean;
  /** Whether to reset the form after successful submission */
  resetOnSuccess?: boolean;
}

/**
 * Hook that integrates react-hook-form with React Query mutations and toast notifications.
 * Provides automatic success/error toasts and proper loading states.
 *
 * @example
 * // Basic usage with Create mutation
 * const createMutation = useCreateProject();
 * const { handleFormSubmit, isSubmitting } = useMutationForm({
 *   mutation: createMutation,
 *   operationType: 'create',
 *   onSuccess: (project) => router.push(`/projects/${project.id}`),
 * });
 *
 * // Custom toast messages
 * const { handleFormSubmit } = useMutationForm({
 *   mutation: updateMutation,
 *   toastMessages: {
 *     success: 'Profile updated!',
 *     error: 'Could not update profile',
 *   },
 * });
 *
 * // With data transformation
 * const { handleFormSubmit } = useMutationForm({
 *   mutation: createMutation,
 *   transformData: (formData) => ({ ...formData, status: 'draft' }),
 * });
 *
 * // In form
 * <form onSubmit={form.handleSubmit(handleFormSubmit)}>
 *   ...
 * </form>
 */
export function useMutationForm<
  TFormData extends FieldValues,
  TMutationData = TFormData,
  TResponse = unknown,
>({
  mutation,
  transformData,
  toastMessages,
  operationType = 'create',
  onSuccess,
  onError,
  showToast = true,
  resetOnSuccess = false,
}: UseMutationFormOptions<TFormData, TMutationData, TResponse>) {
  const messages = toastMessages ?? DEFAULT_TOAST_MESSAGES[operationType];

  const handleFormSubmit = React.useCallback(
    async (data: TFormData) => {
      const mutationData = transformData
        ? transformData(data)
        : (data as unknown as TMutationData);

      try {
        const response = await mutation.mutateAsync(mutationData);

        if (showToast) {
          toastSuccess({ title: messages.success });
        }

        onSuccess?.(response);
        return response;
      } catch (e) {
        const error = e instanceof Error ? e : new Error('An unexpected error occurred');

        if (showToast) {
          const errorPrefix = messages.error ?? 'Operation failed';
          toastError({ title: `${errorPrefix}: ${error.message}` });
        }

        onError?.(error);
        throw error;
      }
    },
    [mutation, transformData, messages, showToast, onSuccess, onError]
  );

  return {
    /** Handler to pass to form.handleSubmit() */
    handleFormSubmit,
    /** Whether the mutation is currently in progress */
    isSubmitting: mutation.isPending,
    /** The last error from the mutation */
    error: mutation.error,
    /** Reset the mutation state */
    reset: mutation.reset,
  };
}

// ============================================================
// FORM WITH MUTATION WRAPPER COMPONENT
// ============================================================

interface MutationFormProps<TFormData extends FieldValues, TMutationData, TResponse> {
  /** The form instance from useForm */
  form: UseFormReturn<TFormData>;
  /** The mutation options */
  mutationOptions: UseMutationFormOptions<TFormData, TMutationData, TResponse>;
  /** Form content (children) */
  children: React.ReactNode;
  /** Additional CSS classes for the form */
  className?: string;
}

/**
 * Form wrapper that integrates with React Query mutations.
 * Handles submission, loading states, and toast notifications automatically.
 *
 * @example
 * const form = useForm<CreateProjectInput>({
 *   resolver: zodResolver(CreateProjectSchema),
 * });
 * const createMutation = useCreateProject();
 *
 * return (
 *   <MutationForm
 *     form={form}
 *     mutationOptions={{
 *       mutation: createMutation,
 *       operationType: 'create',
 *       onSuccess: (project) => router.push(`/projects/${project.id}`),
 *     }}
 *     className="space-y-6"
 *   >
 *     <FormField name="name" label="Project Name" form={form} />
 *     <SubmitButton isSubmitting={createMutation.isPending}>
 *       Create Project
 *     </SubmitButton>
 *   </MutationForm>
 * );
 */
export function MutationForm<
  TFormData extends FieldValues,
  TMutationData = TFormData,
  TResponse = unknown,
>({
  form,
  mutationOptions,
  children,
  className = 'space-y-6',
}: MutationFormProps<TFormData, TMutationData, TResponse>) {
  const { handleFormSubmit, error } = useMutationForm<TFormData, TMutationData, TResponse>(
    mutationOptions
  );

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className={className}>
      <FormError message={error?.message} />
      {children}
    </form>
  );
}

// ============================================================
// ENTITY MUTATION FORM HELPERS
// ============================================================

import { useCreateProfile, useUpdateProfile } from '@/lib/api-client';

interface ProfileCreateFormWithMutationProps {
  /** Called after successful creation */
  onSuccess?: (data: Profile) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateProfileFormData>;
}

/**
 * CreateProfile form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <ProfileCreateFormWithMutation
 *   onSuccess={(profile) => router.push(`/profiles/${{{camelCase name}}.id}`)}
 *   showCancel
 *   onCancel={() => router.back()}
 * />
 */
export function ProfileCreateFormWithMutation({
  onSuccess,
  showCancel = false,
  onCancel,
  defaultValues,
}: ProfileCreateFormWithMutationProps) {
  const form = useForm<CreateProfileFormData>({
    resolver: zodResolver(CreateProfileSchema),
    defaultValues,
  });

  const createMutation = useCreateProfile();
  const { handleFormSubmit } = useMutationForm({
    mutation: createMutation,
    operationType: 'create',
    toastMessages: {
      success: 'Profile created successfully',
      error: 'Failed to create Profile',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={createMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="email"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="firmName"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="licenseNumber"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="timezone"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="subscriptionTier"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="bookingSlug"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="taxSeasonStart"
        label=""
        
        
        form={form}
        disabled={createMutation.isPending}
      />
            <FormField
        name="taxSeasonEnd"
        label=""
        
        
        form={form}
        disabled={createMutation.isPending}
      />
            <FormField
        name="maxDailyAppointments"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="maxDailyAppointmentsTaxSeason"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={createMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={createMutation.isPending}
          loadingText="Creating..."
        >
          Create Profile
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface ProfileEditFormWithMutationProps {
  /** The Profile being edited */
  profile: Profile;
  /** Called after successful update */
  onSuccess?: (data: Profile) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * EditProfile form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <ProfileEditFormWithMutation
 *   profile={existingProfile\}
 *   onSuccess={() => setIsEditing(false)}
 *   showCancel
 *   onCancel={() => setIsEditing(false)}
 * />
 */
export function ProfileEditFormWithMutation({
  profile,
  onSuccess,
  showCancel = false,
  onCancel,
}: ProfileEditFormWithMutationProps) {
  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      userId: profile.userId ?? undefined,
      email: profile.email ?? undefined,
      name: profile.name ?? undefined,
      firmName: profile.firmName ?? undefined,
      licenseNumber: profile.licenseNumber ?? undefined,
      timezone: profile.timezone ?? undefined,
      subscriptionTier: profile.subscriptionTier ?? undefined,
      bookingSlug: profile.bookingSlug ?? undefined,
      taxSeasonStart: profile.taxSeasonStart ?? undefined,
      taxSeasonEnd: profile.taxSeasonEnd ?? undefined,
      maxDailyAppointments: profile.maxDailyAppointments ?? undefined,
      maxDailyAppointmentsTaxSeason: profile.maxDailyAppointmentsTaxSeason ?? undefined,
    },
  });

  const updateMutation = useUpdateProfile();
  const { handleFormSubmit } = useMutationForm({
    mutation: updateMutation,
    operationType: 'update',
    transformData: (data) => ({ id: profile.id, data }),
    toastMessages: {
      success: 'Profile saved successfully',
      error: 'Failed to save Profile',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={updateMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="email"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="firmName"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="licenseNumber"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="timezone"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="subscriptionTier"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="bookingSlug"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="taxSeasonStart"
        label=""
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
            <FormField
        name="taxSeasonEnd"
        label=""
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
            <FormField
        name="maxDailyAppointments"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="maxDailyAppointmentsTaxSeason"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={updateMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={updateMutation.isPending}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

import { useCreateClient, useUpdateClient } from '@/lib/api-client';

interface ClientCreateFormWithMutationProps {
  /** Called after successful creation */
  onSuccess?: (data: Client) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateClientFormData>;
}

/**
 * CreateClient form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <ClientCreateFormWithMutation
 *   onSuccess={(client) => router.push(`/clients/${{{camelCase name}}.id}`)}
 *   showCancel
 *   onCancel={() => router.back()}
 * />
 */
export function ClientCreateFormWithMutation({
  onSuccess,
  showCancel = false,
  onCancel,
  defaultValues,
}: ClientCreateFormWithMutationProps) {
  const form = useForm<CreateClientFormData>({
    resolver: zodResolver(CreateClientSchema),
    defaultValues,
  });

  const createMutation = useCreateClient();
  const { handleFormSubmit } = useMutationForm({
    mutation: createMutation,
    operationType: 'create',
    toastMessages: {
      success: 'Client created successfully',
      error: 'Failed to create Client',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={createMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="email"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="phone"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="taxIdLast4"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="filingStatus"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="preferredContact"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={createMutation.isPending}
          loadingText="Creating..."
        >
          Create Client
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface ClientEditFormWithMutationProps {
  /** The Client being edited */
  client: Client;
  /** Called after successful update */
  onSuccess?: (data: Client) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * EditClient form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <ClientEditFormWithMutation
 *   client={existingClient\}
 *   onSuccess={() => setIsEditing(false)}
 *   showCancel
 *   onCancel={() => setIsEditing(false)}
 * />
 */
export function ClientEditFormWithMutation({
  client,
  onSuccess,
  showCancel = false,
  onCancel,
}: ClientEditFormWithMutationProps) {
  const form = useForm<UpdateClientFormData>({
    resolver: zodResolver(UpdateClientSchema),
    defaultValues: {
      userId: client.userId ?? undefined,
      name: client.name ?? undefined,
      email: client.email ?? undefined,
      phone: client.phone ?? undefined,
      taxIdLast4: client.taxIdLast4 ?? undefined,
      filingStatus: client.filingStatus ?? undefined,
      preferredContact: client.preferredContact ?? undefined,
      notes: client.notes ?? undefined,
    },
  });

  const updateMutation = useUpdateClient();
  const { handleFormSubmit } = useMutationForm({
    mutation: updateMutation,
    operationType: 'update',
    transformData: (data) => ({ id: client.id, data }),
    toastMessages: {
      success: 'Client saved successfully',
      error: 'Failed to save Client',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={updateMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="email"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="phone"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="taxIdLast4"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="filingStatus"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="preferredContact"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={updateMutation.isPending}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

import { useCreateService, useUpdateService } from '@/lib/api-client';

interface ServiceCreateFormWithMutationProps {
  /** Called after successful creation */
  onSuccess?: (data: Service) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateServiceFormData>;
}

/**
 * CreateService form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <ServiceCreateFormWithMutation
 *   onSuccess={(service) => router.push(`/services/${{{camelCase name}}.id}`)}
 *   showCancel
 *   onCancel={() => router.back()}
 * />
 */
export function ServiceCreateFormWithMutation({
  onSuccess,
  showCancel = false,
  onCancel,
  defaultValues,
}: ServiceCreateFormWithMutationProps) {
  const form = useForm<CreateServiceFormData>({
    resolver: zodResolver(CreateServiceSchema),
    defaultValues,
  });

  const createMutation = useCreateService();
  const { handleFormSubmit } = useMutationForm({
    mutation: createMutation,
    operationType: 'create',
    toastMessages: {
      success: 'Service created successfully',
      error: 'Failed to create Service',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={createMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="description"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="durationMinutes"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="price"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormCheckbox
        name="taxSeasonOnly"
        label=""
        form={form}
        
        disabled={createMutation.isPending}
      />
      <FormCheckbox
        name="requiresDocuments"
        label=""
        form={form}
        
        disabled={createMutation.isPending}
      />
      <FormCheckbox
        name="isActive"
        label=""
        form={form}
        
        disabled={createMutation.isPending}
      />
      <FormField
        name="bufferMinutes"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={createMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={createMutation.isPending}
          loadingText="Creating..."
        >
          Create Service
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface ServiceEditFormWithMutationProps {
  /** The Service being edited */
  service: Service;
  /** Called after successful update */
  onSuccess?: (data: Service) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * EditService form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <ServiceEditFormWithMutation
 *   service={existingService\}
 *   onSuccess={() => setIsEditing(false)}
 *   showCancel
 *   onCancel={() => setIsEditing(false)}
 * />
 */
export function ServiceEditFormWithMutation({
  service,
  onSuccess,
  showCancel = false,
  onCancel,
}: ServiceEditFormWithMutationProps) {
  const form = useForm<UpdateServiceFormData>({
    resolver: zodResolver(UpdateServiceSchema),
    defaultValues: {
      userId: service.userId ?? undefined,
      name: service.name ?? undefined,
      description: service.description ?? undefined,
      durationMinutes: service.durationMinutes ?? undefined,
      price: service.price ?? undefined,
      taxSeasonOnly: service.taxSeasonOnly ?? undefined,
      requiresDocuments: service.requiresDocuments ?? undefined,
      isActive: service.isActive ?? undefined,
      bufferMinutes: service.bufferMinutes ?? undefined,
    },
  });

  const updateMutation = useUpdateService();
  const { handleFormSubmit } = useMutationForm({
    mutation: updateMutation,
    operationType: 'update',
    transformData: (data) => ({ id: service.id, data }),
    toastMessages: {
      success: 'Service saved successfully',
      error: 'Failed to save Service',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={updateMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="name"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="description"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="durationMinutes"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="price"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormCheckbox
        name="taxSeasonOnly"
        label=""
        form={form}
        
        disabled={updateMutation.isPending}
      />
      <FormCheckbox
        name="requiresDocuments"
        label=""
        form={form}
        
        disabled={updateMutation.isPending}
      />
      <FormCheckbox
        name="isActive"
        label=""
        form={form}
        
        disabled={updateMutation.isPending}
      />
      <FormField
        name="bufferMinutes"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={updateMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={updateMutation.isPending}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

import { useCreateAppointment, useUpdateAppointment } from '@/lib/api-client';

interface AppointmentCreateFormWithMutationProps {
  /** Called after successful creation */
  onSuccess?: (data: Appointment) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateAppointmentFormData>;
}

/**
 * CreateAppointment form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <AppointmentCreateFormWithMutation
 *   onSuccess={(appointment) => router.push(`/appointments/${{{camelCase name}}.id}`)}
 *   showCancel
 *   onCancel={() => router.back()}
 * />
 */
export function AppointmentCreateFormWithMutation({
  onSuccess,
  showCancel = false,
  onCancel,
  defaultValues,
}: AppointmentCreateFormWithMutationProps) {
  const form = useForm<CreateAppointmentFormData>({
    resolver: zodResolver(CreateAppointmentSchema),
    defaultValues,
  });

  const createMutation = useCreateAppointment();
  const { handleFormSubmit } = useMutationForm({
    mutation: createMutation,
    operationType: 'create',
    toastMessages: {
      success: 'Appointment created successfully',
      error: 'Failed to create Appointment',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={createMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="clientId"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="serviceId"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="startsAt"
        label=""
        
        
        form={form}
        disabled={createMutation.isPending}
      />
            <FormField
        name="endsAt"
        label=""
        
        
        form={form}
        disabled={createMutation.isPending}
      />
            <FormField
        name="status"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="meetingLink"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormCheckbox
        name="reminderSent24h"
        label=""
        form={form}
        
        disabled={createMutation.isPending}
      />
      <FormCheckbox
        name="reminderSent1h"
        label=""
        form={form}
        
        disabled={createMutation.isPending}
      />
      <FormField
        name="cancellationReason"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={createMutation.isPending}
          loadingText="Creating..."
        >
          Create Appointment
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface AppointmentEditFormWithMutationProps {
  /** The Appointment being edited */
  appointment: Appointment;
  /** Called after successful update */
  onSuccess?: (data: Appointment) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * EditAppointment form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <AppointmentEditFormWithMutation
 *   appointment={existingAppointment\}
 *   onSuccess={() => setIsEditing(false)}
 *   showCancel
 *   onCancel={() => setIsEditing(false)}
 * />
 */
export function AppointmentEditFormWithMutation({
  appointment,
  onSuccess,
  showCancel = false,
  onCancel,
}: AppointmentEditFormWithMutationProps) {
  const form = useForm<UpdateAppointmentFormData>({
    resolver: zodResolver(UpdateAppointmentSchema),
    defaultValues: {
      userId: appointment.userId ?? undefined,
      clientId: appointment.clientId ?? undefined,
      serviceId: appointment.serviceId ?? undefined,
      startsAt: appointment.startsAt ?? undefined,
      endsAt: appointment.endsAt ?? undefined,
      status: appointment.status ?? undefined,
      notes: appointment.notes ?? undefined,
      meetingLink: appointment.meetingLink ?? undefined,
      reminderSent24h: appointment.reminderSent24h ?? undefined,
      reminderSent1h: appointment.reminderSent1h ?? undefined,
      cancellationReason: appointment.cancellationReason ?? undefined,
    },
  });

  const updateMutation = useUpdateAppointment();
  const { handleFormSubmit } = useMutationForm({
    mutation: updateMutation,
    operationType: 'update',
    transformData: (data) => ({ id: appointment.id, data }),
    toastMessages: {
      success: 'Appointment saved successfully',
      error: 'Failed to save Appointment',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={updateMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="clientId"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="serviceId"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="startsAt"
        label=""
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
            <FormField
        name="endsAt"
        label=""
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
            <FormField
        name="status"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="meetingLink"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormCheckbox
        name="reminderSent24h"
        label=""
        form={form}
        
        disabled={updateMutation.isPending}
      />
      <FormCheckbox
        name="reminderSent1h"
        label=""
        form={form}
        
        disabled={updateMutation.isPending}
      />
      <FormField
        name="cancellationReason"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={updateMutation.isPending}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

import { useCreateAvailability, useUpdateAvailability } from '@/lib/api-client';

interface AvailabilityCreateFormWithMutationProps {
  /** Called after successful creation */
  onSuccess?: (data: Availability) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateAvailabilityFormData>;
}

/**
 * CreateAvailability form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <AvailabilityCreateFormWithMutation
 *   onSuccess={(availability) => router.push(`/availabilitys/${{{camelCase name}}.id}`)}
 *   showCancel
 *   onCancel={() => router.back()}
 * />
 */
export function AvailabilityCreateFormWithMutation({
  onSuccess,
  showCancel = false,
  onCancel,
  defaultValues,
}: AvailabilityCreateFormWithMutationProps) {
  const form = useForm<CreateAvailabilityFormData>({
    resolver: zodResolver(CreateAvailabilitySchema),
    defaultValues,
  });

  const createMutation = useCreateAvailability();
  const { handleFormSubmit } = useMutationForm({
    mutation: createMutation,
    operationType: 'create',
    toastMessages: {
      success: 'Availability created successfully',
      error: 'Failed to create Availability',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={createMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="dayOfWeek"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="startTime"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="endTime"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormCheckbox
        name="isTaxSeason"
        label=""
        form={form}
        
        disabled={createMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={createMutation.isPending}
          loadingText="Creating..."
        >
          Create Availability
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface AvailabilityEditFormWithMutationProps {
  /** The Availability being edited */
  availability: Availability;
  /** Called after successful update */
  onSuccess?: (data: Availability) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * EditAvailability form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <AvailabilityEditFormWithMutation
 *   availability={existingAvailability\}
 *   onSuccess={() => setIsEditing(false)}
 *   showCancel
 *   onCancel={() => setIsEditing(false)}
 * />
 */
export function AvailabilityEditFormWithMutation({
  availability,
  onSuccess,
  showCancel = false,
  onCancel,
}: AvailabilityEditFormWithMutationProps) {
  const form = useForm<UpdateAvailabilityFormData>({
    resolver: zodResolver(UpdateAvailabilitySchema),
    defaultValues: {
      userId: availability.userId ?? undefined,
      dayOfWeek: availability.dayOfWeek ?? undefined,
      startTime: availability.startTime ?? undefined,
      endTime: availability.endTime ?? undefined,
      isTaxSeason: availability.isTaxSeason ?? undefined,
    },
  });

  const updateMutation = useUpdateAvailability();
  const { handleFormSubmit } = useMutationForm({
    mutation: updateMutation,
    operationType: 'update',
    transformData: (data) => ({ id: availability.id, data }),
    toastMessages: {
      success: 'Availability saved successfully',
      error: 'Failed to save Availability',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={updateMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="dayOfWeek"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="startTime"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="endTime"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormCheckbox
        name="isTaxSeason"
        label=""
        form={form}
        
        disabled={updateMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={updateMutation.isPending}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

import { useCreateDocument, useUpdateDocument } from '@/lib/api-client';

interface DocumentCreateFormWithMutationProps {
  /** Called after successful creation */
  onSuccess?: (data: Document) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Initial values for the form */
  defaultValues?: Partial<CreateDocumentFormData>;
}

/**
 * CreateDocument form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <DocumentCreateFormWithMutation
 *   onSuccess={(document) => router.push(`/documents/${{{camelCase name}}.id}`)}
 *   showCancel
 *   onCancel={() => router.back()}
 * />
 */
export function DocumentCreateFormWithMutation({
  onSuccess,
  showCancel = false,
  onCancel,
  defaultValues,
}: DocumentCreateFormWithMutationProps) {
  const form = useForm<CreateDocumentFormData>({
    resolver: zodResolver(CreateDocumentSchema),
    defaultValues,
  });

  const createMutation = useCreateDocument();
  const { handleFormSubmit } = useMutationForm({
    mutation: createMutation,
    operationType: 'create',
    toastMessages: {
      success: 'Document created successfully',
      error: 'Failed to create Document',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={createMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="clientId"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="appointmentId"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="documentType"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="fileUrl"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="fileName"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="status"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="taxYear"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />
      <FormField
        name="rejectionReason"
        label=""
        type="text"
        
        
        form={form}
        disabled={createMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={createMutation.isPending}
          loadingText="Creating..."
        >
          Create Document
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

interface DocumentEditFormWithMutationProps {
  /** The Document being edited */
  document: Document;
  /** Called after successful update */
  onSuccess?: (data: Document) => void;
  /** Whether to show a cancel button */
  showCancel?: boolean;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

/**
 * EditDocument form with built-in mutation and toast integration.
 * Uses React Query for state management and automatic cache invalidation.
 *
 * @example
 * <DocumentEditFormWithMutation
 *   document={existingDocument\}
 *   onSuccess={() => setIsEditing(false)}
 *   showCancel
 *   onCancel={() => setIsEditing(false)}
 * />
 */
export function DocumentEditFormWithMutation({
  document,
  onSuccess,
  showCancel = false,
  onCancel,
}: DocumentEditFormWithMutationProps) {
  const form = useForm<UpdateDocumentFormData>({
    resolver: zodResolver(UpdateDocumentSchema),
    defaultValues: {
      userId: document.userId ?? undefined,
      clientId: document.clientId ?? undefined,
      appointmentId: document.appointmentId ?? undefined,
      documentType: document.documentType ?? undefined,
      fileUrl: document.fileUrl ?? undefined,
      fileName: document.fileName ?? undefined,
      status: document.status ?? undefined,
      taxYear: document.taxYear ?? undefined,
      notes: document.notes ?? undefined,
      rejectionReason: document.rejectionReason ?? undefined,
    },
  });

  const updateMutation = useUpdateDocument();
  const { handleFormSubmit } = useMutationForm({
    mutation: updateMutation,
    operationType: 'update',
    transformData: (data) => ({ id: document.id, data }),
    toastMessages: {
      success: 'Document saved successfully',
      error: 'Failed to save Document',
    },
    onSuccess,
  });

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormError message={updateMutation.error?.message} />

      {/* userId is auto-injected from session - not user-editable */}
      <FormField
        name="clientId"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="appointmentId"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="documentType"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="fileUrl"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="fileName"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="status"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="taxYear"
        label=""
        type="number"
        
        
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="notes"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />
      <FormField
        name="rejectionReason"
        label=""
        type="text"
        
        
        form={form}
        disabled={updateMutation.isPending}
      />

      <div className="flex gap-4">
        <SubmitButton
          isSubmitting={updateMutation.isPending}
          loadingText="Saving..."
        >
          Save Changes
        </SubmitButton>
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}


// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
