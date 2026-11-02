import { notFound } from "next/navigation";

import { renderEnquiryAdmin, renderEnquiryGuest } from "@/lib/email-templates";
import { env } from "@/lib/env";

const syntheticEnquiry = {
  notificationId: "00000000-0000-4000-8000-000000000001",
  occasion: "Celebration",
  date: "2027-06-18",
  guests: 12,
  name: "Example Guest",
  email: "guest@example.test",
  message: "We would love to celebrate with family and friends.",
  consent: false,
} as const;

export default function EmailPreviewPage() {
  if (env.VERCEL_ENV === "production") notFound();

  const templates = [
    renderEnquiryAdmin(
      syntheticEnquiry,
      "restaurant@example.test",
      "contact@example.test",
    ),
    renderEnquiryGuest(
      syntheticEnquiry,
      "contact@example.test",
      env.NEXT_PUBLIC_SITE_URL,
    ),
  ];

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}>
      <h1>Transactional email previews</h1>
      <p>
        These examples use synthetic names and addresses. No message is sent.
      </p>
      {templates.map((template) => (
        <section key={template.template} style={{ marginBlock: 40 }}>
          <h2>{template.subject}</h2>
          <p>Template: {template.template}</p>
          <iframe
            title={`${template.template} HTML preview`}
            srcDoc={template.html}
            style={{
              width: "100%",
              height: 580,
              border: "1px solid currentColor",
            }}
          />
          <h3>Plain text</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{template.text}</pre>
        </section>
      ))}
    </main>
  );
}
