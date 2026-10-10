import type {
  IBookingBannerContent,
  IFormActionResponse,
  INavbarContent,
  IOpeningHours,
  IWhatsOnContent,
  IWineContent,
} from "@/lib/types";

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ACTION_MESSAGES = {
  UNEXPECTED_FAILURE_LOG: "Server action failed unexpectedly.",
  UNEXPECTED_FAILURE_PUBLIC: "Unable to complete the request.",
} as const;

export const HTTP_CONTENT_TYPE = {
  JSON: "application/json",
  HTML: "text/html",
  MARKDOWN: "text/markdown",
  TEXT: "text/plain",
  XML: "application/xml",
  FORM: "application/x-www-form-urlencoded",
} as const;

export const CORS_HEADERS = {
  ORIGIN: "origin",
  METHODS: "access-control-request-method",
  HEADERS: "access-control-request-headers",
} as const;

export const DEFAULT_SEO = {
  siteName: "Peploe's",
  description:
    "A family-run restaurant on St Stephen's Green, Dublin, since 2002.",
  titleSuffix: " | Peploe's",
  twitterHandle: "",
  locale: "en_IE",
} as const;

export const RESTAURANT_CONTACT = {
  phone: "+35316763144",
  phoneLabel: "+353 1 676 3144",
  email: "reception@peploes.ie",
} as const;

export const RESTAURANT_OPENING_HOURS = [
  { days: "Monday – Wednesday", hours: "12pm to 10pm" },
  { days: "Thursday – Saturday", hours: "12pm to Late" },
  { days: "Sunday", hours: "Closed" },
] as const satisfies readonly IOpeningHours[];

export const SOCIAL_IMAGE = {
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 630,
  FORMAT: "image/png",
} as const;

export const AI_CRAWLER_POLICY = {
  SEARCH: {
    USER_AGENTS: [
      "OAI-SearchBot",
      "PerplexityBot",
      "Claude-SearchBot",
    ] as const,
    ALLOW: true,
  },
  TRAINING: {
    USER_AGENTS: ["GPTBot", "ClaudeBot"] as const,
    ALLOW: false,
  },
  MIXED_USE: {
    USER_AGENTS: ["Google-Extended", "CCBot"] as const,
    ALLOW: true,
  },
} as const;

export const ROUTES = {
  HOME: "/",
  MENUS: "/menus",
  LUNCH: "/menus/lunch",
  DINNER: "/menus/dinner",
  PRE_THEATRE: "/menus/pre-theatre",
  WINE: "/menus/wine",
  COCKTAILS: "/menus/cocktails",
  GROUP_SET_MENU: "/menus/group-set-menu",
  SEASONAL: "/menus/seasonal",
  PRIVATE_DINING: "/private-dining",
  CELEBRATIONS: "/private-dining/groups-celebrations",
  CORPORATE_EVENTS: "/private-dining/corporate-events",
  WEDDINGS: "/private-dining/weddings",
  VISIT_CONTACT: "/visit-contact",
  LLMS: "/llms.txt",
  ROBOTS: "/robots.txt",
  SITEMAP: "/sitemap.xml",
  API: {
    EXAMPLES: "/api/examples",
    EXAMPLE_BY_ID: (id: number | string) => `/api/examples/${id}`,
  },
} as const;

export const FORM_FIELDS = {
  example: {
    NAME: "name",
    EMAIL: "email",
  },
} as const;

export const EXAMPLE_LIMITS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 256,
  LIST_MIN_SIZE: 1,
  LIST_DEFAULT_SIZE: 50,
  LIST_MAX_SIZE: 100,
} as const;

