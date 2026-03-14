import { boolean, check, index, integer, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { users } from "./users";

export const notifications = appSchema.table(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isPublic: boolean("is_public").default(false),
    notificationType: text("notification_type").notNull(),
    priority: text("priority").notNull().default("normal"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    thumbnail: text("thumbnail").notNull(),
    notificationActionPerformed: text("notification_action_performed"),
    notificationChannel: text("notification_channel"),
    relatedEntityType: text("related_entity_type").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    pushProvider: text("push_provider").notNull(),
    pushTokenUpdatedAt: timestamp("push_token_updated_at", { withTimezone: true, mode: "string" }),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
    status: text("status").notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" }),
    failedAt: timestamp("failed_at", { withTimezone: true, mode: "string" }),
    failureReason: text("failure_reason"),
    metadata: jsonb("metadata"),
    createdByType: text("created_by_type").notNull(),
    createdBy: uuid("created_by").notNull(),
    quietHoursStart: timestamp("quiet_hours_start", { withTimezone: true, mode: "string" }),
    quietHoursEnd: timestamp("quiet_hours_end", { withTimezone: true, mode: "string" }),
    reminderFrequencyPerHour: integer("reminder_frequency_per_hour").notNull().default(1),
    deviceAppliedTo: uuid("device_applied_to").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    index("notifications_user_unread_idx")
      .on(table.userId)
      .where(sql`is_read = false`),
    index("notifications_pending_idx").on(table.status, table.createdAt),
    index("notifications_failed_idx")
      .on(table.failedAt)
      .where(sql`status = 'failed'`),
    check(
      "notification_read_state_chk",
      sql`(is_read = true AND read_at IS NOT NULL) OR (is_read = false AND read_at IS NULL)`,
    ),

    // pending → sent → delivered
    // pending → failed
    check(
      "notification_status_time_chk",
      sql`(status = 'pending' AND sent_at IS NULL AND failed_at IS NULL) OR (status = 'sent' AND sent_at IS NOT NULL AND failed_at IS NULL) OR (status = 'failed' AND failed_at IS NOT NULL)`,
    ),
    check("notification_reminder_freq_chk", sql`reminder_frequency_per_hour BETWEEN 1 AND 60`),
  ],
);
