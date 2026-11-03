import type {
  TJournalArticle,
  TJournalCategory,
  TJournalPage,
} from "@/lib/types";

export const journalCategories = [
  { _id: "category-gina", name: "From Gina", slug: "from-gina" },
  {
    _id: "category-produce",
    name: "People & Produce",
    slug: "people-produce",
  },
  { _id: "category-wine", name: "Food & Wine", slug: "food-wine" },
  { _id: "category-art", name: "Art & Place", slug: "art-place" },
  {
    _id: "category-family",
    name: "Family & History",
    slug: "family-history",
  },
] satisfies TJournalCategory[];

// These existing photographs match the Figma frames; crops are checked separately.
// Body copy is synthetic browser-test content pending the approved article copy.
const articleDefaults = {
  _updatedAt: "2026-04-12T12:00:00Z",
  standfirst: "Synthetic fixture: a story from the people behind Peploe’s.",
  readTimeMinutes: 6,
  author: "From Peploe’s",
  noIndex: true,
  seoDescription: "Synthetic Journal article for browser verification.",
  intro: "Synthetic fixture: good food begins with the people who grow it.",
  blocks: [
    {
      _key: "opening",
      _type: "journalParagraph",
      text: "Synthetic fixture: our kitchen starts each morning with a conversation about what is ready in the fields.",
    },
    {
      _key: "heading",
      _type: "journalHeading",
      level: 2,
      text: "Synthetic fixture: a shared season",
    },
    {
      _key: "photograph",
      _type: "journalImage",
      image: {
        src: "/peploes-menu-artichoke.webp",
        alt: "An artichoke from the seasonal kitchen",
      },
      caption: "Synthetic fixture: produce selected for the kitchen.",
    },
    {
      _key: "quote",
      _type: "journalQuote",
      text: "Synthetic fixture: the best ingredients come with a conversation.",
      attribution: "Fixture grower",
    },
    {
      _key: "subheading",
      _type: "journalHeading",
      level: 3,
      text: "Synthetic fixture: from field to table",
    },
    {
      _key: "closing",
      _type: "journalParagraph",
      text: "Synthetic fixture: we plan the next menu around the harvest and the people who bring it to us.",
    },
  ],
} satisfies Partial<TJournalArticle>;

export const journalFeaturedFixture = {
  ...articleDefaults,
  _id: "article-some-things-have-changed",
  slug: "some-things-have-changed",
  title: "Some things have changed. The things that matter haven’t.",
  standfirst:
    "A few reflections on change, continuity and the things that continue to make Peploe’s feel like Peploe’s.",
  date: "2026-04-12",
  readTimeMinutes: 8,
  author: "Gina",
  category: journalCategories[0],
  heroImage: {
    src: "/peploes-private-dining-service.webp",
    alt: "The team serving guests at Peploe’s",
  },
} satisfies TJournalArticle;

export const journalArticles = [
  journalFeaturedFixture,
  {
    ...articleDefaults,
    _id: "article-rooted-in-good-relationships",
    slug: "rooted-in-good-relationships",
    listingOrder: 1,
    title: "Rooted in good relationships.",
    date: "2026-03-20",
    category: journalCategories[1],
    heroImage: {
      src: "/peploes-private-dining-steak.webp",
      alt: "A steak prepared in the Peploe’s kitchen",
    },
    noIndex: false,
  },
  {
    ...articleDefaults,
    _id: "article-a-season-at-its-best",
    slug: "a-season-at-its-best",
    listingOrder: 2,
    title: "A season at its best.",
    date: "2026-03-14",
    category: journalCategories[2],
    heroImage: {
      src: "/peploes-private-dining-service.webp",
      alt: "The team serving guests at Peploe’s",
    },
  },
  {
    ...articleDefaults,
    _id: "article-the-art-of-peploes",
    slug: "the-art-of-peploes",
    listingOrder: 3,
    title: "The art of Peploe’s.",
    date: "2026-03-04",
    category: journalCategories[3],
    heroImage: {
      src: "/peploes-visit-entrance.webp",
      alt: "The Peploe’s entrance on St Stephen’s Green",
    },
  },
  {
    ...articleDefaults,
    _id: "article-moments-menus-and-memories",
    slug: "moments-menus-and-memories",
    listingOrder: 4,
    title: "Moments, menus and memories.",
    date: "2026-03-02",
    category: journalCategories[4],
    heroImage: {
      src: "/peploes-wine-dinner.jpg",
      alt: "A wine dinner at Peploe’s",
    },
  },
  {
    ...articleDefaults,
    _id: "article-a-room-worth-being-in",
    slug: "a-room-worth-being-in",
    listingOrder: 5,
    title: "A room worth being in.",
    date: "2026-02-18",
    category: journalCategories[0],
    heroImage: {
      src: "/peploes-private-dining-celebrations.webp",
      alt: "Guests celebrating at Peploe’s",
    },
  },
  {
    ...articleDefaults,
    _id: "article-bottles-worth-sharing",
    slug: "bottles-worth-sharing",
    listingOrder: 6,
    title: "Bottles worth sharing.",
    date: "2026-02-09",
    category: journalCategories[2],
    heroImage: {
      src: "/peploes-events-cellar-room.webp",
      alt: "The cellar room at Peploe’s",
    },
  },
  // Newer unranked stories must follow the design cards in the listing.
  ...[
    [
      "fixture-growing-together",
      "Synthetic fixture: growing together.",
      "2026-04-28",
    ],
    [
      "fixture-early-delivery",
      "Synthetic fixture: the early delivery.",
      "2026-04-21",
    ],
    [
      "fixture-from-the-field",
      "Synthetic fixture: from the field.",
      "2026-04-14",
    ],
  ].map(([slug, title, date]) => ({
    ...articleDefaults,
    _id: `article-${slug}`,
    slug,
    title,
    date,
    category: journalCategories[1],
    heroImage: { src: "/peploes-producer.png", alt: "A Peploe’s producer" },
  })),
] satisfies TJournalArticle[];

