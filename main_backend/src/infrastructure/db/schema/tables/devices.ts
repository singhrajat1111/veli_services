import {
  boolean,
  check,
  index,
  interval,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { users } from "./users";

export const devices = appSchema.table(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceType: text("device_type").notNull(),
    deviceName: text("device_name").notNull(),
    deviceBrand: text("device_brand").notNull(),
    deviceModel: text("device_model").notNull(),
    os: text("os").notNull(),
    osVersion: text("os_version").notNull(),
    appVersionInstalled: text("app_version_installed").notNull(),
    deviceIdentifier: text("device_identifier").notNull(),
    pushNotificationToken: text("push_notification_token"),
    ipAddress: text("ip_address").notNull(),
    networkType: text("network_type").notNull(),
    isTrustedDevice: boolean("is_trusted_device").default(false),
    isActive: boolean("is_active").default(true),
    lastActive: timestamp("last_active", { withTimezone: true, mode: "string" }),
    lastLogin: timestamp("last_login", { withTimezone: true, mode: "string" }),
    logoutAt: timestamp("logout_at", { withTimezone: true, mode: "string" }),
    sessionDuration: interval("session_duration"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("devices_user_id_index").on(table.userId),
    index("devices_push_token_idx")
      .on(table.pushNotificationToken)
      .where(sql`push_notification_token IS NOT NULL`),
    index("devices_user_active_idx")
      .on(table.userId)
      .where(sql`is_active = true`),
    index("devices_user_trusted_idx")
      .on(table.userId)
      .where(sql`is_trusted_device = true`),
    index("devices_last_active_idx").on(table.lastActive),
    check(
      "device_session_state_chk",
      sql`(is_active = true AND logout_at IS NULL) OR (is_active = false AND logout_at IS NOT NULL)`,
    ),
    uniqueIndex("devices_user_identifier_unique").on(table.userId, table.deviceIdentifier),
  ],
);
