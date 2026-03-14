import { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { users } from "@/infrastructure/db/schema/tables/users";

export type UserRow = InferSelectModel<typeof users>;
export type UserSelectColumns = Partial<Record<keyof UserRow, true>>;

export type UserInsert = InferInsertModel<typeof users>;

export type UserUpdateInsert = Partial<Omit<InferInsertModel<typeof users>, "id" | "createdAt">>;
