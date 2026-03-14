import { boolean, check, index, numeric, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { appSchema } from "./../schema";

export const nutrients = appSchema.table(
  "nutrients",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    servingSize: text("serving_size"),
    measurementTypeUnit: text("measurement_type_unit"),
    calories: numeric("calories").notNull(),
    protein: numeric("protein", { mode: "number" }).default(0),
    totalFat: numeric("total_fat", { mode: "number" }).default(0),
    saturatedFat: numeric("saturated_fat", { mode: "number" }).default(0),
    transFat: numeric("trans_fat", { mode: "number" }).default(0),
    carbohydrates: numeric("carbohydrates", { mode: "number" }).default(0),
    sugar: numeric("sugar", { mode: "number" }).default(0),
    addedSugars: numeric("added_sugars", { mode: "number" }).default(0),
    dietaryFibre: numeric("dietary_fibre", { mode: "number" }).default(0),
    sodium: numeric("sodium", { mode: "number" }).default(0),
    cholesterol: numeric("cholesterol", { mode: "number" }).default(0),
    calcium: numeric("calcium", { mode: "number" }).default(0),
    iron: numeric("iron", { mode: "number" }).default(0),
    potassium: numeric("potassium", { mode: "number" }).default(0),
    vitaminA: numeric("vitamin_a", { mode: "number" }).default(0),
    vitaminB: numeric("vitamin_b", { mode: "number" }).default(0),
    vitaminC: numeric("vitamin_c", { mode: "number" }).default(0),
    allergens: text("allergens").array(),
    isVeg: boolean("is_veg").notNull(),
    isVegan: boolean("is_vegan").notNull(),
    isGlutenFree: boolean("is_gluten_free").notNull(),
    isActiveForProduct: boolean("is_active_for_product").default(true),
    artificialCondiments: text("artificial_condiments").array(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    index("nutrients_active_idx").on(table.isActiveForProduct),
    index("nutrients_veg_idx").on(table.isVeg),
    index("nutrients_gluten_free_idx").on(table.isGlutenFree),
    check(
      "nutrients_non_negative_chk",
      sql`calories >= 0
  AND protein >= 0
  AND total_fat >= 0
  AND saturated_fat >= 0
  AND trans_fat >= 0
  AND carbohydrates >= 0
  AND sugar >= 0
  AND added_sugars >= 0
  AND dietary_fibre >= 0
  AND sodium >= 0
  AND cholesterol >= 0
  AND calcium >= 0
  AND iron >= 0
  AND potassium >= 0
  AND vitamin_a >= 0
  AND vitamin_b >= 0
  AND vitamin_c >= 0
`,
    ),
    check("nutrients_vegan_implies_veg_chk", sql`is_vegan = false OR is_veg = true`),
  ],
);
