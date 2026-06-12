import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createJob, getJobs } from "@/api/jobs";
import type { Job, CreateJobPayload, RecurrenceInterval } from "@/types/job";
import { toast } from "@/utils";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { fmt } from "@/utils";

interface Header {
  key: string;
  value: string;
}

export default function CreateJob() {
  const navigate = useNavigate();
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [url, setUrl] = useState("https://webhook.site/");
  const [method, setMethod] = useState<"POST" | "PUT" | "PATCH">("POST");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json" },
  ]);
  const [bodyStr, setBodyStr] = useState('{\n  "event": "test"\n}');
  const [timeoutMs, setTimeoutMs] = useState(10000);
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [scheduledAt, setScheduledAt] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [deps, setDeps] = useState<string[]>([]);

  useEffect(() => {
    getJobs()
      .then((all) => {
        setPendingJobs(
          all.filter((j) => j.status === "pending" || j.status === "processing"),
        );
      })
      .catch(() => {
        toast.error(
          "Could not load existing jobs",
          "Dependencies list may be incomplete.",
        );
      });
  }, []);

  function toggleDep(id: string) {
    setDeps((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    let body: CreateJobPayload["payload"]["body"];
    if (bodyStr.trim()) {
      try {
        body = JSON.parse(bodyStr) as CreateJobPayload["payload"]["body"];
      } catch {
        toast.error("Invalid JSON", "Check your payload body syntax.");
        return;
      }
    }

    const parsedHeaders: Record<string, string> = {};
    for (const h of headers) {
      if (h.key.trim()) parsedHeaders[h.key.trim()] = h.value.trim();
    }

    const payload: CreateJobPayload = {
      type: "webhook",
      priority,
      payload: { url, method, headers: parsedHeaders, body, timeout_ms: timeoutMs },
    };
    if (scheduledAt) payload.scheduled_at = new Date(scheduledAt).toISOString();
    if (recurrence !== "none")
      payload.recurrence_interval = recurrence as RecurrenceInterval;
    if (deps.length > 0) payload.dependency_ids = deps;

    setSubmitting(true);
    try {
      await createJob(payload);
      toast.success("Job scheduled", "Redirecting to dashboard…");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err: unknown) {
      const errMsg = err as { response?: { data?: { message?: string } } };
      const msg = errMsg.response?.data?.message;
      toast.error("Failed to schedule job", msg ?? "Check the backend logs.");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full px-3 py-2 rounded-lg border border-(--border) bg-(--bg-2) text-(--text-h) text-xs focus:outline-none focus:border-(--accent) transition-colors";
  const labelClass = "block text-xs font-medium text-(--text) mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="p-1.5 border border-(--border) rounded-lg hover:bg-(--bg-2) text-(--text) transition-colors"
        >
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-(--text-h)">New job</h1>
          <p className="text-xs text-(--text) mt-1!">
            Configure a webhook job to run in the background
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-5"
      >
        {/* Webhook */}
        <section className="p-5 rounded-lg border border-(--border) bg-(--bg) space-y-4">
          <h2 className="text-xs font-semibold text-(--text-h) uppercase tracking-wide">
            Webhook target
          </h2>

          <div className="flex gap-2 mt-2">
            <div className="w-28">
              <label className={labelClass}>Method</label>
              <select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value as "POST" | "PUT" | "PATCH");
                }}
                className={fieldClass + " cursor-pointer"}
              >
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
              </select>
            </div>
            <div className="flex-1">
              <label className={labelClass}>
                URL <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                }}
                placeholder="https://…"
                className={fieldClass}
              />
            </div>
          </div>

          {/* Headers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass + " mb-0"}>Headers</label>
              <button
                type="button"
                onClick={() => {
                  setHeaders([...headers, { key: "", value: "" }]);
                }}
                className="flex items-center gap-1 text-xs text-(--accent-text) hover:opacity-80"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-1.5">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    placeholder="Name"
                    value={h.key}
                    onChange={(e) => {
                      setHeaders(
                        headers.map((x, j) =>
                          j === i ? { ...x, key: e.target.value } : x,
                        ),
                      );
                    }}
                    className={fieldClass + " flex-1"}
                  />
                  <input
                    placeholder="Value"
                    value={h.value}
                    onChange={(e) => {
                      setHeaders(
                        headers.map((x, j) =>
                          j === i ? { ...x, value: e.target.value } : x,
                        ),
                      );
                    }}
                    className={fieldClass + " flex-1"}
                  />
                  {headers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setHeaders(headers.filter((_, j) => j !== i));
                      }}
                      className="p-1.5 text-(--text) hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className={labelClass}>JSON body</label>
            <textarea
              rows={4}
              value={bodyStr}
              onChange={(e) => {
                setBodyStr(e.target.value);
              }}
              className={fieldClass + " font-mono resize-y"}
            />
          </div>

          <div className="w-40">
            <label className={labelClass}>Timeout (ms)</label>
            <input
              type="number"
              value={timeoutMs}
              onChange={(e) => {
                setTimeoutMs(Number(e.target.value));
              }}
              className={fieldClass}
            />
          </div>
        </section>

        {/* Schedule */}
        <section className="p-5 rounded-lg border border-(--border) bg-(--bg) space-y-4">
          <h2 className="text-xs font-semibold text-(--text-h) uppercase tracking-wide">
            Schedule & priority
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Priority */}
            <div>
              <label className={labelClass}>Priority</label>
              <div className="space-y-1.5">
                {([1, 2, 3] as const).map((v) => (
                  <label
                    key={v}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${priority === v ? "border-(--accent-border) bg-(--accent-bg)" : "border-(--border) hover:border-(--accent-border)"}`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === v}
                      onChange={() => {
                        setPriority(v);
                      }}
                      className="accent-(--accent)"
                    />
                    <div>
                      <div className="text-xs font-medium text-(--text-h)">
                        {["High", "Medium", "Low"][v - 1]}
                      </div>
                      <div className="text-[10px] text-(--text)">
                        {["First in queue", "Normal", "When idle"][v - 1]}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Scheduled at */}
            <div>
              <label className={labelClass}>Run at (optional)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => {
                  setScheduledAt(e.target.value);
                }}
                className={fieldClass + " cursor-pointer"}
              />
              <p className="text-[10px] text-(--text) mt-1.5">
                Leave empty to run immediately.
              </p>
            </div>

            {/* Recurrence */}
            <div>
              <label className={labelClass}>Recurrence</label>
              <select
                value={recurrence}
                onChange={(e) => {
                  setRecurrence(e.target.value);
                }}
                className={fieldClass + " cursor-pointer"}
              >
                <option value="none">One-off</option>
                <option value="every_1_minute">Every 1 min</option>
                <option value="every_5_minutes">Every 5 min</option>
                <option value="every_1_hour">Every 1 hour</option>
                <option value="every_1_day">Every 1 day</option>
              </select>
              <p className="text-[10px] text-(--text) mt-1.5">
                Recurring jobs re-queue automatically after completion.
              </p>
            </div>
          </div>
        </section>

        {/* Dependencies */}
        <section className="p-5 rounded-lg border border-(--border) bg-(--bg) space-y-3">
          <div>
            <h2 className="text-xs font-semibold text-(--text-h) uppercase tracking-wide">
              Dependencies (DAG)
            </h2>
            <p className="text-xs text-(--text) mt-1">
              This job will wait until all selected jobs complete.
            </p>
          </div>
          {pendingJobs.length === 0 ? (
            <div className="py-5 text-center text-xs text-(--text) border border-dashed border-(--border) rounded-lg">
              No active jobs to depend on
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto divide-y divide-(--border) border border-(--border) rounded-lg">
              {pendingJobs.map((job) => (
                <label
                  key={job.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-(--bg-2) cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={deps.includes(job.id)}
                    onChange={() => {
                      toggleDep(job.id);
                    }}
                    className="accent-(--accent)"
                  />
                  <span className="font-mono text-[10px] text-(--text-h)">
                    {job.id.slice(0, 16)}…
                  </span>
                  <span className="text-[10px] text-(--text) ml-auto">
                    {fmt(job.created_at)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 text-xs font-medium border border-(--border) rounded-lg text-(--text-h) hover:bg-(--bg-2) transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-semibold bg-(--accent)/50 hover:bg-(--accent-hover)/20 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Scheduling…" : "Schedule job"}
          </button>
        </div>
      </form>
    </div>
  );
}
