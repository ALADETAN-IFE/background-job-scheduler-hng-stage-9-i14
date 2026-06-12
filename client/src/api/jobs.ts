import axios from "axios";
import type { Job, DLQEntry, JobStats, CreateJobPayload } from "@/types/job";

interface ApiResponse<T> {
  data: T;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { "Content-Type": "application/json" },
});

// Jobs
export const getJobs = async (): Promise<Job[]> => {
  const { data } = await api.get<ApiResponse<Job[]>>("/jobs");
  return data.data;
};

export const getJobById = async (id: string): Promise<Job> => {
  const { data } = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
  return data.data;
};

export const getJobStats = async (): Promise<JobStats> => {
  const { data } = await api.get<ApiResponse<JobStats>>("/jobs/stats");
  return data.data;
};

export const createJob = async (payload: CreateJobPayload): Promise<Job> => {
  const { data } = await api.post<ApiResponse<Job>>("/jobs", payload);
  return data.data;
};

export const cancelJob = async (id: string): Promise<Job> => {
  const { data } = await api.patch<ApiResponse<Job>>(`/jobs/${id}/cancel`);
  return data.data;
};

// DLQ
export const getDLQ = async (): Promise<{
  data: DLQEntry[];
  count: number;
}> => {
  const { data } = await api.get<{ data: DLQEntry[]; count: number }>("/dlq");
  return data;
};

export const retryDLQEntry = async (id: string): Promise<Job> => {
  const { data } = await api.post<ApiResponse<Job>>(`/dlq/${id}/retry`);
  return data.data;
};
