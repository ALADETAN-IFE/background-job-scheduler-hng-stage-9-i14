import type { JobStatus } from "@/types/job";

interface Props {
  status: JobStatus;
}

const CONFIG: Record<
  JobStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-400/10",
    border: "border-amber-200 dark:border-amber-400/20",
  },
  processing: {
    label: "Processing",
    dot: "bg-blue-400",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-400/10",
    border: "border-blue-200 dark:border-blue-400/20",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-400/10",
    border: "border-emerald-200 dark:border-emerald-400/20",
  },
  failed: {
    label: "Failed",
    dot: "bg-red-400",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-400/10",
    border: "border-red-200 dark:border-red-400/20",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-400/10",
    border: "border-slate-200 dark:border-slate-400/20",
  },
};

export default function StatusBadge({ status }: Props) {
  const c = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${c.bg} ${c.border} ${c.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === "processing" ? "animate-pulse" : ""}`}
      />
      {c.label}
    </span>
  );
}
