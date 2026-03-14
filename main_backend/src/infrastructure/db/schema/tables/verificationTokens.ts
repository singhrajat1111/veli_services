import { index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "@/infrastructure/db/schema/schema";

export const verificationTokens = appSchema.table(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // TODO: Consider adding a foreign key constraint to the users table if it is needed for your application logic. For now, we will keep it as a simple uuid field to avoid tight coupling between the token and user tables.
    contactNumber: text("contact_number").notNull(),
    tokenHash: text("token_hash").notNull(),
    //   SMS_OTP, INVITE, etc.
    type: text("type").notNull(),
    //   EMAIL, SMS
    medium: text("medium").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("verification_token_unique").on(table.tokenHash),
    index("verification_token_single_active_per_contact_type_idx")
      .on(table.contactNumber, table.type)
      .where(sql`used_at IS NULL`),
    index("verification_token_active_idx")
      .on(table.tokenHash)
      .where(sql`used_at IS NULL`),
    index("verification_token_expires_idx").on(table.expiresAt),
  ],
);
