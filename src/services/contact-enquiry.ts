import "server-only";

import { VISIT_CONTACT_CONTENT } from "@/lib/constants/visit-contact";
import { renderContactAdmin } from "@/lib/email-templates";
import { allowEnquiry } from "@/lib/enquiry-rate-limit";
import { contactEnquirySchema } from "@/lib/enquiry-schema";
import { AppModule, ErrorCode, LogContext, Stage } from "@/lib/enums";
import { env } from "@/lib/env";
import { logToSentry } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import type { IEnquiryActionState } from "@/lib/types";
import { sendEmail } from "@/services/email";

const feedback = VISIT_CONTACT_CONTENT.form.feedback;

export async function deliverContactEnquiry(
  rawInput: unknown,
  forwardedFor: string | null,
): Promise<IEnquiryActionState> {
  const parsed = contactEnquirySchema.safeParse(rawInput);
  if (!parsed.success) return { status: "error", message: feedback.invalid };
  if (parsed.data.website)
    return { status: "error", message: feedback.blocked };

  const restaurant = env.EMAIL_RESTAURANT_TO;
  const contact = env.EMAIL_REPLY_TO;
  if (!restaurant || !contact) {
    logger.error(LogContext.Api, "Contact email configuration missing");
    logToSentry(new Error("Contact email configuration missing"), {
      module: AppModule.Api,
      stage: Stage.ServiceCall,
      tags: { template: "contact-admin" },
    });
    return { status: "error", message: feedback.unavailable };
  }
  if (!(await allowEnquiry(forwardedFor)))
    return { status: "error", message: feedback.limited };

  try {
    const result = await sendEmail(
      renderContactAdmin(parsed.data, restaurant, contact),
    );
    if (result.isOk()) return { status: "success", message: feedback.success };
    return result.error.code === ErrorCode.OutcomeUnknown
      ? { status: "unknown", message: feedback.unknown }
      : { status: "error", message: feedback.failed };
  } catch {
    // Provider exceptions may contain guest text or credentials; report only a safe category.
    logger.error(LogContext.Api, "Contact delivery failed unexpectedly");
    logToSentry(new Error("Contact delivery failed unexpectedly"), {
      module: AppModule.Api,
      stage: Stage.ServiceCall,
      tags: { template: "contact-admin" },
    });
    return { status: "unknown", message: feedback.unknown };
  }
}
