"use client";

import { ArrowRight, Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { submitPrivateDiningEnquiry } from "@/actions/private-dining-enquiry";
import styles from "@/components/app/compounds/private-dining.module.css";
import { PrivateDiningDate } from "@/components/app/molecules/private-dining-date";
import { Button } from "@/components/ui/button";
import {
  PRIVATE_DINING_FORM,
  PRIVATE_DINING_REQUIRED_MESSAGES,
} from "@/lib/constants/private-dining";
import { env } from "@/lib/env";
import type {
  IEnquiryActionState,
  IPrivateDiningEnquiryProps,
} from "@/lib/types";

function fieldValidationMessage(
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): string {
  if (control.validity.valueMissing)
    return (
      PRIVATE_DINING_REQUIRED_MESSAGES[control.name] ??
      control.validationMessage
    );
  if (control.name === "email") return PRIVATE_DINING_FORM.invalidEmail;
  if (control.name === "date") return PRIVATE_DINING_FORM.invalidDate;
  if (control instanceof HTMLInputElement && control.name === "guests")
    return control.validity.rangeOverflow
      ? PRIVATE_DINING_FORM.guestLimit.replace("{maximum}", control.max)
      : PRIVATE_DINING_FORM.invalidGuests;
  return control.validationMessage;
}

export function PrivateDiningEnquiryFields({
  content,
}: IPrivateDiningEnquiryProps) {
  const [notificationId, setNotificationId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const guestsRef = useRef<HTMLInputElement>(null);
  const validationId = useId();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [requiredWarning, setRequiredWarning] = useState(false);
  const validationAttempted = useRef(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const messageResizeStart = useRef({ pointerY: 0, height: 0 });
  const submittingRef = useRef(false);
  const [state, setState] = useState<IEnquiryActionState>({
    status: "idle",
    message: "",
  });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setNotificationId(crypto.randomUUID());
  }, []);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (
      pending ||
      submittingRef.current ||
      state.status === "success" ||
      state.status === "unknown"
    )
      return;
    validationAttempted.current = true;
    if (!validateFields()) return;
    submittingRef.current = true;
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await submitPrivateDiningEnquiry(data);
        setState(result);
        if (result.status === "success") {
          formRef.current?.reset();
          validationAttempted.current = false;
          setFieldErrors({});
          setRequiredWarning(false);
          setNotificationId(crypto.randomUUID());
        }
      } catch {
        setState({
          status: "unknown",
          message: PRIVATE_DINING_FORM.feedback.unknown,
        });
      } finally {
        submittingRef.current = false;
      }
    });
  }

  function revise(): void {
    validateFields();
    if (state.status === "error" || state.status === "success") {
      setNotificationId(crypto.randomUUID());
      setState({ status: "idle", message: "" });
    }
  }

  function adjustGuests(step: number): void {
    guestsRef.current?.stepUp(step);
    revise();
  }

  function validateFields(): boolean {
    const controls = Array.from(formRef.current?.elements ?? []).filter(
      (element) =>
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement,
    );
    const missing = controls.filter((control) => control.validity.valueMissing);
    const showSummary = validationAttempted.current && missing.length > 1;
    const errors: Record<string, string> = {};
    for (const control of controls) {
      if (control.validity.valid) continue;
      if (
        control.validity.valueMissing &&
        (!validationAttempted.current || showSummary)
      )
        continue;
      errors[control.name] = fieldValidationMessage(control);
    }
    setFieldErrors(errors);
    setRequiredWarning(showSummary);
    return controls.every((control) => control.validity.valid);
  }

  function errorAttributes(name: string) {
    return {
      "aria-invalid": Boolean(fieldErrors[name]),
      "aria-describedby": fieldErrors[name]
        ? `${validationId}-${name}`
        : undefined,
    };
  }

  function fieldError(name: string) {
    return fieldErrors[name] ? (
      <p
        id={`${validationId}-${name}`}
        className={styles.fieldError}
        role="alert"
      >
        {fieldErrors[name]}
      </p>
    ) : null;
  }

  function resizeMessage(height: number): void {
    if (messageRef.current)
      messageRef.current.style.height = `${Math.max(0, height)}px`;
  }

  function resizeMessageByLine(direction: number): void {
    const message = messageRef.current;
    if (!message) return;
    const lineHeight = Number.parseFloat(getComputedStyle(message).lineHeight);
    resizeMessage(
      message.getBoundingClientRect().height + direction * lineHeight,
    );
  }

  return (
    <form
      ref={formRef}
      className={styles.enquiryFields}
      aria-label={content.formEyebrow ?? content.eyebrow}
      noValidate
      onSubmit={submit}
      onChange={revise}
      onInvalid={(event) => {
        event.preventDefault();
        validateFields();
      }}
    >
      <input
        type="hidden"
        name="notificationId"
        value={notificationId}
        className={styles.enquiryHidden}
      />
      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        className={styles.enquiryHoneypot}
      />
      {content.occasions && (
        <div>
          <div className={styles.selectField}>
            <select
              name="occasion"
              className={styles.enquirySelect}
              aria-label={content.occasionLabel}
              defaultValue=""
              required
              {...errorAttributes("occasion")}
            >
              <option value="" disabled hidden>
                {content.occasionLabel}
              </option>
              {content.occasions.map((occasion) => (
                <option key={occasion} value={occasion}>
                  {occasion}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className={styles.selectIcon} />
          </div>
          {fieldError("occasion")}
        </div>
      )}
      <div className={styles.fieldRow}>
        <div>
          <PrivateDiningDate
            errorId={fieldErrors.date ? `${validationId}-date` : undefined}
          />
          {fieldError("date")}
        </div>
        <div>
          <div className={styles.guestField}>
            <input
              ref={guestsRef}
              type="number"
              inputMode="numeric"
              name="guests"
              min={1}
              max={env.NEXT_PUBLIC_ENQUIRY_MAX_GUESTS}
              step={1}
              required
              aria-label={PRIVATE_DINING_FORM.guests}
              placeholder={PRIVATE_DINING_FORM.guests}
              {...errorAttributes("guests")}
            />
            <div className={styles.guestSteps}>
              <Button
                type="button"
                variant="ghost"
                className={styles.guestStep}
                aria-label={PRIVATE_DINING_FORM.increaseGuests}
                onClick={() => adjustGuests(1)}
              >
                <ChevronUp aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={styles.guestStep}
                aria-label={PRIVATE_DINING_FORM.decreaseGuests}
                onClick={() => adjustGuests(-1)}
              >
                <ChevronDown aria-hidden="true" />
              </Button>
            </div>
          </div>
          {fieldError("guests")}
        </div>
      </div>
      <div className={content.company ? styles.fieldRow : undefined}>
        <div>
          <input
            name="name"
            autoComplete="name"
            required
            aria-label={PRIVATE_DINING_FORM.name}
            placeholder={PRIVATE_DINING_FORM.name}
            {...errorAttributes("name")}
          />
          {fieldError("name")}
        </div>
        {content.company && (
          <input
            name="company"
            autoComplete="organization"
            aria-label={PRIVATE_DINING_FORM.company}
            placeholder={PRIVATE_DINING_FORM.company}
          />
        )}
      </div>
      <div>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-label={PRIVATE_DINING_FORM.email}
          placeholder={PRIVATE_DINING_FORM.email}
          {...errorAttributes("email")}
        />
        {fieldError("email")}
      </div>
      <div>
        <div className={styles.messageField}>
          <textarea
            ref={messageRef}
            name="message"
            required
            aria-label={content.messageLabel}
            placeholder={content.messageLabel}
            rows={3}
            {...errorAttributes("message")}
          />
          <Button
            type="button"
            variant="plain"
            className={styles.messageResize}
            aria-label={PRIVATE_DINING_FORM.resizeMessage}
            title={PRIVATE_DINING_FORM.resizeMessageHint}
            onPointerDown={(event) => {
              const message = messageRef.current;
              if (!message) return;
              event.preventDefault();
              messageResizeStart.current = {
                pointerY: event.clientY,
                height: message.getBoundingClientRect().height,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId))
                return;
              resizeMessage(
                messageResizeStart.current.height +
                  event.clientY -
                  messageResizeStart.current.pointerY,
              );
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
              event.preventDefault();
              resizeMessageByLine(event.key === "ArrowDown" ? 1 : -1);
            }}
            onClick={(event) => {
              if (event.detail === 0) resizeMessageByLine(1);
            }}
          />
        </div>
        {fieldError("message")}
      </div>
      {requiredWarning && (
        <p
          id={`${validationId}-required`}
          className={styles.requiredWarning}
          role="alert"
        >
          {PRIVATE_DINING_FORM.requiredWarning}
        </p>
      )}
      <Button
        type="submit"
        variant="brand-primary"
        disabled={
          pending ||
          !notificationId ||
          state.status === "success" ||
          state.status === "unknown"
        }
        aria-busy={pending}
        aria-describedby={
          requiredWarning
            ? `${validationId}-required enquiry-feedback`
            : "enquiry-feedback"
        }
        className={styles.sendButton}
      >
        {pending ? (
          <>
            {PRIVATE_DINING_FORM.loading}
            <ArrowRight aria-hidden="true" className="size-4" />
          </>
        ) : state.status === "success" ? (
          <>
            {PRIVATE_DINING_FORM.complete}
            <Check aria-hidden="true" className={styles.enquiryCheck} />
          </>
        ) : (
          <>
            {PRIVATE_DINING_FORM.submit}
            <ArrowRight aria-hidden="true" className="size-4" />
          </>
        )}
      </Button>
      <p
        id="enquiry-feedback"
        role="status"
        aria-atomic="true"
        className={
          state.status === "idle" && !pending ? "sr-only" : styles.enquiryStatus
        }
      >
        {pending ? PRIVATE_DINING_FORM.loading : state.message}
      </p>
    </form>
  );
}
