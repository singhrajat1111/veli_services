import { inArray } from "drizzle-orm";

import { AllergiesRepository } from "@/application/preferences/allergies.ports";
import { DbClient } from "@/infrastructure/db";
import {
  AllergiesRowByColumns,
  SelectAllergiesColumns,
} from "@/infrastructure/db/schema/types/allergies.types";

export class AllergiesRepositoryImpl implements AllergiesRepository {
  async getAllAllergies<TColumns extends SelectAllergiesColumns>(columns: TColumns, tx: DbClient) {
    const client = tx;

    if (!client) {
      throw new Error("Database client is not available");
    }

    const allergies = await client.query.allergies.findMany({
      columns,
      orderBy: (allergies, { asc }) => [asc(allergies.name)],
    });

    return allergies as unknown as AllergiesRowByColumns<TColumns>[];
  }

  async verifyAndGetAllergiesByIds<TColumns extends SelectAllergiesColumns>(
    allergyIds: string[],
    columns: TColumns,
    tx: DbClient,
  ) {
    const client = tx;

    if (!client) {
      throw new Error("Database client is not available");
    }

    const allergies = await client.query.allergies.findMany({
      where: (allergies, { eq, and }) =>
        and(inArray(allergies.id, allergyIds), eq(allergies.isActive, true)),
      columns,
    });

    if (allergies.length !== allergyIds.length) {
      throw new Error("One or more allergy IDs are invalid or refer to deleted allergies");
    }

    return allergies as unknown as AllergiesRowByColumns<TColumns>[];
  }
}
