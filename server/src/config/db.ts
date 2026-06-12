import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { ENV } from "./env";
import { logger } from "@/utils";

const dbPath = path.resolve(ENV.SQLITE_PATH);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("synchronous = NORMAL");

logger.info("Database", `SQLite connected at ${dbPath}`);

export default db;
