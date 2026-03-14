import { FoodPreferencesRepository } from "@/application/preferences/foodPreferences.ports";
import { DbClient } from "@/infrastructure/db";
import {
  FoodPreferenceColumnsInput,
  FoodPreferenceRow,
  FoodPreferencesRowsByColumns,
} from "@/infrastructure/db/schema/types/foodPreferences.types";

export class FoodPreferenceRepositoryImpl implements FoodPreferencesRepository {
  async getAllFoodPreferences<TColumns extends FoodPreferenceColumnsInput>(
    columns: TColumns,
    tx: DbClient,
  ): Promise<Array<Pick<FoodPreferenceRow, Extract<keyof TColumns, keyof FoodPreferenceRow>>>> {
    const client = tx;
    if (!client) {
      throw new Error("Database client is not available");
    }

    const foodPreferences = await client.query.foodPreferences.findMany({
      columns,
      orderBy: (foodPreferences, { asc }) => [asc(foodPreferences.name)],
    });

    return foodPreferences as unknown as Array<FoodPreferencesRowsByColumns<TColumns>>;
  }

  async verifyAndGetFoodPreferencesByIds<TColumns extends FoodPreferenceColumnsInput>(
    foodPreferenceIds: string[],
    columns: TColumns,
    tx: DbClient,
  ): Promise<Array<Pick<FoodPreferenceRow, Extract<keyof TColumns, keyof FoodPreferenceRow>>>> {
    const client = tx;
    if (!client) {
      throw new Error("Database client is not available");
    }
    const foodPreferences = await client.query.foodPreferences.findMany({
      where: (foodPreferences, { inArray, eq, and }) => {
        return and(
          inArray(foodPreferences.id, foodPreferenceIds),
          eq(foodPreferences.isActive, true),
        );
      },
      columns,
    });

    if (foodPreferences.length !== foodPreferenceIds.length) {
      throw new Error(
        "One or more food preference IDs are invalid or refer to deleted food preferences",
      );
    }

    return foodPreferences as unknown as Array<FoodPreferencesRowsByColumns<TColumns>>;
  }
}
