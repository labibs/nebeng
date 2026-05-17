import { SignOutButton, UserButton, useUser } from "@clerk/clerk-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import AdminChatSupport from "../components/AdminChatSupport";
import AdminNotification from "../components/AdminNotification";
import {
  LayoutGrid,
  BarChart3,
  Bell,
  LogOut,
  Route,
  ReceiptText,
  Search,
  Settings,
  Store,
  Users,
  Calendar,
  MessageCircle,
  Package,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutGrid },
  { label: "Pengguna", path: "/users", icon: Users },
  { label: "Toko & Produk", path: "/outlets", icon: Store },
  { label: "Transaksi", path: "/transactions", icon: ReceiptText },
  { label: "Postingan", path: "/posts", icon: Route },
];

export default function AdminLayout() {
  const { user } = useUser();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const location = useLocation();
  const isDashboard =
    location.pathname === "/dashboard" || location.pathname === "/";

  // Fetch total unread chat count
  const fetchUnreadCount = async () => {
    if (!user) return;

    // 1. Get my conversation IDs
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    const convIds = (participants || []).map((p) => p.conversation_id);
    if (!convIds.length) {
      setUnreadChatCount(0);
      return;
    }

    // 2. Count unread messages in those conversations
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setUnreadChatCount(count || 0);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      // Subscribe to all message changes
      const channel = supabase
        .channel("global-unread-count")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          () => fetchUnreadCount(),
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [user]);

  const pageTitles = {
    "/users": "Manajemen Pengguna",
    "/outlets": "Toko & Produk",
    "/transactions": "Riwayat Aktivitas",
    "/posts": "Manajemen Postingan",
  };

  const currentPageTitle = pageTitles[location.pathname] || "Admin Panel";

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-[#1e293b]">
      {/* Sidebar */}
      <aside className="fixed inset-y-4 left-4 z-20 flex w-[76px] flex-col rounded-[24px] bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e2e8f0]">
        <div className="mb-8 flex justify-center py-2">
          <img src="/logo.svg" alt="Nebeng" className="h-9 w-9" />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-4">
          {navItems.map((item, index) => (
            <NavLink
              key={`${item.label}-${index}`}
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex h-12 w-12 items-center justify-center rounded-[16px] transition-all duration-300",
                  isActive
                    ? "bg-[#4e73df] text-white shadow-[0_8px_20px_rgba(78,115,223,0.3)] scale-105"
                    : "text-[#94a3b8] hover:bg-[#f0f7ff] hover:text-[#4e73df]",
                ].join(" ")
              }
              title={item.label}
            >
              <item.icon size={22} strokeWidth={2.5} />
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-4">
          {/* <button
            className="flex h-12 w-12 items-center justify-center rounded-[16px] text-[#94a3b8] hover:bg-[#f0f7ff] hover:text-[#4e73df] transition-colors"
            title="Pengaturan"
          >
            <Settings size={22} strokeWidth={2.5} />
          </button>*/}
          <SignOutButton>
            <button
              className="flex h-12 w-12 items-center justify-center rounded-[16px] text-[#94a3b8] hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Keluar"
            >
              <LogOut size={22} strokeWidth={2.5} />
            </button>
          </SignOutButton>
          <div className="pb-2">
            <UserButton afterSignOutUrl="/login" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-[112px] pr-8 pt-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            {isDashboard ? (
              <>
                <h1 className="text-[32px] font-black tracking-tight text-[#0f172a]">
                  Halo, {user?.firstName || "Admin"}!
                </h1>
                <p className="text-sm font-semibold text-[#64748b]">
                  Pantau informasi dan aktivitas platform Anda
                </p>
              </>
            ) : (
              <>
                <h1 className="text-[32px] font-black tracking-tight text-[#0f172a]">
                  {currentPageTitle}
                </h1>
                <p className="text-sm font-semibold text-[#64748b]">
                  Kelola dan pantau data platform Anda secara detail
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                className="h-12 w-[400px] rounded-full bg-white border border-[#e2e8f0] pl-6 pr-12 text-sm font-semibold shadow-sm outline-none placeholder:text-[#94a3b8] focus:border-[#4e73df] focus:ring-4 focus:ring-[#4e73df]/10 transition-all"
                placeholder="Cari apapun..."
              />
              <button className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-full bg-[#4e73df] text-white shadow-lg shadow-[#4e73df]/20 hover:scale-105 transition-transform">
                <Search size={16} strokeWidth={3} />
              </button>
            </div>

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`relative grid h-12 w-12 place-items-center rounded-full border shadow-sm transition-all ${
                isChatOpen
                  ? "bg-[#4e73df] border-[#4e73df] text-white"
                  : "bg-white border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc]"
              }`}
              title="Pesan Bantuan"
            >
              <MessageCircle size={22} strokeWidth={2} />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-300">
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </span>
              )}
            </button>

            <AdminNotification />
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>

      {/* Admin Chat Support Modal */}
      <AdminChatSupport
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
