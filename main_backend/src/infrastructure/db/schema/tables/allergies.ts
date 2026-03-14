import { boolean, check, index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";

export const allergies = appSchema.table(
  "allergies",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("allergies_unique_name_idx").on(table.name),
    index("allergies_active_name_idx")
      .on(table.name)
      .where(sql`is_active = true`),
    check("allergies_name_length_chk", sql`char_length(trim(name)) > 0`),
    check("allergies_name_lowercase_chk", sql`name = lower(name)`),
  ],
);
