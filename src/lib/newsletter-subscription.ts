"use client";

import { NEWSLETTER_SUBSCRIPTION } from "@/lib/constants";

let subscribed = false;

export function hasNewsletterSubscription(): boolean {
  if (subscribed) return true;
  try {
    return (
      localStorage.getItem(NEWSLETTER_SUBSCRIPTION.subscribedKey) === "true"
    );
  } catch {
    return false;
  }
}

export function rememberNewsletterSubscription(): void {
  subscribed = true;
  try {
    localStorage.setItem(NEWSLETTER_SUBSCRIPTION.subscribedKey, "true");
  } catch {}
  window.dispatchEvent(new Event(NEWSLETTER_SUBSCRIPTION.acceptedEvent));
}
