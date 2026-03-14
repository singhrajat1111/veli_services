import { CuisinePreferencesRepository } from "@/application/preferences/cuisinePreferences.ports";
import { DbClient } from "@/infrastructure/db";
import {
  CuisinePreferenceRow,
  CuisinePreferencesColumnsInput,
  CuisinePreferencesRowByColumn,
} from "@/infrastructure/db/schema/types/cuisinePreferences.types";

export class CuisinePreferencesRepositoryImpl implements CuisinePreferencesRepository {
  async getAllCuisinePreferences<TColumns extends CuisinePreferencesColumnsInput>(
    columns: TColumns,
    tx: DbClient,
  ): Promise<
    Array<Pick<CuisinePreferenceRow, Extract<keyof TColumns, keyof CuisinePreferenceRow>>>
  > {
    const client = tx;
    if (!client) {
      throw new Error("Database client is not available");
    }

    const cuisinePreferences = await client.query.cuisinePreferences.findMany({
      columns,
      orderBy: (cuisinePreferences, { asc }) => [asc(cuisinePreferences.name)],
    });

    return cuisinePreferences as unknown as Array<CuisinePreferencesRowByColumn<TColumns>>;
  }

  async verifyAndGetCuisinePreferencesByIds<TColumns extends CuisinePreferencesColumnsInput>(
    cuisinePreferenceIds: string[],
    columns: TColumns,
    tx: DbClient,
  ): Promise<
    Array<Pick<CuisinePreferenceRow, Extract<keyof TColumns, keyof CuisinePreferenceRow>>>
  > {
    const client = tx;
    if (!client) {
      throw new Error("Database client is not available");
    }
    const cuisinePreferences = await client.query.cuisinePreferences.findMany({
      where: (cuisinePreferences, { inArray, eq, and }) => {
        return and(
          inArray(cuisinePreferences.id, cuisinePreferenceIds),
          eq(cuisinePreferences.isActive, true),
        );
      },
      columns,
    });

    if (cuisinePreferences.length !== cuisinePreferenceIds.length) {
      throw new Error(
        "One or more cuisine preference IDs are invalid or refer to deleted cuisine preferences",
      );
    }

    return cuisinePreferences as unknown as Array<CuisinePreferencesRowByColumn<TColumns>>;
  }
}
