import "server-only";

import { createHash } from "node:crypto";

import { err, ok } from "neverthrow";
import { z } from "zod/v4";

import {
  claimEmailDelivery,
  finishEmailDelivery,
} from "@/dal/email-deliveries";
import {
  configuredEmailIdentity,
  selectEmailProvider,
  sendResend,
  sendSmtp,
} from "@/lib/email-provider";
import { AppModule, ErrorCode, LogContext, Stage } from "@/lib/enums";
import { env } from "@/lib/env";
import { logToSentry } from "@/lib/error-handler";
import { createError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  IEmailMessage,
  IEmailTransportMessage,
  TEmailProvider,
  TEmailProviderOutcome,
} from "@/lib/types";

const emailMessageSchema = z.object({
  notificationId: z.uuid(),
  template: z.enum(["enquiry-admin", "enquiry-guest"]),
  version: z.number().int().positive(),
  to: z.array(z.email()).min(1).max(5),
  cc: z.array(z.email()).max(5).optional(),
  bcc: z.array(z.email()).max(5).optional(),
  replyTo: z.email().optional(),
  subject: z.string().min(1).max(180),
  html: z.string().min(1),
  text: z.string().min(1),
});

type TClaim = typeof claimEmailDelivery;
type TFinish = typeof finishEmailDelivery;

interface IEmailServiceDependencies {
  readonly claim: TClaim;
  readonly finish: TFinish;
  readonly smtp: (
    message: IEmailTransportMessage,
  ) => Promise<TEmailProviderOutcome>;
  readonly resend: (
    message: IEmailTransportMessage,
  ) => Promise<TEmailProviderOutcome>;
  readonly providerFlag: string | undefined;
  readonly stagingAllowlist: string | undefined;
  readonly live: boolean;
  readonly identity: typeof configuredEmailIdentity;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stagingRecipientsAllowed(
  message: IEmailTransportMessage,
  allowlist: string | undefined,
): boolean {
  const allowed = new Set(
    (allowlist ?? "")
      .split(",")
      .map((address) => address.trim().toLowerCase())
      .filter(Boolean),
  );
  if (allowed.size === 0) return false;
  const recipients = [
    ...message.to,
    ...message.cc,
    ...message.bcc,
    ...(message.replyTo ? [message.replyTo] : []),
  ];
  return recipients.every((address) => allowed.has(address.toLowerCase()));
}

interface IPreparedEmail {
  readonly message: IEmailTransportMessage;
  readonly template: string;
  readonly payloadHash: string;
  readonly provider: TEmailProvider;
}

function transportMessage(
  message: z.infer<typeof emailMessageSchema>,
  identity: { readonly from: string; readonly replyTo: string },
  live: boolean,
): IEmailTransportMessage {
  const to = message.to.map((address) => address.toLowerCase());
  const cc = (message.cc ?? []).map((address) => address.toLowerCase());
  const bcc = (message.bcc ?? []).map((address) => address.toLowerCase());
  const recipientKey = [...to, ...cc, ...bcc].sort().join("|");
  return {
    id: hash(
      `${message.template}|${message.notificationId}|${message.version}|${recipientKey}`,
    ),
    from: identity.from,
    to,
    cc,
    bcc,
    replyTo: live ? (message.replyTo ?? identity.replyTo) : identity.replyTo,
    subject: live ? message.subject : `[STAGING] ${message.subject}`,
    html: message.html,
    text: message.text,
  };
}

function prepareEmail(raw: IEmailMessage, deps: IEmailServiceDependencies) {
  const parsed = emailMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      createError(ErrorCode.ValidationError, "Invalid email request."),
    );
  }
  const selected = selectEmailProvider(deps.providerFlag);
  const identity = deps.identity();
  if (selected.isErr() || identity.isErr()) {
    logger.error(LogContext.Api, "Email configuration invalid", {
      reason: selected.isErr()
        ? selected.error.reason
        : identity.isErr()
          ? identity.error.reason
          : "unknown",
    });
    return err(
      createError(ErrorCode.ServiceUnavailable, "Email is unavailable."),
    );
  }
  const message = transportMessage(parsed.data, identity.value, deps.live);
  if (!deps.live && !stagingRecipientsAllowed(message, deps.stagingAllowlist)) {
    logger.error(LogContext.Api, "Email staging recipient rejected", {
      id: message.id,
      template: parsed.data.template,
    });
    return err(
      createError(ErrorCode.Forbidden, "Email recipient is not approved."),
    );
  }
  return ok({
    message,
    template: parsed.data.template,
    payloadHash: hash(JSON.stringify(message)),
    provider: selected.value,
  } satisfies IPreparedEmail);
}

