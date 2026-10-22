export const COOKIE_PREFERENCES = {
  storageKey: "peploes.cookie-preferences.v1",
  denialCookie: "peploes-optional-cookies-denied",
  denialMaxAgeSeconds: 31536000,
  defaults: { analytics: false, performance: false, marketing: false },
  accepted: { analytics: true, performance: true, marketing: true },
} as const;

export const COOKIE_PREFERENCES_CONTENT = {
  trigger: "Cookie Settings",
  title: "Cookie Preferences",
  description:
    "We use cookies to improve your experience on our site, understand how it’s used, and ensure it functions properly. You can choose which non-essential cookies you’d like to allow.",
  necessary: {
    title: "Strictly Necessary",
    status: "Always active",
    description:
      "These cookies are essential for the website to function and cannot be turned off.",
  },
  categories: [
    {
      key: "analytics",
      title: "Analytics",
      description:
        "Help us understand how visitors use our website, so we can improve your experience.",
    },
    {
      key: "performance",
      title: "Performance",
      description:
        "Allow us to remember your preferences and provide a smoother, more personalised experience.",
    },
    {
      key: "marketing",
      title: "Marketing",
      description:
        "Used to show you relevant content and offers, on our site and beyond.",
    },
  ],
  policyLabel: "View Privacy & Cookies Policy",
  rejectLabel: "Reject non-essential",
  acceptLabel: "Accept All",
  closeLabel: "Close cookie preferences",
  storageError: "Your preferences could not be saved. Please try again.",
} as const;
