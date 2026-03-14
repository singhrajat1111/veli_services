import { check, index, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";

export const reviewTargets = appSchema.table(
  "review_targets",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
  },
  (table) => [
    uniqueIndex("uq_review_targets_target_id").on(table.targetId, table.targetType),
    index("review_targets_type_idx").on(table.targetType),
    check(
      "review_targets_type_chk",
      sql`target_type IN ('product','variant','vendor','partner','order')`,
    ),
  ],
);
