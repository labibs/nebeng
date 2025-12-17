import { Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, MessageCircle, Receipt, User } from 'lucide-react'

export default function BottomNav() {
  const location = useLocation()

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center">
      <div className="relative w-[92%] max-w-md h-16 bg-black rounded-full flex items-center px-4 shadow-xl">

        {/* Notch */}
        <div className="absolute left-1/2 -top-6 -translate-x-1/2 w-24 h-24 pointer-events-none">
          <div className="absolute bottom-0 w-24 h-12 bg-black rounded-b-full" />
        </div>

        {/* KIRI */}
        <LinkItem to="/" icon={Home} activePath={location.pathname} />
        <LinkItem to="/chat" icon={MessageCircle} activePath={location.pathname} />

        {/* SPACER TENGAH (RUANG TOMBOL +) */}
        <div className="w-24" />

        {/* KANAN */}
        <LinkItem to="/transaksi" icon={Receipt} activePath={location.pathname} />
        <LinkItem to="/profile" icon={User} activePath={location.pathname} />

        {/* TOMBOL CREATE */}
        <Link
          to="/create"
          className="
            absolute left-1/2 -top-8 -translate-x-1/2
            active:scale-90 transition-transform
          "
        >
          <div
            className="
              w-16 h-16 rounded-full
              bg-gradient-to-br from-blue-400 to-blue-600
              flex items-center justify-center
              shadow-2xl hover:scale-105 transition
            "
            style={{
              filter: 'drop-shadow(0 0 14px rgba(251,146,60,0.9))'
            }}
          >
            <PlusCircle size={32} className="text-white" strokeWidth={2.5} />
          </div>
        </Link>
      </div>
    </div>
  )
}

function LinkItem({ to, icon: Icon, activePath }) {
  const isActive = activePath === to

  return (
    <Link
      to={to}
      className="
        flex-1 flex items-center justify-center
        active:scale-90 transition-transform
      "
    >
      <Icon
        size={24}
        className={isActive ? 'text-blue-600 scale-110' : 'text-white/70'}
        style={
          isActive
            ? { filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9))' }
            : {}
        }
      />
    </Link>
  )
}
