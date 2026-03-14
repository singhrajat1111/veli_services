import { DbClient } from "@/infrastructure/db";
import { PersonAllergiesMultipleResult } from "@/infrastructure/db/schema/types/personAllergies.types";
import { PersonFoodPreferencesInsert } from "@/infrastructure/db/schema/types/personFoodPreferences.types";

export interface PersonFoodPreferencesRepository {
  addMultiplePersonFoodPreferences(
    foodPreferenceIds: PersonFoodPreferencesInsert[],
    tx: DbClient,
  ): Promise<PersonAllergiesMultipleResult>;
}
