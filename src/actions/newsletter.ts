"use server";

import { headers } from "next/headers";
import { createPublicAction } from "@/actions/base";
import { FOOTER_CONTENT } from "@/lib/constants/footer";
import type { INewsletterActionState } from "@/lib/types";
import { subscribeNewsletter } from "@/services/newsletter";

export async function submitNewsletter(
  input: unknown,
): Promise<INewsletterActionState> {
  const action = createPublicAction({
    handler: async ({ input: rawInput }) =>
      subscribeNewsletter(rawInput, (await headers()).get("x-forwarded-for")),
  });
  const result = await action(input);
  return {
    accepted: result.isOk(),
    message: result.isOk()
      ? FOOTER_CONTENT.newsletter.status
      : result.error.message,
  };
}
