import { PersonCuisinePreferencesRepository } from "@/application/persons/personCuisinePreferences.ports";
import { DbClient } from "@/infrastructure/db";
import { personCuisinePreferences } from "@/infrastructure/db/schema";
import {
  PersonCuisinePreferenceInsert,
  PersonCuisinePreferencesMultipleResult,
} from "@/infrastructure/db/schema/types/personCuisinePreferences.types";

export class PersonCuisinePreferencesRepositoryImpl implements PersonCuisinePreferencesRepository {
  async addMultipleCuisinePreferencesToPerson(
    cuisinePreferenceIds: PersonCuisinePreferenceInsert[],
    tx: DbClient,
  ): Promise<PersonCuisinePreferencesMultipleResult> {
    const client = tx;
    if (!client) {
      throw new Error("Database client is not available");
    }

    const insertedData = await client
      .insert(personCuisinePreferences)
      .values(cuisinePreferenceIds)
      .returning({
        id: personCuisinePreferences.id,
      });

    if (!insertedData || insertedData.length === 0) {
      throw new Error("Failed to insert person cuisine preferences");
    }

    if (insertedData.length !== cuisinePreferenceIds.length) {
      throw new Error("Mismatch in number of inserted cuisine preferences");
    }

    return insertedData;
  }
}
