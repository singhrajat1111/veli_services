import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";

export const categories = appSchema.table(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    categoryName: text("category_name").notNull(),
    categoryLevel: integer("category_level").notNull(),
    parentCategory: uuid("parent_category"),
    categorySlug: text("category_slug").notNull(),
    categoryDescription: text("category_description").notNull(),
    categoryThumbnail: text("category_thumbnail").notNull(),
    displaySequence: integer("display_sequence").notNull(),
    isDiscountApplied: boolean("is_discount_applied").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.parentCategory],
      foreignColumns: [table.id],
      name: "parent_category_fkey",
    }),
    uniqueIndex("_parent_category_category_name_unique_idx").on(
      table.parentCategory,
      table.categoryName,
    ),
    uniqueIndex("category_slug_unique_idx").on(table.categorySlug),
    uniqueIndex("root_category_name_unique_idx")
      .on(table.categoryName)
      .where(sql`parent_category IS NULL`),
    index("parent_display_sequence_idx")
      .on(table.parentCategory, table.displaySequence)
      .where(sql`is_active = true`),
    index("created_at_idx").on(table.createdAt),
    check("category_no_self_parent_check", sql`parent_category IS NULL OR parent_category <> id`),
    check(
      "category_level_consistency_check",
      sql`(parent_category IS NULL AND category_level = 1) OR (parent_category IS NOT NULL AND category_level > 1)`,
    ),
  ],
);
