import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
import { admins } from "./admins";

export const vendors = appSchema.table(
  "vendors",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    companyName: text("company_name").notNull(),
    tradingName: text("trading_name").notNull(),
    businessRegistrationNumber: text("business_registration_number").notNull(),
    companyType: text("company_type").notNull(),
    dateEstablished: date("date_established", { mode: "string" }),
    companyAddress: text("company_address").notNull(),
    websiteLink: text("website_link").notNull(),
    primaryContactFullName: text("primary_contact_full_name").notNull(),
    primaryContactPosition: text("primary_contact_position").notNull(),
    primaryContactPhoneNumber: text("primary_contact_phone_number").notNull(),
    primaryContactEmail: text("primary_contact_email").notNull(),
    productServicesOffered: text("product_services_offered").notNull().array(),
    productCategories: text("product_categories").notNull().array(),
    otherCategoriesIfSelected: text("other_categories_if_selected").notNull(),
    areProductsCertified: boolean("are_products_certified").notNull(),
    isDeclarationAccepted: boolean("is_declaration_accepted").notNull(),
    fullNameOfAcceptor: text("full_name_of_acceptor").notNull(),
    dateOfAcceptance: timestamp("date_of_acceptance", {
      mode: "string",
      withTimezone: true,
    }).defaultNow(),
    averageReviewRating: numeric("average_review_rating", { mode: "number" }).default(0),
    totalReviews: integer("total_reviews").default(0),
    reviewSummary: text("review_summary"),
    signature: text("signature").notNull(),
    isVerified: boolean("is_verified").default(false),
    verifiedBy: uuid("verified_by").references(() => admins.id),
    isDeleted: boolean("is_deleted").default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("vendors_business_registration_number_unique")
      .on(table.businessRegistrationNumber)
      .where(sql`is_deleted = false`),

    uniqueIndex("vendors_contact_email_unique")
      .on(table.primaryContactEmail)
      .where(sql`is_deleted = false`),

    index("vendors_unverified_idx")
      .on(table.createdAt)
      .where(sql`is_verified = false`),
    index("vendors_verified_idx").on(table.isVerified),
    check(
      "vendors_delete_state_chk",
      sql`
    (is_deleted = false AND deleted_at IS NULL)
    OR
    (is_deleted = true AND deleted_at IS NOT NULL)
  `,
    ),
    check("vendors_email_lowercase_chk", sql`primary_contact_email = lower(primary_contact_email)`),
    check("vendors_established_past_chk", sql`date_established <= current_date`),
  ],
);
