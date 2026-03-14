import { InferSelectModel } from "drizzle-orm";

import { cuisinePreferences } from "@/infrastructure/db/schema/tables/cuisinePreferences";

export type CuisinePreferenceRow = InferSelectModel<typeof cuisinePreferences>;

export type CuisinePreferencesColumnsInput = Partial<Record<keyof CuisinePreferenceRow, true>>;

export type CuisinePreferencesRowByColumn<TColumns extends CuisinePreferencesColumnsInput> = Pick<
  CuisinePreferenceRow,
  Extract<keyof TColumns, keyof CuisinePreferenceRow>
>;
