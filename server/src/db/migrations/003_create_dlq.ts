import { Database } from "better-sqlite3";

export function up(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dlq (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      job_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      error_message TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      failed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_dlq_job_id ON dlq(job_id);
    CREATE INDEX IF NOT EXISTS idx_dlq_failed_at ON dlq(failed_at);
  `);
}
