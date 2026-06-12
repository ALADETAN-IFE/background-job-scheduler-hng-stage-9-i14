import { useEffect, useState } from "react";
import { getDLQ, retryDLQEntry } from "@/api/jobs";
import type { DLQEntry } from "@/types/job";
import { useSSE } from "@/hooks/useSSE";
import { toast } from "@/utils";
import {
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  Eye,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const THRESHOLD = 10;

export default function DLQ() {
  const [entries, setEntries] = useState<DLQEntry[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<DLQEntry | null>(null);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  function fetch() {
    setLoading(true);
    getDLQ()
      .then((res) => {
        setEntries(res.data);
        setCount(res.count);
        setError(null);
      })
      .catch(() => {
        setError("Could not load DLQ entries.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch();
  }, []);

  useSSE([
    {
      event: "job.failed",
      handler: () => {
        fetch();
      },
    },
    {
      event: "job.retry",
      handler: () => {
        fetch();
      },
    },
  ]);

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => {
      setCopied(null);
    }, 2000);
  }

  function handleRetry(id: string, jobId: string) {
    setRetrying((p) => ({ ...p, [id]: true }));
    retryDLQEntry(id)
      .then(() => {
        setEntries((p) => p.filter((e) => e.id !== id));
        setCount((p) => Math.max(0, p - 1));
        if (selected?.id === id) setSelected(null);
        toast.success(
          "Job re-queued",
          `Job ${jobId.slice(0, 8)}… sent back to scheduler.`,
        );

        void navigate("/dashboard");
      })
      .catch(() => {
        toast.error("Retry failed", "The job could not be re-queued.");
      })
      .finally(() => {
        setRetrying((p) => ({ ...p, [id]: false }));
      });
  }

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.job_id.includes(q) ||
      e.error_message.toLowerCase().includes(q) ||
      e.job_type.includes(q)
    );
  });

  function fmt(d: string) {
    return new Date(d).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-(--text-h)">Dead Letter Queue</h1>
          <p className="text-xs text-(--text) mt-0.5">
            Jobs that exhausted all retries — inspect errors and re-queue manually
          </p>
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-(--border) rounded-lg bg-(--bg) text-(--text-h) hover:bg-(--bg-2) transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Threshold warning */}
      {count >= THRESHOLD && (
        <div className="alert alert-warn">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">
              DLQ threshold exceeded — {count}/{THRESHOLD}
            </div>
            <div className="text-xs mt-0.5 opacity-80">
              An alert webhook has been dispatched to the configured endpoint.
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <XCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search + count */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text)"
            size={13}
          />
          <input
            type="text"
            placeholder="Search by ID, error, type…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-(--border) bg-(--bg) text-(--text-h) text-xs focus:outline-none focus:border-(--accent) transition-colors"
          />
        </div>
        <span className="text-xs font-mono text-(--text) border border-(--border) rounded-lg px-3 py-1.5 bg-(--bg-2)">
          {count} / {THRESHOLD} threshold
        </span>
      </div>

      {/* Entries */}
      {loading && entries.length === 0 ? (
        <div className="py-16 text-center text-(--text) border border-(--border) rounded-lg">
          <RefreshCw className="animate-spin mx-auto mb-2 opacity-40" size={18} />
          <span className="text-sm">Loading DLQ…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-14 text-center border border-(--border) rounded-lg bg-(--bg) space-y-2">
          <CheckCircle className="mx-auto text-emerald-500 opacity-60" size={24} />
          <div className="text-sm font-medium text-(--text-h)">DLQ is empty</div>
          <div className="text-xs text-(--text)">No failed jobs awaiting review</div>
        </div>
      ) : (
        <div className="divide-y divide-(--border) border border-(--border) rounded-lg bg-(--bg) overflow-hidden">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-4 p-4 hover:bg-(--bg-2) transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 text-red-600 dark:text-red-400 font-medium capitalize">
                    {entry.job_type}
                  </span>
                  <span className="font-mono text-(--text) flex items-center gap-1">
                    {entry.job_id.slice(0, 16)}…
                    <button
                      onClick={() => {
                        copy(entry.job_id);
                      }}
                      className="text-(--text) hover:text-(--text-h)"
                    >
                      {copied === entry.job_id ? (
                        <Check size={11} className="text-emerald-500" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </span>
                  <span className="text-(--text) opacity-60">{fmt(entry.failed_at)}</span>
                  <span className="text-(--text) opacity-60">
                    {entry.retry_count} retries
                  </span>
                </div>
                <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-400/8 border border-red-200 dark:border-red-400/15 font-mono text-xs text-red-600 dark:text-red-400 truncate">
                  {entry.error_message}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelected(entry);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-(--border) rounded-lg bg-(--bg) text-(--text-h) hover:bg-(--bg-2) transition-colors cursor-pointer"
                >
                  <Eye size={12} /> Inspect
                </button>
                <button
                  onClick={() => {
                    handleRetry(entry.id, entry.job_id);
                  }}
                  disabled={retrying[entry.id]}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-200 dark:border-red-400/20 rounded-lg bg-red-50 dark:bg-red-400/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-400/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    size={12}
                    className={retrying[entry.id] ? "animate-spin" : ""}
                  />
                  {retrying[entry.id] ? "Retrying…" : "Retry"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-(--bg) rounded-xl border border-(--border) shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-(--border) bg-(--bg-2)">
              <h3 className="text-sm font-semibold text-(--text-h) flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                DLQ entry
              </h3>
              <button
                onClick={() => {
                  setSelected(null);
                }}
                className="text-(--text) hover:text-(--text-h) text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-(--text) mb-1">Job ID</div>
                  <div className="font-mono bg-(--bg-2) px-2 py-1 rounded border border-(--border) flex items-center justify-between text-(--text-h)">
                    <span className="truncate text-[10px]">{selected.job_id}</span>
                    <button
                      onClick={() => {
                        copy(selected.job_id);
                      }}
                      className="ml-1 shrink-0"
                    >
                      {copied === selected.job_id ? (
                        <Check size={11} className="text-emerald-500" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-(--text) mb-1">Type</div>
                  <div className="font-medium text-(--text-h) capitalize">
                    {selected.job_type}
                  </div>
                </div>
                <div>
                  <div className="text-(--text) mb-1">Retries</div>
                  <div className="font-medium text-(--text-h)">
                    {selected.retry_count}
                  </div>
                </div>
                <div>
                  <div className="text-(--text) mb-1">Failed at</div>
                  <div className="font-mono text-(--text-h)">
                    {fmt(selected.failed_at)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-red-500 font-medium mb-1">Error</div>
                <pre className="p-3 rounded-lg border border-red-200 dark:border-red-400/20 bg-red-50 dark:bg-red-400/8 text-xs font-mono text-red-600 dark:text-red-400 overflow-x-auto whitespace-pre-wrap">
                  {selected.error_message}
                </pre>
              </div>

              <div>
                <div className="text-xs text-(--text) mb-1">Payload</div>
                <pre className="p-3 rounded-lg border border-(--border) bg-(--bg-2) text-xs font-mono text-(--text-h) overflow-x-auto max-h-40">
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-3.5 border-t border-(--border) bg-(--bg-2)">
              <button
                onClick={() => {
                  setSelected(null);
                }}
                className="px-4 py-2 text-xs font-medium border border-(--border) rounded-lg bg-(--bg) text-(--text-h) hover:bg-(--bg-2) transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleRetry(selected.id, selected.job_id);
                }}
                disabled={retrying[selected.id]}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  size={12}
                  className={retrying[selected.id] ? "animate-spin" : ""}
                />
                Retry now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
