import { useEffect, useRef } from "react";

interface SSEEvent {
  event: string;
  handler: (data: unknown) => void;
}

export function useSSE(events: SSEEvent[]) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const baseUrl =
      (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api";
    const url = `${baseUrl}/events`;
    const es = new EventSource(url);
    esRef.current = es;

    for (const { event, handler } of events) {
      es.addEventListener(event, (e: MessageEvent) => {
        try {
          handler(JSON.parse(e.data as string));
        } catch {
          handler(e.data);
        }
      });
    }

    es.onerror = () => {
      // SSE will auto-reconnect, no action needed
    };

    return () => {
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
