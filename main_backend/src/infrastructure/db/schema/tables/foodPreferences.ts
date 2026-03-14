import { boolean, check, index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";

export const foodPreferences = appSchema.table(
  "food_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_food_preferences_name").on(table.name),
    index("idx_food_preferences_active_name")
      .on(table.name)
      .where(sql`is_active = true`),
    check("food_pref_name_not_empty_chk", sql`char_length(trim(name)) > 0`),
    check("food_pref_name_lowercase_chk", sql`name = lower(name)`),
  ],
);
