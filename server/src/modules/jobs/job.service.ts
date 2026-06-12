import db from "@/config/db";
import { v4 as uuidv4 } from "uuid";
import {
  Job,
  JobStatus,
  JobPriority,
  CreateJobDTO,
  HeapNode,
  RecurrenceInterval,
} from "@/types";
import { jobHeap } from "@/queues";
import {
  saveDependencies,
  areDependenciesMet,
  getUnblockedJobs,
} from "./job-dag.service";
import { getNextRunAt } from "./jobs-recurring.service";
import { getNextRetryAt } from "./jobs-retry.service";
import { addToDLQ } from "../dlq";
import { logger } from "@/utils";
import { sseBroker } from "@/sse";

interface JobRow extends Omit<Job, "payload"> {
  payload: string;
}

export function createJob(dto: CreateJobDTO): Job {
  const id = uuidv4();
  const now = new Date().toISOString();
  const priority = dto.priority ?? JobPriority.MEDIUM;

  // If job has unmet dependencies, keep it pending but don't add to heap yet
  const hasDeps = dto.dependency_ids && dto.dependency_ids.length > 0;

  db.prepare(
    `
    INSERT INTO jobs (id, type, payload, priority, status, scheduled_at, recurrence_interval, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    dto.type,
    JSON.stringify(dto.payload),
    priority,
    JobStatus.PENDING,
    dto.scheduled_at ?? null,
    dto.recurrence_interval ?? null,
    now,
    now,
  );

  if (hasDeps) {
    saveDependencies(id, dto.dependency_ids!);
  }

  const job = getJobById(id)!;

  // Only add to heap if no dependencies and no future scheduled time
  const isDue = !dto.scheduled_at || new Date(dto.scheduled_at) <= new Date();
  const depsAreMet = !hasDeps || areDependenciesMet(id);

  if (isDue && depsAreMet) {
    const node: HeapNode = {
      id,
      priority,
      scheduled_at: dto.scheduled_at ?? null,
      created_at: now,
      effective_priority: priority,
    };
    jobHeap.insert(node);
  }

  logger.info("JobService", `Created job ${id}`, { type: dto.type, priority });
  sseBroker.broadcast({ event: "job.created", data: job });

  return job;
}

export function getJobById(id: string): Job | null {
  const row = db.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as JobRow | undefined;
  if (!row) return null;
  return { ...row, payload: JSON.parse(row.payload) };
}

export function getAllJobs(): Job[] {
  const rows = db
    .prepare(`SELECT * FROM jobs ORDER BY created_at DESC`)
    .all() as JobRow[];
  return rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) }));
}

export function cancelJob(id: string): Job | null {
  const job = getJobById(id);
  if (!job) return null;

  // If processing: mark cancelled immediately — worker will not retry after current attempt
  // If pending: remove from heap and cancel
  if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
    return null; // Cannot cancel terminal states
  }

  db.prepare(
    `
    UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?
  `,
  ).run(JobStatus.CANCELLED, new Date().toISOString(), id);

  jobHeap.remove(id);

  const updated = getJobById(id)!;
  logger.info("JobService", `Cancelled job ${id}`);
  sseBroker.broadcast({ event: "job.cancelled", data: updated });

  return updated;
}

export function markProcessing(id: string): void {
  db.prepare(
    `
    UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?
  `,
  ).run(JobStatus.PROCESSING, new Date().toISOString(), id);

  const job = getJobById(id)!;
  sseBroker.broadcast({ event: "job.processing", data: job });
}

export function markCompleted(id: string): void {
  db.prepare(
    `
    UPDATE jobs
    SET status = ?, last_run_at = ?, updated_at = ?
    WHERE id = ?
  `,
  ).run(JobStatus.COMPLETED, new Date().toISOString(), new Date().toISOString(), id);

  const job = getJobById(id)!;
  logger.info("JobService", `Completed job ${id}`);
  sseBroker.broadcast({ event: "job.completed", data: job });

  // Handle recurring — schedule next run
  if (job.recurrence_interval) {
    const nextRun = getNextRunAt(job.recurrence_interval as RecurrenceInterval);
    createJob({
      type: job.type,
      payload: job.payload,
      priority: job.priority,
      scheduled_at: nextRun,
      recurrence_interval: job.recurrence_interval as RecurrenceInterval,
    });
    logger.info("JobService", `Scheduled next run for recurring job ${id} at ${nextRun}`);
  }

  // Unblock dependent jobs
  const unblocked = getUnblockedJobs(id);
  for (const depJobId of unblocked) {
    const depJob = getJobById(depJobId);
    if (depJob) {
      const node: HeapNode = {
        id: depJobId,
        priority: depJob.priority,
        scheduled_at: depJob.scheduled_at,
        created_at: depJob.created_at,
        effective_priority: depJob.priority,
      };
      jobHeap.insert(node);
      logger.info("JobService", `Unblocked dependent job ${depJobId}`);
    }
  }
}

export function markFailed(id: string, errorMessage: string): void {
  const job = getJobById(id)!;
  const newRetryCount = job.retry_count + 1;

  if (newRetryCount >= job.max_retries) {
    // Exhausted retries — move to DLQ
    db.prepare(
      `
      UPDATE jobs
      SET status = ?, retry_count = ?, error_message = ?, updated_at = ?
      WHERE id = ?
    `,
    ).run(JobStatus.FAILED, newRetryCount, errorMessage, new Date().toISOString(), id);

    addToDLQ({ ...job, retry_count: newRetryCount }, errorMessage);
    const updated = getJobById(id)!;
    sseBroker.broadcast({ event: "job.failed", data: updated });
  } else {
    // Schedule retry
    const nextRetryAt = getNextRetryAt(newRetryCount);
    db.prepare(
      `
      UPDATE jobs
      SET status = ?, retry_count = ?, error_message = ?, scheduled_at = ?, updated_at = ?
      WHERE id = ?
    `,
    ).run(
      JobStatus.PENDING,
      newRetryCount,
      errorMessage,
      nextRetryAt,
      new Date().toISOString(),
      id,
    );

    logger.warn(
      "JobService",
      `Job ${id} failed — retry ${newRetryCount}/${job.max_retries} at ${nextRetryAt}`,
    );
    const updated = getJobById(id)!;
    sseBroker.broadcast({ event: "job.retry", data: updated });
  }
}

export function retryDLQJob(dlqId: string, jobId: string): Job | null {
  // Reset job and re-queue
  db.prepare(
    `
    UPDATE jobs
    SET status = ?, retry_count = 0, error_message = NULL, scheduled_at = NULL, updated_at = ?
    WHERE id = ?
  `,
  ).run(JobStatus.PENDING, new Date().toISOString(), jobId);

  db.prepare(`DELETE FROM dlq WHERE id = ?`).run(dlqId);

  const job = getJobById(jobId)!;
  const node: HeapNode = {
    id: jobId,
    priority: job.priority,
    scheduled_at: null,
    created_at: job.created_at,
    effective_priority: job.priority,
  };
  jobHeap.insert(node);

  logger.info("JobService", `DLQ job ${jobId} re-queued`);
  sseBroker.broadcast({ event: "job.retry", data: job });

  return job;
}

export function getJobStats() {
  const row = db
    .prepare(
      `
    SELECT
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
      COALESCE(SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END), 0) as processing,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
      COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed,
      COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled
    FROM jobs
  `,
    )
    .get();
  return row;
}
