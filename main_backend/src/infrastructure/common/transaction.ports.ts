import { DbClient } from "@/infrastructure/db";

export interface TransactionManager {
  execute<T>(callback: (tx: DbClient) => Promise<T>): Promise<T>;
}
