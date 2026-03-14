import {
  check,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { orders } from "./orders";

export const paymentAttempts = appSchema.table(
  "payment_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    status: text("status").notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    gatewayResponseJson: jsonb("gateway_response_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("payments_attempt_order_id_idx").on(table.orderId),
    uniqueIndex("payments_attempt_order_id_attempt_number_uq_idx").on(
      table.orderId,
      table.attemptNumber,
    ),
    index("payments_attempt_status_created_idx").on(table.status, table.createdAt),
    uniqueIndex("payments_successful_orders_payment_attempts_idx")
      .on(table.orderId)
      .where(sql`status= 'success'`),
    check("payments_attempt_number_positive_chk", sql`attempt_number > 0`),
    check("payments_attempt_status_chk", sql`status IN ('pending','success','failed','cancelled')`),
    check(
      "payments_attempt_success_state_chk",
      sql`
    (status = 'pending')
    OR
    (status IN ('success','failed','cancelled'))
  `,
    ),
  ],
);
