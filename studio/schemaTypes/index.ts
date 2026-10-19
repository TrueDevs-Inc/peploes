import { drinksMenu } from "./drinks-menu";
import { menuCourse } from "./menu-course";
import { menuDish } from "./menu-dish";
import { menuAllergens, menuBooking, menuImage } from "./menu-fields";
import { menuNavigationItem, menusPage } from "./menus-page";
import { restaurantMenu } from "./resturant-menu";
import { seasonalEntry } from "./seasonal-entry";
import {
  seasonalDetail,
  seasonalHero,
  seasonalInvitation,
  seasonalMenuCard,
  seasonalMenuHighlight,
  seasonalRelatedPage,
  seasonalStory,
} from "./seasonal-fields";
import { setMenu, setMenuCollection } from "./set-menu";
import { whatsOnPage } from "./whats-on-page";
import {
  menuWine,
  menuWineCategory,
  menuWineColumn,
  menuWineSection,
  wineMenu,
} from "./wine-menu";

export const schemaTypes = [
  seasonalEntry,
  seasonalHero,
  seasonalDetail,
  seasonalMenuCard,
  seasonalMenuHighlight,
  seasonalRelatedPage,
  seasonalStory,
  seasonalInvitation,
  whatsOnPage,
  menuDish,
  menuCourse,
  menuImage,
  menuBooking,
  menuAllergens,
  menuWine,
  menuWineCategory,
  menuWineColumn,
  menuWineSection,
  setMenu,
  menuNavigationItem,
  restaurantMenu,
  drinksMenu,
  wineMenu,
  setMenuCollection,
  menusPage,
];
