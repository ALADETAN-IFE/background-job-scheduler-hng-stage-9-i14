export function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export * from "./toastState";
