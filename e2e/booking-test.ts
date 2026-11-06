import { bookingTestTime } from "./booking-fixtures";
import { test as base } from "./menu-test";

export { expect } from "./menu-test";
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setSystemTime(bookingTestTime());
    await use(page);
  },
});
