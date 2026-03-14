import { boolean, index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "@/infrastructure/db/schema/schema";
import { users } from "@/infrastructure/db/schema/tables/users";

export const authTokens = appSchema.table(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    isRevoked: boolean("is_revoked").default(false).notNull(),
  },
  (table) => [
    uniqueIndex("refresh_token_hash_unique").on(table.refreshTokenHash),
    index("user_id_index").on(table.userId),
  ],
);
