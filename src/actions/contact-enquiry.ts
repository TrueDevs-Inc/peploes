"use server";

import { headers } from "next/headers";

import { VISIT_CONTACT_CONTENT } from "@/lib/constants/visit-contact";
import { AppModule, LogContext, Stage } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import type { IEnquiryActionState } from "@/lib/types";
import { deliverContactEnquiry } from "@/services/contact-enquiry";

export async function submitContactEnquiry(
  formData: FormData,
): Promise<IEnquiryActionState> {
  const input = {
    notificationId: formData.get("notificationId"),
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    consent: formData.get("consent") === "on",
    website: formData.get("website") || undefined,
  };
  try {
    const requestHeaders = await headers();
    return await deliverContactEnquiry(
      input,
      requestHeaders.get("x-forwarded-for"),
    );
  } catch {
    logger.error(LogContext.Api, "Contact action failed unexpectedly");
    logToSentry(new Error("Contact action failed unexpectedly"), {
      module: AppModule.Action,
      stage: Stage.ErrorHandling,
      tags: { template: "contact-admin" },
    });
    return {
      status: "unknown",
      message: VISIT_CONTACT_CONTENT.form.feedback.unknown,
    };
  }
}
