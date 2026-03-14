import { PersonFoodPreferencesRepository } from "@/application/persons/personFoodPreferences.ports";
import { DbClient } from "@/infrastructure/db";
import { personFoodPreferences } from "@/infrastructure/db/schema";
import { PersonAllergiesMultipleResult } from "@/infrastructure/db/schema/types/personAllergies.types";
import { PersonFoodPreferencesInsert } from "@/infrastructure/db/schema/types/personFoodPreferences.types";

export class PersonFoodPreferencesRepositoryImpl implements PersonFoodPreferencesRepository {
  async addMultiplePersonFoodPreferences(
    foodPreferenceValues: PersonFoodPreferencesInsert[],
    tx: DbClient,
  ): Promise<PersonAllergiesMultipleResult> {
    const client = tx;
    if (!client) {
      throw new Error("Database client is not available");
    }

    const insertedData = await client
      .insert(personFoodPreferences)
      .values(foodPreferenceValues)
      .returning({
        id: personFoodPreferences.id,
      });

    if (!insertedData || insertedData.length === 0) {
      throw new Error("Failed to insert person food preferences");
    }

    if (insertedData.length !== foodPreferenceValues.length) {
      throw new Error("Mismatch in number of inserted food preferences");
    }

    return insertedData;
  }
}
