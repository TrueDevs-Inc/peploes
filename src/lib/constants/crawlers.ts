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

const USER_TRIGGERED_AI_FETCHERS = [
  "ChatGPT-User",
  "Claude-User",
  "Perplexity-User",
] as const;

export const HTML_LIMITED_AI_FETCHERS: readonly string[] = [
  ...AI_CRAWLER_POLICY.SEARCH.USER_AGENTS,
  ...AI_CRAWLER_POLICY.TRAINING.USER_AGENTS,
  ...AI_CRAWLER_POLICY.MIXED_USE.USER_AGENTS,
  ...USER_TRIGGERED_AI_FETCHERS,
];
