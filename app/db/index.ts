import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// データベース接続の初期化
export const db = drizzle(process.env.DATABASE_URL || "", { schema });
