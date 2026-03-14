import { PersonAllergiesRepository } from "@/application/persons/personAllergies.ports";
import { DbClient } from "@/infrastructure/db";
import { personAllergies } from "@/infrastructure/db/schema";
import {
  PersonAllergiesInsert,
  PersonAllergiesMultipleResult,
} from "@/infrastructure/db/schema/types/personAllergies.types";

export class PersonAllergiesRepositoryImpl implements PersonAllergiesRepository {
  async addMultiplePersonAllergies(
    allergiesValues: PersonAllergiesInsert[],
    tx: DbClient,
  ): Promise<PersonAllergiesMultipleResult> {
    const client = tx;

    if (!client) {
      throw new Error("Transaction client is required");
    }

    const insertedPersonAllergies = await client
      .insert(personAllergies)
      .values(allergiesValues)
      .returning({
        id: personAllergies.id,
      });

    if (!insertedPersonAllergies || insertedPersonAllergies.length === 0) {
      throw new Error("Failed to insert person allergies");
    }

    if (insertedPersonAllergies.length !== allergiesValues.length) {
      throw new Error("Mismatch in number of inserted allergies");
    }

    return insertedPersonAllergies.map((row) => ({
      id: row.id,
    }));
  }
}
