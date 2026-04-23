import { Outlet } from "react-router-dom";

export default function ChatLayout() {
  return (
    <div className="min-h-[100dvh] bg-[#f0f7ff] text-slate-900 pt-[env(safe-area-inset-top)]">
      <Outlet />
    </div>
  );
}
