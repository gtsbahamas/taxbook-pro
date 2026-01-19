"use client";

import { Toaster as Sonner, toast } from "sonner";
import { useTheme } from "next-themes";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toast notification component using Sonner
 * Provides success, error, warning, info, and loading variants
 *
 * @generated 2026-01-19
 * @project taxbook-pro
 */

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border group-[.toast]:hover:bg-muted",
          success:
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-green-500/50",
          error:
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-destructive/50",
          warning:
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-yellow-500/50",
          info: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-blue-500/50",
        },
      }}
      {...props}
    />
  );
};

type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

const DEFAULT_DURATION = 4000;

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
  loading: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
};

function showToast(variant: ToastVariant, options: ToastOptions) {
  const {
    title,
    description,
    duration = DEFAULT_DURATION,
    action,
    cancel,
    onDismiss,
    onAutoClose,
  } = options;

  const icon = variantIcons[variant];

  // Build options object compatible with Sonner's ExternalToast type
  const toastOptions: Parameters<typeof toast.success>[1] = {
    description,
    duration: variant === "loading" ? Infinity : duration,
    icon,
    onDismiss,
    onAutoClose,
  };

  // Add action if provided (Sonner expects label + onClick)
  if (action) {
    toastOptions.action = {
      label: action.label,
      onClick: action.onClick,
    };
  }

  // Add cancel if provided (Sonner expects label + onClick, onClick required)
  if (cancel && cancel.onClick) {
    toastOptions.cancel = {
      label: cancel.label,
      onClick: cancel.onClick,
    };
  }

  switch (variant) {
    case "success":
      return toast.success(title, toastOptions);
    case "error":
      return toast.error(title, toastOptions);
    case "warning":
      return toast.warning(title, toastOptions);
    case "info":
      return toast.info(title, toastOptions);
    case "loading":
      return toast.loading(title, toastOptions);
    default:
      return toast(title, toastOptions);
  }
}

const toastSuccess = (options: ToastOptions) => showToast("success", options);

const toastError = (options: ToastOptions) => showToast("error", options);

const toastWarning = (options: ToastOptions) => showToast("warning", options);

const toastInfo = (options: ToastOptions) => showToast("info", options);

const toastLoading = (options: ToastOptions) => showToast("loading", options);

const toastDismiss = (toastId?: string | number) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};

const toastPromise = <T,>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
    description?: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: unknown) => string);
    };
  }
) => {
  return toast.promise(promise, {
    loading: options.loading,
    success: options.success,
    error: options.error,
    description: options.description?.loading,
  });
};

export {
  Toaster,
  toast,
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  toastLoading,
  toastDismiss,
  toastPromise,
  showToast,
  type ToastOptions,
  type ToastVariant,
};
