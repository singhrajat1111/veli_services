import {
  boolean,
  check,
  date,
  index,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { users } from "./users";

export const relatives = appSchema.table(
  "relatives",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    profilePic: text("profile_pic"),
    email: text("email").notNull(),
    dob: date("dob", { mode: "date" }).notNull(),
    ageGroup: text("age_group").notNull(),
    gender: text("gender"),
    isActive: boolean("is_active").default(true),
    isDeleted: boolean("is_deleted").default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("relatives_unique_email").on(table.userId, table.email),
    index("relatives_active_user_id")
      .on(table.userId)
      .where(sql`is_active = true AND is_deleted = false`),
    check(
      "relatives_lifecycle_chk",
      sql`
    (is_active = true AND is_deleted = false AND deleted_at IS NULL)
    OR
    (is_active = false AND is_deleted = true AND deleted_at IS NOT NULL)
  `,
    ),
    check("relatives_email_lowercase_chk", sql`email = lower(email)`),

    check("relatives_email_format_chk", sql`email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$'`),
    check("relatives_dob_past_chk", sql`dob IS NULL OR dob < now()`),
    check("relatives_first_name_chk", sql`char_length(trim(first_name)) > 0`),
    check("relatives_last_name_chk", sql`char_length(trim(last_name)) > 0`),
  ],
);
