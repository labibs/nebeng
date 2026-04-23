import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function MainLayout() {
  return (
    <>
      <div className="min-h-[100dvh] bg-[#f0f7ff] pb-0 text-slate-900 md:pb-0 pt-[env(safe-area-inset-top)]">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}
