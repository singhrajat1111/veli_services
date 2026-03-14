import { InferInsertModel } from "drizzle-orm";

import { addresses } from "@/infrastructure/db/schema/tables/addresses";

export type AddressInsertInput = Omit<
  InferInsertModel<typeof addresses>,
  "id" | "createdAt" | "updatedAt"
>;
