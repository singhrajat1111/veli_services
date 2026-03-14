import {
  RelativesMainFieldsReturn,
  RelativesOutput,
  RelativesSelectInput,
} from "@/application/relative/relative.types";
import { DbClient } from "@/infrastructure/db";

export interface RelativeRepository {
  // Define methods for managing relatives, such as creating, updating, and retrieving relative information
  addRelatives(
    relativesData: RelativesSelectInput[],
    tx: DbClient,
  ): Promise<RelativesMainFieldsReturn[]>;
  updateRelatives(
    userId: string,
    relativesData: RelativesSelectInput[],
    tx: DbClient,
  ): Promise<boolean>;
  getRelatives(userId: string, tx?: DbClient): Promise<RelativesOutput[]>;
}
