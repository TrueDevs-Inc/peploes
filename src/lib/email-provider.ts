import "server-only";

import { err, ok, type Result } from "neverthrow";
import nodemailer from "nodemailer";

import emailLogo from "@/lib/email-logo.json";
import { env } from "@/lib/env";
import type {
  IEmailTransportMessage,
  TEmailFailureReason,
  TEmailProvider,
  TEmailProviderOutcome,
} from "@/lib/types";

export type TEmailConfigError = { readonly reason: TEmailFailureReason };

export function selectEmailProvider(
  flag: string | undefined,
): Result<TEmailProvider, TEmailConfigError> {
  if (flag === undefined || flag === "true") return ok("smtp");
  if (flag === "false") return ok("resend");
  return err({ reason: "invalid_provider_flag" });
}

export function configuredEmailIdentity(): Result<
  { readonly from: string; readonly replyTo: string },
  TEmailConfigError
> {
  const from = env.EMAIL_FROM_ADDRESS;
  const name = env.EMAIL_FROM_NAME;
  const replyTo = env.EMAIL_REPLY_TO;
  if (!from || !name || !replyTo || /[\r\n<>]/.test(name)) {
    return err({ reason: "missing_email_identity" });
  }
  return ok({ from: `"${name}" <${from}>`, replyTo });
}

function smtpAuthentication(): Result<
  | { readonly user: string; readonly pass: string }
  | {
      readonly type: "OAuth2";
      readonly user: string;
      readonly clientId: string;
      readonly clientSecret: string;
      readonly refreshToken: string;
    },
  TEmailConfigError
> {
  const user = env.EMAIL_SMTP_USERNAME;
  if (!user || user !== env.EMAIL_FROM_ADDRESS) {
    return err({ reason: "smtp_sender_mismatch" });
  }
  switch (env.EMAIL_SMTP_AUTH_METHOD) {
    case "app-password":
      return env.EMAIL_SMTP_PASSWORD
        ? ok({ user, pass: env.EMAIL_SMTP_PASSWORD })
        : err({ reason: "missing_smtp_credentials" });
    case "oauth2":
      return env.EMAIL_SMTP_OAUTH_CLIENT_ID &&
        env.EMAIL_SMTP_OAUTH_CLIENT_SECRET &&
        env.EMAIL_SMTP_OAUTH_REFRESH_TOKEN
        ? ok({
            type: "OAuth2",
            user,
            clientId: env.EMAIL_SMTP_OAUTH_CLIENT_ID,
            clientSecret: env.EMAIL_SMTP_OAUTH_CLIENT_SECRET,
            refreshToken: env.EMAIL_SMTP_OAUTH_REFRESH_TOKEN,
          })
        : err({ reason: "missing_smtp_oauth_credentials" });
    default:
      return err({ reason: "missing_smtp_auth_method" });
  }
}

export async function sendSmtp(
  message: IEmailTransportMessage,
): Promise<TEmailProviderOutcome> {
  const auth = smtpAuthentication();
  const host = env.EMAIL_SMTP_HOST;
  const port = env.EMAIL_SMTP_PORT;
  if (!host || !port || auth.isErr()) {
    return {
      status: "rejected",
      reason: auth.isErr() ? auth.error.reason : "missing_smtp_configuration",
    };
  }
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: auth.value,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 8_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    const info = await transport.sendMail({
      from: message.from,
      to: [...message.to],
      cc: [...message.cc],
      bcc: [...message.bcc],
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.html.includes(`cid:${emailLogo.contentId}`)
        ? [
            {
              filename: emailLogo.filename,
              content: emailLogo.content,
              encoding: "base64",
              contentType: emailLogo.contentType,
              contentDisposition: "inline",
              cid: emailLogo.contentId,
            },
          ]
        : undefined,
      messageId: `<${message.id}@${auth.value.user.slice(auth.value.user.indexOf("@") + 1)}>`,
    });
    return smtpOutcome(info);
  } catch (cause) {
    return smtpFailure(cause);
  } finally {
    transport.close();
  }
}

function smtpFailure(cause: unknown): TEmailProviderOutcome {
  if (!(cause instanceof Error)) {
    return { status: "unknown", reason: "smtp_outcome_unknown" };
  }
  const code = "code" in cause ? cause.code : undefined;
  const command = "command" in cause ? cause.command : undefined;
  if (code === "EAUTH")
    return { status: "rejected", reason: "smtp_authentication" };
  if (smtpBeforeData(code, command)) {
    return { status: "rejected", reason: "smtp_before_data" };
  }
  const responseCode = "responseCode" in cause ? cause.responseCode : undefined;
  if (
    code === "EMESSAGE" &&
    command === "DATA" &&
    typeof responseCode === "number" &&
    responseCode >= 400
  ) {
    return { status: "rejected", reason: "smtp_explicit_rejection" };
  }
  return { status: "unknown", reason: "smtp_outcome_unknown" };
}

function smtpBeforeData(code: unknown, command: unknown): boolean {
  return (
    command === "CONN" ||
    command === "MAIL FROM" ||
    command === "RCPT TO" ||
    (code === "EENVELOPE" && command === "DATA")
  );
}

function smtpOutcome(info: {
  readonly accepted: readonly unknown[];
  readonly rejected: readonly unknown[];
  readonly messageId: string;
}): TEmailProviderOutcome {
  if (info.rejected.length > 0 && info.accepted.length > 0) {
    return {
      status: "unknown",
      reason: "partial_smtp_acceptance",
      providerId: info.messageId,
    };
  }
  if (info.accepted.length === 0) {
    return { status: "rejected", reason: "smtp_all_rejected" };
  }
  return { status: "accepted", providerId: info.messageId };
}

export async function sendResend(
  message: IEmailTransportMessage,
): Promise<TEmailProviderOutcome> {
  const key = env.EMAIL_RESEND_API_KEY;
  if (!key)
    return { status: "rejected", reason: "missing_resend_configuration" };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: new Headers([
        ["Authorization", `Bearer ${key}`],
        ["Content-Type", "application/json"],
        ["Idempotency-Key", message.id],
      ]),
      body: JSON.stringify({
        from: message.from,
        to: message.to,
        cc: message.cc,
        bcc: message.bcc,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.html.includes(`cid:${emailLogo.contentId}`)
          ? [
              {
                filename: emailLogo.filename,
                content: emailLogo.content,
                ...Object.fromEntries([
                  ["content_id", emailLogo.contentId],
                  ["content_type", emailLogo.contentType],
                ]),
              },
            ]
          : undefined,
        ...Object.fromEntries([["reply_to", message.replyTo]]),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (
      response.status >= 400 &&
      response.status < 500 &&
      response.status !== 409
    ) {
      return { status: "rejected", reason: "resend_rejected" };
    }
    if (!response.ok) {
      return { status: "unknown", reason: "resend_outcome_unknown" };
    }
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "id" in body &&
      typeof body.id === "string"
    ) {
      return { status: "accepted", providerId: body.id };
    }
    return { status: "unknown", reason: "resend_response_invalid" };
  } catch {
    return { status: "unknown", reason: "resend_outcome_unknown" };
  }
}
