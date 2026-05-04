"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Props for the ErrorBoundary component. */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

/** Internal state for the ErrorBoundary component. */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary that catches rendering errors
 * and displays a fallback UI with retry capability.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <DefaultErrorFallback
            error={this.state.error}
            onRetry={this.handleReset}
          />
        )
      );
    }
    return this.props.children;
  }
}

/** Props for the DefaultErrorFallback component. */
interface DefaultErrorFallbackProps {
  error: Error | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Default fallback UI displayed when an ErrorBoundary catches an error.
 * Shows the error message and a retry button.
 */
export function DefaultErrorFallback({
  error,
  onRetry,
  className,
}: DefaultErrorFallbackProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-red-500/30 bg-red-500/5 py-16 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
        <AlertCircle className="h-7 w-7 text-red-400" />
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-semibold text-[#f2dfd5]">
          Something went wrong
        </p>
        <p className="max-w-sm text-sm text-[#a48c7f]">
          {error?.message ?? "An unexpected error occurred."}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 rounded-xl bg-[#332822] px-4 py-2 text-sm font-medium text-[#a48c7f] transition-colors hover:bg-[#3e322c] hover:text-[#f2dfd5]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
