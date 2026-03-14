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
import { users } from "./users";

export const payments = appSchema.table(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    paymentStatus: text("payment_status").notNull(),
    taxValueType: text("tax_value_type").notNull(),
    taxAmount: numeric("tax_amount", { mode: "number" }).default(0),
    amountPaid: numeric("amount_paid", { mode: "number" }).notNull(),
    paymentGatewayUsed: text("payment_gateway_used").notNull(),
    paymentGatewayFee: numeric("payment_gateway_fee", { mode: "number" }).notNull(),
    paymentMethodType: text("payment_method_type").notNull(),
    paymentMethodId: uuid("payment_method_id").notNull(),
    paymentReferenceId: uuid("payment_reference_id").notNull(),
    transactionId: uuid("transaction_id").notNull(),
    isFailed: boolean("is_failed").default(false),
    failureReason: text("failure_reason"),
    initiatedAt: timestamp("initiated_at", { withTimezone: true, mode: "string" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    currency: text("currency").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_payments_transaction_id").on(table.transactionId),
    // TODO: REVIEW: Enable this index after ensuring gateway offered paymentReferenceId is unique
    // uniqueIndex("ux_payments_payment_reference_id").on(table.paymentReferenceId),
    index("payments_user_created_idx").on(table.userId, table.createdAt),
    index("payments_status_created_idx").on(table.paymentStatus, table.createdAt),
    index("payments_failed_idx")
      .on(table.createdAt)
      .where(sql`is_failed = true`),
    index("payments_completed_at_idx").on(table.completedAt),

    check("payments_tax_nonneg_chk", sql`tax_amount >= 0`),
    check("payments_amount_nonneg_chk", sql`amount_paid >= 0`),
    check("payments_gateway_fee_nonneg_chk", sql`payment_gateway_fee >= 0`),
    check(
      "payments_status_chk",
      sql`payment_status IN ('pending','authorized','captured','failed','refunded')`,
    ),
    check(
      "payments_failure_state_chk",
      sql`
    (is_failed = false AND failure_reason IS NULL)
    OR
    (is_failed = true AND failure_reason IS NOT NULL)
  `,
    ),
    check(
      "payments_completion_chk",
      sql`
    (payment_status IN ('pending','authorized') AND completed_at IS NULL)
    OR
    (payment_status IN ('captured','refunded','failed') AND completed_at IS NOT NULL)
  `,
    ),
  ],
);
