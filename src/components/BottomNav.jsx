import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, MessageCircle, ClipboardCheck, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '@clerk/clerk-react';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useUser();
  const currentUserId = user?.id;

  const [hidden, setHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);

  const isCreateActive = location.pathname === '/create';

  // ... (bagian useEffect unread & scroll sama seperti sebelumnya, tidak ada perubahan)

  return (
    <div className={`fixed inset-x-0 bottom-1 z-50 flex justify-center pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${hidden ? 'translate-y-24 opacity-0 scale-[0.98]' : 'translate-y-0 opacity-100 scale-100'}`}>
      <div className="relative h-20 w-[95%] max-w-md pointer-events-auto">
        {/* Background dengan notch */}
        <div
          className="absolute inset-x-0 top-4 flex h-14 items-center justify-between rounded-full border border-[#4e73df]/15 bg-white/30 px-6 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            WebkitMaskImage: 'radial-gradient(circle 34px at 50% 0, transparent 32px, black 34px)',
            maskImage: 'radial-gradient(circle 34px at 50% 0, transparent 32px, black 34px)',
          }}
        >
          <NavItem to="/" icon={Home} currentPath={location.pathname} />
          <NavItem to="/chat" icon={MessageCircle} currentPath={location.pathname} badge={totalUnread} />
          <div className="w-20" />
          <NavItem to="/transaksi" icon={ClipboardCheck} currentPath={location.pathname} />
          <NavItem to="/market" icon={Store} currentPath={location.pathname} />
        </div>

        {/* Floating Create Button - FIXED */}
        <Link to="/create" className="absolute left-1/2 -top-3 -translate-x-1/2">
          <div
            className={`
              flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-r from-[#4e73df] to-[#6c8ef8]
              shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95
              ${isCreateActive
                ? 'scale-[0.98] ring-4 ring-white/80 shadow-[0_0_24px_rgba(78,115,223,0.45)]'
                : 'hover:-translate-y-0.5 hover:scale-[1.06]'
              }
            `}
          >
            <Plus size={28} strokeWidth={3} className={`text-white drop-shadow-lg transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCreateActive ? 'rotate-90 scale-95' : 'rotate-0 scale-100'}`} />
          </div>
        </Link>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, currentPath, badge = 0 }) {
  const isActive = currentPath === to;

  return (
    <Link to={to} className="relative flex flex-1 items-center justify-center">
      <div className="relative p-3">
        <div
          className={`absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#4e73df] to-[#6c8ef8] blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isActive ? 'scale-125 opacity-70' : 'scale-75 opacity-0'
          }`}
        />

        <Icon
          size={26}
          className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive ? 'scale-110 text-white drop-shadow-lg -translate-y-0.5' : 'scale-100 text-[#4e73df]/70'}`}
        />

        {badge > 0 && (
          <div className="absolute -right-1 -top-1">
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white shadow-md">
              {badge > 99 ? '99+' : badge}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
