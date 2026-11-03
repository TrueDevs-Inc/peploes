import type {
  TJournalArticle,
  TJournalCategory,
  TJournalPage,
} from "../src/lib/types";

// Figma Final Pages: hub 4205:12993 / 4214:6521 and article 4205:13879.
// The owner approved reusing the Growers body until the other articles have copy.
export const JOURNAL_CATEGORIES = [
  { _id: "journal-category-from-gina", name: "From Gina", slug: "from-gina" },
  {
    _id: "journal-category-people-produce",
    name: "People & Produce",
    slug: "people-produce",
  },
  { _id: "journal-category-food-wine", name: "Food & Wine", slug: "food-wine" },
  { _id: "journal-category-art-place", name: "Art & Place", slug: "art-place" },
  {
    _id: "journal-category-family-history",
    name: "Family & History",
    slug: "family-history",
  },
] satisfies TJournalCategory[];

const articleTemplate = {
  standfirst:
    "From milestone birthdays and family celebrations to long lunches with friends, Peploe’s is a warm Dublin setting for bringing people together.",
  readTimeMinutes: 6,
  author: "From Peploe’s",
  noIndex: true,
  seoDescription:
    "At Peploe’s, great food begins long before it reaches our kitchen.",
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
} satisfies Pick<
  TJournalArticle,
  | "standfirst"
  | "readTimeMinutes"
  | "author"
  | "noIndex"
  | "seoDescription"
  | "intro"
  | "blocks"
>;

export const JOURNAL_ARTICLES = [
  {
    slug: "some-things-have-changed",
    title: "Some things have changed. The things that matter haven’t.",
    standfirst:
      "A few reflections on change, continuity and the things that continue to make Peploe’s feel like Peploe’s.",
    date: "2026-04-12",
    readTimeMinutes: 8,
    author: "Gina",
    category: JOURNAL_CATEGORIES[0],
    heroImage: {
      src: "/peploes-private-dining-service.webp",
      alt: "The team serving guests at Peploe’s",
    },
  },
  {
    slug: "rooted-in-good-relationships",
    listingOrder: 1,
    title: "Rooted in good relationships.",
    date: "2026-03-20",
    category: JOURNAL_CATEGORIES[1],
    heroImage: {
      src: "/peploes-private-dining-steak.webp",
      alt: "A steak prepared in the Peploe’s kitchen",
    },
  },
  {
    slug: "a-season-at-its-best",
    listingOrder: 2,
    title: "A season at its best.",
    date: "2026-03-14",
    category: JOURNAL_CATEGORIES[2],
    heroImage: {
      src: "/peploes-private-dining-service.webp",
      alt: "The team serving guests at Peploe’s",
    },
  },
  {
    slug: "the-art-of-peploes",
    listingOrder: 3,
    title: "The art of Peploe’s.",
    date: "2026-03-04",
    category: JOURNAL_CATEGORIES[3],
    heroImage: {
      src: "/peploes-visit-entrance.webp",
      alt: "The Peploe’s entrance on St Stephen’s Green",
    },
  },
  {
    slug: "moments-menus-and-memories",
    listingOrder: 4,
    title: "Moments, menus and memories.",
    date: "2026-03-02",
    category: JOURNAL_CATEGORIES[4],
    heroImage: {
      src: "/peploes-wine-dinner.jpg",
      alt: "A wine dinner at Peploe’s",
    },
  },
  {
    slug: "a-room-worth-being-in",
    listingOrder: 5,
    title: "A room worth being in.",
    date: "2026-02-18",
    category: JOURNAL_CATEGORIES[0],
    heroImage: {
      src: "/peploes-private-dining-celebrations.webp",
      alt: "Guests celebrating at Peploe’s",
    },
  },
  {
    slug: "bottles-worth-sharing",
    listingOrder: 6,
    title: "Bottles worth sharing.",
    date: "2026-02-09",
    category: JOURNAL_CATEGORIES[2],
    heroImage: {
      src: "/peploes-events-cellar-room.webp",
      alt: "The cellar room at Peploe’s",
    },
  },
  {
    slug: "growers-we-work-with",
    title: "The growers we work with.",
    date: "2026-04-12",
    category: JOURNAL_CATEGORIES[1],
    heroImage: {
      src: "/peploes-events-gathering.webp",
      alt: "Guests dining together at Peploe’s",
      desktopPosition: "center 95%",
    },
  },
  // These reference cards specify a month only; store the first day for sorting.
  {
    slug: "the-ingredients-that-inspire",
    title: "The ingredients that inspire.",
    date: "2026-03-01",
    category: JOURNAL_CATEGORIES[1],
    heroImage: {
      src: "/peploes-private-dining-steak.webp",
      alt: "A steak prepared in the Peploe’s kitchen",
    },
  },
  {
    slug: "a-focus-on-seasonal-ingredients",
    title: "A focus on seasonal ingredients.",
    date: "2026-02-01",
    category: JOURNAL_CATEGORIES[1],
    heroImage: {
      src: "/peploes-events-cellar-room.webp",
      alt: "The cellar room at Peploe’s",
    },
  },
  {
    slug: "from-supplier-to-table",
    title: "From supplier to table.",
    date: "2026-01-01",
    category: JOURNAL_CATEGORIES[1],
    heroImage: {
      src: "/peploes-private-dining-celebrations.webp",
      alt: "Guests celebrating at Peploe’s",
    },
  },
  // The mobile homepage supplies the title; the remaining copy uses the template.
  {
    slug: "wine-things-just-happen",
    title: "Wine things just happen.",
    date: "2026-04-12",
    category: JOURNAL_CATEGORIES[2],
    heroImage: {
      src: "/peploes-wine-dinner.jpg",
      alt: "A wine dinner at Peploe’s",
    },
  },
].map((article) => ({
  ...articleTemplate,
  ...article,
  _id: `journal-article-${article.slug}`,
})) satisfies Omit<TJournalArticle, "_updatedAt">[];

export const JOURNAL_PAGE = {
  title: "The Journal",
  seoDescription:
    "Food, wine, people, produce, art and the life of the restaurant.",
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
  featuredArticleSlug: "some-things-have-changed",
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
} satisfies Omit<TJournalPage, "featuredArticle"> & {
  featuredArticleSlug: string;
};
