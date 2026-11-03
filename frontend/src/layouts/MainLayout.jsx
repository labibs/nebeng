import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useState } from "react";

export default function MainLayout() {
  const [bottomNavHidden, setBottomNavHidden] = useState(false);

  return (
    <>
      <div className="min-h-[100dvh] bg-[#f0f7ff] pb-0 text-slate-900 md:pb-0">
        <Outlet context={{ setBottomNavHidden }} />
      </div>
      {!bottomNavHidden && <BottomNav />}
    </>
  );
}
