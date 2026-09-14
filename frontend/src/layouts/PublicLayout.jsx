import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import api from "../services/api";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/membership", label: "Membership" },
  { to: "/trainers", label: "Trainers" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
];

export default function PublicLayout() {
  const [settings, setSettings] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.get("/settings").then((res) => setSettings(res.data.settings)).catch(() => {});
  }, []);

  const gymName = settings?.gymName || "BODY FLEX";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-extrabold tracking-tight text-brand">{gymName}</Link>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}    
                className={({ isActive }) =>
                  `text-sm font-medium transition ${isActive ? "text-brand" : "text-muted hover:text-ink"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/login" className="btn-primary text-sm">Login</Link>
          </nav>
          <button className="md:hidden" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-line bg-white p-4 md:hidden">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-gray-50"
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/login" className="btn-primary mt-2 text-sm">Login</Link>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet context={{ settings }} />
      </main>

      <footer className="border-t border-line bg-gray-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <h4 className="text-base font-bold text-ink">{gymName}</h4>
            <p className="mt-2 text-sm text-muted">{settings?.address || "A professional fitness facility."}</p>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-ink">Contact</h5>
            <p className="mt-2 text-sm text-muted">{settings?.phone}</p>
            <p className="text-sm text-muted">{settings?.email}</p>
            <p className="text-sm text-muted">{settings?.openingHours}</p>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-ink">Quick Links</h5>
            <div className="mt-2 flex flex-col gap-1 text-sm text-muted">
              <Link to="/membership" className="hover:text-ink">Membership Plans</Link>
              <Link to="/contact" className="hover:text-ink">Contact Us</Link>
              <Link to="/login" className="hover:text-ink">Member / Admin Login</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-line py-4 text-center text-xs text-muted">
          © {new Date().getFullYear()} {gymName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
