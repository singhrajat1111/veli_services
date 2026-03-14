import { index, integer, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { deliveries } from "./deliveries";

export const deliveryEvents = appSchema.table(
  "delivery_events",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => deliveries.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    message: text("message").notNull(),
    sequence: integer("sequence").notNull(),
    targetLocation: uuid("target_location"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("delivery_events_delivery_id_sequence_key").on(table.deliveryId, table.sequence),
    index("delivery_events_delivery_id_created_at_index").on(table.deliveryId, table.createdAt),
  ],
);
