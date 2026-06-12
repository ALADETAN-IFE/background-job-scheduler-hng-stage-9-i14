import { NavLink } from "react-router-dom";
import { LayoutDashboard, Plus, Inbox, BookOpen, Home } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: <Home size={14} />, end: true },
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={14} />,
    end: false,
  },
  { to: "/create", label: "New Job", icon: <Plus size={14} />, end: false },
  { to: "/dlq", label: "DLQ", icon: <Inbox size={14} />, end: false },
  { to: "/docs", label: "Docs", icon: <BookOpen size={14} />, end: false },
];

export default function Navbar() {
  return (
    <header className="border-b border-(--border) bg-(--bg) sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-12">
        {/* Brand */}
        <NavLink
          to="/"
          className="flex items-center gap-2 text-(--text-h) font-semibold text-sm"
        >
          <img src="/logo.png" alt="Scheduler Logo" className="w-6 h-6 object-cover rounded-md" />
          <span>Scheduler</span>
        </NavLink>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {links.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-(--accent-bg) text-(--accent-text)"
                    : "text-(--text) hover:text-(--text-h) hover:bg-(--bg-2)"
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
