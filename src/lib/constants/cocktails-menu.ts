import { ROUTES } from "@/lib/constants";
import type { IDrinksMenuContent } from "@/lib/types";

export const COCKTAILS_MENU: IDrinksMenuContent = {
  slug: "cocktails",
  title: "Cocktails at Peploe's",
  aside:
    "Beautifully made drinks, timeless favourites and modern creations, served in a setting made for good company.",
  image: {
    src: "/peploes-menu-cocktail.webp",
    fit: "cover",
    desktopPosition: "center 87.3%",
    mobilePosition: "center 70.6%",
    alt: "A freshly prepared cocktail with mint and lime at the bar.",
  },
  cocktailSections: [
    {
      _key: "aperitifs",
      heading: "Aperitifs",
      columns: 1,
      dishes: [
        {
          _key: "bellini-1",
          name: "Bellini",
          description: "Prosecco, peach purée",
          price: 12.0,
        },
        {
          _key: "hugo-2",
          name: "Hugo",
          description: "Prosecco, elderflower, mint, soda, lime",
          price: 12.0,
        },
        {
          _key: "aperol-spritz-3",
          name: "Aperol Spritz",
          description: "Aperol, prosecco, soda, orange",
          price: 12.0,
        },
        {
          _key: "kir-royal-4",
          name: "Kir Royal",
          description: "Champagne, crème de cassis",
          price: 18.0,
        },
      ],
    },
    {
      _key: "classic-cocktails",
      heading: "Classic Cocktails",
      columns: 1,
      dishes: [],
    },
    {
      _key: "signature-cocktails",
      heading: "Peploe’s Signature Cocktails",
      columns: 1,
      dishes: [],
    },
  ],
  spiritsHeading: "Spirits",
  spiritsDescription:
    "An extensive selection of premium spirits from around the world.",
  spirits: [
    {
      _key: "gin",
      heading: "Gin",
      columns: 1,
      dishes: [
        {
          _key: "bombay-sapphire-1",
          name: "Bombay Sapphire",
          price: 7.5,
        },
        {
          _key: "dingle-2",
          name: "Dingle",
          price: 8.5,
        },
        {
          _key: "skellig-six18-3",
          name: "Skellig Six18",
          price: 9.0,
        },
        {
          _key: "blood-monkey-spice-storm-4",
          name: "Blood Monkey Spice Storm",
          price: 9.0,
        },
        {
          _key: "hendricks-5",
          name: "Hendrick's",
          price: 9.5,
        },
        {
          _key: "gun-powder-6",
          name: "Gun Powder",
          price: 10.0,
        },
        {
          _key: "tanqueray-10-7",
          name: "Tanqueray 10",
          price: 10.0,
        },
        {
          _key: "wilde-8",
          name: "Wilde",
          price: 11.0,
        },
        {
          _key: "monkey-47-9",
          name: "Monkey 47",
          price: 17.0,
        },
      ],
    },
    {
      _key: "vodka",
      heading: "Vodka",
      columns: 1,
      dishes: [
        {
          _key: "finlandia-1",
          name: "Finlandia",
          price: 7.0,
        },
        {
          _key: "absolut-2",
          name: "Absolut",
          price: 7.5,
        },
        {
          _key: "ketel-one-3",
          name: "Ketel One",
          price: 8.5,
        },
        {
          _key: "istil38-4",
          name: "Istil38",
          price: 8.0,
        },
        {
          _key: "grey-goose-5",
          name: "Grey Goose",
          price: 8.0,
        },
        {
          _key: "grey-goose-6",
          name: "Grey Goose",
          price: 11.0,
        },
        {
          _key: "belvedere-7",
          name: "Belvedere",
          price: 11.0,
        },
      ],
    },
    {
      _key: "rum",
      heading: "Rum",
      columns: 1,
      dishes: [
        {
          _key: "bacardi-1",
          name: "Bacardi",
          price: 6.5,
        },
        {
          _key: "morgan-spiced-2",
          name: "Morgan Spiced",
          price: 6.5,
        },
        {
          _key: "bacardi-8y-3",
          name: "Bacardi 8y",
          price: 9.0,
        },
        {
          _key: "havana-club-7y-4",
          name: "Havana Club 7y",
          price: 9.0,
        },
      ],
    },
    {
      _key: "irish-rum",
      heading: "Irish Rum",
      columns: 1,
      dishes: [
        {
          _key: "two-shores-amarone-cask-1",
          name: "Two Shores Amarone Cask",
          price: 11.5,
        },
        {
          _key: "two-shores-peated-2",
          name: "Two Shores Peated",
          price: 14.5,
        },
      ],
    },
    {
      _key: "irish-whiskey",
      heading: "Irish Whiskey",
      columns: 1,
      dishes: [
        {
          _key: "jameson-1",
          name: "Jameson",
          price: 6.5,
        },
        {
          _key: "tullamore-dew-2",
          name: "Tullamore Dew",
          price: 7.5,
        },
        {
          _key: "teeling-small-batch-3",
          name: "Teeling Small Batch",
          price: 7.5,
        },
        {
          _key: "slane-4",
          name: "Slane",
          price: 8.0,
        },
        {
          _key: "teeling-single-grain-5",
          name: "Teeling Single Grain",
          price: 8.5,
        },
        {
          _key: "knappogue-castle-14y-6",
          name: "Knappogue Castle 14y",
          price: 9.5,
        },
        {
          _key: "tullamore-dew-12y-7",
          name: "Tullamore Dew 12y",
          price: 11.0,
        },
        {
          _key: "redbreast-12y-8",
          name: "Redbreast 12y",
          price: 12.5,
        },
        {
          _key: "teeling-wonders-of-woods-9",
          name: "Teeling Wonders of Woods",
          price: 15.0,
        },
        {
          _key: "teeling-18y-10",
          name: "Teeling 18y",
          price: 22.0,
        },
      ],
    },
    {
      _key: "scottish-whisky",
      heading: "Scottish Whisky",
      columns: 1,
      dishes: [
        {
          _key: "benromach-10y-1",
          name: "Benromach 10y",
          price: 11.0,
        },
        {
          _key: "arran-14y-2",
          name: "Arran 14y",
          price: 11.0,
        },
        {
          _key: "glendronach-12y-3",
          name: "Glendronach 12y",
          price: 12.0,
        },
        {
          _key: "talisker-10y-4",
          name: "Talisker 10y",
          price: 11.0,
        },
        {
          _key: "ardbeg-10y-5",
          name: "Ardbeg 10y",
          price: 13.0,
        },
        {
          _key: "glenmorangie-signet-6",
          name: "Glenmorangie Signet",
          price: 25.0,
        },
      ],
    },
    {
      _key: "bourbon",
      heading: "Bourbon",
      columns: 1,
      dishes: [
        {
          _key: "buffalo-trace-1",
          name: "Buffalo Trace",
          price: 8.0,
        },
        {
          _key: "jack-daniels-2",
          name: "Jack Daniel’s",
          price: 7.0,
        },
        {
          _key: "woodford-reserve-3",
          name: "Woodford Reserve",
          price: 8.5,
        },
        {
          _key: "makers-mark-4",
          name: "Maker's Mark",
          price: 8.5,
        },
        {
          _key: "gentleman-jack-5",
          name: "Gentleman Jack",
          price: 10.0,
        },
        {
          _key: "jack-daniels-single-barrel-6",
          name: "Jack Daniel's Single Barrel",
          price: 12.0,
        },
      ],
    },
    {
      _key: "cognac-armagnac-calvados",
      heading: "Cognac, Armagnac & Calvados",
      columns: 1,
      dishes: [
        {
          _key: "armagnac-1",
          name: "Armagnac",
          price: 9.0,
        },
        {
          _key: "calvados-2",
          name: "Calvados",
          price: 9.0,
        },
        {
          _key: "pierre-de-segonzac-cognac-vsop-3",
          name: "Pierre de Segonzac Cognaz VSOP",
          price: 9.5,
        },
        {
          _key: "remy-martin-vsop-4",
          name: "Rémy Martin VSOP",
          price: 12.0,
        },
        {
          _key: "remy-martin-xo-5",
          name: "Rémy Martin XO",
          price: 19.0,
        },
        {
          _key: "remy-martin-ancestral-6",
          name: "Rémy Martin Ancestral",
          price: 75.0,
        },
        {
          _key: "hennessy-paradis-imperial-7",
          name: "Hennessy Paradis Imperial",
          price: 375.0,
          priceDecimalPlaces: 0,
        },
      ],
    },
    {
      _key: "liqueurs",
      heading: "Liqueurs",
      columns: 2,
      dishes: [
        {
          _key: "irish-poitin-1",
          name: "Irish Poitin",
          price: 7.0,
        },
        {
          _key: "limoncello-2",
          name: "Limoncello",
          price: 7.0,
        },
        {
          _key: "amaretto-5-almond-3",
          name: "Amaretto 5 Almond",
          price: 7.0,
        },
        {
          _key: "baileys-6-4",
          name: "Baileys 6",
          price: 7.0,
        },
        {
          _key: "cointreau-5",
          name: "Cointreau",
          price: 7.0,
        },
        {
          _key: "sambucca-6",
          name: "Sambucca",
          price: 7.0,
        },
        {
          _key: "kahlua-7",
          name: "Kalhua",
          price: 7.0,
        },
        {
          _key: "pernod-8",
          name: "Pernod",
          price: 7.0,
        },
        {
          _key: "creme-de-menthe-9",
          name: "Crème de Menthe",
          price: 7.0,
        },
        {
          _key: "pimms-10",
          name: "Pimms",
          price: 7.0,
        },
        {
          _key: "grappa-11",
          name: "Grappa",
          price: 7.0,
        },
        {
          _key: "grand-marnier-12",
          name: "Grand Marnier",
          price: 7.0,
        },
      ],
    },
  ],
  notes: ["Our team will be happy to help you choose the perfect drink."],
  allergens: {
    heading: "Allergen Information",
    description:
      "Please inform your server of any allergies or dietary requirements. While we take great care, we cannot guarantee the absence of allergens in our wines.",
  },
  seoDescription:
    "Explore aperitifs, cocktails and spirits at Peploe’s, served at our bar on St Stephen’s Green.",
  booking: {
    mobilePadding: 54,
    mobileOverlay:
      "linear-gradient(180deg,rgba(32,16,9,0.031373),rgba(32,16,9,0.721569) 58%,rgba(32,16,9,0.941176))",
    tallOnMobile: true,
    heading: "Classic cocktails, timeless company",
    label: "Book a Table",
    href: ROUTES.BOOK_A_TABLE,
    image: {
      src: "/peploes-cocktail-menu-booking.webp",
      desktopPosition: "50% 79.3%",
      alt: "A cocktail being finished with aromatic smoke at Peploe’s bar.",
    },
  },
};
