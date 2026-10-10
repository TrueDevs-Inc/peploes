import type { IMenuContent } from "@/lib/types";

export const DINNER_MENU: IMenuContent = {
  slug: "dinner",
  title: "Dinner Menu",
  serviceTimes: "Served from 5pm",
  image: {
    src: "/peploes-dinner-flatlay.webp",
    alt: "A selection of Peploe’s dinner dishes arranged on white plates.",
    desktopCrop: {
      widthPercent: 72.662253,
      aspectRatio: 1.666666608,
      leftPercent: 43.6941,
      topPx: -207.6,
      rotationDegrees: 10.7862,
    },
  },
  courses: [
    {
      _key: "small-bites",
      heading: "Small Bites",
      columns: 1,
      dishes: [
        {
          _key: "sourdough",
          name: "Peploe’s 48hr Sourdough Breads",
          description: "Cultured butter",
          price: 4,
        },
        { _key: "olives", name: "Marinated Olives from Puglia", price: 5 },
        { _key: "almonds", name: "Smoked Almonds", price: 5 },
      ],
    },
    {
      _key: "starters",
      heading: "Starters",
      columns: 2,
      dishes: [
        {
          _key: "onion-soup",
          name: "French Onion Soup",
          description: "Caramelised onions, Gruyère crouton",
          price: 9,
        },
        {
          _key: "seasonal-soup",
          name: "Fresh Seasonal Soup",
          description: "Today’s seasonal ingredients",
          price: 9,
        },
        {
          _key: "tuna",
          name: "Seared Blue Fin Tuna",
          description: "Avocado, soy, sesame, pickled cucumber",
          price: 16,
        },
        {
          _key: "aubergine",
          name: "Smoked Aubergine (V)",
          description: "Whipped goat’s cheese, pomegranate, herbs",
          price: 13,
        },
        {
          _key: "scampi",
          name: "Scampi of Dublin Bay Prawns",
          description: "Garlic, chilli, lemon, herb butter",
          price: 16,
        },
        {
          _key: "croquettes",
          name: "Fish Croquettes",
          description: "Tartare sauce, lemon",
          price: 14,
        },
        {
          _key: "goats-cheese",
          name: "Dublin Hills Goats Cheese",
          description: "Beetroot, hazelnut, watercress",
          price: 14,
        },
        {
          _key: "stracciatella",
          name: "Stracciatella from Puglia",
          description: "Heritage tomatoes, basil, olive oil",
          price: 15,
        },
      ],
    },
    {
      _key: "main-courses",
      heading: "Main Courses",
      columns: 2,
      dishes: [
        {
          _key: "seabass",
          name: "Fillet of Seabass",
          description: "Chardonnay cream, samphire, new potatoes",
          price: 28,
        },
        {
          _key: "rib-eye",
          name: "Chargrilled Dry-Aged Rib Eye",
          description: "Peppercorn sauce, watercress, bone marrow butter",
          price: 34,
        },
        {
          _key: "chicken",
          name: "Peploe’s Chicken Milanese",
          description: "Rocket, parmesan, lemon",
          price: 26,
        },
        {
          _key: "pork",
          name: "Winetavern Farm Free Range Pork Chop",
          description: "Apple purée, hispi cabbage, jus",
          price: 28,
        },
        {
          _key: "cauliflower",
          name: "Miso Glazed Cauliflower (V)",
          description: "Sesame, pickled vegetables, herb oil",
          price: 24,
        },
        {
          _key: "salmon",
          name: "Fillet of Salmon",
          description: "Clams, peas, mint, brown butter",
          price: 27,
        },
      ],
    },
    {
      _key: "side-dishes",
      heading: "Side Dishes",
      columns: 2,
      dishes: [
        { _key: "frites", name: "Pomme Frites", price: 6 },
        {
          _key: "truffle-frites",
          name: "Truffle & Parmesan Pomme Frites",
          price: 7,
        },
        { _key: "courgettes", name: "Fried Panko Courgettes", price: 7 },
        { _key: "caesar", name: "Baby Caesar Salad", price: 6 },
        { _key: "haricot", name: "Haricot Vert", price: 6 },
        { _key: "potatoes", name: "Duck Fat Roasted Potatoes", price: 7 },
        { _key: "rocket", name: "Rocket Salad", price: 6 },
        { _key: "lettuce", name: "Irish Butterhead Lettuce Salad", price: 6 },
      ],
    },
  ],
  notes: [
    "This menu is offered to groups of 9 guests or less.",
    "Each customer is required to order at least a main course.",
  ],
  allergens: {
    heading: "Allergen Information",
    description:
      "Please inform your server of any allergies or dietary requirements.\nWhile we take great care, we cannot guarantee the absence of allergens in our dishes.",
  },
  seoDescription:
    "Explore the Dinner menu at Peploe’s on St Stephen’s Green, with seasonal starters, main courses and sides, served from 5pm.",
};
