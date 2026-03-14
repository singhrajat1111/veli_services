import { DbClient } from "@/infrastructure/db";
import {
  PersonCuisinePreferenceInsert,
  PersonCuisinePreferencesMultipleResult,
} from "@/infrastructure/db/schema/types/personCuisinePreferences.types";

export interface PersonCuisinePreferencesRepository {
  addMultipleCuisinePreferencesToPerson(
    cuisinePreferenceIds: PersonCuisinePreferenceInsert[],
    tx: DbClient,
  ): Promise<PersonCuisinePreferencesMultipleResult>;
}
