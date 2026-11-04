import { z } from "zod/v4";

export const privateDiningEnquirySchema = z.object({
  notificationId: z.uuid(),
  occasion: z.string().trim().min(1).max(80).optional(),
  date: z.iso.date(),
  guests: z.coerce.number().int().min(1).max(200),
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().max(120).optional(),
  email: z.email().max(254),
  message: z.string().trim().min(1).max(5_000),
  consent: z.boolean(),
  website: z.string().max(200).optional(),
});

export type TPrivateDiningEnquiry = z.infer<typeof privateDiningEnquirySchema>;
