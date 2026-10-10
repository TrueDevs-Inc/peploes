import type { IMenuContent } from "@/lib/types";

export const PRE_THEATRE_MENU: IMenuContent = {
  slug: "pre-theatre",
  introLayout: "editorial",
  title: "Pre-Theatre Menu",
  serviceTimes: "Served from 5pm until 6pm (excluding Saturdays)",
  offer: "2 Courses €40 / 3 Courses €45",
  aside:
    "Simple, seasonal ingredients, prepared with care and served with understated elegance.",
  image: {
    src: "/peploes-menu-artichoke.webp",
    rotation: -23,
    desktopScale: 1.193,
    alt: "An illustrated artichoke.",
  },
  courses: [
    {
      _key: "small-bites",
      heading: "Small Bites",
      columns: 3,
      dishes: [
        {
          _key: "selection-of-fresh-bread-1",
          name: "Selection of Fresh Bread",
          description: "Irish Gourmet Butter from Waterford, Basil Pesto",
          price: 4.0,
        },
        {
          _key: "marinated-olives-from-puglia-2",
          name: "Marinated Olives from Puglia",
          price: 5.0,
        },
        {
          _key: "smoked-almonds-3",
          name: "Smoked Almonds",
          price: 5.0,
        },
      ],
    },
    {
      _key: "starters",
      heading: "Starters",
      columns: 2,
      dishes: [
        {
          _key: "fresh-seasonal-soup-1",
          name: "Fresh Seasonal Soup",
        },
        {
          _key: "dublin-hills-goats-cheese-2",
          name: "Dublin Hills Goats Cheese",
          description: "New Season Peach, San Daniele Ham, Aged Balsamico",
        },
        {
          _key: "stracciatella-from-puglia-3",
          name: "Stracciatella from Puglia",
          description: "Heritage Tomatoes, Ginger, Orange and Sorrel",
        },
        {
          _key: "fish-croquettes-4",
          name: "Fish Croquettes",
          description: "Romesco Sauce, Yuzu, Coriander Aioli",
        },
      ],
    },
    {
      _key: "main-courses",
      heading: "Main Courses",
      columns: 2,
      dishes: [
        {
          _key: "peploes-chicken-milanese-1",
          name: "Peploe's Chicken Milanese",
          description: "Rocket, Heritage Tomatoes, Parmesan",
        },
        {
          _key: "rick-higgins-dry-aged-rib-eye-2",
          name: "Rick Higgins Dry-Aged Rib Eye",
          description: "Café de Paris Butter, Watercress · €7 supplement",
        },
        {
          _key: "fillet-of-salmon-3",
          name: "Fillet of Salmon",
          description: "Summer Greens, Lemon Beurre Blanc",
        },
        {
          _key: "miso-glazed-cauliflower-v-4",
          name: "Miso Glazed Cauliflower (V)",
          description: "Sesame, Pickled Vegetables, Herb Oil",
        },
        {
          _key: "milk-fed-veal-rigatoni-5",
          name: "Milk Fed Veal Rigatoni",
          description: "Wild Mushrooms, Parmesan, Truffle",
        },
      ],
    },
    {
      _key: "dessert",
      heading: "Dessert",
      columns: 2,
      dishes: [
        {
          _key: "sticky-toffee-date-pudding-1",
          name: "Sticky Toffee & Date Pudding",
          description: "Butterscotch, Vanilla Ice Cream",
        },
        {
          _key: "sea-buckthorn-tart-2",
          name: "Sea Buckthorn Tart",
          description: "Crème Fraîche, Candied Hazelnuts",
        },
        {
          _key: "farmhouse-cheese-selection-3",
          name: "Farmhouse Cheese Selection",
          description: "Quince, Oatcakes",
        },
        {
          _key: "dark-chocolate-ganache-4",
          name: "Dark Chocolate Ganache",
          description: "Raspberry, Chantilly Cream",
        },
      ],
    },
    {
      _key: "side-dishes",
      heading: "Side Dishes",
      columns: 2,
      dishes: [
        {
          _key: "pomme-frites-1",
          name: "Pomme Frites",
          price: 6.0,
        },
        {
          _key: "truffle-parmesan-pomme-frites-2",
          name: "Truffle & Parmesan Pomme Frites",
          price: 7.0,
        },
        {
          _key: "baby-caesar-salad-3",
          name: "Baby Caesar Salad",
          price: 6.0,
        },
        {
          _key: "haricot-vert-4",
          name: "Haricot Vert",
          price: 6.0,
        },
        {
          _key: "duck-fat-roasted-potatoes-5",
          name: "Duck Fat Roasted Potatoes",
          price: 7.0,
        },
        {
          _key: "rocket-salad-6",
          name: "Rocket Salad",
          price: 6.0,
        },
      ],
    },
  ],
  notes: [
    "This menu is offered to groups of 8 guests or less.",
    "Each customer is required to order at least a main course.",
  ],
  allergens: {
    heading: "Allergen Information",
    description:
      "Please inform your server of any allergies or dietary requirements.\nWhile we take great care, we cannot guarantee the absence of allergens in our dishes.",
  },
  seoDescription:
    "Enjoy a pre-theatre meal at Peploe’s on St Stephen’s Green, with two or three seasonal courses before your evening in the city.",
};