function reportOutcome(
  outcome: TEmailProviderOutcome,
  email: IPreparedEmail,
  provider: TEmailProvider,
) {
  const { id } = email.message;
  switch (outcome.status) {
    case "accepted":
      return ok({ id, provider, status: "accepted" as const });
    case "rejected":
      logger.error(LogContext.Api, "Email provider rejected message", {
        id,
        provider,
        template: email.template,
        reason: outcome.reason,
      });
      logToSentry(new Error("Email provider rejected message"), {
        module: AppModule.Api,
        stage: Stage.ServiceCall,
        tags: {
          deliveryId: id,
          provider,
          template: email.template,
          reason: outcome.reason,
        },
      });
      return err(
        createError(ErrorCode.ServiceUnavailable, "Email was not sent."),
      );
    case "unknown":
      logger.error(LogContext.Api, "Email provider outcome unknown", {
        id,
        provider,
        template: email.template,
        reason: outcome.reason,
      });
      logToSentry(new Error("Email provider outcome unknown"), {
        module: AppModule.Api,
        stage: Stage.ServiceCall,
        tags: {
          deliveryId: id,
          provider,
          template: email.template,
          reason: outcome.reason,
        },
      });
      return err(
        createError(ErrorCode.OutcomeUnknown, "Email status needs checking."),
      );
  }
}

async function persistOutcome(
  outcome: TEmailProviderOutcome,
  email: IPreparedEmail,
  provider: TEmailProvider,
  deps: IEmailServiceDependencies,
) {
  const { id } = email.message;
  const finished = await deps.finish({
    id,
    status: outcome.status,
    ...("providerId" in outcome && outcome.providerId
      ? { providerId: outcome.providerId }
      : {}),
  });
  if (finished.isOk() && finished.value)
    return reportOutcome(outcome, email, provider);
  logger.error(LogContext.Database, "Email delivery status unavailable", {
    id,
    provider,
  });
  logToSentry(new Error("Email delivery status unavailable"), {
    module: AppModule.Api,
    stage: Stage.ServiceCall,
    tags: { deliveryId: id, provider, template: email.template },
  });
  return err(
    createError(ErrorCode.OutcomeUnknown, "Email status needs checking."),
  );
}

async function deliverEmail(
  email: IPreparedEmail,
  deps: IEmailServiceDependencies,
) {
  const { id } = email.message;
  const claim = await deps.claim({
    id,
    payloadHash: email.payloadHash,
    template: email.template,
    provider: email.provider,
  });
  if (claim.isErr()) {
    logger.error(LogContext.Database, "Email delivery claim failed", { id });
    return err(
      createError(ErrorCode.ServiceUnavailable, "Email is unavailable."),
    );
  }
  if (claim.value.record.payloadHash !== email.payloadHash) {
    return err(
      createError(ErrorCode.Conflict, "This email request has changed."),
    );
  }
  if (!claim.value.claimed) {
    return claim.value.record.status === "accepted"
      ? ok({
          id,
          provider: claim.value.record.provider,
          status: "accepted" as const,
        })
      : err(
          createError(ErrorCode.OutcomeUnknown, "Email status needs checking."),
        );
  }
  const provider = claim.value.record.provider;
  const outcome = await (provider === "smtp"
    ? deps.smtp(email.message)
    : deps.resend(email.message));
  return persistOutcome(outcome, email, provider, deps);
}

export function createEmailDeliveryService(deps: IEmailServiceDependencies) {
  return function sendEmail(raw: IEmailMessage) {
    const prepared = prepareEmail(raw, deps);
    return prepared.isErr()
      ? Promise.resolve(prepared)
      : deliverEmail(prepared.value, deps);
  };
}

export const sendEmail = createEmailDeliveryService({
  claim: claimEmailDelivery,
  finish: finishEmailDelivery,
  smtp: sendSmtp,
  resend: sendResend,
  providerFlag: env.PREFER_SMTP,
  stagingAllowlist: env.EMAIL_STAGING_ALLOWLIST,
  live: env.VERCEL_ENV === "production",
  identity: configuredEmailIdentity,
});
