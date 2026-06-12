import { useState } from "react";
import { Layers, Cpu, Terminal } from "lucide-react";

type Tab = "arch" | "benchmark" | "api";

const BENCHMARK = [
  { jobs: 1_000, heap: "9.89", wheel: "3.24", winner: "Timing Wheel" },
  { jobs: 10_000, heap: "39.73", wheel: "26.94", winner: "Timing Wheel" },
  { jobs: 100_000, heap: "377.01", wheel: "192.58", winner: "Timing Wheel" },
];

const ENDPOINTS = [
  { method: "GET", path: "/api/jobs", desc: "List all jobs" },
  { method: "POST", path: "/api/jobs", desc: "Create a new job" },
  { method: "GET", path: "/api/jobs/stats", desc: "Job counts by status" },
  { method: "GET", path: "/api/jobs/:id", desc: "Get job by ID" },
  { method: "PATCH", path: "/api/jobs/:id/cancel", desc: "Cancel a job" },
  { method: "GET", path: "/api/dlq", desc: "List DLQ entries" },
  { method: "POST", path: "/api/dlq/:id/retry", desc: "Re-queue a DLQ entry" },
  { method: "GET", path: "/api/events", desc: "SSE live event stream" },
  { method: "GET", path: "/api-docs", desc: "Swagger UI" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-400",
  POST: "bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/20 text-blue-700 dark:text-blue-400",
  PATCH:
    "bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20 text-amber-700 dark:text-amber-400",
};

export default function Docs() {
  const [tab, setTab] = useState<Tab>("arch");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "arch", label: "Architecture", icon: <Layers size={13} /> },
    { id: "benchmark", label: "Benchmarks", icon: <Cpu size={13} /> },
    { id: "api", label: "API reference", icon: <Terminal size={13} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-(--text-h)">Documentation</h1>
        <p className="text-xs text-(--text) mt-0.5">
          Architecture decisions, benchmarks, and API reference
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-(--border)">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === t.id
                ? "border-(--accent) text-(--accent-text)"
                : "border-transparent text-(--text) hover:text-(--text-h)"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Architecture */}
      {tab === "arch" && (
        <div className="space-y-6 text-sm">
          {[
            {
              title: "Heap-based priority queue",
              body: "The primary queue uses a min-heap ordered by effective priority → scheduled time → creation time. Jobs enter the heap only when due. Recurring jobs re-enter after completion. Stale jobs get promoted to prevent starvation.",
            },
            {
              title: "DAG workflow engine",
              body: "Jobs declare dependency IDs. The engine checks job_dependencies on each completion — dependents only enter the heap when all prerequisites are in a completed state. Stored as a join table in SQLite.",
            },
            {
              title: "Starvation prevention",
              body: "Every 2 minutes, jobs pending longer than 5 minutes have their effective_priority bumped by 1 level (3→2, 2→1). This guarantees low-priority jobs eventually execute regardless of high-priority backlog.",
            },
            {
              title: "Retry backoff with jitter",
              body: "Failed jobs retry up to 3 times. Delays: ~1s, ~5s, ~25s — base × 5^(attempt-1) + random(0, base/2). After 3 failures the job moves to the Dead Letter Queue.",
            },
            {
              title: "DLQ alert threshold",
              body: "Threshold is set to 10 entries. When crossed, the scheduler creates a webhook job pointing at DLQ_ALERT_WEBHOOK_URL with event=dlq.threshold.exceeded. In production this URL would be a PagerDuty or Slack webhook.",
            },
            {
              title: "Cancellation behaviour",
              body: "Pending jobs are removed from the heap immediately. Processing jobs are marked cancelled in the DB — the worker checks status after the handler returns and skips the status update, so the current HTTP attempt finishes but no retry is scheduled.",
            },
            {
              title: "Duplicate protection",
              body: "Before processing, the worker acquires a Redis SET NX lock on the job ID (30s TTL). If another worker already holds the lock it skips the job. On completion the lock is always released in a finally block.",
            },
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <h3 className="font-semibold text-(--text-h)">{item.title}</h3>
              <p className="text-(--text) leading-relaxed text-xs">{item.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Benchmark */}
      {tab === "benchmark" && (
        <div className="space-y-6">
          <p className="text-xs text-(--text) leading-relaxed pb-3">
            Both algorithms were benchmarked on the same machine by inserting N jobs then
            extracting all of them. The heap uses{" "}
            <code className="text-[10px] px-1 py-0.5 rounded bg-(--bg-2) border border-(--border) text-(--text-h)">
              O(log N)
            </code>{" "}
            insertion; the timing wheel uses{" "}
            <code className="text-[10px] px-1 py-0.5 rounded bg-(--bg-2) border border-(--border) text-(--text-h)">
              O(1)
            </code>{" "}
            insertion with slot-based tick advancement.
          </p>

          <div className="rounded-lg border border-(--border) overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-(--border) bg-(--bg-2) text-(--text) font-medium">
                  <th className="px-4 py-2.5">Jobs</th>
                  <th className="px-4 py-2.5">Min-heap (ms)</th>
                  <th className="px-4 py-2.5">Timing wheel (ms)</th>
                  <th className="px-4 py-2.5">Winner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {BENCHMARK.map((row, i) => (
                  <tr key={i} className="hover:bg-(--bg-2) transition-colors font-mono">
                    <td className="px-4 py-2.5 text-(--text-h)">
                      {row.jobs.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-(--text)">{row.heap}</td>
                    <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {row.wheel}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-400">
                        {row.winner}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg border border-(--border) bg-(--bg) space-y-2">
              <div className="font-semibold text-(--text-h)">Min-heap</div>
              <ul className="space-y-1 text-(--text) list-disc list-inside">
                <li>Insert: O(log N) — sifts up</li>
                <li>Extract: O(log N) — sifts down</li>
                <li>Exact ordering by priority + time</li>
                <li>Scales predictably at any volume</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-(--border) bg-(--bg) space-y-2">
              <div className="font-semibold text-(--text-h)">Timing wheel</div>
              <ul className="space-y-1 text-(--text) list-disc list-inside">
                <li>Insert: O(1) — index by delay slot</li>
                <li>Tick: O(1) — read current slot</li>
                <li>Fixed granularity (1s per slot)</li>
                <li>Memory proportional to wheel size</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* API reference */}
      {tab === "api" && (
        <div className="space-y-2">
          {ENDPOINTS.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-(--border) bg-(--bg) hover:bg-(--bg-2) transition-colors"
            >
              <span
                className={`shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-mono font-semibold ${METHOD_COLORS[e.method] ?? ""}`}
              >
                {e.method}
              </span>
              <code className="text-xs text-(--text-h) font-mono flex-1">{e.path}</code>
              <span className="text-xs text-(--text)">{e.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
