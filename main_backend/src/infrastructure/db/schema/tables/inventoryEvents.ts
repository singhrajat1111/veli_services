import { check, index, integer, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { productVariants } from "./productVariants";

export const inventoryEvents = appSchema.table(
  "inventory_events",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id),
    eventType: text("event_type").notNull(),
    quantity: integer("quantity").notNull(),
    referenceType: text("reference_type").notNull(),
    referenceId: uuid("reference_id").notNull(),
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_inventory_events_variant_reference_unique").on(
      table.variantId,
      table.referenceType,
      table.referenceId,
    ),
    index("idx_inventory_events_variant_created_at").on(table.variantId, table.createdAt),
    index("idx_inventory_events_reference").on(table.referenceType, table.referenceId),
    check("inventory_quantity_nonzero_chk", sql`quantity <> 0`),
    check("inventory_quantity_reasonable_chk", sql`abs(quantity) <= 100000`),
    uniqueIndex("inventory_events_variant_sequence_unique").on(table.variantId, table.sequence),
    check(
      "inventory_event_type_chk",
      sql`event_type IN ('reserve','release','deduct','restock','adjustment')`,
    ),
  ],
);
