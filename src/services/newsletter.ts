import "server-only";

import { err } from "neverthrow";
import { z } from "zod";
import { NEWSLETTER_LIMITS } from "@/lib/constants";
import { FOOTER_CONTENT } from "@/lib/constants/footer";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import { requestNewsletterSubscription } from "@/lib/newsletter-provider";

const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email().max(NEWSLETTER_LIMITS.emailMaxLength))
    .transform((email) => email.toLowerCase()),
});

export async function subscribeNewsletter(
  input: unknown,
  forwardedFor: string | null = null,
) {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.ValidationError,
        FOOTER_CONTENT.newsletter.invalidError,
      ),
    );
  return await requestNewsletterSubscription(parsed.data.email, forwardedFor);
}