// The hub and article Figma frames are independent content scenarios. These
// detail-only fixtures preserve the hub's six reference cards and real sorting.
export const journalGrowersRelatedFixtures = [
  [
    "the-ingredients-that-inspire",
    "The ingredients that inspire.",
    "2026-03-20",
    "/peploes-private-dining-steak.webp",
  ],
  [
    "a-focus-on-seasonal-ingredients",
    "A focus on seasonal ingredients.",
    "2026-02-14",
    "/peploes-events-cellar-room.webp",
  ],
  [
    "from-supplier-to-table",
    "From supplier to table.",
    "2026-01-18",
    "/peploes-private-dining-celebrations.webp",
  ],
].map(([slug, title, date, src]) => ({
  ...articleDefaults,
  _id: `article-${slug}`,
  slug,
  title,
  date,
  category: journalCategories[1],
  heroImage: { src, alt: title },
})) satisfies TJournalArticle[];

export const journalArticleFixtures = [
  ...journalArticles,
  ...journalGrowersRelatedFixtures,
  {
    ...articleDefaults,
    _id: "article-growers-we-work-with",
    slug: "growers-we-work-with",
    title: "The growers we work with.",
    standfirst:
      "From milestone birthdays and family celebrations to long lunches with friends, Peploe’s is a warm Dublin setting for bringing people together.",
    intro:
      "At Peploe’s, great food begins long before it reaches our kitchen. It starts in the fields, farms and harbours, with people who care as deeply about quality as we do.",
    blocks: [
      {
        _key: "opening",
        _type: "journalParagraph",
        text: "We’ve always believed that the best ingredients come from producers who understand their craft — and who share our respect for seasonality, provenance and flavour. Many of the growers and suppliers we work with have been part of Peploe’s for years, and their produce sits at the heart of our menus.",
      },
      {
        _key: "relationship-heading",
        _type: "journalHeading",
        level: 2,
        text: "A relationship built over time",
      },
      {
        _key: "relationship",
        _type: "journalParagraph",
        text: "The best supplier relationships are rarely transactional. They are built through conversations, shared standards and an understanding of what each season can offer. That continuity gives our chefs the confidence to let ingredients speak for themselves.",
      },
      {
        _key: "seasonal-heading",
        _type: "journalHeading",
        level: 2,
        text: "A seasonal approach",
      },
      {
        _key: "seasonal",
        _type: "journalParagraph",
        text: "Seasonality shapes the way we cook. It allows us to work with ingredients at their best and gives the menu a natural rhythm across the year. The result is food that feels grounded in its moment rather than fixed in place.",
      },
      {
        _key: "working-heading",
        _type: "journalHeading",
        level: 2,
        text: "Working together",
      },
      {
        _key: "working",
        _type: "journalParagraph",
        text: "Our relationships with growers and suppliers are built on trust, respect and a shared commitment to quality. We value the knowledge and experience they bring, and we are proud to support people who share our approach to food.",
      },
    ],
    date: "2026-04-12",
    category: journalCategories[1],
    heroImage: {
      src: "/peploes-events-gathering.webp",
      alt: "Guests dining together at Peploe’s",
      desktopPosition: "center 95%",
    },
  },
  {
    ...articleDefaults,
    _id: "article-wine-things-just-happen",
    slug: "wine-things-just-happen",
    title: "Wine things just happen.",
    date: "2026-01-07",
    category: journalCategories[2],
    heroImage: {
      src: "/peploes-wine-dinner.jpg",
      alt: "A wine dinner at Peploe’s",
    },
  },
] satisfies TJournalArticle[];

export const journalPageFixture = {
  title: "The Journal",
  seoDescription: "Stories, people and moments from Peploe’s.",
  hero: {
    eyebrow: "Stories from St Stephen’s Green",
    heading: "The Journal",
    standfirst:
      "Food, wine, people, produce, art and the life of the restaurant.",
    description:
      "Seasonal menus, special evenings, wine dinners and occasions throughout the year, all in the heart of St Stephen’s Green.",
    image: {
      src: "/peploes-seasonal-hero.jpg",
      alt: "A bartender pouring a drink at Peploe’s",
    },
  },
  featuredArticle: journalFeaturedFixture,
  listing: {
    heading: "Stories from Peploe’s.",
    allLabel: "All stories",
    articleAction: "Read the story",
    loadMoreAction: "Load more stories",
    emptyMessage: "There are no stories in this category yet.",
  },
  closing: {
    heading:
      "Stories from St Stephen’s Green — food, wine, people and the life of Peploe’s.",
    image: {
      src: "/peploes-events-gathering.webp",
      alt: "Guests dining together at Peploe’s",
    },
  },
} satisfies TJournalPage;
