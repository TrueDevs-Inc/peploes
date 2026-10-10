import { ROUTES } from "@/lib/constants";
import type { ISetMenuCollection } from "@/lib/types";

export const GROUP_SET_MENU: ISetMenuCollection = {
  slug: "group-set-menu",
  title: "Group Set Menu",
  aside:
    "Exceptional food, great wine and even better company — the perfect setting for your next gathering.",
  image: {
    src: "/peploes-menu-botanical.webp",
    alt: "A delicate botanical illustration.",
  },
  imageBeforeAside: true,
  inclusionsHeading: "Included with your menu",
  menus: [
    {
      _key: "group-set-lunch",
      title: "Group Set Lunch",
      price: 65,
      summary: "This menu is offered to groups of 10 or more.",
      cardDescription: "For groups of 10 or more",
      inclusions: ["Bread Course", "Side dishes served with main course"],
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
              _key: "milk-fed-veal-rigatoni-3",
              name: "Milk Fed Veal Rigatoni",
              description: "Wild Mushrooms, Parmesan, Truffle",
            },
            {
              _key: "scampi-of-dublin-bay-prawn-4",
              name: "Scampi of Dublin Bay Prawn",
              description: "Chilli, Garlic, Lemon, Herb Oil",
            },
            {
              _key: "dublin-hills-goats-cheese-5",
              name: "Dublin Hills Goats Cheese",
              description: "Heritage Tomatoes, Ginger, Orange and Sorrel",
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
          firstColumnCount: 2,
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
            {
              _key: "tea-coffee-5",
              name: "Tea / Coffee",
              description: "Selection of Teas, Freshly Brewed Coffee",
            },
          ],
        },
      ],
    },
    {
      _key: "group-set-dinner",
      title: "Group Set Dinner",
      price: 85,
      summary: "This menu is offered to groups of 10 or more.",
      cardDescription: "For groups of 10 or more",
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
          firstColumnCount: 2,
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
            {
              _key: "tea-coffee-5",
              name: "Tea / Coffee",
              description: "Selection of Teas, Freshly Brewed Coffee",
            },
          ],
        },
      ],
    },
  ],
  offer: "Menus for Groups of 10 or More",
  notes: [
    "Our set menus are available for groups of 10 or more guests, perfect for celebrations, private dining and business occasions.",
  ],
  allergens: {
    heading: "Allergen Information",
    description:
      "Please inform your server of any allergies or dietary requirements. While we take great care, we cannot guarantee the absence of allergens in our dishes.",
  },
  seoDescription:
    "Explore group lunch and dinner menus at Peploe’s, for celebrations, private dining and business occasions.",
  booking: {
    desktopOverlay:
      "linear-gradient(90deg,rgba(15,13,12,0.101961),rgba(15,13,12,0.470588) 37.0192%,rgb(15,13,12))",
    fullWidthOnMobile: true,
    mobilePadding: 45,
    mobileOverlay:
      "linear-gradient(180deg,rgba(15,13,12,0.031373),rgba(15,13,12,0.690196) 41.8051%,rgba(15,13,12,0.960784))",
    desktopContentWidth: 300,
    desktopTextAlign: "left",
    heading: "Bring everyone together.",
    description:
      "From family celebrations to business dinners, our team can help you plan the right menu and setting.",
    label: "Enquire About a Group Booking",
    href: `${ROUTES.PRIVATE_DINING}#enquire`,
    image: {
      src: "/peploes-group-menu-booking.webp",
      desktopPosition: "50% 57.7%",
      alt: "Guests and staff in Peploe’s dining room.",
    },
  },
};
