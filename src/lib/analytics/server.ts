import { GA4Event } from "@/lib/enums";
import { env, isProduction } from "@/lib/env";
import type { IMeasurementEventPayload, IPurchaseParams } from "@/lib/types";

const GA_MEASUREMENT_ID = env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_API_SECRET = env.GA_API_SECRET;
const GA_ENDPOINT =
  env.NEXT_PUBLIC_GA_ENDPOINT ?? "https://www.google-analytics.com/mp/collect";
const DEFAULT_ENGAGEMENT_TIME_MS = 100;

function isConfigured(): boolean {
  return isProduction() && !!GA_MEASUREMENT_ID && !!GA_API_SECRET;
}

function generateClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function sendMeasurementEvent(
  eventName: string,
  params: Record<string, unknown>,
  clientId?: string,
): Promise<boolean> {
  if (!isConfigured()) {
    console.log("[GA4 Server] Not configured, skipping event:", eventName);
    return false;
  }

  const payload: IMeasurementEventPayload = {
    client_id: clientId ?? generateClientId(),
    events: [
      {
        name: eventName,
        params: {
          ...params,
          engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_MS,
        },
      },
    ],
  };

  const url = `${GA_ENDPOINT}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "Unable to read response");
    console.error(
      "[GA4 Server] Failed to send event:",
      response.status,
      response.statusText,
      body,
    );
    return false;
  }

  return true;
}

export async function trackServerPurchase(
  params: IPurchaseParams,
  clientId?: string,
): Promise<boolean> {
  const items = params.items.map((item) => ({
    item_id: item.item_id,
    item_name: item.item_name,
    ...(item.item_category && { item_category: item.item_category }),
    ...(item.item_variant && { item_variant: item.item_variant }),
    price: item.price,
    quantity: item.quantity,
  }));

  const eventParams: Record<string, unknown> = {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency,
    tax: params.tax ?? 0,
    shipping: params.shipping ?? 0,
    items,
    ...(params.utm_source && { utm_source: params.utm_source }),
    ...(params.utm_medium && { utm_medium: params.utm_medium }),
    ...(params.utm_campaign && { utm_campaign: params.utm_campaign }),
  };

  return await sendMeasurementEvent(GA4Event.Purchase, eventParams, clientId);
}

export async function trackServerEvent(
  eventName: string,
  params: Record<string, unknown>,
  clientId?: string,
): Promise<boolean> {
  const trimmedEventName = eventName?.trim();

  if (!trimmedEventName) {
    console.warn("[GA4 Server] Event name cannot be empty");
    return false;
  }

  return await sendMeasurementEvent(trimmedEventName, params, clientId);
}
