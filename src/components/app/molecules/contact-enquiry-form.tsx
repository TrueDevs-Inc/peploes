"use client";

import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { submitContactEnquiry } from "@/actions/contact-enquiry";
import styles from "@/components/app/compounds/visit-contact.module.css";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { VISIT_CONTACT_CONTENT } from "@/lib/constants/visit-contact";
import type { IEnquiryActionState } from "@/lib/types";

const content = VISIT_CONTACT_CONTENT.form;

export function ContactEnquiryForm() {
  const [notificationId, setNotificationId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const [state, setState] = useState<IEnquiryActionState>({
    status: "idle",
    message: "",
  });
  const [pending, startTransition] = useTransition();

  useEffect(() => setNotificationId(crypto.randomUUID()), []);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (
      pending ||
      submittingRef.current ||
      state.status === "success" ||
      state.status === "unknown" ||
      !event.currentTarget.reportValidity()
    )
      return;
    submittingRef.current = true;
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await submitContactEnquiry(data);
        setState(result);
        if (result.status === "success") {
          formRef.current?.reset();
          setNotificationId(crypto.randomUUID());
        }
      } catch {
        setState({ status: "unknown", message: content.feedback.unknown });
      } finally {
        submittingRef.current = false;
      }
    });
  }

  function revise(): void {
    if (state.status === "error" || state.status === "success") {
      setNotificationId(crypto.randomUUID());
      setState({ status: "idle", message: "" });
    }
  }

  return (
    <section
      className={styles.messageSection}
      aria-labelledby="contact-message-heading"
    >
      <div className={`site-container ${styles.messageGrid}`}>
        <div data-scroll-reveal>
          <p className={styles.eyebrow}>{content.eyebrow}</p>
          <h2 id="contact-message-heading" className={styles.heading}>
            {content.heading}
          </h2>
          <p className={styles.description}>{content.description}</p>
        </div>
        <form
          data-scroll-reveal
          ref={formRef}
          className={styles.messageForm}
          aria-label="General contact message"
          noValidate
          onSubmit={submit}
          onChange={revise}
        >
          <fieldset className={styles.messageFields} disabled={pending}>
            <input type="hidden" name="notificationId" value={notificationId} />
            <input
              name="website"
              type="text"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              className={styles.messageHoneypot}
            />
            <label>
              {content.name}
              <input name="name" autoComplete="name" maxLength={120} required />
            </label>
            <label>
              {content.email}
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>
            <label>
              {content.message}
              <textarea name="message" maxLength={5000} rows={5} required />
            </label>
            <label className={styles.messageConsent}>
              <input name="consent" type="checkbox" required />
              <span>
                I agree to the{" "}
                <Link href={ROUTES.PRIVACY_COOKIES}>privacy policy</Link> for
                enquiries.
              </span>
            </label>
          </fieldset>
          <Button
            type="submit"
            variant="brand-primary"
            className={styles.messageSubmit}
            disabled={
              pending ||
              !notificationId ||
              state.status === "success" ||
              state.status === "unknown"
            }
            aria-busy={pending}
            aria-describedby="contact-message-feedback"
          >
            {pending
              ? content.sending
              : state.status === "success"
                ? content.sent
                : content.submit}
            {pending ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 motion-safe:animate-spin"
              />
            ) : state.status === "success" ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <ArrowRight aria-hidden="true" className="size-4" />
            )}
          </Button>
          <p
            id="contact-message-feedback"
            role="status"
            aria-atomic="true"
            className={
              state.status === "idle" && !pending
                ? "sr-only"
                : styles.messageFeedback
            }
          >
            {pending ? content.sending : state.message}
          </p>
        </form>
      </div>
    </section>
  );
}
