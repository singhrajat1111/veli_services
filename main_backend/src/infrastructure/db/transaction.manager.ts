import { TransactionManager } from "@/infrastructure/common/transaction.ports";
import { getDb, type DbClient } from "@/infrastructure/db";

export class TransactionManagerImpl implements TransactionManager {
  async execute<T>(callback: (tx: DbClient) => Promise<T>): Promise<T> {
    const client = await getDb();

    return client.transaction(async (tx) => {
      return callback(tx);
    });
  }
}
