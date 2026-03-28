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
    <div className={`fixed inset-x-0 bottom-1 z-50 flex justify-center pointer-events-none transition-all duration-300 ${hidden ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
      <div className="relative w-[95%] max-w-md h-20 pointer-events-auto">
        {/* Background dengan notch */}
        <div
          className="absolute inset-x-0 top-4 h-14 flex items-center justify-between px-6 rounded-full backdrop-blur-xl bg-white/20 border border-green-600/20 shadow-2xl"
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
              w-14 h-14 rounded-full bg-linear-to-r from-[#81c784] to-[#66bb6a]
              flex items-center justify-center shadow-2xl
              transition-all duration-300 active:scale-95
              ${isCreateActive
                ? 'ring-4 ring-white/80 scale-95 shadow-[0_0_20px_rgba(129,199,132,0.8)]'
                : 'hover:scale-110'
              }
            `}
          >
            <Plus size={28} strokeWidth={3} className={`${isCreateActive ? 'text-white drop-shadow-lg' : 'text-green-600/70'}`} />
          </div>
        </Link>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, currentPath, badge = 0 }) {
  const isActive = currentPath === to;

  return (
    <Link to={to} className="flex-1 flex items-center justify-center relative">
      <div className="relative p-3">
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#81c784] to-[#66bb6a] blur-xl opacity-70 -z-10 scale-125" />
        )}

        <Icon
          size={26}
          className={`transition-all duration-300 ${isActive ? 'text-white drop-shadow-lg' : 'text-green-600/70'}`}
        />

        {badge > 0 && (
          <div className="absolute -top-1 -right-1">
            <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-md">
              {badge > 99 ? '99+' : badge}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}