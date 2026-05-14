import { useEffect, useMemo, useState } from "react";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import { ShieldAlert } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import LoadingLogo from "./LoadingLogo";

function hasAdminAccess(user, profile) {
  return (
    user?.publicMetadata?.role === "admin" ||
    user?.publicMetadata?.is_admin === true ||
    profile?.role === "admin" ||
    profile?.is_admin === true
  );
}

export default function AdminGuard({ children }) {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;

    let active = true;

    async function fetchProfile() {
      setLoadingProfile(true);
      setError("");

      const { data, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError) {
        setError(profileError.message);
      } else {
        setProfile(data);
      }

      setLoadingProfile(false);
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, [isLoaded, user]);

  const allowed = useMemo(() => hasAdminAccess(user, profile), [user, profile]);

  if (!isLoaded || loadingProfile) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f0f7ff]">
        <LoadingLogo />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 p-6 text-slate-900">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <ShieldAlert size={22} />
          </div>
          <h1 className="text-xl font-bold">Akses admin ditolak</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Akun ini sudah login lewat Clerk, tetapi belum punya role admin.
          </p>
          {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
          <div className="mt-6">
            <SignOutButton>
              <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Keluar
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
