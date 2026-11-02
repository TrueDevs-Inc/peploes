import "server-only";

import { renderEnquiryAdmin, renderEnquiryGuest } from "@/lib/email-templates";
import { allowEnquiry } from "@/lib/enquiry-rate-limit";
import { privateDiningEnquirySchema } from "@/lib/enquiry-schema";
import { AppModule, ErrorCode, LogContext, Stage } from "@/lib/enums";
import { env } from "@/lib/env";
import { logToSentry } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import type { IEnquiryActionState } from "@/lib/types";
import { sendEmail } from "@/services/email";

const successMessage =
  "Your enquiry has reached our team. They will be in touch.";
const unknownMessage =
  "We could not confirm delivery. Please contact our team before sending this again.";

export async function deliverPrivateDiningEnquiry(
  rawInput: unknown,
  forwardedFor: string | null,
): Promise<IEnquiryActionState> {
  const parsed = privateDiningEnquirySchema.safeParse(rawInput);
  if (!parsed.success) {
    return { status: "error", message: "Please check the form and try again." };
  }
  if (parsed.data.website) {
    return { status: "error", message: "We could not send your enquiry." };
  }
  const restaurant = env.EMAIL_RESTAURANT_TO;
  const contact = env.EMAIL_REPLY_TO;
  if (!restaurant || !contact) {
    logger.error(LogContext.Api, "Enquiry email configuration missing");
    return {
      status: "error",
      message:
        "Online enquiries are unavailable. Please contact our team directly.",
    };
  }
  if (!(await allowEnquiry(forwardedFor))) {
    return {
      status: "error",
      message:
        "We could not send your enquiry right now. Please contact our team directly.",
    };
  }
  const enquiry = parsed.data;
  let admin: Awaited<ReturnType<typeof sendEmail>>;
  try {
    admin = await sendEmail(renderEnquiryAdmin(enquiry, restaurant, contact));
  } catch {
    logger.error(
      LogContext.Api,
      "Enquiry restaurant delivery failed unexpectedly",
    );
    logToSentry(new Error("Enquiry restaurant delivery failed unexpectedly"), {
      module: AppModule.Api,
      stage: Stage.ServiceCall,
      tags: { template: "enquiry-admin" },
    });
    return { status: "unknown", message: unknownMessage };
  }
  if (admin.isErr()) {
    return admin.error.code === ErrorCode.OutcomeUnknown
      ? { status: "unknown", message: unknownMessage }
      : {
          status: "error",
          message:
            "We could not send your enquiry. Your details are still in the form; please try again or contact our team.",
        };
  }
  try {
    const guest = await sendEmail(
      renderEnquiryGuest(enquiry, contact, env.NEXT_PUBLIC_SITE_URL),
    );
    if (guest.isOk()) {
      return {
        status: "success",
        message: successMessage,
        guestAcknowledgement: "accepted",
      };
    }
    logger.warn(LogContext.Api, "Enquiry acknowledgement unavailable", {
      id: admin.value.id,
      status: guest.error.code,
    });
  } catch {
    logger.error(
      LogContext.Api,
      "Enquiry acknowledgement failed unexpectedly",
      { id: admin.value.id },
    );
    logToSentry(new Error("Enquiry acknowledgement failed unexpectedly"), {
      module: AppModule.Api,
      stage: Stage.ServiceCall,
      tags: { deliveryId: admin.value.id, template: "enquiry-guest" },
    });
  }
  return {
    status: "success",
    message: successMessage,
    guestAcknowledgement: "failed",
  };
}