export const SEARCH_PARAM_KEYS = {
  PAGE: "page",
  LIMIT: "limit",
  QUERY: "q",
  SORT: "sort",
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

export const DURATION = {
  ONE_MINUTE_MS: 60_000,
  FIVE_MINUTES_MS: 300_000,
  FIFTEEN_MINUTES_MS: 900_000,
  ONE_HOUR_MS: 3_600_000,
  ONE_DAY_MS: 86_400_000,
  ONE_WEEK_MS: 604_800_000,
} as const;

export const ISR_REVALIDATE = {
  NEVER: false,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
} as const;

export const ANALYTICS = {
  DEDUP_WINDOW_MS: 2000,
  MAX_HISTORY_SIZE: 100,
  WEB_VITALS_LOAD_DELAY_MS: 2_500,
  UTM_KEYS: [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ] as const,
  UTM_STORAGE_KEY: "app_utm_params",
  UTM_EXPIRY_HOURS: 24,
  THRESHOLDS: {
    LCP: { good: 2500, needsImprovement: 4000 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    INP: { good: 200, needsImprovement: 500 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
  },
  ERROR_MESSAGES: {
    WEB_VITALS_LOAD_FAILED: "[WebVitals] Failed to load web-vitals library:",
  },
} as const;

export const MOTION = {
  FAST: "150ms",
  INTERACTION: "160ms",
  BASE: "300ms",
  SLOW: "500ms",
  CRAWL: "1200ms",
  EASE_ORGANIC: "cubic-bezier(0.22, 1, 0.36, 1)",
  EASE_SPRING: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const CARD_STYLES = {
  BASE: "rounded-lg border bg-card text-card-foreground shadow-sm",
  INTERACTIVE:
    "rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent/50",
  STATIC: "rounded-lg border bg-card text-card-foreground",
} as const;

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const ALLOWED_URL_SCHEMES = [
  "http:",
  "https:",
  "mailto:",
  "tel:",
] as const;

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export const MILLISECONDS_PER_DAY = 86_400_000;

export const BOOKING_BANNER_CONTENT = {
  heading: "Book your table and step down",
  emphasizedHeading: "from the city.",
  description:
    "A warm welcome, a memorable meal and a room worth being in, waiting for you in St. Stephen's Green.",
  ctaLabel: "Book a Table",
  image: { src: "/peploes-booking-botanical.png", alt: "" },
} as const satisfies IBookingBannerContent;

export const NAVBAR_CONTENT = {
  navigationLabel: "Main navigation",
  homeLabel: "Peploe’s home",
  menusLabel: "Menus",
  ourStoryLabel: "Our Story",
  groupsLabel: "Private Dining & Events",
  groupsId: "Private Dining & Events",
  whatsOnLabel: "What’s On",
  visitContactLabel: "Visit & Contact",
  giftVouchersLabel: "Gift Vouchers",
  bookingLabel: "Book a Table",
  mobileBookingLabel: "Book",
} as const satisfies INavbarContent;

export const DESKTOP_NAVIGATION_QUERY = "(min-width: 80rem)";

export const MENUS_SHELF_CONTENT = {
  heading: "Great food brings people together.",
  description:
    "Seasonal dishes, exceptional wines and a warm welcome in the heart of Dublin.",
} as const;

export const WINE_CONTENT: IWineContent = {
  eyebrow: "Wine at Peploe's",
  heading: "Bottles worth lingering over.",
  description:
    "Wine has always been part of the Peploe’s experience, from long lunches and pre-theatre dinners to evenings that stretch a little longer. We source many of our wines directly from small producers across Europe, alongside trusted estates and classic regions. The result is a list built for discovery, sharing and returning favourites.",
  primaryCtaLabel: "Explore the Wine List",
  secondaryCtaLabel: "Stories from the cellar",
  image: { src: "/peploes-wine-dinner.jpg", alt: "" },
};

export const WHATS_ON_CONTENT: IWhatsOnContent = {
  eyebrow: "This season at Peploe’s",
  heading: "What’s On",
  description:
    "From seasonal menus to special events, there’s always something to look forward to at Peploe’s.",
  ctaLabel: "View what’s on",
};

export const EXAMPLE_FORM_INITIAL_STATE = {
  success: false,
  error: undefined,
} satisfies IFormActionResponse;

export const READ_MORE_COLLAPSED_HEIGHT = "12.5em";

export const MOBILE_HOME_CONTENT = {
  entranceImage: "/peploes-entrance-mobile.jpg",
  menusImage: "/peploes-dining-room-mobile.png",
  ginaEyebrow: "From the cellar",
  ginaHeading: "Wine things just happen.",
} as const;
