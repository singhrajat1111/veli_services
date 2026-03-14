import { index, timestamp, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { coupons } from "./coupons";
import { users } from "./users";

export const couponUsers = appSchema.table(
  "coupon_users",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("coupon_users_coupon_id_user_id_idx").on(table.couponId, table.userId),
    index("coupon_users_user_id_idx").on(table.userId),
  ],
);
