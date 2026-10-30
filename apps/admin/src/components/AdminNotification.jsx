import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { apiFetch } from "../lib/apiClient";
import {
  Bell,
  X,
  Package,
  CreditCard,
  ArrowRightLeft,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale/id";

export default function AdminNotification() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const cursorRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    cursorRef.current = new Date().toISOString();

    const poll = async () => {
      try {
        const result = await apiFetch(`/admin/notifications?after=${encodeURIComponent(cursorRef.current)}`, { clerkId: user.id });
        if (!active) return;
        cursorRef.current = result?.cursor || new Date().toISOString();
        for (const event of result?.events || []) {
          const isDeal = event.type === "deal";
          const isTransfer = event.type === "transfer";
          addNotification({
            ...event,
            icon: isDeal ? Package : isTransfer ? ArrowRightLeft : CreditCard,
            color: isDeal ? "text-blue-500" : isTransfer ? "text-purple-500" : "text-emerald-500",
            bgColor: isDeal ? "bg-blue-50" : isTransfer ? "bg-purple-50" : "bg-emerald-50",
          });
        }
      } catch (error) {
        console.error("Gagal mengambil notifikasi admin:", error);
      }
    };

    const timer = window.setInterval(poll, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user]);

  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev].slice(0, 20));
    setUnreadCount((prev) => prev + 1);
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className={`grid h-12 w-12 place-items-center rounded-full border shadow-sm transition-all ${
          isOpen
            ? "bg-[#4e73df] border-[#4e73df] text-white"
            : "bg-white border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc]"
        }`}
        title="Notifikasi"
      >
        <Bell size={22} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-300">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-[380px] origin-top-right overflow-hidden rounded-[24px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#e2e8f0] animate-in zoom-in-95 fade-in duration-200 z-[60]">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Notifikasi Aktivitas
            </h3>
            <button
              onClick={() => setNotifications([])}
              className="text-[10px] font-bold text-[#4e73df] hover:underline"
            >
              Hapus Semua
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-300">
                  <Bell size={32} />
                </div>
                <p className="text-sm font-bold text-slate-500">
                  Belum ada notifikasi
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Aktivitas platform akan muncul di sini
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <div
                    className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl ${notif.bgColor} ${notif.color}`}
                  >
                    <notif.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-800">
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Clock size={10} />
                        {formatDistanceToNow(new Date(notif.time), {
                          addSuffix: false,
                          locale: localeId,
                        })}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-50 p-3 text-center">
            <button className="text-xs font-bold text-slate-500 hover:text-[#4e73df] transition-colors">
              Lihat Semua Aktivitas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
