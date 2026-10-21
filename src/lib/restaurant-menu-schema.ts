import { z } from "zod";

import {
  keyedMenuArray,
  menuCourseSchema,
  menuEditorialShape,
  menuTextSchema,
} from "@/lib/menu-schema";

export const restaurantMenuSchema = z.object({
  ...menuEditorialShape,
  _type: z.literal("restaurantMenu").default("restaurantMenu"),
  slug: z.enum(["lunch", "dinner", "pre-theatre"]),
  serviceTimes: menuTextSchema,
  introLayout: z.literal("editorial").optional(),
  courses: keyedMenuArray(menuCourseSchema),
});
