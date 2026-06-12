export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum JobPriority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

export enum JobType {
  WEBHOOK = "webhook",
}

export enum RecurrenceInterval {
  EVERY_1_MINUTE = "every_1_minute",
  EVERY_5_MINUTES = "every_5_minutes",
  EVERY_1_HOUR = "every_1_hour",
  EVERY_1_DAY = "every_1_day",
}

export interface Job {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  priority: JobPriority;
  status: JobStatus;
  retry_count: number;
  max_retries: number;
  scheduled_at: string | null;
  recurrence_interval: RecurrenceInterval | null;
  last_run_at: string | null;
  next_run_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobDependency {
  job_id: string;
  dependency_id: string;
}

export interface DLQEntry {
  id: string;
  job_id: string;
  error_message: string;
  failed_at: string;
  retry_count: number;
  payload: Record<string, unknown>;
  job_type: JobType;
}

export interface CreateJobDTO {
  type: JobType;
  payload: Record<string, unknown>;
  priority?: JobPriority;
  scheduled_at?: string;
  recurrence_interval?: RecurrenceInterval;
  dependency_ids?: string[];
}

export interface WebhookPayload {
  url: string;
  method?: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  timeout_ms?: number;
}

export interface HeapNode {
  id: string;
  priority: JobPriority;
  scheduled_at: string | null;
  created_at: string;
  effective_priority: number;
}
