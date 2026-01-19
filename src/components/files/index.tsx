/**
 * File Upload Components - taxbook-pro
 * Generated: 2026-01-19
 *
 * Drag-and-drop file upload with Supabase Storage integration.
 * Includes upload progress, file preview, and error handling.
 *
 * Place in: components/files/
 *
 * @example
 * // Basic usage
 * <FileUpload
 *   bucket="media"
 *   onUploadComplete={(files) => console.log(files)}
 * />
 *
 * @example
 * // With restrictions
 * <FileUpload
 *   bucket="documents"
 *   allowedTypes={['application/pdf', 'image/*']}
 *   maxSizeMB={10}
 *   maxFiles={5}
 *   onUploadComplete={(files) => setDocuments(files)}
 *   onError={(error) => toast.error(error.message)}
 * />
 *
 * @example
 * // File list with delete
 * <FileList
 *   files={uploadedFiles}
 *   onDelete={(file) => handleDelete(file)}
 *   showPreview
 * />
 */

'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// ============================================================
// TYPES
// ============================================================

/** Represents an uploaded file with its metadata */
export interface UploadedFile {
  /** Unique identifier for the file */
  id: string;
  /** Original file name */
  name: string;
  /** Storage path in the bucket */
  path: string;
  /** Public URL (if bucket is public) */
  url: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Upload timestamp */
  uploadedAt: Date;
}

/** Upload progress for a single file */
export interface FileUploadProgress {
  /** File being uploaded */
  file: File;
  /** Progress percentage (0-100) */
  progress: number;
  /** Upload status */
  status: 'pending' | 'uploading' | 'complete' | 'error';
  /** Error message if status is 'error' */
  error?: string;
  /** Resulting uploaded file if complete */
  result?: UploadedFile;
}

/** Configuration for file upload */
export interface FileUploadConfig {
  /** Supabase storage bucket name */
  bucket: string;
  /** Allowed MIME types (e.g., ['image/*', 'application/pdf']) */
  allowedTypes?: string[];
  /** Maximum file size in megabytes */
  maxSizeMB?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Custom path prefix within the bucket */
  pathPrefix?: string;
  /** Whether to generate unique file names */
  useUniqueNames?: boolean;
}

/** Error types for file upload */
export type FileUploadError =
  | { type: 'file_too_large'; file: File; maxSizeMB: number }
  | { type: 'invalid_type'; file: File; allowedTypes: string[] }
  | { type: 'too_many_files'; count: number; maxFiles: number }
  | { type: 'upload_failed'; file: File; message: string }
  | { type: 'network_error'; message: string };

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Checks if a file type matches the allowed types
 */
export function isFileTypeAllowed(file: File, allowedTypes: string[]): boolean {
  if (allowedTypes.length === 0) return true;

  return allowedTypes.some((allowed) => {
    if (allowed.endsWith('/*')) {
      // Wildcard match (e.g., 'image/*')
      const category = allowed.slice(0, -2);
      return file.type.startsWith(category);
    }
    return file.type === allowed;
  });
}

/**
 * Generates a unique file name with timestamp and random suffix
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `${baseName}-${timestamp}-${random}.${extension}`;
}

/**
 * Gets file extension from name
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Determines if file is an image based on MIME type
 */
export function isImageFile(file: File | UploadedFile): boolean {
  const type = 'type' in file ? file.type : '';
  return type.startsWith('image/');
}

// ============================================================
// FILE UPLOAD HOOK
// ============================================================

interface UseFileUploadOptions extends FileUploadConfig {
  /** Called when all uploads complete */
  onUploadComplete?: (files: UploadedFile[]) => void;
  /** Called when an error occurs */
  onError?: (error: FileUploadError) => void;
  /** Called when progress updates */
  onProgress?: (progress: FileUploadProgress[]) => void;
}

interface UseFileUploadReturn {
  /** Upload files to Supabase Storage */
  uploadFiles: (files: File[]) => Promise<UploadedFile[]>;
  /** Current upload progress for all files */
  progress: FileUploadProgress[];
  /** Whether any upload is in progress */
  isUploading: boolean;
  /** Cancel all pending uploads */
  cancelUpload: () => void;
  /** Clear completed/errored uploads from progress */
  clearProgress: () => void;
  /** Delete a file from storage */
  deleteFile: (path: string) => Promise<boolean>;
}

