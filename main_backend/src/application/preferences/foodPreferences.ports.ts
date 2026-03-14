import { DbClient } from "@/infrastructure/db";
import {
  FoodPreferenceColumnsInput,
  FoodPreferenceRow,
} from "@/infrastructure/db/schema/types/foodPreferences.types";

export interface FoodPreferencesRepository {
  getAllFoodPreferences<TColumns extends FoodPreferenceColumnsInput>(
    columns: TColumns,
    tx: DbClient,
  ): Promise<Array<Pick<FoodPreferenceRow, Extract<keyof TColumns, keyof FoodPreferenceRow>>>>;
  verifyAndGetFoodPreferencesByIds<TColumns extends FoodPreferenceColumnsInput>(
    foodPreferenceIds: string[],
    columns: TColumns,
    tx: DbClient,
  ): Promise<Array<Pick<FoodPreferenceRow, Extract<keyof TColumns, keyof FoodPreferenceRow>>>>;
}
