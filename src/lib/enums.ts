// ─── Error Codes ─────────────────────────────────────────────────────────

export enum ErrorCode {
  Unauthorized = "UNAUTHORIZED",
  Forbidden = "FORBIDDEN",
  Conflict = "CONFLICT",
  ValidationError = "VALIDATION_ERROR",
  InvalidForm = "INVALID_FORM",
  InternalError = "INTERNAL_ERROR",
  NotFound = "NOT_FOUND",
  NotImplemented = "NOT_IMPLEMENTED",
  DatabaseError = "DATABASE_ERROR",
  DbListFailed = "DB_LIST_FAILED",
  DbCreateFailed = "DB_CREATE_FAILED",
  TooManyRequests = "TOO_MANY_REQUESTS",
  ServiceUnavailable = "SERVICE_UNAVAILABLE",
  OutcomeUnknown = "OUTCOME_UNKNOWN",
  HoldExpired = "HOLD_EXPIRED",
}

// ─── HTTP ─────────────────────────────────────────────────────────────────

export enum HttpVerb {
  Get = "GET",
  Post = "POST",
  Delete = "DELETE",
  Put = "PUT",
  Patch = "PATCH",
}

// ─── Forms ────────────────────────────────────────────────────────────────

export enum FormStatus {
  Idle = "idle",
  Loading = "loading",
  Success = "success",
  Error = "error",
}

// ─── Cookie Consent ─────────────────────────────────────────────────────

export enum CookieConsentStatus {
  Accepted = "accepted",
  Declined = "declined",
  Pending = "pending",
}

// ─── Logging ──────────────────────────────────────────────────────────────

export enum LogLevel {
  Debug = "debug",
  Info = "info",
  Warning = "warning",
  Error = "error",
  Critical = "critical",
  Fatal = "fatal",
}

export enum LogContext {
  App = "App",
  Api = "Api",
  Database = "Database",
  ErrorHandler = "ErrorHandler",
  HealthCheck = "HealthCheck",
  Analytics = "Analytics",
}

// ─── Error Types (granular, for Sentry/observability) ────────────────────

export enum ErrorType {
  // Database errors
  DatabasePoolError = "database_pool_error",
  DatabaseQueryFailed = "database_query_failed",

  // Validation errors
  ValidationError = "validation_error",

  // Data health / integrity
  DataEmpty = "data_empty",
  DataMissing = "data_missing",

  // Observability
  ClientError = "client_error",
}

// ─── Observability ─────────────────────────────────────────────────────────

export enum AppModule {
  Database = "database",
  Api = "api",
  Action = "action",
  Sentry = "sentry",
  Analytics = "analytics",
  ErrorHandler = "error_handler",
}

export enum Stage {
  Connection = "connection",
  Request = "request",
  Response = "response",
  DataFetching = "data_fetching",
  DataValidation = "data_validation",
  ErrorHandling = "error_handling",
  ServiceCall = "service_call",
}

export enum SentryTag {
  ErrorType = "error-type",
  Module = "module",
  Stage = "stage",
  Method = "method",
  Component = "component",
}

export enum SentryContext {
  RequestData = "request_data",
  ResponseData = "response_data",
  OperationData = "operation_data",
  ValidationDetails = "validation_details",
  Environment = "environment",
}

// ─── Analytics ────────────────────────────────────────────────────────────

export enum GA4Event {
  PageView = "page_view",
  PageContext = "page_context",
  ViewItem = "view_item",
  Purchase = "purchase",
  WebVitals = "web_vitals",
  PerformanceAlert = "performance_alert",
  SlowLcp = "slow_lcp",
}

export enum WebVitalsMetricName {
  Cls = "CLS",
  Fcp = "FCP",
  Lcp = "LCP",
  Ttfb = "TTFB",
  Inp = "INP",
}

export enum PerfRating {
  Good = "good",
  NeedsImprovement = "needs-improvement",
  Poor = "poor",
}

export enum GA4AlertType {
  PoorPerformance = "poor_performance",
  SlowLcp = "slow_lcp",
}

// ─── Data Health ──────────────────────────────────────────────────────────

export enum DataCriticality {
  Critical = "critical",
  Warning = "warning",
  Info = "info",
}
