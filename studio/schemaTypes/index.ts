import { drinksMenu } from "./drinks-menu";
import { menuCourse } from "./menu-course";
import { menuDish } from "./menu-dish";
import { menuAllergens, menuBooking, menuImage } from "./menu-fields";
import { menuNavigationItem, menusPage } from "./menus-page";
import { restaurantMenu } from "./resturant-menu";
import { setMenu, setMenuCollection } from "./set-menu";
import {
  menuWine,
  menuWineCategory,
  menuWineColumn,
  menuWineSection,
  wineMenu,
} from "./wine-menu";

export const schemaTypes = [
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
