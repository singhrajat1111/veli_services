import { index, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { vendors } from "./vendors";
import { coupons } from "./coupons";

export const couponVendors = appSchema.table(
  "coupon_vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("coupon_vendors_vendor_id_coupon_id_unique_idx").on(table.vendorId, table.couponId),
    index("coupon_vendors_coupon_id_idx").on(table.couponId),
  ],
);
