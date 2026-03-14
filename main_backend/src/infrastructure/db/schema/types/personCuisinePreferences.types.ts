import { InferSelectModel } from "drizzle-orm";

import { personCuisinePreferences } from "@/infrastructure/db/schema/tables/personCuisinePreference";

export type PersonCuisinePreferenceRow = InferSelectModel<typeof personCuisinePreferences>;

export type PersonCuisinePreferenceInsert = Pick<
  PersonCuisinePreferenceRow,
  "personId" | "cuisinePreferenceId"
>;

export type PersonCuisinePreferencesMultipleResult = Array<{
  id: string;
}>;
