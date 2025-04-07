import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../../db/schema";
import path from "path";

/**
 * テスト用のインメモリデータベースを作成する
 * 各テスト実行時に一意のDBを作成することで、並列実行時にもテストが干渉しない
 */
export function createTestDb() {
  // メモリ内DBを作成
  const sqlite = new Database(`:memory:`);

  // テスト用のDBインスタンスを作成
  const testDb = drizzle(sqlite, { schema });

  // マイグレーションを適用
  migrate(testDb, {
    migrationsFolder: path.join(__dirname, "../../db/migrations"),
  });

  return testDb;
}
