import { index, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { coupons } from "./coupons";
import { productVariants } from "./productVariants";

export const couponProducts = appSchema.table(
  "coupon_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("coupon_products_coupon_id_product_id_unique").on(table.couponId, table.productId),
    index("coupon_products_product_id_idx").on(table.productId),
  ],
);
