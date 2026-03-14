import { DbClient } from "@/infrastructure/db";
import {
  PersonAllergiesInsert,
  PersonAllergiesMultipleResult,
} from "@/infrastructure/db/schema/types/personAllergies.types";

export interface PersonAllergiesRepository {
  addMultiplePersonAllergies(
    allergiesIds: PersonAllergiesInsert[],
    tx: DbClient,
  ): Promise<PersonAllergiesMultipleResult>;
}
