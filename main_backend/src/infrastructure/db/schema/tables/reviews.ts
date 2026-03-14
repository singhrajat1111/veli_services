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
import { users } from "./users";
import { reviewTargets } from "./reviewTargets";
import { admins } from "./admins";

export const reviews = appSchema.table(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    reviewTargetId: uuid("review_target_id")
      .notNull()
      .references(() => reviewTargets.id),
    targetId: uuid("target_id").notNull(),
    rating: numeric("rating", { precision: 2 }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    images: text("images").array(),
    status: text("status").default("pending"),
    isVerifiedOrder: boolean("is_verified_order").default(false),
    isApproved: boolean("is_approved").default(false),
    approvedBy: uuid("approved_by").references(() => admins.id),
    isReported: boolean("is_reported").default(false),
    adminRemarks: text("admin_remarks"),
    helpfulCount: integer("helpful_count").default(0),
    unhelpfulCount: integer("unhelpful_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("reviews_user_target_unique").on(
      table.senderId,
      table.reviewTargetId,
      table.targetId,
    ),
    index("reviews_target_approved_idx")
      .on(table.reviewTargetId, table.targetId, table.createdAt)
      .where(sql`is_approved = true`),
    index("reviews_user_created_idx").on(table.senderId, table.createdAt),
    index("reviews_pending_idx")
      .on(table.createdAt)
      .where(sql`is_approved = false`),
    index("reviews_reported_idx")
      .on(table.createdAt)
      .where(sql`is_reported = true`),
    check("reviews_rating_range_chk", sql`rating BETWEEN 1 AND 5`),
    check(
      "reviews_approval_state_chk",
      sql`
    (is_approved = false AND approved_by IS NULL)
    OR
    (is_approved = true AND approved_by IS NOT NULL)
  `,
    ),
    check("reviews_status_chk", sql`status IN ('pending','approved','rejected','hidden')`),
    check("reviews_helpful_nonneg_chk", sql`helpful_count >= 0`),
    check("reviews_unhelpful_nonneg_chk", sql`unhelpful_count >= 0`),
    check(
      "reviews_status_approval_consistency_chk",
      sql`
    (status = 'approved' AND is_approved = true)
    OR
    (status <> 'approved' AND is_approved = false)
  `,
    ),
  ],
);
