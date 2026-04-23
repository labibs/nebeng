import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  LogOut,
  User,
  ChevronRight,
  Settings,
  Store,
  LayoutDashboard,
} from "lucide-react";

export default function Profile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", user.id)
        .single();

      if (!error) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [isLoaded, user]);

  if (loading) {
    return (
      <div className="p-6 text-center text-[#4e73df] font-bold">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-center">Profile tidak ditemukan</div>;
  }

  const menuItems = [
    {
      label: "Pengaturan",
      icon: Settings,
      action: () => alert("Pengaturan segera hadir!"),
    },
    { label: "Outlet Saya", icon: Store, action: () => navigate("/outlet") },
    { label: "Dashboard", icon: LayoutDashboard, action: () => navigate("/") },
  ];

  return (
    <>
      {/* Arrow / Tail (segitiga kecil di atas kanan) */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-t border-l border-slate-200 rotate-45" />

      {/* Konten Profile */}
      <div className="p-5 pb-6 space-y-5 pt-[env(safe-area-inset-top)]">
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
              <p className="text-sm font-bold text-white">Detail Profile</p>
              <p className="text-[10px] font-medium text-white/70">
                Lihat tampilan premium
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
            Shortcuts
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

        {/* Logout Section */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full flex items-center gap-3 p-3.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm active:bg-rose-100 group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <LogOut size={16} />
            </div>
            Logout Akun
          </button>
        </div>
      </div>
    </>
  );
}
