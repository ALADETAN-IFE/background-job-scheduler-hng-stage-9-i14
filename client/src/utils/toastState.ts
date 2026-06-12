export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

type ToastListener = (toasts: Toast[] | ((prev: Toast[]) => Toast[])) => void;
let listener: ToastListener | null = null;

// Public trigger object
export const toast = {
  success: (title: string, message?: string) => {
    _add("success", title, message);
  },
  error: (title: string, message?: string) => {
    _add("error", title, message);
  },
  info: (title: string, message?: string) => {
    _add("info", title, message);
  },
};

function _add(type: ToastType, title: string, message?: string) {
  const id = Math.random().toString(36).slice(2);

  if (listener) {
    listener((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      listener?.((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }
}

// Internal binding methods for the provider component to hook into
export function _subscribe(registerListener: ToastListener) {
  listener = registerListener;
}

export function _unsubscribe() {
  listener = null;
}
