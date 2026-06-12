import { Request, Response } from "express";

export const rootHandler = (_req: Request, res: Response) => {
  res.json({
    name: "Webhook Background Job Scheduler",
    type: "monolith",
    version: "1.0.0",
    status: "running",
    endpoints: {
      root: "/",
      health: "/api/v1/health",
      docs: "/api-docs",
      jobs: "/api/jobs",
      dlq: "/api/dlq",
      events: "/api/events",
    },
  });
};
