import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { _subscribe, _unsubscribe, type Toast } from "@/utils";

const ICONS = {
  success: <CheckCircle size={16} className="shrink-0 mt-0.5" />,
  error: <XCircle size={16} className="shrink-0 mt-0.5" />,
  info: <Info size={16} className="shrink-0 mt-0.5" />,
};

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    _subscribe(setToasts);
    return () => {
      _unsubscribe();
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type} pointer-events-auto flex gap-3 p-4 rounded-lg border shadow-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800`}
        >
          {ICONS[t.type]}
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-semibold">{t.title}</div>
            {t.message && (
              <div className="text-xs mt-0.5 opacity-80 leading-relaxed">{t.message}</div>
            )}
          </div>
          <button
            onClick={() => {
              setToasts((prev) => prev.filter((x) => x.id !== t.id));
            }}
            className="shrink-0 h-fit opacity-60 hover:opacity-100 transition-opacity mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
