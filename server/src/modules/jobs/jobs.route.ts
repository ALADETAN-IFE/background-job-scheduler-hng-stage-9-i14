import { Router } from "express";
import { z } from "zod";
import {
  getStats,
  getJobs,
  getJob,
  createJobHandler,
  cancelJobHandler,
} from "./jobs.controller";
import { methodNotAllowedHandler, validateRequest } from "@/middlewares";
import { routeRegistry } from "@/docs";
import { JobType, RecurrenceInterval } from "@/types";

const router = Router();

const createJobSchema = z
  .object({
    type: z.enum([...Object.values(JobType)]),
    payload: z.object({
      url: z.url(),
      method: z
        .enum(["POST", "PUT", "PATCH"], {
          message: "method must be one of: POST, PUT, PATCH",
        })
        .default("POST"),
      headers: z.record(z.string(), z.string()).optional(),
      body: z.record(z.string(), z.unknown()).optional(),
      timeout_ms: z.number().positive().optional(),
    }),
    priority: z
      .number()
      .int()
      .min(1, { message: "priority must be 1 (High), 2 (Medium), or 3 (Low)" })
      .max(3, { message: "priority must be 1 (High), 2 (Medium), or 3 (Low)" })
      .optional(),
    scheduled_at: z.iso.datetime().optional(),
    recurrence_interval: z
      .enum([...Object.values(RecurrenceInterval)], {
        message:
          "recurrence_interval must be one of: every_1_minute, every_5_minutes, every_1_hour, every_1_day",
      })
      .optional(),
    dependency_ids: z.array(z.string().uuid()).optional(),
  })
  .strict();

const jobIdParamSchema = z.object({
  id: z.uuid(),
});

// GET /api/jobs/stats
routeRegistry.register({
  method: "GET",
  path: "/api/jobs/stats",
  handler: getStats,
  docs: {
    tags: ["Jobs"],
    summary: "Get job counts by status",
    description: "Returns total and per-status job counts for the dashboard.",
    responses: {
      "200": {
        description: "Job statistics",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    total: { type: "number" },
                    pending: { type: "number" },
                    processing: { type: "number" },
                    completed: { type: "number" },
                    failed: { type: "number" },
                    cancelled: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

router
  .route("/stats")
  .get(getStats)
  .all(methodNotAllowedHandler(["GET"]));

// GET /api/jobs
routeRegistry.register({
  method: "GET",
  path: "/api/jobs",
  handler: getJobs,
  docs: {
    tags: ["Jobs"],
    summary: "List all jobs",
    description: "Returns all jobs ordered by creation time descending.",
    responses: {
      "200": {
        description: "List of jobs",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: { type: "array", items: { type: "object" } },
              },
            },
          },
        },
      },
    },
  },
});

// POST /api/jobs
routeRegistry.register({
  method: "POST",
  path: "/api/jobs",
  handler: createJobHandler,
  docs: {
    tags: ["Jobs"],
    summary: "Create a new job",
    description:
      "Creates and queues a new job. Jobs with a future scheduled_at will not run until that time. Jobs with dependency_ids will not run until all dependencies complete.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["type", "payload"],
            properties: {
              type: { type: "string", enum: ["webhook"], example: "webhook" },
              payload: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string", example: "https://webhook.site/your-id" },
                  method: {
                    type: "string",
                    enum: ["POST", "PUT", "PATCH"],
                    example: "POST",
                  },
                  headers: { type: "object" },
                  body: { type: "object" },
                  timeout_ms: { type: "number", example: 10000 },
                },
              },
              priority: {
                type: "number",
                enum: [1, 2, 3],
                example: 1,
                description: "1=High 2=Medium 3=Low",
              },
              scheduled_at: { type: "string", example: "2026-06-10T15:00:00Z" },
              recurrence_interval: {
                type: "string",
                enum: [
                  "every_1_minute",
                  "every_5_minutes",
                  "every_1_hour",
                  "every_1_day",
                ],
              },
              dependency_ids: {
                type: "array",
                items: { type: "string" },
                example: ["job-uuid-1", "job-uuid-2"],
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Job created",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: { type: "object" },
              },
            },
          },
        },
      },
      "400": {
        description: "Validation error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
});

router
  .route("/")
  .get(getJobs)
  .post(validateRequest({ body: createJobSchema }), createJobHandler)
  .all(methodNotAllowedHandler(["GET", "POST"]));

// GET /api/jobs/:id
routeRegistry.register({
  method: "GET",
  path: "/api/jobs/:id",
  handler: getJob,
  docs: {
    tags: ["Jobs"],
    summary: "Get job by ID",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Job UUID",
      },
    ],
    responses: {
      "200": {
        description: "Job found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: { type: "object" },
              },
            },
          },
        },
      },
      "404": {
        description: "Job not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "Job not found" },
              },
            },
          },
        },
      },
    },
  },
});

// PATCH /api/jobs/:id/cancel
routeRegistry.register({
  method: "PATCH",
  path: "/api/jobs/:id/cancel",
  handler: cancelJobHandler,
  docs: {
    tags: ["Jobs"],
    summary: "Cancel a job",
    description:
      "Cancels a pending or processing job. Completed and failed jobs cannot be cancelled. If processing, the current attempt finishes but no retry is scheduled.",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Job UUID",
      },
    ],
    responses: {
      "200": {
        description: "Job cancelled",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: { type: "object" },
              },
            },
          },
        },
      },
      "404": {
        description: "Job not found or already in terminal state",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
});

router
  .route("/:id")
  .get(validateRequest({ params: jobIdParamSchema }), getJob)
  .all(methodNotAllowedHandler(["GET"]));

router
  .route("/:id/cancel")
  .patch(validateRequest({ params: jobIdParamSchema }), cancelJobHandler)
  .all(methodNotAllowedHandler(["PATCH"]));

export default router;
