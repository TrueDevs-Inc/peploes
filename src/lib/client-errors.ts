import type { SeverityLevel } from "@sentry/nextjs";
import { clientSentry as Sentry } from "./client-sentry";

import { LogLevel, SentryTag } from "./enums";
import type { IClientLogConfig } from "./types";

const SEVERITY_MAP: Record<LogLevel, SeverityLevel> = {
  [LogLevel.Debug]: "debug",
  [LogLevel.Info]: "info",
  [LogLevel.Warning]: "warning",
  [LogLevel.Error]: "error",
  [LogLevel.Critical]: "fatal",
  [LogLevel.Fatal]: "fatal",
};

const clientErrorQueue: unknown[] = [];

export function logClientError(error: Error, config: IClientLogConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  const entry = {
    timestamp: Date.now(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    config: {
      module: config.module,
      stage: config.stage,
      errorType: config.errorType ?? "client_error",
      level: config.level ?? LogLevel.Error,
      context: config.context ?? {},
    },
  };

  clientErrorQueue.push(entry);

  if (process.env.NODE_ENV !== "production") {
    console.error("[Client Error]", entry);
  }

  const sentry = Sentry;
  if (sentry)
    sentry.withScope((scope) => {
      scope.setLevel(SEVERITY_MAP[config.level ?? LogLevel.Error]);
      scope.setTag(SentryTag.Module, config.module);
      scope.setTag(SentryTag.Stage, config.stage);

      if (config.errorType) {
        scope.setTag(SentryTag.ErrorType, config.errorType);
      }

      if (config.context) {
        for (const [key, value] of Object.entries(config.context)) {
          scope.setContext(key, value as Record<string, unknown>);
        }
      }

      sentry.captureException(error);
    });

  const win = window as Window & { clientErrorLog?: unknown[] };
  win.clientErrorLog = win.clientErrorLog ?? [];
  win.clientErrorLog.push(entry);
}

export function getQueuedErrors(): unknown[] {
  return [...clientErrorQueue];
}

export function clearErrorQueue(): void {
  clientErrorQueue.length = 0;
}
