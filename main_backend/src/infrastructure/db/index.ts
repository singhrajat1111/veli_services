import type { Sql } from "postgres";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { logger } from "@/shared/logger";
import { config } from "@/shared/config";
import * as schema from "@/infrastructure/db/schema";

// Postgres instance for database connection
let sql: Sql | null = null;
// Drizzle instance for ORM operations

export type DbClient = PostgresJsDatabase<typeof schema>;

// TODO:
// let db: ReturnType<typeof drizzle> | null = null;
let db: DbClient | null = null;

export const initDb = async (): Promise<void> => {
  if (sql && db) return;

  logger.info("Initializing Postgres client...");

  try {
    logger.info("Connecting to Postgres with connection string: ", {
      connectionString: config.drizzle.connectionString,
    });
    const client = postgres(config.drizzle.connectionString, {
      max: config.nodeEnv === "production" ? 10 : 2,
      idle_timeout: 30,
      connect_timeout: 10,
      // TODO: Add SSL configuration for production environment if connecting via Supabase
      // ssl: "require", // important for Supabase
    });

    await client`SELECT 1`;

    sql = client;
    // db= drizzle(sql);
    db = drizzle(sql, { schema });

    logger.info("Postgres connection established.");
  } catch (error) {
    logger.error("Failed to initialize Postgres connection: ", { error });
    throw error;
  }
};

export const getSql = (): Sql => {
  if (!sql) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return sql;
};

export const getDb = () => {
  if (!db) {
    throw new Error("Drizzle DB not initialized. Call initDb() first.");
  }
  return db;
};

export const closeDb = async (): Promise<void> => {
  if (sql) {
    logger.info("Closing Postgres connection...");
    await sql.end();
    sql = null;
    db = null;
  }
};

export const checkDbHealth = async (): Promise<boolean> => {
  try {
    const db = getSql();
    await db`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};
