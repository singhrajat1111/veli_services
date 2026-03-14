import { uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";

export const recommendations = appSchema.table("recommendations", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
});
