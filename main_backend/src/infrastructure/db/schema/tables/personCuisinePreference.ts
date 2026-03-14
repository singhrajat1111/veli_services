import { index, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { persons } from "./persons";
import { cuisinePreferences } from "./cuisinePreferences";

export const personCuisinePreferences = appSchema.table(
  "person_cuisine_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    cuisinePreferenceId: uuid("cuisine_preference_id")
      .notNull()
      .references(() => cuisinePreferences.id, { onDelete: "cascade" }),
    notedAt: timestamp("noted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
    // TODO: Add is_active and is_deleted fields when necessary
  },
  (table) => [
    uniqueIndex("person_cuisine_preference_unique_idx").on(
      table.personId,
      table.cuisinePreferenceId,
    ),
    index("person_cuisine_preference_person_idx").on(table.personId),
    index("person_cuisine_preference_cuisine_idx").on(table.cuisinePreferenceId),
  ],
);
