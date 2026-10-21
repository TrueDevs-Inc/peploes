import type { VariantProps } from "class-variance-authority";
import type { Result as NeverthrowResult } from "neverthrow";
import type { Route } from "next";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import type { infer as InferSchema } from "zod";
import type { z } from "zod/v4";

import type {
  calendarQuerySchema,
  guestDetailsSchema,
  holdInputSchema,
  timesQuerySchema,
} from "@/lib/booking-schema";
import type { holdTokenSchema } from "@/lib/booking-token";
import type {
  cmsMenuSchema,
  menuCollectionNavigationSchema,
  menusPageSchema,
} from "@/lib/cms-menu-schema";
import type { MENU_SLUGS, ROUTES } from "@/lib/constants";
import type {
  BOOKING_SKIP_REASONS,
  BOOKING_UNSUPPORTED_SETTINGS,
} from "@/lib/constants/booking";
import type { buttonVariants } from "@/lib/constants/button";
import type { ErrorCode, HttpVerb, LogLevel } from "@/lib/enums";
import type { createResDiaryProvider } from "@/lib/resdiary-provider";
import type {
  closedDatesReplySchema,
  dateRangeReplySchema,
  guestReplySchema,
  holdReplySchema,
  holdStatusReplySchema,
  setupReplySchema,
  signInReplySchema,
  timeSlotReplySchema,
} from "@/lib/resdiary-schema";
import type {
  seasonalCardSchema,
  seasonalEntrySchema,
  whatsOnPageSchema,
} from "@/lib/seasonal-schema";

// ─── Core Framework Types ─────────────────────────────────────────────────

export interface IFetchOptions<TBody = unknown> {
  url: string;
  method: HttpVerb;
  token?: string;
  body?: TBody;
  headers?: Record<string, string>;
}

export interface IFetchResponse<T = unknown> {
  data: T | null;
  ok: boolean;
  status: number;
  error: string | null;
}

export interface IBatchProcessInput<T, R> {
  items: T[];
  processor: (item: T, index: number) => Promise<R>;
  concurrency?: number;
}

export interface IBatchProcessResult<R> {
  results: R[];
  errors: Array<{ index: number; error: unknown }>;
}

export interface ISuccess<T> {
  data: T;
  error: null;
}

export interface IFailure<E> {
  data: null;
  error: E;
}

export type TResult<T, E = Error> = ISuccess<T> | IFailure<E>;

export interface IError<TCode extends ErrorCode = ErrorCode> {
  code: TCode;
  message: string;
  details?: unknown;
}

export interface IAppError {
  code: ErrorCode;
  message: string;
  context?: Record<string, unknown>;
}

// ─── Action Framework ────────────────────────────────────────────────────

export interface IActionDefinition<
  TInput,
  TOutput,
  TCode extends ErrorCode = ErrorCode,
> {
  parse: (rawInput: unknown) => NeverthrowResult<TInput, IError<TCode>>;
  handler: (
    payload: IActionPayload<TInput>,
  ) => Promise<NeverthrowResult<TOutput, IError<TCode>>>;
}

export interface IPublicActionDefinition<
  TOutput,
  TCode extends ErrorCode = ErrorCode,
> {
  handler: (
    payload: IPublicActionPayload,
  ) => Promise<NeverthrowResult<TOutput, IError<TCode>>>;
}

export type TActionResult<
  TOutput,
  TCode extends ErrorCode = ErrorCode,
> = TResult<TOutput, IError<TCode>>;

export interface IActionContext {
  userId: string | null;
  role: string | null;
}

export interface IAuthenticatedContext {
  userId: string;
  role: string | null;
}

export interface IPublicActionPayload {
  input: unknown;
}

export interface IActionPayload<TInput> {
  input: TInput;
  context: IAuthenticatedContext;
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export type TAuthErrorCodes = ErrorCode.Unauthorized;

// ─── SEO Types ────────────────────────────────────────────────────────────

export interface ISeoConfig {
  title: string;
  description: string;
  url: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

// ─── SEO Schema Types (JSON-LD) ──────────────────────────────────────────

export interface IBreadcrumbItem {
  name: string;
  url: string;
}

export interface IWebsiteSchemaConfig {
  name: string;
  description: string;
  url: string;
  alternateName?: string | string[];
}

export interface IOrganizationSchemaConfig {
  name: string;
  url: string;
  logoUrl?: string;
  sameAs?: string[];
}

export interface IJsonLdProps {
  data: Record<string, unknown>;
}

// ─── Hook Internal Types ──────────────────────────────────────────────────

export interface IRevealObserverRegistry {
  observer: IntersectionObserver;
  handlers: Map<Element, () => void>;
}

export interface IRevealProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  stagger?: boolean;
}

export interface IDoodleDrawOnProps {
  className?: string;
  threshold?: number;
}

// ─── Client Error Logging ────────────────────────────────────────────────

export interface IClientLogConfig {
  module: string;
  stage: string;
  errorType?: string;
  level?: LogLevel;
  context?: Record<string, unknown>;
}

// ─── Analytics ────────────────────────────────────────────────────────────

export interface IBaseEventParams {
  page_location?: string;
  page_title?: string;
}

export interface IPurchaseItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
}

