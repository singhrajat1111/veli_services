import { InferSelectModel } from "drizzle-orm";

import { allergies } from "@/infrastructure/db/schema/tables/allergies";

export type AllergiesRow = InferSelectModel<typeof allergies>;

export type SelectAllergiesColumns = Partial<Record<keyof AllergiesRow, true>>;

export type AllergiesRowByColumns<TColumns extends SelectAllergiesColumns> = Pick<
  AllergiesRow,
  Extract<keyof TColumns, keyof AllergiesRow>
>;
