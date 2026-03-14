import {
  boolean,
  check,
  index,
  integer,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { orders } from "./orders";
import { users } from "./users";
import { addresses } from "./addresses";

export const deliveries = appSchema.table(
  "deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    deliveryPartner: text("delivery_partner").notNull(),
    deliveryType: text("delivery_type"),
    deliveryStatus: text("delivery_status").notNull(),
    trackingId: text("tracking_id").notNull(),
    trackingUrl: text("tracking_url").notNull(),
    expectedDeliveryTime: timestamp("expected_delivery_time", {
      withTimezone: true,
      mode: "string",
    }),
    pickupAddressId: uuid("pickup_address_id").notNull(),
    outForDeliveryTime: timestamp("out_for_delivery_time", { withTimezone: true, mode: "string" }),
    isDelivered: boolean("is_delivered").default(false),
    deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: "string" }),
    deliveryAttemptCount: integer("delivery_attempt_count").default(0),
    deliveryConfirmationMethod: text("delivery_confirmation_method").notNull(),
    deliveryCharges: numeric("delivery_charges", {
      mode: "number",
      precision: 14,
      scale: 2,
    }).default(0),
    isContactlessDelivery: boolean("is_contactless_delivery").default(false),
    failureReason: text("failure_reason"),
    destinationAddressId: uuid("destination_address_id")
      .notNull()
      .references(() => addresses.id),
    deliveryInstruction: text("delivery_instruction").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("deliveries_order_id_unique").on(table.orderId),
    uniqueIndex("deliveries_tracking_id_unique").on(table.trackingId),
    index("deliveries_user_id_created_at_index").on(table.userId, table.createdAt),
    index("deliveries_status_created_idx").on(table.deliveryStatus, table.createdAt),
    index("deliveries_pickup_address_id_idx").on(table.pickupAddressId),
    index("deliveries_destination_address_id_idx").on(table.destinationAddressId),
    index("deliveries_expected_pending_idx")
      .on(table.expectedDeliveryTime)
      .where(sql`is_delivered = false`),
    index("deliveries_delivery_partner_idx").on(table.deliveryPartner),
    index("deliveries_user_id_status_idx").on(table.userId, table.deliveryStatus),
    check(
      "delivery_delivered_state_chk",
      sql`(is_delivered = true AND delivered_at IS NOT NULL) OR (is_delivered = false AND delivered_at IS NULL)`,
    ),
    check("delivery_attempt_nonneg_chk", sql`delivery_attempt_count >= 0`),
  ],
);