export interface IPurchaseParams extends IBaseEventParams {
  transaction_id: string;
  value: number;
  currency: string;
  tax?: number;
  shipping?: number;
  items: IPurchaseItem[];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface IUTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface IEventRecord {
  signature: string;
  timestamp: number;
}

export interface IEventSignature {
  eventName: string;
  params: Record<string, unknown>;
}

export interface IWebVitalsLibMetric {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
}

export type TAnalyticsPlatform = "GA4";

export interface IEventLogData {
  platform: TAnalyticsPlatform;
  event: string;
  params?: Record<string, unknown>;
  eventId?: string;
}

export interface IMeasurementEventPayload {
  client_id: string;
  events: Array<{
    name: string;
    params: Record<string, unknown>;
  }>;
}

// ─── Sentry / Observability ───────────────────────────────────────────────

export interface ISentryLogConfig {
  module: string;
  stage: string;
  errorType?: string;
  level?: LogLevel;
  context?: Record<string, unknown>;
  tags?: Record<string, string>;
}

export type TDataHealthValue =
  | string
  | unknown[]
  | Record<string, unknown>
  | null
  | undefined;

export interface IDataHealthConfig {
  field: string;
  criticality: string;
  context?: Record<string, unknown>;
}

// ─── Logger ───────────────────────────────────────────────────────────────

export interface ILoggerConfig {
  level: string;
  context: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface IRestaurantNow {
  date: string;
  time: string;
}

export interface IDatePeriod {
  from: string;
  to: string;
}

export type TResDiaryOperation =
  | "getRules"
  | "getAvailableDates"
  | "searchTimes"
  | "createHold"
  | "changeHold"
  | "submitHoldGuest"
  | "getHoldStatus"
  | "getClosedDates";

interface IResDiaryFailureBase {
  operation: TResDiaryOperation;
  httpStatus?: number;
  requestId?: string;
  detail?: string;
}

export type TResDiaryFailure = IResDiaryFailureBase &
  (
    | {
        kind:
          | "not_configured"
          | "unavailable"
          | "not_found"
          | "outcome_unknown"
          | "payment_unsupported";
      }
    | { kind: "rejected"; fields: string[] }
  );

export interface IResDiaryClock {
  time: string;
  nextDay: boolean;
}

export interface IResDiaryRules {
  minPartySize: number;
  maxPartySize: number;
  defaultPartySize: number;
  maxDaysAhead: number | null;
  services: { id: number; name: string; start: string | null }[];
  currency: string;
  termsHtml: string;
  privacyHtml: string;
  noAvailability: { message: string | null; phone: string | null };
  membership: { label: string | null; required: boolean } | null;
  customField: {
    label: string | null;
    required: boolean;
    type: "text" | "url";
  } | null;
  stripe: { publishableKey: string; accountId: string; live: boolean } | null;
  paymentProvider: "stripe" | "guestpay" | null;
}

export interface IResDiaryDateRangeInput {
  from: string;
  to: string;
  partySize: number;
}

export interface IResDiaryTimeSearchInput {
  date: string;
  partySize: number;
}

export interface IResDiaryDateRange {
  dates: { date: string; times: IResDiaryClock[] }[];
  missing: IDatePeriod | null;
}

export interface IResDiarySlot {
  date: string;
  time: string;
  serviceId: number;
  standard: boolean;
  feeCents: number;
  leaveTimeRequired: boolean;
  leaveTime: IResDiaryClock | null;
}

export interface IResDiaryTimes {
  mayRequireCard: boolean;
  slots: IResDiarySlot[];
}

export interface IResDiaryHoldInput {
  date: string;
  time: string;
  partySize: number;
}

export interface IResDiaryHold {
  holdId: number;
  reference: string;
  expiresAt: number;
  expiresInMs: number;
}

export interface IResDiaryChangeHoldInput extends IResDiaryHoldInput {
  holdId: number;
}

export interface IResDiaryHoldExpiry {
  expiresAt: number | null;
}

export interface IResDiaryGuest {
  firstName: string;
  surname: string;
  email: string;
  mobile?: string;
  mobileCountryCode?: number;
}

export interface IResDiaryGuestInput {
  holdId: number;
  guest: IResDiaryGuest;
  specialRequests?: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface IResDiaryStripeStep {
  publishableKey: string;
  accountId: string;
  clientSecret: string;
}

export type TResDiaryGuestOutcome =
  | { kind: "confirmed"; reference: string }
  | {
      kind: "payment";
      amountCents: number;
      amountText: string;
      stripe: IResDiaryStripeStep;
    }
  | { kind: "card"; amountText: string; stripe: IResDiaryStripeStep }
  | { kind: "table_taken" }
  | { kind: "guest_blocked" };

export interface IResDiaryHoldStatus {
  status: "pending" | "confirmed" | "failed" | "cancelled" | "unknown";
  reference: string | null;
}

export interface IResDiaryClosedDates {
  closedWeekdays: number[];
  closedPeriods: IDatePeriod[];
}

export interface IResDiaryWeekdays {
  weekdays: number[];
  skipped: number;
}

export type TResDiaryProvider = ReturnType<typeof createResDiaryProvider>;

export interface IResDiaryCallOptions {
  deadlineAt?: number;
}

export interface IResDiaryConfig {
  apiUrl: string;
  micrositeName: string;
  channelCode: string;
  username: string;
  password: string;
}

export interface IResDiaryReply {
  status: number;
  headers: Headers;
  text: () => Promise<string>;
}

export type TResDiaryFetch = (
  url: string,
  init: RequestInit,
) => Promise<IResDiaryReply>;

export interface IResDiaryDeps {
  config?: IResDiaryConfig | null;
  fetch?: TResDiaryFetch;
}

export type TResDiaryResult<T> = Promise<NeverthrowResult<T, TResDiaryFailure>>;

export type TResDiarySignInReply = z.infer<typeof signInReplySchema>;
export type TResDiarySetupReply = z.infer<typeof setupReplySchema>;
export type TResDiaryDateRangeReply = z.infer<typeof dateRangeReplySchema>;
export type TResDiaryTimeSlotReply = z.infer<typeof timeSlotReplySchema>;
export type TResDiaryClosedDatesReply = z.infer<typeof closedDatesReplySchema>;
export type TResDiaryHoldReply = z.infer<typeof holdReplySchema>;
export type TResDiaryGuestReply = z.infer<typeof guestReplySchema>;
export type TResDiaryHoldStatusReply = z.infer<typeof holdStatusReplySchema>;

export type TBookingProvider = Pick<
  TResDiaryProvider,
  | "getRules"
  | "getClosedDates"
  | "getAvailableDates"
  | "searchTimes"
  | "createHold"
  | "changeHold"
  | "submitHoldGuest"
  | "getHoldStatus"
>;

export type TBookingOperation =
  | "getFindTableData"
  | "getCalendarDays"
  | "getTimes"
  | "holdTable"
  | "submitGuestDetails"
  | "getHoldStatus";

export type TBookingSkipReason =
  (typeof BOOKING_SKIP_REASONS)[keyof typeof BOOKING_SKIP_REASONS];

export interface ISkippedSlot {
  date: string;
  time: string;
  reason: TBookingSkipReason;
}

export type TUnsupportedSetting =
  (typeof BOOKING_UNSUPPORTED_SETTINGS)[keyof typeof BOOKING_UNSUPPORTED_SETTINGS];

export interface IBookingServiceDeps {
  provider?: TBookingProvider;
  holdSecret?: string | null;
  liveSite?: boolean;
}

export type TBookingErrorCode =
  | ErrorCode.ServiceUnavailable
  | ErrorCode.TooManyRequests
  | ErrorCode.ValidationError
  | ErrorCode.Conflict
  | ErrorCode.Forbidden
  | ErrorCode.NotFound
  | ErrorCode.HoldExpired
  | ErrorCode.OutcomeUnknown;

export type THoldInput = z.infer<typeof holdInputSchema>;

export type THoldToken = z.infer<typeof holdTokenSchema>;

export type TGuestDetails = z.infer<typeof guestDetailsSchema>;

export type TBookingField =
  | keyof z.infer<typeof timesQuerySchema>
  | keyof z.infer<typeof calendarQuerySchema>
  | keyof THoldInput
  | keyof TGuestDetails;

export interface IBookingError extends IError<TBookingErrorCode> {
  fieldErrors?: Partial<Record<TBookingField, string>>;
  clearHold?: true;
  holdCookie?: IHoldCookie;
}

export type TBookingResult<T> = Promise<NeverthrowResult<T, IBookingError>>;

export interface IBookingWindow {
  rules: IResDiaryRules;
  lastDate: string | null;
  closed: IResDiaryClosedDates;
}

export interface IBookingVisit {
  today: string;
  now: string;
  closed: boolean;
  serviceStarts: ReadonlyMap<number, string>;
}

export interface IFindTableData {
  partySize: { min: number; max: number; default: number };
  calendar: {
    today: string;
    lastDate: string | null;
    defaultDate: string;
    closedWeekdays: number[];
    closedPeriods: IDatePeriod[];
  };
  terms: string[];
}

export interface ICalendarDays {
  from: string;
  to: string;
  partySize: number;
  openDates: string[];
}

export interface IReturnBy {
  time: string;
  label: string;
  nextDay: boolean;
  required: boolean;
}

export type TBookingOffer =
  | {
      kind: "standard";
      feeCents: number;
      mayRequireCard: boolean;
      returnBy: IReturnBy | null;
    }
  | {
      kind: "promotion";
      promotionId: number;
      name: string;
      description: string;
      feeCents: number;
      mayRequireCard: boolean;
      mayRequireDeposit: boolean;
      returnBy: IReturnBy | null;
    };

export type TStandardOffer = Extract<TBookingOffer, { kind: "standard" }>;

export interface ICurrentOffer {
  time: IBookingTime;
  offer: TStandardOffer;
}

export interface IBookingGuestContext {
  provider: TBookingProvider;
  secret: string;
  liveSite: boolean;
}

export interface IBookingTime {
  searchDate: string;
  date: string;
  time: string;
  label: string;
  offers: TBookingOffer[];
}

export type TTimesEmptyReason = "closed" | "none_online" | "all_passed";

export interface ITimesData {
  date: string;
  dateLabel: string;
  partySize: number;
  guestsLabel: string;
  times: IBookingTime[];
  emptyReason: TTimesEmptyReason | null;
}

export interface IPartyLimits {
  min: number;
  max: number;
}

export interface ICheckedOffer extends ICurrentOffer {
  visit: IBookingVisit;
}

export interface IHoldSummary {
  reference: string;
  date: string;
  dateLabel: string;
  time: string;
  timeLabel: string;
  partySize: number;
  guestsLabel: string;
  offer: TStandardOffer;
  revision: number;
}

export interface IHoldCookie {
  token: string;
  maxAgeSeconds: number;
}

export type TGuestDetailsView =
  | { kind: "confirmed"; reference: string; summary: IHoldSummary }
  | {
      kind: "payment";
      amountCents: number;
      amountText: string;
      stripe: IResDiaryStripeStep;
      summary: IHoldSummary;
    }
  | {
      kind: "card";
      amountText: string;
      stripe: IResDiaryStripeStep;
      summary: IHoldSummary;
    };

export type TGuestDetailsResult =
  | Extract<TGuestDetailsView, { kind: "confirmed" }>
  | (Exclude<TGuestDetailsView, { kind: "confirmed" }> & {
      holdCookie: IHoldCookie;
    });

export type THoldState = "pending" | "confirmed" | "expired" | "failed";

export interface IHoldStatusResult {
  status: THoldState;
  reference: string;
  summary: IHoldSummary;
  clearHold: boolean;
}

export interface IHoldCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

export interface IHoldCookieStore {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: IHoldCookieOptions): unknown;
  delete(cookie: { name: string; path: string }): unknown;
}

export interface IRateLimitWindow {
  limit(identifier: string): Promise<{ success: boolean; reason?: string }>;
}

export type THoldGate = () => Promise<boolean>;

export interface IHoldLimiterDeps {
  windows: readonly IRateLimitWindow[];
  secret: string;
}

export type TBookingResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: IBookingResponseError };

export interface IBookingResponseError {
  code: TBookingErrorCode | ErrorCode.InternalError;
  message: string;
  fieldErrors?: IBookingError["fieldErrors"];
}

export type THeldTable = Pick<IHoldResult, "expiresInMs" | "summary">;

export interface IHoldResult {
  holdToken: string;
  cookieMaxAgeSeconds: number;
  expiresInMs: number;
  summary: IHoldSummary;
}

// ─── Component Prop Types ──────────────────────────────────────────────

export interface IFieldErrorProps {
  errors?: string[] | undefined;
  className?: string;
}

export interface IWhatsOnEvent {
  id: string;
  href: Route<"/seasonal" | `/seasonal/${string}`>;
  category: string;
  title: string;
  description: string;
  image: ISectionImage;
  ctaLabel: string;
  mobileCtaLabel?: string;
}

export interface IReadMoreProps {
  children: React.ReactNode;
  className?: string;
}

export interface ICloseButtonProps {
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

export interface ISentryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface ISentryErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ITrackEventProps {
  eventName: string;
  params?: Record<string, unknown>;
}

// ─── Navigation ─────────────────────────────────────────────────────────

export interface INavLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface INavGroup {
  label: string;
  links: INavLink[];
}

export interface IBreadcrumbsProps {
  items: IBreadcrumbItem[];
  className?: string;
}

export interface IBreadcrumbTrailProps {
  items: IBreadcrumbItem[];
  className?: string;
}

// ─── Cookie Consent ────────────────────────────────────────────────────

export interface ICookieConsentRecord {
  status: string;
  version: number;
  timestamp: string;
}

// ─── Homepage Content ───────────────────────────────────────────────────

export interface ISectionImage {
  _key?: string;
  src: string;
  alt: string;
}

export interface IHeroContent {
  eyebrow: string;
  headingLines: readonly [string, string, string];
  description: string;
  bookingLabel: string;
  callLabel: string;
  backgroundImage: ISectionImage;
  entranceBackground: ISectionImage;
  entranceImage: ISectionImage;
  entranceCaption: string;
}

export interface IMenuCategory {
  label: string;
  description: string;
  href?: Route;
}

export interface IMenusContent {
  eyebrow: string;
  heading: string;
  description: string;
  categoriesLabel: string;
  categories: readonly IMenuCategory[];
  ctaLabel: string;
  image: ISectionImage;
}

export interface IWineContent {
  eyebrow: string;
  heading: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  image: ISectionImage;
}

export interface IBookingBannerContent {
  heading: string;
  emphasizedHeading: string;
  description: string;
  ctaLabel: string;
  image: ISectionImage;
}

export interface IHumanHospitalityContent {
  eyebrow: string;
  heading: string;
  description: string;
  phoneAction: INavLink;
  emailAction: INavLink;
  image: ISectionImage;
}

export interface INavbarBrandProps {
  onClick?: () => void;
}

export interface INavbarBookingButtonProps {
  onNavigate?: () => void;
}

export interface INavbarContent {
  navigationLabel: string;
  homeLabel: string;
  menusLabel: string;
  ourStoryLabel: string;
  groupsLabel: string;
  groupsId: string;
  whatsOnLabel: string;
  visitContactLabel: string;
  giftVouchersLabel: string;
  bookingLabel: string;
  mobileBookingLabel: string;
}

export interface IDesktopNavigationItem {
  id: string;
  label: string;
  href?: Route;
  content?: ReactNode;
}

export interface IDesktopNavigationProps {
  items: readonly IDesktopNavigationItem[];
}

export interface IDesktopNavigationTriggerProps {
  item: IDesktopNavigationItem;
  isOpen: boolean;
  isActive: boolean;
  isCurrent: boolean;
  panelId: string;
  onFocus: () => void;
  onToggle: () => void;
  onOpen: () => void;
}

export interface IOpenDesktopNavigation {
  id: string;
  source: "hover" | "activation";
}

export interface INavigationShelfProps {
  eyebrow: string;
  heading: string;
  action?: ReactNode;
  introClassName: string;
  children: ReactNode;
}

export interface INavigationShelfLinkProps {
  label: string;
  description?: string;
  href?: Route;
  className?: string;
}

export interface IMobileNavigationProps {
  brandPhraseClassName: string;
}

export interface IMobileNavigationItem {
  id: string;
  label: string;
  href?: Route;
  children?: readonly IMenuNavigationLink[];
}

export interface IMobileNavigationTriggerProps {
  item: IMobileNavigationItem;
  isExpanded: boolean;
  panelId: string;
  onNavigate: () => void;
  onToggle: () => void;
}

export interface IMenuNavigationLink {
  compactDesktop?: boolean;
  label: string;
  href?: Route;
  children?: readonly { label: string; href: Route }[];
}

export interface IMenuDish {
  priceDecimalPlaces?: 0 | 2;
  _key: string;
  name: string;
  description?: string | null;
  price?: number | null;
}

export interface IMenuCourse {
  _key: string;
  heading: string;
  columns: 1 | 2 | 3;
  dishes: readonly IMenuDish[];
  firstColumnCount?: number;
}

export interface IMenuContent extends IMenuEditorialContent, IMenuNotesContent {
  serviceTimes: string;
  courses: readonly IMenuCourse[];
  introLayout?: "editorial";
  booking?: IMenuBooking;
}

export interface IMenuEditorialContent {
  slug: string;
  title: string;
  description?: string;
  aside?: string;
  image?: IMenuImage | null;
  imageBeforeAside?: boolean;
  serviceTimes?: string;
  offer?: string | null;
  seoDescription: string;
}

export interface IMenuEditorialIntroProps {
  menu: IMenuEditorialContent;
  compact?: boolean;
}

export interface IMenuEditorialImageProps {
  image: IMenuImage;
  compact: boolean;
  imageBeforeAside?: boolean;
}

export interface IMenuBooking {
  tallOnMobile?: boolean;
  fullWidthOnMobile?: boolean;
  mobilePadding?: number;
  mobileOverlay?: string;
  desktopOverlay?: string;
  desktopContentWidth?: number;
  desktopTextAlign?: "left" | "right";
  heading: string;
  description?: string;
  label: string;
  href?: Route;
  image: IMenuImage;
}

export interface IMenuBookingStyle extends CSSProperties {
  "--menu-booking-mobile-padding": string;
  "--menu-booking-mobile-overlay": string;
  "--menu-booking-desktop-overlay": string;
  "--menu-booking-image-position": string;
  "--menu-booking-content-width": string;
  "--menu-booking-text-align": "left" | "right";
}

export interface IMenuBookingProps {
  booking?: IMenuBooking;
}

export interface IMenuNotesContent {
  offer?: string | null;
  notes: readonly string[];
  allergens?: { heading: string; description: string } | null;
}

export interface IMenuNotesProps {
  menu: IMenuNotesContent;
  allergenHeadingClassName?: string;
  compact?: boolean;
  collection?: boolean;
}

export interface ISetMenu {
  _key: string;
  title: string;
  price: number;
  summary: string;
  cardDescription?: string;
  serviceTimes?: string;
  inclusions: readonly string[];
  courses: readonly IMenuCourse[];
}

export interface ISetMenuCollection
  extends IMenuEditorialContent,
    IMenuNotesContent {
  inclusionsHeading?: string;
  menus: readonly ISetMenu[];
  booking: IMenuBooking;
}

export interface ISetMenuCollectionProps {
  menu: ISetMenuCollection;
}

export interface IWine {
  _key: string;
  name: string;
  region?: string;
  vintage?: string;
  glass?: number | null;
  bottle?: number | null;
  available?: boolean;
}

export interface IWineCategory {
  _key: string;
  heading: string;
  shortHeading?: string;
  emphasized?: boolean;
  compactVintageHeading?: boolean;
  mobileTopPadding?: number;
  mobileHeadingGap?: number;
  showVintage: boolean;
  showGlass: boolean;
  wines: readonly IWine[];
}

export interface IWineSection {
  _key: string;
  heading: string;
  description?: string;
  highlighted?: boolean;
  desktopBottomPadding?: number;
  mobileBottomPadding?: number;
  columns: readonly { _key: string; categories: readonly IWineCategory[] }[];
}

export interface IWineMenuContent
  extends IMenuEditorialContent,
    IMenuNotesContent {
  indexLabel: string;
  sections: readonly IWineSection[];
  booking: IMenuBooking;
}

export interface IWineMenuProps {
  menu: IWineMenuContent;
}

export interface IWineCategoryProps {
  category: IWineCategory;
  sectionKey: string;
  column: number;
  rowSpan: number;
  continued: boolean;
}

export interface IWineSectionStyle extends CSSProperties {
  "--wine-bottom-padding": string;
  "--wine-mobile-bottom-padding": string;
}

export interface IWineCategoryStyle extends CSSProperties {
  "--wine-column": number;
  "--wine-row-span": number;
  "--wine-top-padding": string;
  "--wine-heading-gap": string;
}

export interface IDrinksMenuContent
  extends IMenuEditorialContent,
    IMenuNotesContent {
  cocktailSections: readonly IMenuCourse[];
  spiritsHeading: string;
  spiritsDescription?: string;
  spirits: readonly IMenuCourse[];
  booking: IMenuBooking;
}

export interface IDrinksMenuProps {
  menu: IDrinksMenuContent;
}

export interface IMenuImageCrop {
  widthPercent: number;
  aspectRatio: number;
  leftPercent: number;
  topPx: number;
  rotationDegrees?: number;
}

export interface IMenuImage extends ISectionImage {
  desktopCrop?: IMenuImageCrop;
  desktopPosition?: string;
  mobilePosition?: string;
  rotation?: number;
  desktopScale?: number;
  scale?: number;
  fit?: "contain" | "cover";
}

export interface IMenuImageStyle extends CSSProperties {
  "--menu-image-crop-left"?: string;
  "--menu-image-crop-top"?: string;
  "--menu-image-crop-width"?: string;
  "--menu-image-crop-aspect"?: string;
  "--menu-image-crop-rotation"?: string;
  "--menu-image-scale": number;
  "--menu-image-rotation"?: string;
  "--menu-image-position"?: string;
  "--menu-image-desktop-position"?: string;
  "--menu-image-desktop-scale"?: number;
}

export interface IMenuPageContent {
  eyebrow: string;
  heading: string;
  description: string;
  image: ISectionImage;
  navigationLabel: string;
  navigation: readonly IMenuNavigationLink[];
  booking: IMenuBooking;
}

export interface IMenuContentProps {
  menu: IMenuContent;
}

export interface IMenuCourseProps {
  course: IMenuCourse;
  idPrefix?: string;
  compact?: boolean;
}

export interface IMenuDishProps {
  dish: IMenuDish;
}

export interface IMenuNavigationProps {
  items: readonly IMenuNavigationLink[];
  label: string;
  className?: string;
}

export interface IOpeningHours {
  days: string;
  hours: string;
}

export interface IMobileNavigationContent {
  openLabel: string;
  closeLabel: string;
  title: string;
  navigationLabel: string;
  items: readonly IMobileNavigationItem[];
  giftVouchersLabel: string;
  openingHoursHeading: string;
  openingHours: readonly IOpeningHours[];
  address: string;
  phoneAction: INavLink;
  emailAction: INavLink;
  brandPhrase: string;
}

export interface IFooterContent {
  homeLabel: string;
  address: string;
  tagline: string;
  contactHeading: string;
  openingHoursHeading: string;
  openingHours: readonly IOpeningHours[];
  exploreHeading: string;
  exploreLinks: readonly IMenuNavigationLink[];
  newsletter: {
    heading: string;
    description: string;
    emailLabel: string;
    submitLabel: string;
    status: string;
  };
  copyright: string;
  legalNavigationLabel: string;
  legalLabels: readonly {
    label: string;
    shortLabel?: string;
    href: TPolicyPath;
  }[];
  instagramHref: string;
  instagramLabel: string;
  facebookHref: string;
  facebookLabel: string;
}

export interface IRestaurantFeature {
  title: string;
  description: string;
  illustration: string;
}

export interface IRestaurantFeaturesContent {
  sectionLabel: string;
  items: readonly IRestaurantFeature[];
}

export interface IStoryContent {
  eyebrow: string;
  heading: string;
  headingContinuation?: string;
  description?: string;
  ctaLabel: string;
  image: ISectionImage;
}

export interface IStoriesContent {
  eyebrow: string;
  headingLines: readonly [string, string];
  description: string;
  ctaLabel: string;
  family: IStoryContent;
  produce: IStoryContent;
  gina: IStoryContent;
  art: IStoryContent;
}

export interface IGroupOccasion {
  href: Route;
  title: string;
  description: string;
  mobileDescription?: string;
  image: ISectionImage;
  minHeight: number;
}

export interface IGroupsOccasionsContent {
  eyebrow: string;
  heading: string;
  description: string;
  ctaLabel: string;
  cardCtaLabel: string;
  image: ISectionImage;
  occasions: readonly IGroupOccasion[];
}

export interface IPrivateDiningLayoutProps {
  children: ReactNode;
}

export interface IPrivateDiningHeading {
  eyebrow: string;
  heading: string;
  description?: string;
}

export interface IPrivateDiningHero extends IPrivateDiningHeading {
  image: ISectionImage;
  action?: string;
}

export interface IPrivateDiningFeature {
  _key: string;
  heading: string;
  description?: string;
  illustration?: string;
  items?: readonly string[];
}

export interface IPrivateDiningEnquiryContent {
  eyebrow: string;
  heading: string;
  description: string;
  formEyebrow?: string;
  occasionLabel?: string;
  occasions?: readonly string[];
  messageLabel: string;
  company?: boolean;
  consent?: boolean;
  contacts?: boolean;
}

export interface IPrivateDiningPageContent {
  title: string;
  seoDescription: string;
  hero: IPrivateDiningHero;
  enquiry: IPrivateDiningEnquiryContent;
  closing: {
    heading: string;
    description: string;
    image: ISectionImage;
    contacts?: boolean;
  };
}

export interface IPrivateDiningHeadingProps extends IPrivateDiningHeading {
  className?: string;
}

export interface IPrivateDiningHeroProps {
  hero: IPrivateDiningHero;
  variant: "overview" | "celebrations" | "corporate" | "weddings";
}

export interface IPrivateDiningFeaturesProps {
  items: readonly IPrivateDiningFeature[];
  className?: string;
}

export interface IPrivateDiningFeatureSectionProps {
  content: IPrivateDiningHeading & {
    items: readonly IPrivateDiningFeature[];
  };
  className?: string;
  featuresClassName?: string;
}

export interface IPrivateDiningImageSectionProps {
  heading: IPrivateDiningHeading;
  image: ISectionImage;
  className?: string;
  imageFirst?: boolean;
  contained?: boolean;
  children?: ReactNode;
}

export interface IPrivateDiningEnquiryProps {
  content: IPrivateDiningEnquiryContent;
  compact?: boolean;
  className?: string;
}

export interface IPrivateDiningClosingProps {
  content: IPrivateDiningPageContent["closing"];
  imageSizes?: string;
  className?: string;
}

export interface IPrivateDiningMenuProps {
  heading: IPrivateDiningHeading;
  paragraphs: readonly string[];
  imageFirst?: boolean;
  className?: string;
}

export interface IWhatsOnContent {
  eyebrow: string;
  heading: string;
  description: string;
  ctaLabel: string;
}

export interface IStoryActionProps {
  label: string;
  filled?: boolean;
  href?: Route;
}

export interface IEventActionProps {
  label: string;
  mobileLabel?: string;
  href?: Route<`/seasonal/${string}`>;
}

export interface IEventCardProps {
  event: IWhatsOnEvent;
  featured?: boolean;
}

export interface IWhatsOnProps {
  events: readonly IWhatsOnEvent[];
}

export interface IButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export interface IPolicyTextPart {
  text: string;
  href?: string;
}

export interface IPolicySection {
  _key: string;
  heading: string;
  body: readonly IPolicyTextPart[];
  items?: readonly string[];
}

export type TPolicyPath = (typeof ROUTES)[
  | "PRIVACY_COOKIES"
  | "ACCESSIBILITY_POLICY"
  | "TERMS_CONDITIONS"
  | "BOOKING_CANCELLATION_TERMS"];

export interface IPolicyPageContent {
  variant: "privacy" | "accessibility" | "terms" | "booking";
  path: TPolicyPath;
  seoDescription: string;
  title: string;
  eyebrow: string;
  heading: string;
  description: string;
  image: ISectionImage;
  sections: readonly IPolicySection[];
}

export interface IPolicyContentsProps {
  children: ReactNode;
}

export interface IPolicyPageProps {
  policy: IPolicyPageContent;
}

export interface ISeasonalEventCard {
  id?: string;
  title: string;
  description: string;
  action: string;
  image: ISectionImage;
  href?: Route;
}

export interface ISeasonalEventContent {
  title: string;
  seoDescription: string;
  hero: {
    eyebrow: string;
    heading: string;
    description: string;
    image: ISectionImage;
  };
  details?: readonly {
    _key?: string;
    label: string;
    description: string;
    icon: { src: string; width: number; height: number };
  }[];
  menu?: {
    eyebrow: string;
    heading: string;
    description: string;
    cards: readonly ISeasonalEventCard[];
  };
  story?: {
    eyebrow: string;
    heading: string;
    paragraphs: readonly { _key: string; text: string }[];
    image: ISectionImage;
  };
  gallery?: {
    eyebrow: string;
    heading: string;
    images: readonly ISectionImage[];
  };
  invitation?: {
    heading: string;
    description: string;
    bookingAction: string;
    enquiryAction: string;
    image: ISectionImage;
  };
  related?: {
    eyebrow: string;
    cards: readonly ISeasonalEventCard[];
  };
}

export interface ISeasonalEventActionProps {
  label: string;
  href?: Route;
}

export interface ISeasonalEventRelatedProps {
  content: NonNullable<ISeasonalEventContent["related"]>;
}

export interface ITableBookingGuestDetails {
  firstName: string;
  surname: string;
  email: string;
  phone: string;
  requests: string;
  terms: boolean;
}

export interface ITableBookingDetailsProps {
  details: ITableBookingGuestDetails;
  onChange: (details: ITableBookingGuestDetails) => void;
  onBack: () => void;
  onContinue: () => void;
}

export interface ITableBookingDateProps {
  value: string;
  onChange: (value: string) => void;
}

export interface ITableBookingPartySizeProps {
  value: string;
  onChange: (value: string) => void;
}

export interface ITableBookingSupportProps {
  confirmation?: boolean;
}

export interface ITableBookingProgressProps {
  step: number;
}
export interface ITableBookingFieldProps extends ComponentProps<"input"> {
  label: ReactNode;
  error?: string;
}

export interface ITableBookingTimesProps {
  longDate: string;
  guests: string;
  time: string;
  returnAccepted: boolean;
  onTimeChange: (time: string) => void;
  onReturnChange: (accepted: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}

export type TMenuSlug = (typeof MENU_SLUGS)[number];
export type TCmsMenu = InferSchema<typeof cmsMenuSchema>;
export type TMenusPageDocument = InferSchema<typeof menusPageSchema>;
export type TMenuCollections = InferSchema<
  typeof menuCollectionNavigationSchema
>;
export interface ICmsMenuPageProps {
  slug: TMenuSlug;
}
export interface IMenuHeroProps {
  content: TMenusPageDocument;
}
export interface IMenuLayoutProps {
  children: ReactNode;
}

// ─── What’s On CMS ───────────────────────────────────────────────────────
export type TSeasonalCard = InferSchema<typeof seasonalCardSchema>;
export type TSeasonalEntry = InferSchema<typeof seasonalEntrySchema>;
export type TWhatsOnPage = InferSchema<typeof whatsOnPageSchema>;
export interface ISeasonalMonth {
  key: string;
  name: string;
  abbreviation: string;
  events: (TSeasonalCard & { day: string })[];
}
export interface ISeasonalProps {
  content: TWhatsOnPage;
  months: ISeasonalMonth[];
}
export interface ISeasonalJoinProps {
  join: TWhatsOnPage["join"];
}
export interface ISeasonalEventProps {
  content: ISeasonalEventContent;
  join: TWhatsOnPage["join"];
}
export interface ISeasonalRouteProps {
  params: Promise<{ slug: string }>;
}