/**
 * Hook for handling file uploads to Supabase Storage.
 *
 * @example
 * const { uploadFiles, progress, isUploading } = useFileUpload({
 *   bucket: 'media',
 *   maxSizeMB: 10,
 *   allowedTypes: ['image/*'],
 *   onUploadComplete: (files) => setUploadedFiles(prev => [...prev, ...files]),
 *   onError: (error) => toast.error(getErrorMessage(error)),
 * });
 */
export function useFileUpload({
  bucket,
  allowedTypes = [],
  maxSizeMB = 50,
  maxFiles = 10,
  pathPrefix = '',
  useUniqueNames = true,
  onUploadComplete,
  onError,
  onProgress,
}: UseFileUploadOptions): UseFileUploadReturn {
  const [progress, setProgress] = React.useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const supabase = createClient();

  const updateProgress = React.useCallback(
    (updates: Partial<FileUploadProgress> & { file: File }) => {
      setProgress((prev) => {
        const newProgress = prev.map((p) =>
          p.file === updates.file ? { ...p, ...updates } : p
        );
        onProgress?.(newProgress);
        return newProgress;
      });
    },
    [onProgress]
  );

  const uploadFiles = React.useCallback(
    async (files: File[]): Promise<UploadedFile[]> => {
      // Validate file count
      if (files.length > maxFiles) {
        const error: FileUploadError = {
          type: 'too_many_files',
          count: files.length,
          maxFiles,
        };
        onError?.(error);
        return [];
      }

      // Validate each file
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      for (const file of files) {
        if (file.size > maxSizeBytes) {
          const error: FileUploadError = {
            type: 'file_too_large',
            file,
            maxSizeMB,
          };
          onError?.(error);
          return [];
        }

        if (!isFileTypeAllowed(file, allowedTypes)) {
          const error: FileUploadError = {
            type: 'invalid_type',
            file,
            allowedTypes,
          };
          onError?.(error);
          return [];
        }
      }

      // Initialize progress tracking
      const initialProgress: FileUploadProgress[] = files.map((file) => ({
        file,
        progress: 0,
        status: 'pending',
      }));
      setProgress(initialProgress);
      setIsUploading(true);

      abortControllerRef.current = new AbortController();
      const uploadedFiles: UploadedFile[] = [];

      try {
        // Upload files sequentially to properly track progress
        for (const file of files) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          updateProgress({ file, status: 'uploading', progress: 0 });

          const fileName = useUniqueNames
            ? generateUniqueFileName(file.name)
            : file.name;
          const filePath = pathPrefix
            ? `${pathPrefix}/${fileName}`
            : fileName;

          try {
            const { data, error } = await supabase.storage
              .from(bucket)
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (error) {
              updateProgress({
                file,
                status: 'error',
                error: error.message,
                progress: 0,
              });
              const uploadError: FileUploadError = {
                type: 'upload_failed',
                file,
                message: error.message,
              };
              onError?.(uploadError);
              continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(data.path);

            const uploadedFile: UploadedFile = {
              id: data.id || crypto.randomUUID(),
              name: file.name,
              path: data.path,
              url: urlData.publicUrl,
              size: file.size,
              type: file.type,
              uploadedAt: new Date(),
            };

            uploadedFiles.push(uploadedFile);
            updateProgress({
              file,
              status: 'complete',
              progress: 100,
              result: uploadedFile,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Upload failed';
            updateProgress({
              file,
              status: 'error',
              error: message,
              progress: 0,
            });
            const uploadError: FileUploadError = {
              type: 'upload_failed',
              file,
              message,
            };
            onError?.(uploadError);
          }
        }

        if (uploadedFiles.length > 0) {
          onUploadComplete?.(uploadedFiles);
        }

        return uploadedFiles;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        const error: FileUploadError = {
          type: 'network_error',
          message,
        };
        onError?.(error);
        return [];
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },
    [
      bucket,
      allowedTypes,
      maxSizeMB,
      maxFiles,
      pathPrefix,
      useUniqueNames,
      supabase,
      onUploadComplete,
      onError,
      updateProgress,
    ]
  );

  const cancelUpload = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
    setProgress((prev) =>
      prev.map((p) =>
        p.status === 'uploading' || p.status === 'pending'
          ? { ...p, status: 'error' as const, error: 'Upload cancelled' }
          : p
      )
    );
  }, []);

  const clearProgress = React.useCallback(() => {
    setProgress([]);
  }, []);

  const deleteFile = React.useCallback(
    async (path: string): Promise<boolean> => {
      try {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        return !error;
      } catch {
        return false;
      }
    },
    [bucket, supabase]
  );

  return {
    uploadFiles,
    progress,
    isUploading,
    cancelUpload,
    clearProgress,
    deleteFile,
  };
}

// ============================================================
// FILE UPLOAD COMPONENT
// ============================================================

interface FileUploadProps extends FileUploadConfig {
  /** Called when upload completes successfully */
  onUploadComplete?: (files: UploadedFile[]) => void;
  /** Called when an error occurs */
  onError?: (error: FileUploadError) => void;
  /** Custom placeholder text */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show upload progress */
  showProgress?: boolean;
}

/**
 * Drag-and-drop file upload component with click-to-upload support.
 *
 * @example
 * <FileUpload
 *   bucket="media"
 *   allowedTypes={['image/*']}
 *   maxSizeMB={5}
 *   maxFiles={3}
 *   onUploadComplete={(files) => setImages(files)}
 *   onError={(error) => handleError(error)}
 * />
 */
export function FileUpload({
  bucket,
  allowedTypes = [],
  maxSizeMB = 50,
  maxFiles = 10,
  pathPrefix = '',
  useUniqueNames = true,
  onUploadComplete,
  onError,
  placeholder,
  disabled = false,
  className,
  showProgress = true,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const {
    uploadFiles,
    progress,
    isUploading,
    cancelUpload,
    clearProgress,
  } = useFileUpload({
    bucket,
    allowedTypes,
    maxSizeMB,
    maxFiles,
    pathPrefix,
    useUniqueNames,
    onUploadComplete,
    onError,
  });

  const handleDragOver = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !isUploading) {
        setIsDragging(true);
      }
    },
    [disabled, isUploading]
  );

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await uploadFiles(files);
      }
    },
    [disabled, isUploading, uploadFiles]
  );

  const handleClick = React.useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        await uploadFiles(files);
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [uploadFiles]
  );

  const defaultPlaceholder = React.useMemo(() => {
    const parts = ['Drag and drop files here, or click to select'];
    if (allowedTypes.length > 0) {
      const typeNames = allowedTypes.map((t) =>
        t.endsWith('/*') ? t.replace('/*', 's') : t.split('/')[1]
      );
      parts.push(`Accepted: ${typeNames.join(', ')}`);
    }
    parts.push(`Max size: ${maxSizeMB}MB`);
    if (maxFiles > 1) {
      parts.push(`Up to ${maxFiles} files`);
    }
    return parts;
  }, [allowedTypes, maxSizeMB, maxFiles]);

  const accept = React.useMemo(() => {
    return allowedTypes.length > 0 ? allowedTypes.join(',') : undefined;
  }, [allowedTypes]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && !disabled && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          disabled && 'cursor-not-allowed opacity-50',
          isUploading && 'pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        aria-label="File upload dropzone"
        aria-disabled={disabled || isUploading}
      >
        {/* Upload icon */}
        <svg
          className={cn(
            'mb-4 h-12 w-12 text-muted-foreground',
            isDragging && 'text-primary'
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
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {/* Placeholder text */}
        <div className="text-center">
          {placeholder ? (
            <p className="text-sm text-muted-foreground">{placeholder}</p>
          ) : (
            defaultPlaceholder.map((line, index) => (
              <p
                key={index}
                className={cn(
                  'text-sm',
                  index === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {line}
              </p>
            ))
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="sr-only"
          aria-hidden="true"
        />
      </div>

      {/* Upload progress */}
      {showProgress && progress.length > 0 && (
        <div className="space-y-3">
          {progress.map((item, index) => (
            <FileUploadProgressItem key={index} progress={item} />
          ))}

          {/* Cancel/Clear buttons */}
          <div className="flex gap-2">
            {isUploading && (
              <Button variant="outline" size="sm" onClick={cancelUpload}>
                Cancel Upload
              </Button>
            )}
            {!isUploading && progress.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearProgress}>
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FILE UPLOAD PROGRESS ITEM
// ============================================================

interface FileUploadProgressItemProps {
  progress: FileUploadProgress;
  className?: string;
}

/**
 * Displays upload progress for a single file.
 */
export function FileUploadProgressItem({
  progress,
  className,
}: FileUploadProgressItemProps) {
  const { file, progress: percent, status, error } = progress;

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        status === 'error' && 'border-destructive/50 bg-destructive/5',
        status === 'complete' && 'border-green-500/50 bg-green-500/5',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* File icon */}
        <FileIcon type={file.type} className="h-8 w-8 shrink-0" />

        {/* File info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
            {status === 'error' && error && (
              <span className="text-destructive"> - {error}</span>
            )}
            {status === 'complete' && (
              <span className="text-green-600 dark:text-green-400"> - Complete</span>
            )}
          </p>
        </div>

        {/* Status indicator */}
        {status === 'uploading' && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
        {status === 'complete' && (
          <svg
            className="h-5 w-5 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'error' && (
          <svg
            className="h-5 w-5 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Progress bar */}
      {(status === 'uploading' || status === 'pending') && (
        <Progress value={percent} className="mt-2 h-1" />
      )}
    </div>
  );
}

// ============================================================
// FILE ICON COMPONENT
// ============================================================

interface FileIconProps {
  type: string;
  className?: string;
}

/**
 * Displays an icon based on file MIME type.
 */
export function FileIcon({ type, className }: FileIconProps) {
  const iconColor = React.useMemo(() => {
    if (type.startsWith('image/')) return 'text-purple-500';
    if (type.startsWith('video/')) return 'text-red-500';
    if (type.startsWith('audio/')) return 'text-green-500';
    if (type === 'application/pdf') return 'text-red-600';
    if (type.includes('word') || type.includes('document')) return 'text-blue-600';
    if (type.includes('sheet') || type.includes('excel')) return 'text-green-600';
    return 'text-muted-foreground';
  }, [type]);

  const iconPath = React.useMemo(() => {
    if (type.startsWith('image/')) {
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    }
    if (type.startsWith('video/')) {
      return 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z';
    }
    if (type.startsWith('audio/')) {
      return 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3';
    }
    // Default document icon
    return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  }, [type]);

  return (
    <svg
      className={cn(iconColor, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
    </svg>
  );
}

// ============================================================
// FILE PREVIEW COMPONENT
// ============================================================

interface FilePreviewProps {
  /** File to preview */
  file: UploadedFile | File;
  /** Image URL (required for UploadedFile, generated for File) */
  url?: string;
  /** Size of the preview */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the file name */
  showName?: boolean;
  /** Whether to show the file size */
  showSize?: boolean;
  /** Called when remove button is clicked */
  onRemove?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Preview component for uploaded files.
 * Shows image thumbnail for images, icon for other files.
 *
 * @example
 * <FilePreview
 *   file={uploadedFile}
 *   size="md"
 *   showName
 *   onRemove={() => handleRemove(uploadedFile)}
 * />
 */
export function FilePreview({
  file,
  url,
  size = 'md',
  showName = false,
  showSize = false,
  onRemove,
  className,
}: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const isRawFile = file instanceof File;
  const fileType = isRawFile ? file.type : file.type;
  const fileName = isRawFile ? file.name : file.name;
  const fileSize = isRawFile ? file.size : file.size;
  const isImage = fileType.startsWith('image/');

  // Generate preview URL for raw File objects
  React.useEffect(() => {
    if (isRawFile && isImage) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (!isRawFile && url) {
      setPreviewUrl(url);
    } else if (!isRawFile && 'url' in file) {
      setPreviewUrl(file.url);
    }
  }, [file, isRawFile, isImage, url]);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  return (
    <div className={cn('group relative inline-flex flex-col items-center', className)}>
      {/* Preview container */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border bg-muted',
          sizeClasses[size]
        )}
      >
        {isImage && previewUrl ? (
          <Image
            src={previewUrl}
            alt={fileName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileIcon type={fileType} className="h-1/2 w-1/2" />
          </div>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              'absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full',
              'bg-destructive text-destructive-foreground shadow-sm',
              'opacity-0 transition-opacity group-hover:opacity-100',
              'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring'
            )}
            aria-label={`Remove ${fileName}`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* File info */}
      {(showName || showSize) && (
        <div className="mt-1 max-w-full text-center">
          {showName && (
            <p className="truncate text-xs font-medium" title={fileName}>
              {fileName}
            </p>
          )}
          {showSize && (
            <p className="text-xs text-muted-foreground">
              {formatFileSize(fileSize)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// FILE LIST COMPONENT
// ============================================================

interface FileListProps {
  /** List of uploaded files */
  files: UploadedFile[];
  /** Called when a file is deleted */
  onDelete?: (file: UploadedFile) => void;
  /** Whether deletion is in progress */
  isDeleting?: boolean;
  /** Show image previews */
  showPreview?: boolean;
  /** Preview size */
  previewSize?: 'sm' | 'md' | 'lg';
  /** Display mode */
  mode?: 'list' | 'grid';
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays a list of uploaded files with preview and delete options.
 *
 * @example
 * <FileList
 *   files={uploadedFiles}
 *   onDelete={(file) => handleDelete(file)}
 *   showPreview
 *   mode="grid"
 * />
 */
export function FileList({
  files,
  onDelete,
  isDeleting = false,
  showPreview = true,
  previewSize = 'md',
  mode = 'list',
  emptyMessage = 'No files uploaded',
  className,
}: FileListProps) {
  if (files.length === 0) {
    return (
      <div className={cn('py-8 text-center text-sm text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  if (mode === 'grid') {
    return (
      <div
        className={cn(
          'grid gap-4',
          previewSize === 'sm' && 'grid-cols-6 sm:grid-cols-8 lg:grid-cols-12',
          previewSize === 'md' && 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8',
          previewSize === 'lg' && 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6',
          className
        )}
      >
        {files.map((file) => (
          <FilePreview
            key={file.id}
            file={file}
            size={previewSize}
            showName
            onRemove={onDelete && !isDeleting ? () => onDelete(file) : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('divide-y rounded-lg border', className)}>
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
        >
          {/* Preview */}
          {showPreview && (
            <FilePreview file={file} size="sm" className="shrink-0" />
          )}

          {/* File info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(file.size)} - Uploaded{' '}
              {file.uploadedAt.toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* View button */}
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${file.name}`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </Button>

            {/* Delete button */}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(file)}
                disabled={isDeleting}
                aria-label={`Delete ${file.name}`}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// ERROR MESSAGE HELPER
// ============================================================

/**
 * Converts a FileUploadError to a human-readable message.
 *
 * @example
 * onError={(error) => toast.error(getFileUploadErrorMessage(error))}
 */
export function getFileUploadErrorMessage(error: FileUploadError): string {
  switch (error.type) {
    case 'file_too_large':
      return `"${error.file.name}" exceeds the maximum size of ${error.maxSizeMB}MB`;
    case 'invalid_type':
      return `"${error.file.name}" is not an allowed file type. Allowed: ${error.allowedTypes.join(', ')}`;
    case 'too_many_files':
      return `Too many files selected (${error.count}). Maximum allowed: ${error.maxFiles}`;
    case 'upload_failed':
      return `Failed to upload "${error.file.name}": ${error.message}`;
    case 'network_error':
      return `Network error: ${error.message}`;
    default:
      return 'An unknown error occurred during upload';
  }
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
