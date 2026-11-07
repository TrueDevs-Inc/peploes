"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { clientSentry as Sentry } from "@/lib/client-sentry";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry?.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-12 text-center">
          <h1 className="text-3xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            Please try again. If the issue persists, contact support.
          </p>
          <Button
            variant="plain"
            type="button"
            className="mx-auto rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => reset()}
          >
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
}
