import { Outlet } from 'react-router-dom';

export default function ChatLayout() {
  return (
    <div className="min-h-screen bg-[#f0f7ff] text-slate-900">
      <Outlet />
    </div>
  );
}
