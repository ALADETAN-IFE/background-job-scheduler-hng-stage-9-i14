import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJobStats } from "@/api/jobs";
import type { JobStats } from "@/types/job";
import { useSSE } from "@/hooks/useSSE";
import {
  ArrowRight,
  GitBranch,
  RefreshCw,
  ShieldAlert,
  Layers,
  Clock,
  TrendingUp,
} from "lucide-react";

const EMPTY: JobStats = {
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
};

const FEATURES = [
  {
    icon: <Layers size={16} />,
    title: "Heap-based priority queue",
    desc: "Jobs ordered by priority, scheduled time, and creation time.",
  },
  {
    icon: <GitBranch size={16} />,
    title: "DAG workflow engine",
    desc: "Jobs wait for all dependencies before entering the queue.",
  },
  {
    icon: <Clock size={16} />,
    title: "Timing wheel scheduler",
    desc: "O(1) alternative algorithm — benchmarked and documented.",
  },
  {
    icon: <RefreshCw size={16} />,
    title: "Retries with backoff",
    desc: "3 attempts with exponential backoff and random jitter.",
  },
  {
    icon: <ShieldAlert size={16} />,
    title: "Dead Letter Queue",
    desc: "Failed jobs isolated for inspection and manual re-queue.",
  },
  {
    icon: <TrendingUp size={16} />,
    title: "Starvation prevention",
    desc: "Low-priority jobs promoted over time to prevent indefinite blocking.",
  },
];

export default function Home() {
  const [stats, setStats] = useState<JobStats>(EMPTY);

  console.log(stats)

  function fetchStats() {
    getJobStats()
      .then(setStats)
      .catch(() => {
        setStats(EMPTY);
      });
  }

  useEffect(() => {
    fetchStats();
  }, []);
  useSSE([
    { event: "job.created", handler: fetchStats },
    { event: "job.completed", handler: fetchStats },
    { event: "job.failed", handler: fetchStats },
    { event: "job.cancelled", handler: fetchStats },
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-14">
      {/* Hero */}
      <section className="pt-8 space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-(--accent-border) bg-(--accent-bg) text-[10px] font-semibold text-(--accent-text) uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-(--accent) animate-pulse" />
          HNG Stage 9 · Background Job Scheduler
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-(--text-h) leading-tight">
          Background jobs,
          <br />
          <span className="text-(--accent-text)">engineered for resilience</span>
        </h1>

        <p className="text-(--text) max-w-lg leading-relaxed pt-2 pb-3">
          A priority-driven job scheduler with webhook delivery, DAG dependencies,
          automatic retries, and a dead-letter queue — all observable in real time.
        </p>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-(--accent)/50 hover:bg-(--accent-hover)/20 text-white text-sm font-medium transition-colors shadow-sm"
          >
            Open dashboard <ArrowRight size={14} />
          </Link>
          <Link
            to="/create"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) hover:bg-(--bg-2) text-(--text-h) text-sm font-medium transition-colors"
          >
            Schedule a job
          </Link>
        </div>
      </section>

      {/* Live stats */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-(--text) uppercase tracking-wide pb-3">
          Live system stats
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Completed", value: stats.completed, color: "text-emerald-500" },
            { label: "Pending", value: stats.pending, color: "text-amber-500" },
            { label: "Failed", value: stats.failed, color: "text-red-500" },
          ].map((s) => (
            <div
              key={s.label}
              className="p-4 rounded-lg border border-(--border) bg-(--bg) space-y-1"
            >
              <div className="text-xs text-(--text)">{s.label}</div>
              <div
                className={`text-2xl font-semibold font-mono ${s.color ?? "text-(--text-h)"}`}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-(--text) uppercase tracking-wide pb-3">
          What's built
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-(--border) bg-(--bg) space-y-2 hover:border-(--accent-border) transition-colors"
            >
              <div className="text-(--accent-text)">{f.icon}</div>
              <div className="text-sm font-medium text-(--text-h)">{f.title}</div>
              <div className="text-xs text-(--text) leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
