import { boolean, check, index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { users } from "./users";

export const addresses = appSchema.table(
  "addresses",
  {
    // TODO: Add the not null constraints again after ensuring that the application code is updated to provide values for these fields when inserting new address records.
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    address_type: text("address_type"),
    displayLabel: text("display_label"),
    primaryPhone: text("primary_phone"),
    secondaryPhone: text("secondary_phone"),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city"),
    state: text("state"),
    landmarks: text("landmarks").array().default([]),
    country: text("country"),
    postCode: text("post_code"),
    isDefault: boolean("is_default").default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
    isActive: boolean("is_active").default(true),
  },
  (table) => [
    index("addresses_user_id_idx").on(table.userId),

    index("addresses_user_default_active_idx")
      .on(table.userId, table.isDefault)
      .where(sql`is_active = true`),

    index("addresses_user_active_idx")
      .on(table.userId)
      .where(sql`is_active = true`),

    index("addresses_user_created_idx").on(table.userId, table.createdAt),

    index("addresses_city_state_idx").on(table.city, table.state),

    index("addresses_post_code_idx").on(table.postCode),

    uniqueIndex("addresses_user_single_default_idx")
      .on(table.userId)
      .where(sql`is_default = true AND is_active = true`),

    check("post_code_au_check", sql`post_code ~ '^[0-9]{4}$'`),
    check("primary_phone_au_e164_format", sql`primary_phone ~ '^\\+61[0-9]{9}$'`),

    check(
      "address_lifecycle_check",
      sql`(is_active = true AND deleted_at IS NULL)
  OR
  (is_active = false AND deleted_at IS NOT NULL)`,
    ),
    check("address_type_not_empty", sql`char_length(trim(address_type)) > 0`),
    check("default_requires_active", sql`is_default = false OR is_active = true`),
  ],
);
