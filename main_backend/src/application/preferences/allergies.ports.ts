import { DbClient } from "@/infrastructure/db";
import {
  AllergiesRow,
  SelectAllergiesColumns,
} from "@/infrastructure/db/schema/types/allergies.types";

export interface AllergiesRepository {
  getAllAllergies<TColumns extends SelectAllergiesColumns>(
    columns: TColumns,
    tx: DbClient,
  ): Promise<Array<Pick<AllergiesRow, Extract<keyof TColumns, keyof AllergiesRow>>>>;
  verifyAndGetAllergiesByIds<TColumns extends SelectAllergiesColumns>(
    allergyIds: string[],
    columns: TColumns,
    tx: DbClient,
  ): Promise<Array<Pick<AllergiesRow, Extract<keyof TColumns, keyof AllergiesRow>>>>;
}
