import {
  boolean,
  check,
  index,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { payments } from "./payments";
import { orders } from "./orders";
import { users } from "./users";
import { admins } from "./admins";

export const refunds = appSchema.table(
  "refunds",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    amount: numeric("amount", { mode: "number", precision: 14, scale: 2 }).notNull(),
    status: text("status").notNull(),
    refundType: text("refund_type").notNull(),
    reason: text("reason").notNull(),
    gatewayRefundId: text("gateway_refund_id").notNull(),
    proofImage: text("proof_image"),
    isApproved: boolean("is_approved").default(false),
    approvedBy: uuid("approved_by").references(() => admins.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("refunds_gateway_refund_id_unique").on(table.gatewayRefundId),
    index("refunds_order_id_idx").on(table.orderId),
    index("refunds_payment_id_idx").on(table.paymentId),
    index("refunds_user_created_idx").on(table.userId, table.createdAt),
    index("refunds_pending_approval_idx")
      .on(table.createdAt)
      .where(sql`is_approved = false`),
    check("refund_amount_positive_chk", sql`amount > 0`),
    check(
      "refund_approval_state_chk",
      sql`
    (is_approved = false AND approved_by IS NULL)
    OR
    (is_approved = true AND approved_by IS NOT NULL)
  `,
    ),
    check(
      "refund_status_chk",
      sql`status IN ('pending','approved','processing','completed','rejected','failed')`,
    ),
  ],
);
