import { index, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { persons } from "./persons";
import { foodPreferences } from "./foodPreferences";

export const personFoodPreferences = appSchema.table(
  "person_food_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    foodPreferenceId: uuid("food_preference_id")
      .notNull()
      .references(() => foodPreferences.id, { onDelete: "cascade" }),
    notedAt: timestamp("noted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
    // TODO: Add is_active and is_deleted fields when necessary
  },
  (table) => [
    uniqueIndex("person_food_preference_unique_idx").on(table.personId, table.foodPreferenceId),
    index("person_food_preference_person_idx").on(table.personId),
    index("person_food_preference_food_preference_idx").on(table.foodPreferenceId),
  ],
);
