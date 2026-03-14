import { index, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { coupons } from "./coupons";
import { categories } from "./categories";

export const couponCategories = appSchema.table(
  "coupon_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("coupon_category_unique_idx").on(table.couponId, table.categoryId),
    index("coupon_categories_category_idx").on(table.categoryId),
  ],
);
