import { check, index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { users } from "./users";
import { devices } from "./devices";

export const sessions = appSchema.table(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id),
    accessTokenJti: text("access_token_jti").notNull(),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    userAgent: text("user_agent"),
    loginMethod: text("login_method").notNull(),
    sessionStatus: text("session_status").default("active"),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true, mode: "string" }),
    logoutAt: timestamp("logout_at", { withTimezone: true, mode: "string" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("sessions_unique_user_device_active")
      .on(table.userId, table.deviceId)
      .where(sql`session_status = 'active'`),
    uniqueIndex("sessions_unique_refresh_hash").on(table.refreshTokenHash),

    uniqueIndex("sessions_unique_access_token_jti").on(table.accessTokenJti),
    index("sessions_jti_active_idx")
      .on(table.accessTokenJti)
      .where(sql`session_status = 'active'`),

    index("sessions_user_id_created_at").on(table.userId, table.createdAt),
    index("sessions_active_idx")
      .on(table.expiresAt)
      .where(sql`session_status = 'active'`),

    index("sessions_device_idx").on(table.deviceId),
    check("sessions_status_chk", sql`session_status IN ('active','revoked','expired')`),
    check(
      "sessions_lifecycle_chk",
      sql`
    (session_status = 'active' AND logout_at IS NULL)
    OR
    (session_status IN ('revoked','expired') AND logout_at IS NOT NULL)
  `,
    ),
  ],
);
