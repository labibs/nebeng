import { Link, useLocation } from 'react-router-dom'
import { Home, Plus, MessageCircle, Receipt, User } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function BottomNav() {
  const location = useLocation()
  const [hidden, setHidden] = useState(false)
  const [lastScroll, setLastScroll] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      if (current > lastScroll && current > 80) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      setLastScroll(current)
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastScroll])

  return (
    <div
      className={`
        fixed inset-x-0 bottom-4 z-50 flex justify-center
        transition-all duration-300
        ${hidden ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'}
      `}
    >
      {/* WRAPPER */}
      <div className="relative w-[90%] max-w-md h-14">

        {/* === NAVBAR (MASKED / BOLOBG) === */}
        <div
          className="
            absolute inset-0
            flex items-center px-3
            rounded-full
            backdrop-blur-xl bg-white/20
            border border-white/30
            shadow-[0_8px_30px_rgba(0,0,0,0.25)]
          "
          style={{
            WebkitMaskImage: `
              radial-gradient(
                circle 30px at 50% 0px,
                transparent 99%,
                black 100%
              )
            `,
            maskImage: `
              radial-gradient(
                circle 30px at 50% 0px,
                transparent 99%,
                black 100%
              )
            `,
          }}
        >
          {/* KIRI */}
          <NavItem to="/" icon={Home} activePath={location.pathname} />
          <NavItem to="/chat" icon={MessageCircle} activePath={location.pathname} />

          {/* SPACE */}
          <div className="w-16" />

          {/* KANAN */}
          <NavItem to="/transaksi" icon={Receipt} activePath={location.pathname} />
          <NavItem to="/profile" icon={User} activePath={location.pathname} />
        </div>

        {/* === TOMBOL + (DI LUAR MASK) === */}
        <Link
          to="/create"
          className="
            absolute left-1/2 -top-7 -translate-x-1/2
            active:scale-90 transition-transform
            z-50
          "
        >
          <div
            className="
              w-14 h-14 rounded-full
              bg-blue-600
              flex items-center justify-center
              shadow-[0_10px_30px_rgba(37,99,235,0.6)]
            "
          >
            <Plus size={26} className="text-white" strokeWidth={2.5} />
          </div>
        </Link>

      </div>
    </div>
  )
}

function NavItem({ to, icon: Icon, activePath }) {
  const isActive = activePath === to

  return (
    <Link to={to} className="flex-1 flex items-center justify-center">
      <Icon
        size={22}
        className={
          isActive
            ? 'text-blue scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]'
            : 'text-blue/70'
        }
      />
    </Link>
  )
}
