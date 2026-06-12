import db from "@/config/db";
import { logger } from "@/utils";
import { up as migration001 } from "./migrations/001_create_jobs";
import { up as migration002 } from "./migrations/002_create_job_dependencies";
import { up as migration003 } from "./migrations/003_create_dlq";

const migrations = [
  { name: "001_create_jobs", up: migration001 },
  { name: "002_create_job_dependencies", up: migration002 },
  { name: "003_create_dlq", up: migration003 },
];

// Migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    run_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function runMigrations(): void {
  logger.info("Migrations", "Running migrations...");

  for (const migration of migrations) {
    const already = db
      .prepare("SELECT id FROM migrations WHERE name = ?")
      .get(migration.name);

    if (already) {
      logger.log("Migrations", `Skipping ${migration.name} — already run`);
      continue;
    }

    try {
      migration.up(db);
      db.prepare("INSERT INTO migrations (name) VALUES (?)").run(migration.name);
      logger.info("Migrations", `Ran ${migration.name}`);
    } catch (err) {
      logger.error("Migrations", `Failed on ${migration.name}`, err);
      process.exit(1);
    }
  }

  logger.info("Migrations", "All migrations complete");
}
