import { index, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { orderItems } from "./orderItems";
import { returns } from "./returns";

export const returnItems = appSchema.table(
  "return_items",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    returnId: uuid("return_id")
      .notNull()
      .references(() => returns.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("return_items_order_item_id_return_id_unique").on(
      table.orderItemId,
      table.returnId,
    ),
    index("return_items_return_id_index").on(table.returnId),
    index("return_items_order_item_id_index").on(table.orderItemId),
    index("return_items_created_at_index").on(table.createdAt),
    index("return_items_return_created_idx").on(table.returnId, table.createdAt),
  ],
);
