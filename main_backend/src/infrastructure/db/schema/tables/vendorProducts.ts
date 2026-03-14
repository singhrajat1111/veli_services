import { integer, numeric, timestamp, uuid } from "drizzle-orm/pg-core";

import { appSchema } from "./../schema";
// TODO: Skip for now as we are not using vendor products in MVP
export const vendorProducts = appSchema.table("vendor_products", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  vendorId: uuid("vendor_id").notNull(),
  variantId: uuid("variant_id").notNull(),
  vendorSellingPrice: numeric("vendor_selling_price").notNull(),
  vendorStock: integer("vendor_stock").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
