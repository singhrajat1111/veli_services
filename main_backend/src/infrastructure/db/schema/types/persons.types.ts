import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { persons } from "@/infrastructure/db/schema/tables/persons";

export type PersonsInsertRow = InferInsertModel<typeof persons>;
export type PersonsReturnRow = InferSelectModel<typeof persons>;

export type SelectPersonsColumns = Partial<Record<keyof PersonsReturnRow, true>>;

export type PersonsPartialReturnRow = Partial<PersonsReturnRow>;
