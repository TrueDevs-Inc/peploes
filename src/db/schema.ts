import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { EXAMPLE_LIMITS } from "@/lib/constants";

export const examples = pgTable("examples", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: EXAMPLE_LIMITS.NAME_MAX_LENGTH }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailProvider = pgEnum("email_provider", ["smtp", "resend"]);
export const emailDeliveryStatus = pgEnum("email_delivery_status", [
  "pending",
  "accepted",
  "rejected",
  "unknown",
]);

export const emailDeliveries = pgTable("email_deliveries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  payloadHash: varchar("payload_hash", { length: 64 }).notNull(),
  template: varchar("template", { length: 64 }).notNull(),
  provider: emailProvider("provider").notNull(),
  status: emailDeliveryStatus("status").notNull(),
  providerId: varchar("provider_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
