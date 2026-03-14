import { check, index, jsonb, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";

export const idempotencyKeys = appSchema.table(
  "idempotency_keys",
  {
    key: text("key").primaryKey().notNull(),
    requestHash: text("request_hash").notNull(),
    response: jsonb("response").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
  },
  (table) => [
    index("idempotency_keys_created_at_idx").on(table.createdAt),
    uniqueIndex("idempotency_key_hash_unique").on(table.key, table.requestHash),
    check("idempotency_key_not_empty_chk", sql`char_length(trim(key)) > 0`),
    check("idempotency_hash_not_empty_chk", sql`char_length(trim(request_hash)) > 0`),
  ],
);
