import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

export default function MainLayout() {
  return (
    <>
      <div className="min-h-screen bg-[#f0f7ff] pb-0 text-slate-900 md:pb-0">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}
