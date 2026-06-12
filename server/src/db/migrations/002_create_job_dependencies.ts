import { Database } from "better-sqlite3";

export function up(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_dependencies (
      job_id TEXT NOT NULL,
      dependency_id TEXT NOT NULL,
      PRIMARY KEY (job_id, dependency_id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (dependency_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_job_deps_job_id ON job_dependencies(job_id);
    CREATE INDEX IF NOT EXISTS idx_job_deps_dep_id ON job_dependencies(dependency_id);
  `);
}
