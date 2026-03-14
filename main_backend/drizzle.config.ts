import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: "./src/infrastructure/db/schema/index.ts",
  out: "./src/infrastructure/db/migrations",
  dbCredentials: {
    // url: process.env.SUPABASE_DB_URL!.replace("[]", process.env.SUPABASE_DB_PASSWORD!),
    url: process.env.SUPABASE_DB_URL!,
  },
  extensionsFilters: ["postgis"],
} satisfies Config;
