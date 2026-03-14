import { check, index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { persons } from "./persons";
import { allergies } from "./allergies";

export const personAllergies = appSchema.table(
  "person_allergies",
  {
    id: uuid("id").defaultRandom().primaryKey().defaultRandom(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    allergyId: uuid("allergy_id")
      .notNull()
      .references(() => allergies.id, { onDelete: "cascade" }),
    severity: text("severity"),
    notedAt: timestamp("noted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
    // TODO: Add is_active and is_deleted fields when necessary
  },
  (table) => [
    uniqueIndex("person_allergy_unique_idx").on(table.personId, table.allergyId),
    index("person_allergies_person_idx").on(table.personId),
    index("person_allergies_allergy_idx").on(table.allergyId),
    check("person_allergy_severity_chk", sql`severity IN ('mild','moderate','severe','critical')`),
  ],
);
