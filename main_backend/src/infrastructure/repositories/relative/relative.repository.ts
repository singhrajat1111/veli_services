import { RelativeRepository } from "@/application/relative/relative.ports";
import {
  RelativesMainFieldsReturn,
  RelativesOutput,
  RelativesSelectInput,
} from "@/application/relative/relative.types";
import { DbClient } from "@/infrastructure/db";
import { relatives } from "@/infrastructure/db/schema";

export class RelativeRepositoryImpl implements RelativeRepository {
  async addRelatives(
    relativesData: RelativesSelectInput[],
    tx: DbClient,
  ): Promise<RelativesMainFieldsReturn[]> {
    // Implement the logic to add relatives to the database using the provided transaction
    // Return the added relatives or a boolean indicating success/failure

    const client = tx;
    if (!client) {
      throw new Error("Database client is not available");
    }

    const insertedRelatives = await client
      .insert(relatives)
      .values(relativesData)
      .returning({ id: relatives.id });

    if (!insertedRelatives || insertedRelatives.length === 0) {
      throw new Error("Failed to add relatives data");
    }

    return insertedRelatives;
  }

  async updateRelatives(
    userId: string,
    relativesData: RelativesSelectInput[],
    tx: DbClient,
  ): Promise<boolean> {
    // Implement the logic to update relatives in the database using the provided transaction
    // Return a boolean indicating success/failure
    return false;
  }

  async getRelatives(userId: string, tx?: DbClient): Promise<RelativesOutput[]> {
    // Implement the logic to retrieve relatives from the database, optionally using the provided transaction
    // Return an array of relatives for the specified user
    return [];
  }
}
