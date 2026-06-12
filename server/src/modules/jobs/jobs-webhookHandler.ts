import { WebhookPayload } from "@/types";
import { logger } from "@/utils";

export interface WebhookResult {
  success: boolean;
  statusCode: number;
  responseBody: string;
  durationMs: number;
  error?: string;
}

export async function handleWebhook(
  jobId: string,
  payload: WebhookPayload,
): Promise<WebhookResult> {
  const { url, method = "POST", headers = {}, body = {}, timeout_ms = 10000 } = payload;

  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid webhook URL: ${url}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeout_ms);
  const start = Date.now();

  logger.info("WebhookHandler", `Firing ${method} ${url}`, { jobId });

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Job-ID": jobId,
        "X-Scheduler-Source": "job-scheduler",
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const durationMs = Date.now() - start;
    const responseBody = await response.text().catch(() => "");

    const result: WebhookResult = {
      success: response.ok,
      statusCode: response.status,
      responseBody: responseBody.slice(0, 500), // cap stored response
      durationMs,
    };

    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      logger.warn("WebhookHandler", `Failed ${method} ${url} → ${response.status}`, {
        jobId,
        durationMs,
      });
    } else {
      logger.info("WebhookHandler", `Success ${method} ${url} → ${response.status}`, {
        jobId,
        durationMs,
      });
    }

    return result;
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : "Unknown error";
    const isTimeout = error.includes("abort") || error.includes("AbortError");

    logger.error("WebhookHandler", `Error ${method} ${url}`, {
      jobId,
      error,
      durationMs,
    });

    return {
      success: false,
      statusCode: isTimeout ? 408 : 0,
      responseBody: "",
      durationMs,
      error: isTimeout ? `Timeout after ${timeout_ms}ms` : error,
    };
  } finally {
    clearTimeout(timeout);
  }
}
