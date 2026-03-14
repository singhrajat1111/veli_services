import { check, integer, numeric, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { carts } from "./carts";
import { productVariants } from "./productVariants";

export const cartItems = appSchema.table(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    totalCost: numeric("total_cost", { precision: 14, scale: 2 })
      .notNull()
      .generatedAlwaysAs(sql`quantity*unit_price`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("cart_item_cart_id_variant_id_unique").on(table.cartId, table.variantId),
    check("cart_item_quantity_check", sql`quantity > 0`),
    check("cart_item_unit_price_check", sql`unit_price >= 0`),
    check("cart_item_total_cost_check", sql`total_cost >= 0`),
  ],
);
