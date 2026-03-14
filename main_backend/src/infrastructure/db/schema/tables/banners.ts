import { boolean, check, index, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { admins } from "./admins";

export const banners = appSchema.table(
  "banners",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description").notNull(),
    buttonText: text("button_text").notNull(),
    buttonLink: text("button_link").notNull(),
    position: text("position").notNull(),
    isActive: boolean("is_active").default(true),
    bgColor: text("bg_color").notNull(),
    textColor: text("text_color").notNull(),
    btnColor: text("btn_color").notNull(),
    alignment: text("alignment").notNull(),
    bannerLocationPage: text("banner_location_page").notNull(),
    imageUrl: text("image_url").notNull(),
    placeholderImage: text("placeholder_image").notNull(),
    startDate: timestamp("start_date", { withTimezone: true, mode: "string" }),
    endDate: timestamp("end_date", { withTimezone: true, mode: "string" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    createdBy: uuid("created_by").references(() => admins.id, {
      onDelete: "set null",
    }),
    updatedBy: uuid("updated_by").references(() => admins.id, {
      onDelete: "set null",
    }),
    deletedBy: uuid("deleted_by").references(() => admins.id, {
      onDelete: "set null",
    }),
    clickCount: integer("click_count").default(0),
    impressionCount: integer("impression_count").default(0),
    utmSource: text("utm_source"),
    utmCampaign: text("utm_campaign"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_start_date")
      .on(table.startDate, table.endDate)
      .where(sql`is_active = true AND deleted_at IS NULL`),
    index("idx_created_by").on(table.createdBy),
    index("idx_created_at").on(table.createdAt),
    index("idx_banners_title").on(table.title),
    index("idx_banners_position")
      .on(table.position)
      .where(sql`is_active = true AND deleted_at IS NULL`),
    check("title_lowercase_check", sql`title = lower(title)`),
    check(
      "end_date_after_start_date_check",
      sql` start_date IS NULL OR end_date IS NULL OR end_date > start_date`,
    ),
    check("button_text_not_empty_check", sql`char_length(trim(button_text)) > 0`),
    check(
      "background_active_deleted_check",
      sql`(is_active = true AND deleted_at IS NULL) OR (is_active = false AND deleted_at IS NOT NULL)`,
    ),
    check("position_not_empty_check", sql`(char_length(trim(position)) > 0)`),
    check("banner_click_nonneg", sql`click_count >= 0`),
    check("banner_impression_nonneg", sql`impression_count >= 0`),
  ],
);
