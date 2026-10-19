import type { VariantProps } from "class-variance-authority";
import type { Result as NeverthrowResult } from "neverthrow";
import type { Route } from "next";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import type { infer as InferSchema } from "zod";
import type { z } from "zod/v4";
import type { examples } from "@/db/schema";
import type {
  cmsMenuSchema,
  menuCollectionNavigationSchema,
  menusPageSchema,
} from "@/lib/cms-menu-schema";
import type { MENU_SLUGS, ROUTES } from "@/lib/constants";
import type { buttonVariants } from "@/lib/constants/button";
import type { ErrorCode, HttpVerb, LogLevel } from "@/lib/enums";
import type { createExampleSchema } from "@/lib/examples-schema";

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

export interface IFormActionResponse {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
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

export interface IActionPayload<TInput> {
  input: TInput;
  context: IAuthenticatedContext;
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export type TAuthErrorCodes = ErrorCode.Unauthorized;

// ─── Example Domain ───────────────────────────────────────────────────────

export type TExampleRecord = typeof examples.$inferSelect;

export type TCreateExampleInput = z.infer<typeof createExampleSchema>;

export interface IExampleDto {
  id: number;
  name: string;
  createdAt: string;
}

export type TExampleActionErrorCodes =
  | ErrorCode.InvalidForm
  | ErrorCode.ValidationError
  | ErrorCode.DbCreateFailed;

export interface IExamplesResponse {
  data: IExampleDto[];
}

export interface IListExamplesOptions {
  limit?: number;
}

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

// ─── Component Prop Types ──────────────────────────────────────────────

export interface IFieldErrorProps {
  errors?: string[] | undefined;
  className?: string;
}

export interface IWhatsOnEvent {
  id: string;
  href: Route<`/seasonal/${string}`>;
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
    paragraphs: readonly string[];
    image: ISectionImage;
  };
  gallery?: {
    eyebrow: string;
    heading: string;
    images: readonly ISectionImage[];
  };
  invitation: {
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
