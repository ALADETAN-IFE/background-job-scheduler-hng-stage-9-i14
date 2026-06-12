import { useEffect, useState } from "react";
import { getJobs, getJobStats, cancelJob } from "@/api/jobs";
import type { Job, JobStats } from "@/types/job";
import JobsTable from "@/components/JobsTable";
import { useSSE } from "@/hooks/useSSE";
import { toast } from "@/utils";
import { RefreshCw, Layers, Clock, Play, CheckCircle2, XCircle, Ban } from "lucide-react";

const EMPTY_STATS: JobStats = {
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
};

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    Promise.all([getJobs(), getJobStats()])
      .then(([j, s]) => {
        setJobs(j);
        setStats(s);
        setError(null);
      })
      .catch(() => {
        setError("Could not reach the scheduler backend.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function refreshStats() {
    getJobStats()
      .then(setStats)
      .catch(() => {
        setStats(EMPTY_STATS);
      });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  function handleJobUpdate(raw: unknown) {
    const job = raw as Job;
    setJobs((prev) => {
      const exists = prev.some((j) => j.id === job.id);
      return exists ? prev.map((j) => (j.id === job.id ? job : j)) : [job, ...prev];
    });
    refreshStats();
  }

  useSSE([
    { event: "job.created", handler: handleJobUpdate },
    { event: "job.processing", handler: handleJobUpdate },
    { event: "job.completed", handler: handleJobUpdate },
    { event: "job.failed", handler: handleJobUpdate },
    { event: "job.retry", handler: handleJobUpdate },
    { event: "job.cancelled", handler: handleJobUpdate },
  ]);

  function handleCancel(id: string) {
    cancelJob(id)
      .then(() => {
        toast.success("Job cancelled");
      })
      .catch(() => {
        toast.error("Cancel failed", "The job could not be cancelled.");
      });
  }

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      icon: <Layers size={14} />,
      color: "text-(--accent-text)",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: <Clock size={14} />,
      color: "text-amber-500",
    },
    {
      label: "Processing",
      value: stats.processing,
      icon: <Play size={14} />,
      color: "text-blue-500",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: <CheckCircle2 size={14} />,
      color: "text-emerald-500",
    },
    {
      label: "Failed",
      value: stats.failed,
      icon: <XCircle size={14} />,
      color: "text-red-500",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: <Ban size={14} />,
      color: "text-slate-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-(--text-h)">Dashboard</h1>
          <p className="text-xs text-(--text) mt-0.5">
            Live view of all jobs in the scheduler
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-(--border) rounded-lg bg-(--bg) text-(--text-h) hover:bg-(--bg-2) transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert alert-error">
          <XCircle size={14} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Connection error</div>
            <div className="text-xs mt-0.5 opacity-80">{error}</div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="p-3 rounded-lg border border-(--border) bg-(--bg) space-y-2"
          >
            <div className={`flex items-center gap-1.5 text-xs font-medium ${c.color}`}>
              {c.icon}
              {c.label}
            </div>
            <div className="text-2xl font-semibold font-mono text-(--text-h)">
              {loading ? <span className="opacity-30">—</span> : c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-(--text-h)">All jobs</h2>
        </div>
        {loading && jobs.length === 0 ? (
          <div className="py-16 text-center text-(--text) border border-(--border) rounded-lg">
            <RefreshCw className="animate-spin mx-auto mb-2 opacity-40" size={18} />
            <span className="text-sm">Loading jobs…</span>
          </div>
        ) : (
          <JobsTable jobs={jobs} onCancelJob={handleCancel} />
        )}
      </div>
    </div>
  );
}
