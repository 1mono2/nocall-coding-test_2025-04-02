import type { Config } from "drizzle-kit";

export default {
  dialect: "sqlite",
  schema: "./app/db/schema/index.ts",
  out: "./app/db/migrations",
} satisfies Config;
