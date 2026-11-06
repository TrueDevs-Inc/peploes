import { z } from "zod/v4";
import { env } from "@/lib/env";

export const privateDiningEnquirySchema = z.object({
  notificationId: z.uuid(),
  occasion: z.string().trim().min(1).max(80).optional(),
  date: z.iso.date(),
  guests: z.coerce
    .number()
    .int()
    .min(1)
    .refine(
      (guests) =>
        env.NEXT_PUBLIC_ENQUIRY_MAX_GUESTS === undefined ||
        guests <= env.NEXT_PUBLIC_ENQUIRY_MAX_GUESTS,
      "Guest count exceeds the enquiry limit.",
    ),
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().max(120).optional(),
  email: z.email().max(254),
  message: z.string().trim().min(1).max(5_000),
  consent: z.boolean(),
  website: z.string().max(200).optional(),
});

export type TPrivateDiningEnquiry = z.infer<typeof privateDiningEnquirySchema>;

export const contactEnquirySchema = z.object({
  notificationId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  message: z.string().trim().min(1).max(5_000),
  consent: z.literal(true),
  website: z.string().max(200).optional(),
});

export type TContactEnquiry = z.infer<typeof contactEnquirySchema>;
