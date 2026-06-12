import { jobHeap } from "@/queues";
import { acquireLock, releaseLock } from "./lock";
import { handleWebhook } from "@/modules/jobs";
import { getJobById, markProcessing, markCompleted, markFailed } from "@/modules/jobs";
import { JobStatus, WebhookPayload, JobType } from "@/types";
import { logger } from "@/utils";
import { ENV } from "@/config";

async function processNextJob(): Promise<void> {
  const node = jobHeap.peek();
  if (!node) return;

  let locked = false;
  try {
    locked = await acquireLock(node.id);
  } catch (err) {
    logger.warn("Worker", "Redis unavailable, skipping tick");
    return;
  }
  if (!locked) return;

  jobHeap.extractMin();

  try {
    const job = getJobById(node.id);

    if (!job) {
      await releaseLock(node.id);
      return;
    }

    if (job.status === JobStatus.CANCELLED) {
      logger.info("Worker", `Skipping cancelled job ${job.id}`);
      await releaseLock(node.id);
      return;
    }

    if (job.status !== JobStatus.PENDING) {
      await releaseLock(node.id);
      return;
    }

    markProcessing(job.id);
    logger.info("Worker", `Processing job ${job.id}`, { type: job.type });

    let success = false;
    let errorMessage = "";

    if (job.type === JobType.WEBHOOK) {
      const result = await handleWebhook(
        job.id,
        job.payload as unknown as WebhookPayload,
      );
      success = result.success;
      errorMessage = result.error ?? `HTTP ${result.statusCode}`;
    } else {
      errorMessage = `Unknown job type: ${job.type}`;
    }

    const current = getJobById(job.id);
    if (current?.status === JobStatus.CANCELLED) {
      logger.info(
        "Worker",
        `Job ${job.id} was cancelled during processing — skipping status update`,
      );
      await releaseLock(job.id);
      return;
    }

    if (success) {
      markCompleted(job.id);
    } else {
      markFailed(job.id, errorMessage);
    }
  } finally {
    await releaseLock(node.id);
  }
}

export function startWorker(): void {
  logger.info("Worker", "Worker started");
  setInterval(() => {
    processNextJob().catch((err) => {
      logger.error("Worker", "Unexpected worker error", err);
    });
  }, ENV.WORKER_POLL_INTERVAL_MS);
}
