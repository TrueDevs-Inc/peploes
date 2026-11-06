"use client";

import { Component } from "react";

import { Button } from "@/components/ui/button";
import { clientSentry as Sentry } from "@/lib/client-sentry";
import type {
  ISentryErrorBoundaryProps,
  ISentryErrorBoundaryState,
} from "@/lib/types";

export class SentryErrorBoundary extends Component<
  ISentryErrorBoundaryProps,
  ISentryErrorBoundaryState
> {
  constructor(props: ISentryErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ISentryErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const sentry = Sentry;
    if (!sentry) return;
    sentry.withScope((scope) => {
      scope.setExtra("componentStack", errorInfo.componentStack ?? "");
      sentry.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try again.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reload Content
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
