import { InferSelectModel } from "drizzle-orm";

import { personAllergies } from "@/infrastructure/db/schema/tables/personAllergies";

export type PersonAllergyRow = InferSelectModel<typeof personAllergies>;

export type PersonAllergiesInsert = Pick<PersonAllergyRow, "personId" | "allergyId">;

export type PersonAllergiesMultipleResult = Array<{
  id: string;
}>;
