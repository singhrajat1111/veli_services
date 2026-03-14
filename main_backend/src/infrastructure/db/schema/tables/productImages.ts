import { boolean, index, integer, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { productVariants } from "./productVariants";

export const productImages = appSchema.table(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    isPrimary: boolean("is_primary").default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_product_images_product_id").on(table.productId),
    index("idx_product_images_product_sort").on(table.productId, table.sortOrder),
    uniqueIndex("unique_product_primary_image")
      .on(table.productId)
      .where(sql`is_primary = true`),
    uniqueIndex("uq_product_images_product_url").on(table.productId, table.url),
  ],
);
