import { boolean, check, index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { orders } from "./orders";
import { users } from "./users";
import { admins } from "./admins";

export const returns = appSchema.table(
  "returns",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull(),
    reason: text("reason").notNull(),
    proofImage: text("proof_image"),
    isApproved: boolean("is_approved").default(false),
    approvedBy: uuid("approved_by").references(() => admins.id),
    destinationAddressId: uuid("destination_address_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("returns_unique_order_idx").on(table.orderId),
    index("returns_user_idx").on(table.userId),
    index("returns_status_idx").on(table.status),
    index("returns_user_status_idx").on(table.userId, table.status),
    index("returns_approved_by_idx").on(table.approvedBy),
    index("returns_pending_idx")
      .on(table.createdAt)
      .where(sql`is_approved = false`),
    check(
      "returns_approval_state_chk",
      sql`
    (is_approved = false AND approved_by IS NULL)
    OR
    (is_approved = true AND approved_by IS NOT NULL)
  `,
    ),
    check(
      "returns_status_chk",
      sql`status IN ('pending','approved','rejected','in_transit','received','refunded')`,
    ),
  ],
);
