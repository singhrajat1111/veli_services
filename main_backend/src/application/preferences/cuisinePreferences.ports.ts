import { DbClient } from "@/infrastructure/db";
import { CuisinePreferenceRow } from "@/infrastructure/db/schema/types/cuisinePreferences.types";
import { FoodPreferenceColumnsInput } from "@/infrastructure/db/schema/types/foodPreferences.types";

export interface CuisinePreferencesRepository {
  getAllCuisinePreferences<TColumns extends FoodPreferenceColumnsInput>(
    columns: TColumns,
    tx: DbClient,
  ): Promise<
    Array<Pick<CuisinePreferenceRow, Extract<keyof TColumns, keyof CuisinePreferenceRow>>>
  >;
  verifyAndGetCuisinePreferencesByIds<TColumns extends FoodPreferenceColumnsInput>(
    cuisinePreferenceIds: string[],
    columns: TColumns,
    tx: DbClient,
  ): Promise<
    Array<Pick<CuisinePreferenceRow, Extract<keyof TColumns, keyof CuisinePreferenceRow>>>
  >;
}
