import {
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
import { productVariants } from "./productVariants";

export const orderItems = appSchema.table(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPriceSnapshot: numeric("unit_price_snapshot", { mode: "number" }).notNull(),
    totalCost: numeric("total_cost", { mode: "number" })
      .notNull()
      .generatedAlwaysAs(sql`quantity * unit_price_snapshot`),
    stockKeepingUnitSnapshot: text("stock_keeping_unit_snapshot").notNull(),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("order_items_order_id_variant_id_idx").on(table.orderId, table.variantId),
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_variant_id_idx").on(table.variantId),
    check("order_item_quantity_chk", sql`quantity > 0`),
    check("order_item_unit_price_chk", sql`unit_price_snapshot >= 0`),
    check("order_item_total_cost_chk", sql`total_cost >= 0`),
    check("order_item_sku_not_empty_chk", sql`char_length(trim(stock_keeping_unit_snapshot)) > 0`),
    check("order_item_name_not_empty_chk", sql`char_length(trim(product_name_snapshot)) > 0`),
  ],
);
