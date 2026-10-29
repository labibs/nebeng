import { Outlet } from "react-router-dom";

export default function ChatLayout() {
  return (
    <div className="min-h-[100dvh] w-full max-w-full bg-[#f0f7ff] text-slate-900 pt-[env(safe-area-inset-top)] overflow-x-hidden relative flex flex-col">
      <Outlet />
    </div>
  );
}
