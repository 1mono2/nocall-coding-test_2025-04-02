import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

console.log(process.env.DATABASE_URL);

// Drizzle ORMの初期化
export const db = drizzle(process.env.DATABASE_URL || "", { schema });
