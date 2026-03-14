import { boolean, check, index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";

export const cuisinePreferences = appSchema.table(
  "cuisine_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("cuisine_preferences_name_unique_idx").on(table.name),
    index("cuisine_preferences_active_name_idx")
      .on(table.name)
      .where(sql`is_active = true`),
    check("cuisine_pref_name_not_empty_chk", sql`char_length(trim(name)) > 0`),
    check("cuisine_pref_name_lowercase_chk", sql`name = lower(name)`),
  ],
);
