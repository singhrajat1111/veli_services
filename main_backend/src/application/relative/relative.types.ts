import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { relatives } from "@/infrastructure/db/schema";

export type RelativesSelectInput = InferInsertModel<typeof relatives>;

export type RelativesSelectRow = InferSelectModel<typeof relatives>;

export type RelativesOutput = Partial<RelativesSelectRow>;

export type RelativesMainFieldsReturn = {
  id: string;
};
