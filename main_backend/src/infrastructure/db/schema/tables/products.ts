import {
  boolean,
  check,
  index,
  integer,
  interval,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { categories } from "./categories";
import { admins } from "./admins";

export const products = appSchema.table(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    // vendorId: uuid("vendor_id"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    productSlug: text("product_slug").notNull(),
    description: text("description").notNull(),
    newArrival: boolean("new_arrival").default(false),
    isBestSeller: boolean("is_best_seller").default(false),
    careInstruction: text("care_instruction").notNull(),
    unitsSold: integer("units_sold").default(0),
    features: text("features").array(),
    // nutritionValue: uuid("nutrition_value"),
    minOrderQuantity: integer("min_order_quantity").notNull().default(1),
    maxOrderQuantity: integer("max_order_quantity").notNull().default(100),
    thumbnailImage: text("thumbnail_image").notNull(),
    averageReviewRating: numeric("average_review_rating", { precision: 3, scale: 2 }),
    totalReviews: integer("total_reviews").default(0),
    reviewSummary: text("review_summary"),
    weighingUnit: text("weighing_unit").notNull(),
    productWeight: numeric("product_weight").notNull(),
    dimensions: text("dimensions").notNull(),
    isReturnable: boolean("is_returnable").default(false),
    returnWindow: interval("return_window").notNull(),
    userVisibility: text("user_visibility").notNull().default("public"),
    reviewTargetId: uuid("review_target_id"),
    averageRating: numeric("average_rating", { precision: 3, scale: 2 }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => admins.id),
    color: text("color").notNull(),
    isTaxable: boolean("is_taxable").default(true),
    taxMethod: text("tax_method").notNull(),
    taxAmount: numeric("tax_amount").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_unique_product_slug").on(table.productSlug),
    index("products_category_created_idx").on(table.categoryId, table.createdAt),
    index("products_public_idx")
      .on(table.createdAt)
      .where(sql`user_visibility = 'public'`),
    index("products_best_seller_idx")
      .on(table.unitsSold)
      .where(sql`is_best_seller = true`),
    index("products_rating_idx").on(table.averageRating),
    index("products_new_arrival_idx")
      .on(table.createdAt)
      .where(sql`new_arrival = true`),
    check("product_order_qty_range_chk", sql`min_order_quantity <= max_order_quantity`),
    check("products_units_sold_nonneg", sql`units_sold >= 0`),
    check(
      "product_rating_range_chk",
      sql`(average_review_rating IS NULL OR average_review_rating BETWEEN 0 AND 5) AND (average_rating IS NULL OR average_rating BETWEEN 0 AND 5)`,
    ),
    check("product_visibility_chk", sql`user_visibility IN ('public','private','draft')`),
    check(
      "product_tax_consistency_chk",
      sql`(is_taxable = false AND tax_amount = 0) OR (is_taxable = true AND tax_amount >= 0)`,
    ),
    check("product_return_window_positive", sql`return_window >= interval '0'`),
    check("products_total_reviews_nonneg", sql`total_reviews >= 0`),
  ],
);
