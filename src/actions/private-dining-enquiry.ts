"use server";

import { headers } from "next/headers";

import { PRIVATE_DINING_FORM } from "@/lib/constants/private-dining";
import { LogContext } from "@/lib/enums";
import { logger } from "@/lib/logger";
import type { IEnquiryActionState } from "@/lib/types";
import { deliverPrivateDiningEnquiry } from "@/services/private-dining-enquiry";

export async function submitPrivateDiningEnquiry(
  formData: FormData,
): Promise<IEnquiryActionState> {
  const input = {
    notificationId: formData.get("notificationId"),
    occasion: formData.get("occasion") || undefined,
    date: formData.get("date"),
    guests: formData.get("guests"),
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    email: formData.get("email"),
    message: formData.get("message"),
    consent: formData.get("consent") === "on",
    website: formData.get("website") || undefined,
  };
  try {
    const requestHeaders = await headers();
    return await deliverPrivateDiningEnquiry(
      input,
      requestHeaders.get("x-forwarded-for"),
    );
  } catch {
    logger.error(LogContext.Api, "Enquiry action failed unexpectedly");
    return {
      status: "unknown",
      message: PRIVATE_DINING_FORM.feedback.unknown,
    };
  }
}
