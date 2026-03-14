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
import { products } from "./products";
import { nutrients } from "./nutrients";
import { reviewTargets } from "./reviewTargets";

export const productVariants = appSchema.table(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantName: text("variant_name").notNull(),
    variantDescription: text("variant_description").notNull(),
    stockKeepingUnit: text("stock_keeping_unit").notNull(),
    mrp: numeric("mrp").notNull(),
    sellingPrice: numeric("selling_price").notNull(),
    availableStock: integer("available_stock").default(0),
    weighingUnit: text("weighing_unit").notNull(),
    weight: numeric("weight").notNull(),
    barcode: text("barcode"),
    nutritionValue: uuid("nutrition_value")
      .notNull()
      .references(() => nutrients.id),
    reviewTargetId: uuid("review_target_id")
      .notNull()
      .references(() => reviewTargets.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("product_variants_product_id_idx").on(table.productId),
    uniqueIndex("product_variants_sku_unique").on(table.stockKeepingUnit),
    index("product_variants_product_price_idx").on(table.productId, table.sellingPrice),
    index("product_variants_in_stock_idx")
      .on(table.productId)
      .where(sql`available_stock > 0`),
    check("variant_price_logic_chk", sql`selling_price <= mrp`),
    check("variant_price_nonneg_chk", sql`mrp >= 0 AND selling_price >= 0`),
    check("variant_stock_nonneg_chk", sql`available_stock >= 0`),
    check("variant_weight_positive_chk", sql`weight > 0`),
  ],
);
