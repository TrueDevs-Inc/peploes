export const SEASONAL_CONTENT = {
  title: "What’s On | Seasonal Events",
  seoDescription:
    "Explore seasonal dining, wine evenings and special occasions at Peploe’s on St Stephen’s Green, with terrace drinks and contact details for enquiries.",
  hero: {
    eyebrow: "What’s On",
    heading: "There’s always\nsomething happening\nat Peploe’s.",
    description:
      "Seasonal menus, special evenings, wine dinners and occasions throughout the year, all in the heart of St Stephen’s Green.",
    image: {
      src: "/peploes-seasonal-hero.jpg",
      alt: "A bartender pouring cocktails at Peploe’s bar",
    },
  },
  diary: {
    eyebrow: "Upcoming Events",
    heading: "In the diary.",
    description:
      "From seasonal dishes to special evenings, there’s always something to look forward to at Peploe’s.",
    emptyMessage: "New dates will be announced here soon.",
    action: "Find Out More",
    // Design fixtures for browser tests; the website diary reads Sanity.
    months: [
      {
        name: "October",
        abbreviation: "Oct",
        events: [
          {
            slug: "rugby-at-peploes",
            day: "04",
            category: "Autumn Rugby",
            title: "Rugby at Peploe’s",
            description:
              "Join us for pre- and post-match dining with seasonal dishes and great wine.",
            action: "Find out more",
          },
          {
            slug: "italian-wine-dinner",
            day: "18",
            category: "Wine Dinner",
            title: "An Evening with Italian Wines",
            description:
              "A special wine dinner celebrating family producers from across Italy.",
            action: "Reserve your place",
          },
        ],
      },
      {
        name: "November",
        abbreviation: "Nov",
        events: [
          {
            slug: "christmas-at-peploes",
            day: "01",
            category: "Christmas",
            title: "Christmas at Peploe’s",
            description:
              "Festive menus, private dining and celebrations on St Stephen’s Green.",
            action: "View menus & details",
          },
          {
            slug: "sunday-at-peploes",
            day: "15",
            category: "Sunday Dining",
            title: "Sunday at Peploe’s",
            description:
              "A relaxed long lunch with seasonal dishes, good wine and great company.",
            action: "Find out more",
          },
          {
            slug: "lobster-season",
            day: "28",
            category: "Lobster Season",
            title: "Lobster Season",
            description: "Fresh, seasonal and always a favourite at Peploe’s.",
            action: "View menu",
          },
        ],
      },
      {
        name: "December",
        abbreviation: "Dec",
        events: [
          {
            slug: "new-years-eve",
            day: "31",
            category: "Special Event",
            title: "New Year’s Eve",
            description:
              "A special menu to see in the New Year in true Peploe’s style.",
            action: "Enquire now",
          },
        ],
      },
    ],
  },
  terrace: {
    heading: "Terrace days at Peploe’s",
    description:
      "During the warmer months, enjoy drinks on Peploe’s terrace\noverlooking St Stephen’s Green. A relaxed spot to meet before dinner\nor simply watch the city go by.",
    image: {
      src: "/peploes-seasonal-terrace.png",
      alt: "A table with red chairs on Peploe’s terrace beside the stone entrance",
    },
  },
  join: {
    eyebrow: "Join Us",
    heading: "See something\nyou’d like to join us for?",
    description:
      "Book your table online or get in touch with our team for special events and\nlarger groups.",
    bookingAction: "Book a Table",
    contactAction: "Contact Us",
    image: {
      src: "/peploes-seasonal-join.jpg",
      alt: "A member of the Peploe’s team serving beside the mural and red flowers",
    },
  },
} as const;
