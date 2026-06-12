import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center space-y-4">
      <div className="text-6xl font-mono font-semibold text-(--accent-text) opacity-60">
        404
      </div>
      <h1 className="text-xl font-semibold text-(--text-h)">Page not found</h1>
      <p className="text-sm text-(--text) max-w-xs">
        This route doesn't exist. Check the URL or head back to the dashboard.
      </p>
      <Link
        to="/"
        className="mt-2 px-4 py-2.5 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-white text-sm font-medium transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
