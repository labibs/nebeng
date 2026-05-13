import { SignOutButton, UserButton } from "@clerk/clerk-react";
import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, LogOut } from "lucide-react";

const navItems = [{ label: "Dashboard", path: "/dashboard", icon: BarChart3 }];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              Nebeng
            </p>
            <h1 className="text-lg font-black">Admin Panel</h1>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Console
            </p>
            <h2 className="text-base font-black">Operasional Nebeng</h2>
          </div>
          <div className="flex items-center gap-3">
            <UserButton />
            <SignOutButton>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                title="Keluar"
              >
                <LogOut size={16} />
              </button>
            </SignOutButton>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
