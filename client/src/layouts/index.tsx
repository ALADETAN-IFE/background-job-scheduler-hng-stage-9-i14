import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ToastProvider from "@/components/Toast";

export function Layout() {
  const [sseConnected, setSseConnected] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const base =
      (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api";
    const es = new EventSource(`${base}/events`);
    es.onopen = () => {
      setSseConnected(true);
    };
    es.onerror = () => {
      setSseConnected(false);
    };
    return () => {
      es.close();
    };
  }, []);

  const pathname = location.pathname;

  console.log(pathname);

  return (
    <div className="flex flex-col min-h-screen bg-(--bg) text-(--text)">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      {(pathname === "/" || pathname === "/docs") && (
        <footer className="border-t border-(--border) bg-(--bg-2)">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-(--text)">
            <span>© {new Date().getFullYear()} JobScheduler</span>
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${sseConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
              />
              <span className="font-mono">{sseConnected ? "Live" : "Connecting…"}</span>
            </div>
          </div>
        </footer>
      )}

      <ToastProvider />
    </div>
  );
}
