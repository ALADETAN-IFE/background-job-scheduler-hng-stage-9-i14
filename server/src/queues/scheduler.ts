import db from "@/config/db";
import { jobHeap } from "./heap";
import { JobStatus, HeapNode } from "@/types";
import { logger } from "@/utils";
import { ENV } from "@/config";

// Load all pending jobs that are due now into the heap
export function loadDueJobs(): void {
  const now = new Date().toISOString();

  const jobs = db
    .prepare(
      `
    SELECT id, priority, scheduled_at, created_at, priority as effective_priority
    FROM jobs
    WHERE status = ?
    AND (scheduled_at IS NULL OR scheduled_at <= ?)
  `,
    )
    .all(JobStatus.PENDING, now) as HeapNode[];

  let loaded = 0;
  for (const job of jobs) {
    if (!jobHeap.has(job.id)) {
      jobHeap.insert(job);
      loaded++;
    }
  }

  if (loaded > 0) {
    logger.log(
      "Scheduler",
      `Loaded ${loaded} due jobs into heap (heap size: ${jobHeap.size})`,
    );
  }
}

// Age pending jobs to prevent starvation
// Jobs waiting longer than STARVATION_THRESHOLD_MS get their effective priority bumped
export function runStarvationPrevention(): void {
  const threshold = ENV.STARVATION_THRESHOLD_MS;
  const cutoff = new Date(Date.now() - threshold).toISOString();

  const staleJobs = db
    .prepare(
      `
    SELECT id, priority, scheduled_at, created_at
    FROM jobs
    WHERE status = ?
    AND created_at <= ?
    AND (scheduled_at IS NULL OR scheduled_at <= datetime('now'))
  `,
    )
    .all(JobStatus.PENDING, cutoff) as HeapNode[];

  for (const job of staleJobs) {
    // Promote: if priority is 3 (low) bump to 2 (medium), if 2 bump to 1 (high)
    const promoted = Math.max(1, job.priority - 1);
    if (promoted < job.priority) {
      const node: HeapNode = { ...job, effective_priority: promoted };
      jobHeap.remove(job.id);
      jobHeap.insert(node);
      logger.info(
        "Scheduler",
        `Promoted stale job ${job.id} from priority ${job.priority} to ${promoted}`,
      );
    }
  }
}

// Start the scheduler loop
export function startScheduler(): void {
  logger.info("Scheduler", "Starting scheduler loop");

  // Load due jobs every WORKER_POLL_INTERVAL_MS
  setInterval(loadDueJobs, ENV.WORKER_POLL_INTERVAL_MS);

  // Run starvation prevention every STARVATION_CHECK_INTERVAL_MS
  setInterval(runStarvationPrevention, ENV.STARVATION_CHECK_INTERVAL_MS);

  // Initial load
  loadDueJobs();
}
