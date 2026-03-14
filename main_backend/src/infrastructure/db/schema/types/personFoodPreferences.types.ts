import { InferSelectModel } from "drizzle-orm";

import { personFoodPreferences } from "@/infrastructure/db/schema/tables/personFoodPreferences";

export type FoodPreferenceRow = InferSelectModel<typeof personFoodPreferences>;

export type PersonFoodPreferencesInsert = Pick<FoodPreferenceRow, "personId" | "foodPreferenceId">;

export type PersonFoodPreferencesMultipleResult = Array<{
  personId: string;
  foodPreferenceId: string;
}>;
