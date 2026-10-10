import type { IMenuContent } from "@/lib/types";

export const LUNCH_MENU: IMenuContent = {
  slug: "lunch",
  title: "Lunch Menu",
  serviceTimes: "Served from 12pm until 4:30pm   ·   Last orders 4:45pm",
  offer: "2 Courses €42 / 3 Courses €48",
  image: {
    src: "/peploes-lunch-flatlay.webp",
    desktopCrop: {
      widthPercent: 62.372685,
      aspectRatio: 1.498581784,
      leftPercent: 43.9136,
      topPx: -114.92,
      rotationDegrees: 0,
    },
    alt: "A selection of Peploe’s lunch dishes, with fish, steak and dessert.",
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
        },
        {
          _key: "seasonal-soup",
          name: "Fresh Seasonal Soup",
          description: "Today’s seasonal ingredients",
        },
        {
          _key: "tuna",
          name: "Seared Blue Fin Tuna",
          description: "Avocado, soy, sesame, pickled cucumber",
        },
        {
          _key: "aubergine",
          name: "Smoked Aubergine (V)",
          description: "Whipped goat’s cheese, pomegranate, herbs",
        },
        {
          _key: "scampi",
          name: "Scampi of Dublin Bay Prawns",
          description: "Garlic, chilli, lemon, herb butter",
        },
        {
          _key: "croquettes",
          name: "Fish Croquettes",
          description: "Tartare sauce, lemon",
        },
        {
          _key: "goats-cheese",
          name: "Dublin Hills Goats Cheese",
          description: "Beetroot, hazelnut, watercress",
        },
        {
          _key: "stracciatella",
          name: "Stracciatella from Puglia",
          description: "Heritage tomatoes, basil, olive oil",
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
        },
        {
          _key: "rib-eye",
          name: "Chargrilled Dry-Aged Rib Eye",
          description: "Peppercorn sauce, watercress, bone marrow butter",
        },
        {
          _key: "chicken",
          name: "Peploe’s Chicken Milanese",
          description: "Rocket, parmesan, lemon",
        },
        {
          _key: "pork",
          name: "Winetavern Farm Free Range Pork Chop",
          description: "Apple purée, hispi cabbage, jus",
        },
        {
          _key: "cauliflower",
          name: "Miso Glazed Cauliflower (V)",
          description: "Sesame, pickled vegetables, herb oil",
        },
        {
          _key: "salmon",
          name: "Fillet of Salmon",
          description: "Clams, peas, mint, brown butter",
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
        { _key: "caesar", name: "Baby Caesar Salad", price: 6 },
        { _key: "haricot", name: "Haricot Vert", price: 6 },
        { _key: "potatoes", name: "Duck Fat Roasted Potatoes", price: 7 },
        { _key: "lettuce", name: "Irish Butterhead Lettuce Salad", price: 6 },
      ],
    },
  ],
  notes: [
    "This menu is for groups of 9 or less.",
    "Each customer is required to order at least a main course.",
  ],
  allergens: {
    heading: "Allergen Information",
    description:
      "Please inform your server of any allergies or dietary requirements.\nWhile we take great care, we cannot guarantee the absence of allergens in our dishes.",
  },
  seoDescription:
    "Explore the Lunch menu at Peploe’s on St Stephen’s Green, with seasonal dishes, small bites and sides.",
};
