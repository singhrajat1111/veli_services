import { index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { persons } from "./persons";
import { dietaryNeeds } from "./dietaryNeeds";

export const personsDietaryNeeds = appSchema.table(
  "persons_dietary_needs",
  {
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    dietaryNeedsId: uuid("dietary_needs_id")
      .notNull()
      .references(() => dietaryNeeds.id, { onDelete: "cascade" }),
    notes: text("notes"),
    notedAt: timestamp("noted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
    // TODO: Add is_active and is_deleted fields when necessary
  },
  (table) => [
    uniqueIndex("persons_dietary_needs_person_id_dietary_needs_id_unique").on(
      table.personId,
      table.dietaryNeedsId,
    ),
    index("persons_dietary_needs_person_id_index").on(table.personId),
    index("persons_dietary_needs_dietary_needs_id_index").on(table.dietaryNeedsId),
  ],
);
