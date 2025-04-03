import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// .env.localファイルからの環境変数の読み込み
config({ path: ".env.local" });

// データベースのURLを取得または代替値を設定
const dbUrl = process.env.DATABASE_URL || "";

export default {
  dialect: "sqlite",
  schema: "./app/db/schema/index.ts",
  out: "./app/db/migrations",
  dbCredentials: {
    url: dbUrl,
  },
} satisfies Config;
