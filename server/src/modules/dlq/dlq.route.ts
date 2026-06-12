import { Router } from "express";
import { getDLQ, retryDLQ } from "./dlq.controller";
import { methodNotAllowedHandler } from "@/middlewares";
import { routeRegistry } from "@/docs";

const router = Router();

// GET /api/dlq
routeRegistry.register({
  method: "GET",
  path: "/api/dlq",
  handler: getDLQ,
  docs: {
    tags: ["DLQ"],
    summary: "List all DLQ entries",
    description:
      "Returns all jobs that have exhausted their retries and landed in the dead-letter queue.",
    responses: {
      "200": {
        description: "List of DLQ entries",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                count: { type: "number", example: 3 },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      job_id: { type: "string" },
                      job_type: { type: "string", example: "webhook" },
                      payload: { type: "object" },
                      error_message: { type: "string" },
                      retry_count: { type: "number", example: 3 },
                      failed_at: { type: "string", example: "2026-06-10T10:00:00Z" },
                    },
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
  .route("/")
  .get(getDLQ)
  .all(methodNotAllowedHandler(["GET"]));

// POST /api/dlq/:id/retry
routeRegistry.register({
  method: "POST",
  path: "/api/dlq/:id/retry",
  handler: retryDLQ,
  docs: {
    tags: ["DLQ"],
    summary: "Retry a DLQ job",
    description:
      "Resets the job retry count to 0 and re-queues it for processing. If it fails again it returns to the DLQ.",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "DLQ entry ID",
      },
    ],
    responses: {
      "200": {
        description: "Job successfully re-queued",
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
        description: "DLQ entry not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "DLQ entry not found" },
              },
            },
          },
        },
      },
    },
  },
});

router
  .route("/:id/retry")
  .post(retryDLQ)
  .all(methodNotAllowedHandler(["POST"]));

export default router;
