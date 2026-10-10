import type { ISetMenuCollection } from "@/lib/types";

export const SEASONAL_MENU: ISetMenuCollection = {
  slug: "seasonal",
  title: "Seasonal Menus",
  description:
    "Our festive seasonal set menus are designed for Christmas celebrations, group dining and special occasions at Peploe’s.",
  aside:
    "A time for remarkable food, wonderful company and unforgettable celebrations at Peploe’s.",
  image: {
    src: "/peploes-menu-botanical.webp",
    alt: "A delicate botanical illustration.",
  },
  imageBeforeAside: true,
  menus: [
    {
      _key: "set-christmas-lunch",
      title: "Set Christmas Lunch",
      price: 75,
      summary: "This menu is offered to groups greater than 7 guests.",
      inclusions: [],
      courses: [
        {
          _key: "starters",
          heading: "Starters",
          columns: 2,
          dishes: [
            {
              _key: "french-onion-soup-1",
              name: "French Onion Soup",
              description: "Sourdough crouton gratinated with aged Gruyère",
            },
            {
              _key: "spiced-butternut-squash-soup-2",
              name: "Spiced Butternut Squash Soup",
              description: "Coconut, lemon & fresh herbs",
            },
            {
              _key: "chicken-liver-foie-gras-parfait-3",
              name: "Chicken Liver & Foie Gras Parfait",
              description: "Red onion chutney, toasted brioche & maple glaze",
            },
            {
              _key: "scampi-of-dublin-bay-prawn-4",
              name: "Scampi of Dublin Bay Prawn",
              description: "Mango, red chilli, tartar sauce",
            },
            {
              _key: "bruschetta-of-dublin-hills-goats-cheese-5",
              name: "Bruschetta of Dublin Hills Goats Cheese",
              description: "Roasted grape & fig, thyme & walnut",
            },
            {
              _key: "beetroot-cured-salmon-6",
              name: "Beetroot Cured Salmon",
              description: "Treacle bread, kohlrabi & horseradish crème",
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
              name: "Peploe’s Chicken Milanese",
              description: "Rocket, Heritage Tomatoes, Parmesan",
            },
            {
              _key: "chargrilled-dry-aged-rib-eye-7-supplement-2",
              name: "Chargrilled Dry Aged Rib Eye · €7 supplement",
              description: "Café de Paris Butter, Watercress",
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
              _key: "winetavern-farm-free-range-pork-chop-5",
              name: "Wineteavern Farm Free Range Pork Chop",
              description: "Apple, Mustard Cream, Seasonal Greens",
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
              _key: "lemon-tart-2",
              name: "Lemon Tart",
              description: "Crème Fraîche, Candied Hazelnuts",
            },
            {
              _key: "dark-chocolate-mousse-3",
              name: "Dark Chocolate Mousse",
              description: "Raspberries, Chantilly Cream",
            },
            {
              _key: "farmhouse-cheese-selection-4",
              name: "Farmhouse Cheese Selection",
              description: "Quince, Oatcakes",
            },
          ],
        },
        {
          _key: "tea-coffee",
          heading: "Tea / Coffee",
          columns: 1,
          dishes: [
            {
              _key: "selection-of-teas-freshly-brewed-coffee-1",
              name: "Selection of Teas, Freshly Brewed Coffee",
            },
          ],
        },
      ],
      serviceTimes: "Served from 3rd November 2025",
    },
    {
      _key: "set-christmas-dinner",
      title: "Set Christmas Dinner",
      price: 95,
      summary: "This menu is offered to groups greater than 7 guests.",
      inclusions: [],
      courses: [
        {
          _key: "starters",
          heading: "Starters",
          columns: 2,
          dishes: [
            {
              _key: "french-onion-soup-1",
              name: "French Onion Soup",
              description: "Gruyère Crouton, Chives",
            },
            {
              _key: "fresh-seasonal-soup-2",
              name: "Fresh Seasonal Soup",
              description: "Seasonal Ingredients, Herb Oil",
            },
            {
              _key: "scampi-of-dublin-bay-prawns-3",
              name: "Scampi of Dublin Bay Prawns",
              description: "Chilli, Garlic, Lemon, Herb Oil",
            },
            {
              _key: "burrata-from-puglia-4",
              name: "Burrata from Puglia",
              description: "Heritage Tomatoes, Basil Pesto",
            },
            {
              _key: "milk-fed-veal-rigatoni-5",
              name: "Milk Fed Veal Rigatoni",
              description: "Wild Mushrooms, Parmesan, Truffle",
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
              name: "Peploe’s Chicken Milanese",
              description: "Rocket, Heritage Tomatoes, Parmesan",
            },
            {
              _key: "fried-sea-bass-fillet-2",
              name: "Fried Sea Bass Fillet",
              description: "Saffron Potatoes, Samphire, Beurre Blanc",
            },
            {
              _key: "chargrilled-dry-aged-rib-eye-3",
              name: "Chargrilled Dry Aged Rib Eye",
              description: "Café de Paris Butter, Watercress",
            },
            {
              _key: "miso-glazed-cauliflower-v-4",
              name: "Miso Glazed Cauliflower (V)",
              description: "Sesame, Pickled Vegetables, Herb Oil",
            },
            {
              _key: "winetavern-farm-free-range-pork-chop-5",
              name: "Wineteavern Farm Free Range Pork Chop",
              description: "Apple, Mustard Cream, Seasonal Greens",
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
              _key: "lemon-tart-2",
              name: "Lemon Tart",
              description: "Crème Fraîche, Candied Hazelnuts",
            },
            {
              _key: "dark-chocolate-mousse-3",
              name: "Dark Chocolate Mousse",
              description: "Raspberries, Chantilly Cream",
            },
            {
              _key: "farmhouse-cheese-selection-4",
              name: "Farmhouse Cheese Selection",
              description: "Quince, Oatcakes",
            },
          ],
        },
        {
          _key: "tea-coffee",
          heading: "Tea / Coffee",
          columns: 1,
          dishes: [
            {
              _key: "selection-of-teas-freshly-brewed-coffee-1",
              name: "Selection of Teas, Freshly Brewed Coffee",
            },
          ],
        },
      ],
      serviceTimes: "Served from 3rd November 2025",
    },
  ],
  offer: "Menus for Groups of More Than 7",
  notes: [
    "Our seasonal menus are designed for Christmas celebrations, private dining and special group occasions at Peploe’s.",
  ],
  allergens: {
    heading: "Allergen Information",
    description:
      "Please inform your server of any allergies or dietary requirements. While we take great care, we cannot guarantee the absence of allergens in our dishes.",
  },
  seoDescription:
    "Discover seasonal menus at Peploe’s, including Christmas lunch and dinner for festive gatherings.",
  booking: {
    desktopOverlay:
      "linear-gradient(90deg,rgba(15,13,12,0.101961),rgba(15,13,12,0.470588) 37.0192%,rgb(15,13,12))",
    fullWidthOnMobile: true,
    mobilePadding: 14,
    mobileOverlay:
      "linear-gradient(180deg,rgba(15,13,12,0.031373),rgba(15,13,12,0.690196) 45.4111%,rgba(15,13,12,0.960784))",
    desktopContentWidth: 390,
    desktopTextAlign: "left",
    heading: "Celebrate the season at Peploe’s.",
    description:
      "Seasonal food, exceptional wine and a table made for gathering.",
    label: "Plan Your Gathering",
    image: {
      src: "/peploes-seasonal-menu-booking.webp",
      desktopPosition: "50% 61%",
      alt: "A festive table at Peploe’s.",
    },
  },
};
