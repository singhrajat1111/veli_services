import { check, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";

export const persons = appSchema.table(
  "persons",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    personType: text("person_type").notNull(),
    referenceId: uuid("reference_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_persons_reference_id_person_type").on(table.referenceId, table.personType),
    check("person_type_chk", sql`person_type IN ('user','relative')`),
  ],
);
