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

export const partners = appSchema.table(
  "partners",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    companyName: text("company_name").notNull(),
    tradingName: text("trading_name").notNull(),
    businessRegistrationNumber: text("business_registration_number").notNull(),
    companyType: text("company_type").notNull(),
    dateEstablished: date("date_established").notNull(),
    companyAddress: text("company_address").notNull(),
    websiteLink: text("website_link").notNull(),
    socialMediaLink: text("social_media_link").notNull(),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone").notNull(),
    primaryContactFullName: text("primary_contact_full_name").notNull(),
    primaryContactPosition: text("primary_contact_position").notNull(),
    primaryContactPhoneNumber: text("primary_contact_phone_number").notNull(),
    primaryContactEmail: text("primary_contact_email").notNull(),
    businessCategories: text("business_categories").notNull().array(),
    partnershipInterestReason: text("partnership_interest_reason").notNull(),
    otherBusinessIfSelected: text("other_business_if_selected").notNull(),
    valuesAddedToVelqip: text("values_added_to_velqip").notNull(),
    existingPartnerships: text("existing_partnerships").notNull(),
    briefServiceDescription: text("brief_service_description").notNull(),
    areasOfOperation: text("areas_of_operation").notNull().array(),
    yearsInOperation: integer("years_in_operation").notNull(),
    keyClientsOrPartners: text("key_clients_or_partners").notNull(),
    isGstRegistered: boolean("is_gst_registered").notNull(),
    isInsuranceCoverageApplicable: boolean("is_insurance_coverage_applicable").notNull(),
    isDeclarationAccepted: boolean("is_declaration_accepted").notNull(),
    fullNameOfAcceptor: text("full_name_of_acceptor").notNull(),
    dateOfAcceptance: date("date_of_acceptance").notNull(),
    averageReviewRating: numeric("average_review_rating", { precision: 3, scale: 2 }),
    totalReviews: integer("total_reviews").default(0),
    reviewSummary: text("review_summary"),
    signature: text("signature").notNull(),
    isVerified: boolean("is_verified").default(false),
    verifiedBy: uuid("verified_by").references(() => admins.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("partners_business_registration_number_unique").on(
      table.businessRegistrationNumber,
    ),
    uniqueIndex("partners_contact_email_unique").on(table.contactEmail),
    index("partners_unverified_idx")
      .on(table.createdAt)
      .where(sql`is_verified = false`),
    index("partners_verified_idx").on(table.isVerified),
    check(
      "partners_contact_email_format_chk",
      sql`contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$'`,
    ),

    check(
      "partners_primary_email_format_chk",
      sql`primary_contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$'`,
    ),
    check("partners_established_past_chk", sql`date_established <= current_date`),

    check("partners_acceptance_past_chk", sql`date_of_acceptance <= current_date`),
    check(
      "partners_verification_state_chk",
      sql`
    (is_verified = false AND verified_by IS NULL)
    OR
    (is_verified = true AND verified_by IS NOT NULL)
  `,
    ),
    check(
      "partners_rating_range_chk",
      sql`average_review_rating IS NULL OR (average_review_rating BETWEEN 0 AND 5)`,
    ),
  ],
);
