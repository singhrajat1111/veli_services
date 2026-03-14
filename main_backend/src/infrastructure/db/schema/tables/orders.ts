import { check, index, numeric, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { users } from "./users";
import { payments } from "./payments";
import { addresses } from "./addresses";
import { reviewTargets } from "./reviewTargets";
import { carts } from "./carts";

export const orders = appSchema.table(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    orderNumber: text("order_number").notNull(),
    shippingCost: numeric("shipping_cost", { mode: "number" }).default(0),
    couponAppliedId: uuid("coupon_applied_id"),
    discountAmount: numeric("discount_amount", { mode: "number" }).default(0),
    taxAmount: numeric("tax_amount", { mode: "number" }).default(0),
    orderStatus: text("order_status").notNull(),
    paymentStatus: text("payment_status").notNull().default("pending"),
    paymentId: uuid("payment_id").references(() => payments.id),
    packingNumber: uuid("packing_number"),
    trackingNumber: uuid("tracking_number"),
    deliveryId: uuid("delivery_id"),
    addressId: uuid("address_id").references(() => addresses.id),
    reviewTargetId: uuid("review_target_id")
      .notNull()
      .references(() => reviewTargets.id),
    expectedDeliveryTime: timestamp("expected_delivery_time", {
      withTimezone: true,
      mode: "string",
    }),
    placedAt: timestamp("placed_at", { withTimezone: true, mode: "string" }),
    cancelledBy: text("cancelled_by"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "string" }),
    cancellationReason: text("cancellation_reason"),
    total: numeric("total", { mode: "number" }).notNull(),
    sourceCartId: uuid("source_cart_id")
      .notNull()
      .references(() => carts.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_order_number_unique").on(table.orderNumber),
    index("orders_user_created_idx").on(table.userId, table.createdAt),
    index("orders_status_created_idx").on(table.orderStatus, table.createdAt),
    index("orders_payment_pending_idx")
      .on(table.createdAt)
      .where(sql`payment_status = 'pending'`),
    index("orders_delivery_id_idx").on(table.deliveryId),
    index("orders_user_status_idx").on(table.userId, table.orderStatus),
    check("orders_shipping_nonneg_chk", sql`shipping_cost >= 0`),
    check("orders_discount_nonneg_chk", sql`discount_amount >= 0`),
    check("orders_tax_nonneg_chk", sql`tax_amount >= 0`),
    check("orders_total_nonneg_chk", sql`total >= 0`),
    check("orders_discount_not_exceed_total_chk", sql`discount_amount <= total`),
    check(
      "orders_status_chk",
      sql`order_status IN ('pending','confirmed','paid','shipped','delivered','cancelled','refunded')`,
    ),
    check(
      "orders_payment_status_chk",
      sql`payment_status IN ('pending','paid','failed','refunded')`,
    ),
    check(
      "orders_cancel_state_chk",
      sql`
    (order_status <> 'cancelled' AND cancelled_at IS NULL AND cancelled_by IS NULL)
    OR
    (order_status = 'cancelled' AND cancelled_at IS NOT NULL)
  `,
    ),
    check(
      "orders_payment_link_chk",
      sql`
    (payment_status = 'pending' AND payment_id IS NULL)
    OR
    (payment_status <> 'pending' AND payment_id IS NOT NULL)
  `,
    ),
  ],
);
