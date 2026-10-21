import { z } from "zod";

export const menuKeySchema = z.string().regex(/^[A-Za-z0-9_-]+$/);
export const menuTextSchema = z.string().trim().min(1);
export const optionalMenuTextSchema = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || undefined);
export const menuPriceSchema = z
  .number()
  .finite()
  .nonnegative()
  .multipleOf(0.01);

export function keyedMenuArray<TSchema extends z.ZodType<{ _key: string }>>(
  item: TSchema,
) {
  return z
    .array(item)
    .nullish()
    .transform((items) => items ?? [])
    .refine(
      (items) =>
        new Set(items.map((entry) => entry._key)).size === items.length,
      "Item keys must be unique.",
    );
}

export const menuImageSchema = z.object({
  src: z
    .string()
    .url()
    .regex(
      /^https:\/\/cdn\.sanity\.io\/images\/[a-z0-9]+\/[a-z0-9_-]+\/[^?#]+$/,
    ),
  alt: menuTextSchema,
  desktopCrop: z
    .object({
      widthPercent: z.number().positive(),
      aspectRatio: z.number().positive(),
      leftPercent: z.number().finite(),
      topPx: z.number().finite(),
      rotationDegrees: z.number().min(-360).max(360).optional(),
    })
    .optional(),
  desktopPosition: optionalMenuTextSchema,
  mobilePosition: optionalMenuTextSchema,
  rotation: z.number().min(-360).max(360).optional(),
  desktopScale: z.number().min(0.5).max(3).optional(),
  scale: z.number().min(0.5).max(3).optional(),
  fit: z.enum(["contain", "cover"]).optional(),
});

export const menuBookingSchema = z.object({
  tallOnMobile: z.boolean().optional(),
  fullWidthOnMobile: z.boolean().optional(),
  mobilePadding: z.number().nonnegative().optional(),
  mobileOverlay: optionalMenuTextSchema,
  desktopOverlay: optionalMenuTextSchema,
  desktopContentWidth: z.number().positive().optional(),
  desktopTextAlign: z.enum(["left", "right"]).optional(),
  heading: menuTextSchema,
  description: optionalMenuTextSchema,
  label: menuTextSchema,
  image: menuImageSchema,
});

export const menuDishSchema = z.object({
  _key: menuKeySchema,
  name: menuTextSchema,
  description: optionalMenuTextSchema,
  price: menuPriceSchema.nullish(),
  priceDecimalPlaces: z.union([z.literal(0), z.literal(2)]).optional(),
});

export const menuCourseSchema = z
  .object({
    _key: menuKeySchema,
    heading: menuTextSchema,
    kind: z
      .enum(["small-bites", "starters", "mains", "desserts", "sides", "other"])
      .default("other"),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    firstColumnCount: z.number().int().positive().optional(),
    dishes: keyedMenuArray(menuDishSchema),
  })
  .transform((course) => ({
    ...course,
    firstColumnCount:
      course.columns === 2 ? course.firstColumnCount : undefined,
  }));

export const menuEditorialShape = {
  title: menuTextSchema,
  description: optionalMenuTextSchema,
  aside: optionalMenuTextSchema,
  serviceTimes: optionalMenuTextSchema,
  seoDescription: menuTextSchema,
  image: menuImageSchema.nullish(),
  imageBeforeAside: z.boolean().optional(),
  offer: optionalMenuTextSchema,
  notes: z
    .array(menuTextSchema)
    .nullish()
    .transform((notes) => notes ?? []),
  allergens: z
    .object({ heading: menuTextSchema, description: menuTextSchema })
    .nullish(),
  booking: menuBookingSchema
    .nullish()
    .transform((booking) => booking ?? undefined),
};
