export const journalCategory = {
  _id: "category-food",
  name: "Food",
  slug: "food",
};

export const publishedArticle = {
  _id: "article-sample",
  _updatedAt: "2026-10-19T12:00:00Z",
  slug: "sample",
  title: "Sample article",
  standfirst: "A short introduction to a test article.",
  date: "2026-10-19",
  readTimeMinutes: 4,
  author: "Sample author",
  category: journalCategory,
  heroImage: {
    src: "https://cdn.sanity.io/images/project/development/test.jpg",
    alt: "A test dining table",
  },
  noIndex: false,
  seoDescription: "A description of the test article.",
  intro: "An introduction for the article banner.",
  blocks: [{ _key: "opening", _type: "journalParagraph", text: "Test body." }],
};

export const publishedJournalPage = {
  title: "Journal",
  seoDescription: "Test Journal description.",
  hero: {
    eyebrow: "Our Journal",
    heading: "Test Journal",
    standfirst: "People, food and stories.",
    description: "Stories from the test restaurant.",
  },
  featuredArticle: publishedArticle,
  listing: {
    heading: "Latest stories",
    allLabel: "All stories",
    articleAction: "Read story",
    loadMoreAction: "Load more",
    emptyMessage: "No stories in this category yet.",
  },
  closing: {
    heading: "Visit us",
    image: publishedArticle.heroImage,
  },
};
