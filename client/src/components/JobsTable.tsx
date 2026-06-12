import { useState } from "react";
import type { Job } from "@/types/job";
import StatusBadge from "./StatusBadge";
import {
  Eye,
  Ban,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
} from "lucide-react";
import { fmt } from "@/utils";

interface Props {
  jobs: Job[];
  onCancelJob?: (id: string) => void;
}

const PRIORITY_CONFIG: Record<number, { label: string; className: string }> = {
  1: {
    label: "High",
    className:
      "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/20",
  },
  2: {
    label: "Med",
    className:
      "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20",
  },
  3: {
    label: "Low",
    className:
      "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-400/10 border-sky-200 dark:border-sky-400/20",
  },
};

export default function JobsTable({ jobs, onCancelJob }: Props) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [priorityF, setPriorityF] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }

  function handleCancel(id: string) {
    if (!onCancelJob) return;
    onCancelJob(id);
  }

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    return (
      (statusF === "all" || j.status === statusF) &&
      (priorityF === "all" || j.priority.toString() === priorityF) &&
      (j.id.toLowerCase().includes(q) ||
        j.type.toLowerCase().includes(q) ||
        JSON.stringify(j.payload).toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-lg border border-(--border) bg-(--bg)">
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text)"
            size={13}
          />
          <input
            type="text"
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-(--border) bg-(--bg-2) text-(--text-h) text-xs focus:outline-none focus:border-(--accent) transition-colors"
          />
        </div>
        <select
          value={statusF}
          onChange={(e) => {
            setStatusF(e.target.value);
            setPage(1);
          }}
          className="px-2.5 py-1.5 rounded-md border border-(--border) bg-(--bg-2) text-(--text) text-xs focus:outline-none focus:border-(--accent) cursor-pointer"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={priorityF}
          onChange={(e) => {
            setPriorityF(e.target.value);
            setPage(1);
          }}
          className="px-2.5 py-1.5 rounded-md border border-(--border) bg-(--bg-2) text-(--text) text-xs focus:outline-none focus:border-(--accent) cursor-pointer"
        >
          <option value="all">All priorities</option>
          <option value="1">High</option>
          <option value="2">Medium</option>
          <option value="3">Low</option>
        </select>
        <span className="text-xs text-(--text) ml-auto font-mono">
          {filtered.length} jobs
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-(--border) bg-(--bg) overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-(--border) bg-(--bg-2) text-(--text) font-medium">
              <th className="px-4 py-2.5">ID</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Priority</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-center">Retries</th>
              <th className="px-4 py-2.5">Scheduled / Run</th>
              <th className="px-4 py-2.5">Interval</th>
              <th className="px-4 py-2.5">Created</th>
              <th className="px-4 py-2.5">Updated</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-(--text)">
                  <AlertCircle className="mx-auto mb-2 opacity-40" size={20} />
                  <span>No jobs match the current filters</span>
                </td>
              </tr>
            ) : (
              pageItems.map((job) => {
                const prio = PRIORITY_CONFIG[job.priority];
                const cancelable =
                  job.status === "pending" || job.status === "processing";
                return (
                  <tr key={job.id} className="hover:bg-(--bg-2) transition-colors">
                    <td className="px-4 py-2.5 font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-(--text-h)" title={job.id}>
                          {job.id.slice(0, 8)}…
                        </span>
                        <button
                          onClick={() => {
                            copy(job.id);
                          }}
                          className="p-0.5 rounded text-(--text) hover:text-(--text-h)"
                        >
                          {copiedId === job.id ? (
                            <Check size={11} className="text-emerald-500" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-(--text-h) capitalize">
                      {job.type}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded border text-xs font-medium ${prio.className}`}
                      >
                        {prio.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono text-(--text)">
                      {job.retry_count}/{job.max_retries}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-(--text)">
                      {job.last_run_at
                        ? fmt(job.last_run_at)
                        : job.scheduled_at
                          ? fmt(job.scheduled_at)
                          : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {job.recurrence_interval ? (
                        <span className="px-1.5 py-0.5 rounded bg-(--accent-bg) text-(--accent-text) border border-(--accent-border) font-mono text-[10px]">
                          {job.recurrence_interval.replace("every_", "")}
                        </span>
                      ) : (
                        <span className="text-(--text) opacity-40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-(--text)">
                      {fmt(job.created_at)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-(--text)">
                      {fmt(job.updated_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                          }}
                          className="p-1.5 rounded border border-(--border) hover:bg-(--bg-2) text-(--text) hover:text-(--text-h) transition-colors"
                          title="View details"
                        >
                          <Eye size={12} />
                        </button>
                        {cancelable && onCancelJob && (
                          <button
                            onClick={() => {
                              handleCancel(job.id);
                            }}
                            className="p-1.5 rounded border border-red-200 dark:border-red-400/20 hover:bg-red-50 dark:hover:bg-red-400/10 text-red-500 transition-colors"
                            title="Cancel job"
                          >
                            <Ban size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-xs text-(--text)">
          <span className="font-mono">
            {(safePage - 1) * PER_PAGE + 1}–
            {Math.min(safePage * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
              }}
              disabled={safePage === 1}
              className="p-1.5 rounded border border-(--border) hover:bg-(--bg-2) disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="px-2 font-mono">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={safePage === totalPages}
              className="p-1.5 rounded border border-(--border) hover:bg-(--bg-2) disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-(--bg) rounded-xl border border-(--border) shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-(--border) bg-(--bg-2)">
              <h3 className="font-semibold text-sm text-(--text-h)">Job details</h3>
              <button
                onClick={() => {
                  setSelectedJob(null);
                }}
                className="text-(--text) hover:text-(--text-h) text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-(--text) mb-1">Job ID</div>
                  <div className="font-mono bg-(--bg-2) px-2 py-1 rounded border border-(--border) flex items-center justify-between text-(--text-h)">
                    <span className="truncate text-[10px]">{selectedJob.id}</span>
                    <button
                      onClick={() => {
                        copy(selectedJob.id);
                      }}
                      className="ml-1 shrink-0 text-(--text) hover:text-(--accent-text)"
                    >
                      {copiedId === selectedJob.id ? (
                        <Check size={11} className="text-emerald-500" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-(--text) mb-1">Status</div>
                  <StatusBadge status={selectedJob.status} />
                </div>
                <div>
                  <div className="text-(--text) mb-1">Type</div>
                  <div className="font-medium text-(--text-h) capitalize">
                    {selectedJob.type}
                  </div>
                </div>
                <div>
                  <div className="text-(--text) mb-1">Priority</div>
                  <span
                    className={`px-1.5 py-0.5 rounded border text-xs font-medium ${(PRIORITY_CONFIG[selectedJob.priority]).className}`}
                  >
                    {(PRIORITY_CONFIG[selectedJob.priority]).label}{" "}
                    (level {selectedJob.priority})
                  </span>
                </div>
                <div>
                  <div className="text-(--text) mb-1">Created</div>
                  <div className="font-mono text-(--text-h)">
                    {fmt(selectedJob.created_at)}
                  </div>
                </div>
                <div>
                  <div className="text-(--text) mb-1">Last run</div>
                  <div className="font-mono text-(--text-h)">
                    {fmt(selectedJob.last_run_at)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-(--text) mb-1">Payload</div>
                <pre className="p-3 rounded-lg border border-(--border) bg-(--bg-2) text-xs font-mono text-(--text-h) overflow-x-auto max-h-48">
                  {JSON.stringify(selectedJob.payload, null, 2)}
                </pre>
              </div>

              {selectedJob.error_message && (
                <div>
                  <div className="text-xs text-red-500 font-medium mb-1">Error</div>
                  <pre className="p-3 rounded-lg border border-red-200 dark:border-red-400/20 bg-red-50 dark:bg-red-400/8 text-xs font-mono text-red-600 dark:text-red-400 overflow-x-auto whitespace-pre-wrap">
                    {selectedJob.error_message}
                  </pre>
                </div>
              )}
            </div>
            <div className="flex justify-end px-5 py-3.5 border-t border-(--border) bg-(--bg-2)">
              <button
                onClick={() => {
                  setSelectedJob(null);
                }}
                className="px-4 py-2 text-xs font-medium border border-(--border) rounded-lg bg-(--bg) text-(--text-h) hover:bg-(--bg-2) transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
