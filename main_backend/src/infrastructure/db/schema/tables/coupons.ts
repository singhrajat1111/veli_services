import {
  boolean,
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
import { admins } from "./admins";

export const coupons = appSchema.table(
  "coupons",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    code: text("code").notNull(),
    type: text("type").notNull(),
    value: numeric("value", { mode: "number", precision: 12, scale: 2 }).notNull(),
    minOrderValue: numeric("min_order_value", {
      mode: "number",
      precision: 14,
      scale: 2,
    }).notNull(),
    maxDiscount: numeric("max_discount", { mode: "number", precision: 14, scale: 2 }).notNull(),
    userCount: integer("user_count").default(0),
    isActive: boolean("is_active").default(true),
    title: text("title").notNull(),
    description: text("description").notNull(),
    startDate: timestamp("start_date", { withTimezone: true, mode: "string" }),
    expiringDate: timestamp("expiring_date", { withTimezone: true, mode: "string" }),
    usageLimit: integer("usage_limit").notNull(),
    perUserUsageLimit: integer("per_user_usage_limit").notNull(),
    applicableUserType: text("applicable_user_type").notNull(),
    applicableTarget: text("applicable_target").notNull(),
    appliedCount: integer("applied_count").default(0),
    totalDiscountGiven: numeric("total_discount_given", {
      mode: "number",
      precision: 14,
      scale: 2,
    }).default(0),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => admins.id),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => admins.id),
    deletedBy: uuid("deleted_by").references(() => admins.id),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("coupons_code_unique").on(table.code),
    index("coupons_created_by_index").on(table.createdBy),
    index("coupons_created_at_index")
      .on(table.createdAt)
      .where(sql`deleted_at IS NULL`),
    index("coupons_expired_date_index")
      .on(table.expiringDate)
      .where(sql`deleted_at IS NULL`),
    index("coupons_active_code")
      .on(table.code)
      .where(sql`is_active = true AND deleted_at IS NULL`),
    check(
      "coupon_lifecycle_check",
      sql` (is_active = true AND deleted_at IS NULL) OR (is_active = false AND deleted_at IS NOT NULL)`,
    ),
    check("coupon_type_check", sql`type IN ('percentage','flat')`),
    check("coupon_usage_limit_check", sql`usage_limit >= 0`),
    check("coupon_per_user_limit_check", sql`per_user_usage_limit >= 0`),
    check("coupon_applied_count_check", sql`applied_count >= 0`),
    check("coupon_user_count_check", sql`user_count >= 0`),
    check("coupon_usage_consistency_check", sql`applied_count <= usage_limit OR usage_limit = 0`),
  ],
);
