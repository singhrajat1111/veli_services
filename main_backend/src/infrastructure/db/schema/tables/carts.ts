import { check, index, integer, numeric, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { users } from "./users";

export const carts = appSchema.table(
  "carts",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    // Possible statuses: 'active', 'ordered', 'abandoned', 'expired'
    status: text("status").notNull(),
    totalItems: integer("total_items").default(0).notNull(),
    totalPrice: numeric("total_price", { precision: 14, scale: 2 }).default("0").notNull(),
    totalDiscountApplied: numeric("total_discount_applied", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    totalSellingPrice: numeric("total_selling_price", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("carts_user_id_status_idx").on(table.userId, table.status),
    index("carts_user_id_created_at_idx").on(table.userId, table.createdAt),
    check("carts_total_items_non_negative", sql`total_items >= 0`),
    check("carts_total_price_non_negative", sql`total_price >= 0`),
    check("carts_total_discount_applied_non_negative", sql`total_discount_applied >= 0`),
    check("carts_total_selling_price_non_negative", sql`total_selling_price >= 0`),
    check("cart_status_check", sql`status IN ('active','ordered','abandoned','expired')`),
  ],
);
