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

export const admins = appSchema.table(
  "admins",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    role: text("role").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    profilePic: text("profile_pic"),
    gender: text("gender"),
    dob: date("dob"),
    isMailVerified: boolean("is_mail_verified").default(false),
    passwordLastChangedAt: timestamp("password_last_changed_at", {
      withTimezone: true,
      mode: "string",
    }),
    authProvider: text("auth_provider"),
    accountLockedUntil: timestamp("account_locked_until", { withTimezone: true, mode: "string" }),
    permissions: text("permissions").array().notNull().default([]),
    is2FaEnabled: boolean("is_2fa_enabled").default(false),
    notificationPreferences: text("notification_preferences"),
    preferredLanguage: text("preferred_language").default("en"),
    timezone: text("timezone"),
    // Indicates if the admin account is active or deactivated
    isActive: boolean("is_active").default(true),
    lastLogin: timestamp("last_login", { withTimezone: true, mode: "string" }),
    // Possible statuses: online/offline
    status: text("status").notNull().default("online"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_unique_email").on(table.email),
    index("admin_status_created_index").on(table.status, table.createdAt),
    index("admin_last_login_index")
      .on(table.lastLogin)
      .where(sql`is_active = true`),
    index("admin_active_idx")
      .on(table.createdAt)
      .where(sql`is_active = true`),
    check("email_format_check", sql`email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'`),
    check("dob_past_check", sql`dob < current_date`),
    check(
      "account_locked_check",
      sql`account_locked_until IS NULL OR account_locked_until > created_at`,
    ),
    check("permissions_not_empty_check", sql`array_length(permissions, 1) > 0`),
    check("email_lowercase_check", sql`email = lower(email)`),
    check("role_not_empty_check", sql`char_length(trim(role)) > 0`),
    check("name_not_empty_check", sql`char_length(trim(name)) > 0`),
    check("admin_presence_check", sql`status IN ('online','offline')`),
  ],
);
