import { index, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
import { users } from "./users";
import { products } from "./products";

export const wishlists = appSchema.table(
  "wishlists",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("wishlists_user_product_unique_idx").on(table.userId, table.productId),
    index("wishlists_user_id_idx").on(table.userId),
    index("wishlists_product_id_idx").on(table.productId),
    index("wishlists_user_created_idx").on(table.userId, table.createdAt),
  ],
);
