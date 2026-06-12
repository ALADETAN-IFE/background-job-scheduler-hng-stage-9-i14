import { Request, Response } from "express";
import { getDLQEntries, getDLQCount } from "./dlq.service";
import { retryDLQJob } from "../jobs";

export const getDLQ = (_req: Request, res: Response) => {
  const entries = getDLQEntries();
  const count = getDLQCount();
  res.json({ success: true, data: entries, count });
};

export const retryDLQ = (req: Request, res: Response) => {
  const entry = getDLQEntries().find((e) => e.id === req.params.id);
  if (!entry) {
    res.status(404).json({ success: false, message: "DLQ entry not found" });
    return;
  }
  const job = retryDLQJob(entry.id, entry.job_id);
  res.json({ success: true, data: job });
};
