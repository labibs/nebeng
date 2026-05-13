import { SignOutButton, UserButton } from "@clerk/clerk-react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Bell,
  LogOut,
  MessageCircle,
  ReceiptText,
  Search,
  Settings,
  Store,
  Users,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { label: "Users", path: "/dashboard", icon: Users },
  { label: "Outlets", path: "/dashboard", icon: Store },
  { label: "Orders", path: "/dashboard", icon: ReceiptText },
  { label: "Chat", path: "/dashboard", icon: MessageCircle },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#f0f7ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[1480px] bg-[#eaf3ff] lg:m-8 lg:min-h-[calc(100vh-4rem)] lg:rounded-[28px]">
        <aside className="fixed inset-y-6 left-6 z-20 hidden w-[78px] rounded-[26px] bg-white p-3 shadow-[0_24px_80px_rgba(42,79,150,0.14)] lg:flex lg:flex-col">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4e73df] text-white">
            <BarChart3 size={21} />
          </div>

          <nav className="flex flex-1 flex-col items-center gap-3">
            {navItems.map((item, index) => (
              <NavLink
                key={`${item.label}-${index}`}
                to={item.path}
                className={({ isActive }) =>
                  [
                    "flex h-12 w-12 items-center justify-center rounded-2xl transition",
                    isActive && index === 0
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
                      : "text-slate-500 hover:bg-[#edf3ff] hover:text-[#4e73df]",
                  ].join(" ")
                }
                title={item.label}
              >
                <item.icon size={20} />
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-3">
            <button
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-500 hover:bg-[#edf3ff] hover:text-[#4e73df]"
              title="Pengaturan"
            >
              <Settings size={20} />
            </button>
            <SignOutButton>
              <button
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                title="Keluar"
              >
                <LogOut size={20} />
              </button>
            </SignOutButton>
          </div>
        </aside>

        <div className="lg:pl-[118px]">
          <header className="flex flex-col gap-5 px-5 pb-4 pt-5 md:flex-row md:items-center md:justify-between lg:px-8 lg:pt-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full border-[6px] border-[#4e73df]/20 bg-white">
                  <span className="block h-2.5 w-2.5 rounded-full bg-[#4e73df]" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4e73df]">
                    Nebeng Admin
                  </p>
                  <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                    Dashboard Operasional
                  </h1>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Pantau user, outlet, transaksi, dan aktivitas marketplace.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="hidden h-12 w-[320px] items-center rounded-full bg-white px-4 shadow-sm md:flex">
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                  placeholder="Search..."
                />
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white">
                  <Search size={17} />
                </span>
              </label>
              <button className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-700 shadow-sm">
                <Bell size={19} />
              </button>
              <UserButton />
            </div>
          </header>

          <main className="px-5 pb-6 lg:px-8 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
