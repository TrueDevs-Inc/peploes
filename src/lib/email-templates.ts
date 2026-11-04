import type { TPrivateDiningEnquiry } from "@/lib/enquiry-schema";
import type { IEmailMessage } from "@/lib/types";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function layout(preheader: string, content: string, contact: string): string {
  const safeContact = escapeHtml(contact);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f8f4ed;color:#271f1c;font-family:Georgia,serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #ded6cb"><tr><td style="padding:32px 28px 16px;border-top:6px solid #6f2637"><p style="margin:0;color:#6f2637;font-size:26px;letter-spacing:.08em">PEPLOE'S</p></td></tr><tr><td style="padding:0 28px 28px;font-size:16px;line-height:1.6;overflow-wrap:anywhere">${content}<p style="margin:28px 0 0;font-size:14px">Questions? <a style="color:#6f2637" href="mailto:${safeContact}">Reply to ${safeContact}</a>.</p></td></tr></table></td></tr></table></body></html>`;
}

function details(enquiry: TPrivateDiningEnquiry): string[] {
  return [
    `Name: ${enquiry.name}`,
    ...(enquiry.company ? [`Company: ${enquiry.company}`] : []),
    ...(enquiry.occasion ? [`Occasion: ${enquiry.occasion}`] : []),
    `Preferred date: ${enquiry.date}`,
    `Guests: ${enquiry.guests}`,
    `Email: ${enquiry.email}`,
    `Message: ${enquiry.message}`,
  ];
}

export function renderEnquiryAdmin(
  enquiry: TPrivateDiningEnquiry,
  recipient: string,
  contact: string,
): IEmailMessage {
  const lines = details(enquiry);
  const content = `<h1 style="font-size:28px;line-height:1.2">New private dining enquiry</h1>${lines.map((line) => `<p style="margin:0 0 12px;white-space:pre-wrap">${escapeHtml(line)}</p>`).join("")}`;
  return {
    notificationId: enquiry.notificationId,
    template: "enquiry-admin",
    version: 1,
    to: [recipient],
    replyTo: enquiry.email,
    subject: "New private dining enquiry",
    html: layout(
      "A guest has sent a private dining enquiry.",
      content,
      contact,
    ),
    text: `New private dining enquiry\n\n${lines.join("\n")}\n\nReply to ${contact}.`,
  };
}

export function renderEnquiryGuest(
  enquiry: TPrivateDiningEnquiry,
  contact: string,
  siteUrl: string,
): IEmailMessage {
  const url = new URL("/private-dining", siteUrl).toString();
  const content = `<h1 style="font-size:28px;line-height:1.2">Thank you for your enquiry</h1><p>Dear ${escapeHtml(enquiry.name)},</p><p>Thank you for getting in touch about private dining at Peploe's. Our team has received your enquiry and will be in touch.</p><p>Your preferred date: ${escapeHtml(enquiry.date)}<br>Number of guests: ${enquiry.guests}</p><p><a style="color:#6f2637" href="${escapeHtml(url)}">Explore private dining at Peploe's</a></p>`;
  return {
    notificationId: enquiry.notificationId,
    template: "enquiry-guest",
    version: 1,
    to: [enquiry.email],
    subject: "Your Peploe's private dining enquiry",
    html: layout(
      "We have received your private dining enquiry.",
      content,
      contact,
    ),
    text: `Dear ${enquiry.name},\n\nThank you for getting in touch about private dining at Peploe's. Our team has received your enquiry and will be in touch.\n\nYour preferred date: ${enquiry.date}\nNumber of guests: ${enquiry.guests}\n\nExplore private dining: ${url}\n\nQuestions? Reply to ${contact}.`,
  };
}
