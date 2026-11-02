import "server-only";

import { PRIVATE_DINING_FORM } from "@/lib/constants/private-dining";
import { renderEnquiryAdmin, renderEnquiryGuest } from "@/lib/email-templates";
import { allowEnquiry } from "@/lib/enquiry-rate-limit";
import { privateDiningEnquirySchema } from "@/lib/enquiry-schema";
import { AppModule, ErrorCode, LogContext, Stage } from "@/lib/enums";
import { env } from "@/lib/env";
import { logToSentry } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import type { IEnquiryActionState } from "@/lib/types";
import { sendEmail } from "@/services/email";

const configurationMissing = "Enquiry email configuration missing";

export async function deliverPrivateDiningEnquiry(
  rawInput: unknown,
  forwardedFor: string | null,
): Promise<IEnquiryActionState> {
  const parsed = privateDiningEnquirySchema.safeParse(rawInput);
  if (!parsed.success) {
    return { status: "error", message: PRIVATE_DINING_FORM.feedback.invalid };
  }
  if (parsed.data.website) {
    return { status: "error", message: PRIVATE_DINING_FORM.feedback.blocked };
  }
  const restaurant = env.EMAIL_RESTAURANT_TO;
  const contact = env.EMAIL_REPLY_TO;
  if (!restaurant || !contact) {
    logger.error(LogContext.Api, configurationMissing);
    logToSentry(new Error(configurationMissing), {
      module: AppModule.Api,
      stage: Stage.ServiceCall,
      tags: { template: "enquiry-admin" },
    });
    return {
      status: "error",
      message: PRIVATE_DINING_FORM.feedback.unavailable,
    };
  }
  if (!(await allowEnquiry(forwardedFor))) {
    return {
      status: "error",
      message: PRIVATE_DINING_FORM.feedback.limited,
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
    return { status: "unknown", message: PRIVATE_DINING_FORM.feedback.unknown };
  }
  if (admin.isErr()) {
    return admin.error.code === ErrorCode.OutcomeUnknown
      ? { status: "unknown", message: PRIVATE_DINING_FORM.feedback.unknown }
      : {
          status: "error",
          message: PRIVATE_DINING_FORM.feedback.failed,
        };
  }
  try {
    const guest = await sendEmail(
      renderEnquiryGuest(enquiry, contact, env.NEXT_PUBLIC_SITE_URL),
    );
    if (guest.isOk()) {
      return {
        status: "success",
        message: PRIVATE_DINING_FORM.feedback.success,
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
    message: PRIVATE_DINING_FORM.feedback.success,
    guestAcknowledgement: "failed",
  };
}
