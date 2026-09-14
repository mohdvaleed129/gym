import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  AlertCircle,
  BarChart3,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ScrollText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/payments", label: "Payments", icon: Wallet },
  { to: "/admin/due", label: "Due & Overdue", icon: AlertCircle },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/plans", label: "Membership Plans", icon: ClipboardList },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/audit-logs", label: "Audit Log", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <span className="text-lg font-extrabold tracking-tight text-brand">BODY FLEX</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-gray-50 hover:text-ink"
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
              {admin?.name?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{admin?.name}</p>
              <p className="truncate text-xs text-muted">{admin?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-outline mt-2 w-full text-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-surface shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="text-lg font-extrabold text-brand">BODY FLEX</span>
              <button onClick={() => setDrawerOpen(false)}><X size={20} /></button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-gray-50"
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <button onClick={handleLogout} className="btn-outline mt-3 w-full text-sm">
                <LogOut size={16} /> Logout
              </button>
            </nav>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-line bg-surface px-4 md:h-16 md:px-6">
          <button className="rounded-md p-2 hover:bg-gray-100 md:hidden" onClick={() => setDrawerOpen(true)}>
            <Menu size={22} />
          </button>
          <span className="text-base font-bold text-brand md:hidden">BODY FLEX</span>
          <div className="hidden text-sm text-muted md:block">
            Welcome back, <span className="font-medium text-ink">{admin?.name}</span>
          </div>
          <div className="w-6 md:hidden" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
