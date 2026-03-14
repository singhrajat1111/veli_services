import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";
// TODO: Migrate as soon as supabase services are ready to be used, current migration: 0009.
export const users = appSchema.table(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    contactNumber: text("contact_number").notNull(),
    profilePic: text("profile_pic"),
    dob: date("dob", { mode: "date" }),
    ageGroup: text("age_group"),
    gender: text("gender"),
    isMailVerified: boolean("is_mail_verified").default(false),
    isContactNumberVerified: boolean("is_contact_number_verified").default(false),
    accountStatus: text("account_status").default("active"),
    passwordHash: text("password_hash"),
    lastPasswordChangedAt: timestamp("last_password_changed_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    relativesCount: integer("relatives_count").default(0),
    lastLogin: timestamp("last_login", { withTimezone: true, mode: "string" }),
    authProvider: text("auth_provider").default("local"),
    providerUserId: text("provider_user_id"),
    failedLoginAttempts: integer("failed_login_attempts").default(0),
    accountLockedUntil: timestamp("account_locked_until", { withTimezone: true, mode: "string" }),
    consentAcceptedAt: timestamp("consent_accepted_at", { withTimezone: true, mode: "string" }),
    termsConditionVersionAccepted: text("terms_condition_version_accepted").notNull(),
    is2FaEnabled: boolean("is_2fa_enabled").default(false),
    notificationPreferences: text("notification_preferences"),
    preferredLanguage: text("preferred_language"),
    timezone: text("timezone"),
    referredBy: uuid("referred_by"),
    referralCode: text("referral_code"),
    loyaltyPoints: integer("loyalty_points").default(0),
    subscriptionStatus: text("subscription_status").default("inactive"),
    onboardingStep: integer("onboarding_step").default(1),
    isDeleted: boolean("is_deleted").default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.referredBy],
      foreignColumns: [table.id],
    }),
    uniqueIndex("users_email_unique_idx")
      .on(table.email)
      .where(sql`is_deleted = false`),
    uniqueIndex("users_contact_number_unique_idx")
      .on(table.contactNumber)
      .where(sql`is_deleted = false`),
    uniqueIndex("users_referral_code_unique_idx")
      .on(table.referralCode)
      .where(sql`referral_code IS NOT NULL`),
    uniqueIndex("users_provider_user_id_unique_idx")
      .on(table.providerUserId)
      .where(sql`auth_provider != 'local' AND provider_user_id IS NOT NULL AND is_deleted = false`),
    index("users_referred_by_idx").on(table.referredBy),
    index("users_account_status_idx").on(table.accountStatus),
    index("users_last_login_idx").on(table.lastLogin),
    index("users_active_idx")
      .on(table.createdAt)
      .where(sql`is_deleted = false AND account_status = 'active'`),
    index("users_locked_idx")
      .on(table.accountLockedUntil)
      .where(sql`account_locked_until IS NOT NULL`),
    check("users_email_lowercase_chk", sql`email = lower(email)`),
    check(
      "users_delete_state_chk",
      sql`
    (is_deleted = false AND deleted_at IS NULL)
    OR
    (is_deleted = true AND deleted_at IS NOT NULL)
  `,
    ),
    check(
      "users_account_status_chk",
      sql`account_status IN ('active','suspended','blocked','pending_verification')`,
    ),
    check("users_onboarding_step_chk", sql`onboarding_step >= 1 AND onboarding_step <= 6`),
  ],
);
