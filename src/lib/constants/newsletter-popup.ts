export const NEWSLETTER_POPUP = {
  triggerSelector: "#wine",
  dismissedKey: "peploes:newsletter:dismissed",
  lastShownKey: "peploes:newsletter:last-shown",
  cooldownMs: 7 * 24 * 60 * 60 * 1000,
  closeLabel: "Close newsletter signup",
} as const;
