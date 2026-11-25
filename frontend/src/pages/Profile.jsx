import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import { useLanguage } from "../lib/LanguageContext";
import { openChat } from "../lib/chatHelper";
import {
  LogOut,
  User,
  ChevronRight,
  Settings,
  Store,
  LayoutDashboard,
  HelpCircle,
} from "lucide-react";

export default function Profile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchProfile = async () => {
      try {
        const data = await apiFetch('/users/profile');
        if (data) setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [isLoaded, user]);

  if (loading) {
    return (
      <div className="p-6 text-center text-[#4e73df] font-bold">
        {t("Loading profile...")}
      </div>
    );
  }

  if (!profile) {
      return <div className="p-6 text-center">{t("Profil tidak ditemukan")}</div>;
  }

  const handleHelp = async () => {
    try {
      // 1. Cari user dengan role admin
      const admins = await apiFetch('/users/admins');

      if (!admins || admins.length === 0) {
        alert(t("Maaf, layanan bantuan sedang tidak tersedia."));
        return;
      }

      const admin = admins[0];

      // 2. Buat atau ambil conversation_id
      const result = await apiFetch("/conversations", {
        method: "POST",
        body: JSON.stringify({ opponent_id: admin.clerk_id }),
      });

      if (!result.conversation_id) {
        throw new Error("Gagal membuat percakapan");
      }

      // 3. Buka halaman chat
      openChat(
        result.conversation_id,
        {
          name: admin.name,
          avatar_url: admin.avatar_url,
        },
        navigate,
      );
    } catch (err) {
      console.error("Error opening help chat:", err);
      alert(t("Terjadi kesalahan saat menghubungi bantuan."));
    }
  };

  const menuItems = [
    {
      label: t("Pengaturan"),
      icon: Settings,
      action: () => setShowLanguageSettings((shown) => !shown),
    },
    { label: t("Outlet Saya"), icon: Store, action: () => navigate("/outlet") },
    {
      label: t("Bantuan"),
      icon: HelpCircle,
      action: handleHelp,
    },
  ];

  // Tambahkan shortcut Dashboard hanya jika role-nya admin
  if (profile?.role === "admin") {
    menuItems.push({
      label: t("Dashboard Admin"),
      icon: LayoutDashboard,
      action: () => {
        window.location.href =
          import.meta.env.VITE_ADMIN_URL || "https://numpak-admin.vercel.app";
      },
    });
  }

  return (
    <>
      {/* Arrow / Tail (segitiga kecil di atas kanan) */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-t border-l border-slate-200 rotate-45" />

      {/* Konten Profile */}
      <div className="p-5 pb-6 pt-5 space-y-5">
        {/* Header Profile */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={profile.avatar_url}
              alt="avatar"
              className="w-14 h-14 rounded-full object-cover ring-4 ring-[#4e73df]/10"
            />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-slate-800 truncate leading-tight">
              {profile.name}
            </h2>
            <p className="text-xs text-slate-400 truncate">{profile.email}</p>
          </div>
        </div>

        {/* View Detail Premium Link */}
        <button
          onClick={() => navigate(`/profile/detail/${user.id}`)}
          className="w-full bg-[#4e73df] p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-lg shadow-blue-900/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md border border-white/20">
              <User size={20} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">{t("Detail Profil")}</p>
              <p className="text-[10px] font-medium text-white/70">
                {t("Lihat tampilan premium")}
              </p>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="text-white group-hover:translate-x-1 transition-transform"
          />
        </button>

        {/* Shortcuts Section */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1">
            {t("Shortcuts")}
          </p>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-all group active:bg-slate-100"
            >
              <div className="flex items-center gap-3.5">
                <div className="text-slate-400 group-hover:text-[#4e73df] transition-colors">
                  <item.icon size={18} />
                </div>
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                  {item.label}
                </span>
              </div>
              <ChevronRight
                size={14}
                className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all"
              />
            </button>
          ))}
        </div>

        {showLanguageSettings && (
          <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <h3 className="text-sm font-bold text-slate-800">{t("Bahasa")}</h3>
            <p className="mt-1 text-xs text-slate-500">{t("Pilih bahasa aplikasi")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[{ id: "id", label: t("Bahasa Indonesia") }, { id: "en", label: t("Inggris") }].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={language === option.id}
                  onClick={() => setLanguage(option.id)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${language === option.id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">{t("Simpan preferensi di perangkat ini")}</p>
          </section>
        )}

        {/* Logout Section */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full flex items-center gap-3 p-3.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm active:bg-rose-100 group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <LogOut size={16} />
            </div>
            {t("Keluar")}
          </button>
        </div>
      </div>
    </>
  );
}
