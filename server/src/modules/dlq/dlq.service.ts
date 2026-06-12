import db from "@/config/db";
import { v4 as uuidv4 } from "uuid";
import { Job, DLQEntry } from "@/types";
import { ENV } from "@/config";
import { logger } from "@/utils";

interface DLQRow {
  id: string;
  job_id: string;
  job_type: string;
  payload: string;
  error_message: string;
  retry_count: number;
  failed_at: string;
}

export function addToDLQ(job: Job, errorMessage: string): void {
  db.prepare(
    `
    INSERT INTO dlq (id, job_id, job_type, payload, error_message, retry_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(
    uuidv4(),
    job.id,
    job.type,
    JSON.stringify(job.payload),
    errorMessage,
    job.retry_count,
  );

  logger.warn("DLQ", `Job ${job.id} added to DLQ`, {
    type: job.type,
    retries: job.retry_count,
  });
  checkDLQThreshold();
}

export function getDLQEntries(): DLQEntry[] {
  const rows = db.prepare(`SELECT * FROM dlq ORDER BY failed_at DESC`).all() as DLQRow[];
  return rows.map((r) => ({
    ...r,
    payload: JSON.parse(r.payload),
    job_type: r.job_type as Job["type"],
  }));
}

export function removeDLQEntry(dlqId: string): void {
  db.prepare(`DELETE FROM dlq WHERE id = ?`).run(dlqId);
}

export function getDLQCount(): number {
  const row = db.prepare(`SELECT COUNT(*) as count FROM dlq`).get() as { count: number };
  return row.count;
}

function checkDLQThreshold(): void {
  const count = getDLQCount();
  const threshold = ENV.DLQ_ALERT_THRESHOLD;

  if (count >= threshold) {
    logger.warn(
      "DLQ",
      `Threshold exceeded: ${count}/${threshold} — firing alert webhook`,
    );

    import("../jobs/job.service")
      .then(({ createJob }) => {
        createJob({
          type: "webhook" as Job["type"],
          priority: 1,
          payload: {
            url: ENV.DLQ_ALERT_WEBHOOK_URL,
            method: "POST",
            body: {
              event: "dlq.threshold.exceeded",
              count,
              threshold,
              timestamp: new Date().toISOString(),
            },
          },
        });
      })
      .catch((err: Error) => logger.error("DLQ", "Failed to create alert job", err));
  }
}
