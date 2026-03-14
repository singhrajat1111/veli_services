import { InferSelectModel } from "drizzle-orm";

import { foodPreferences } from "@/infrastructure/db/schema/tables/foodPreferences";

export type FoodPreferenceRow = InferSelectModel<typeof foodPreferences>;

export type FoodPreferenceColumnsInput = Partial<Record<keyof FoodPreferenceRow, true>>;

export type FoodPreferencesRowsByColumns<TColumns extends FoodPreferenceColumnsInput> = Pick<
  FoodPreferenceRow,
  Extract<keyof TColumns, keyof FoodPreferenceRow>
>;
