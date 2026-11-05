import { err, ok } from "neverthrow";
import { FOOTER_CONTENT } from "@/lib/constants/footer";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";

const attempts = new Map<string, number>();
export async function requestNewsletterSubscription(email: string) {
  await new Promise((resolve) => setTimeout(resolve, 750));
  if (email.startsWith("unknown-"))
    return err(
      createError(
        ErrorCode.OutcomeUnknown,
        FOOTER_CONTENT.newsletter.unknownError,
      ),
    );
  const attempt = (attempts.get(email) ?? 0) + 1;
  attempts.set(email, attempt);
  if (email.startsWith("rejected-") && attempt === 1) {
    return err(
      createError(
        ErrorCode.ServiceUnavailable,
        FOOTER_CONTENT.newsletter.deliveryError,
      ),
    );
  }
  return ok(undefined);
}
