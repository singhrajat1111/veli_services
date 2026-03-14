import { index, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { partners } from "./partners";
import { coupons } from "./coupons";

export const couponPartners = appSchema.table(
  "coupon_partners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "cascade" }),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("coupon_partners_unique_idx").on(table.partnerId, table.couponId),
    index("coupon_partners_coupon_id_idx").on(table.couponId),
  ],
);
