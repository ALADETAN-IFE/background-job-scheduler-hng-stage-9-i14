import db from "@/config/db";
import { JobStatus } from "@/types";

// Check if all dependencies of a job have completed
export function areDependenciesMet(jobId: string): boolean {
  const deps = db
    .prepare(
      `
    SELECT j.status
    FROM job_dependencies jd
    JOIN jobs j ON j.id = jd.dependency_id
    WHERE jd.job_id = ?
  `,
    )
    .all(jobId) as { status: JobStatus }[];

  if (deps.length === 0) return true;
  return deps.every((d) => d.status === JobStatus.COMPLETED);
}

// Get all jobs that were waiting on this job and are now unblocked
export function getUnblockedJobs(completedJobId: string): string[] {
  const dependent = db
    .prepare(
      `
    SELECT DISTINCT jd.job_id
    FROM job_dependencies jd
    WHERE jd.dependency_id = ?
  `,
    )
    .all(completedJobId) as { job_id: string }[];

  return dependent.map((d) => d.job_id).filter((id) => areDependenciesMet(id));
}

// Save dependencies for a new job
export function saveDependencies(jobId: string, dependencyIds: string[]): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO job_dependencies (job_id, dependency_id) VALUES (?, ?)
  `);

  const insertMany = db.transaction((deps: string[]) => {
    for (const depId of deps) {
      insert.run(jobId, depId);
    }
  });

  insertMany(dependencyIds);
}
