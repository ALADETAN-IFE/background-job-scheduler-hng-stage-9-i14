import { Request, Response } from "express";
import { createJob, getAllJobs, getJobById, cancelJob, getJobStats } from "./job.service";
import { logger } from "@/utils";

export const getStats = (_req: Request, res: Response) => {
  const stats = getJobStats();
  res.json({ success: true, data: stats });
};

export const getJobs = (_req: Request, res: Response) => {
  const jobs = getAllJobs();
  res.json({ success: true, data: jobs });
};

export const getJob = (req: Request, res: Response) => {
  const { id } = req.params;
  const jobId = id as string;
  const job = getJobById(jobId);
  if (!job) {
    res.status(404).json({ success: false, message: "Job not found" });
    return;
  }
  res.json({ success: true, data: job });
};

export const createJobHandler = (req: Request, res: Response) => {
  try {
    const job = createJob(req.body);
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    logger.error("Jobs", "Failed to create job", err);
    res.status(400).json({ success: false, message: (err as Error).message });
  }
};

export const cancelJobHandler = (req: Request, res: Response) => {
  const { id } = req.params;
  const jobId = id as string;
  const job = cancelJob(jobId);
  if (!job) {
    res.status(404).json({
      success: false,
      message: "Job not found or already in terminal state",
    });
    return;
  }
  res.json({ success: true, data: job });
};
