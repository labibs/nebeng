import { Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, MessageCircle, Receipt, User } from 'lucide-react'

export default function BottomNav() {
  const location = useLocation()

  const tabs = [
    { path: '/', icon: Home },
    { path: '/chat', icon: MessageCircle },
    { path: '/create', icon: PlusCircle },
    { path: '/transaksi', icon: Receipt },
    { path: '/profile', icon: User },
  ]

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center">
      {/* Dock */}
      <div className="relative w-[92%] max-w-md h-16 bg-black rounded-full flex items-center justify-between px-6 shadow-xl">

        {/* Notch */}
        <div className="absolute left-1/2 -top-6 -translate-x-1/2 w-20 h-20 pointer-events-none">
          <div className="absolute bottom-0 w-20 h-10 bg-black rounded-b-full" />
        </div>

        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path
          const isCreate = tab.path === '/create'

          if (isCreate) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="absolute left-1/2 -top-8 -translate-x-1/2
                  active:scale-90 transition-transform duration-150"
              >
                {/* Create Button */}
                <div
                  className="
                    w-16 h-16 rounded-full
                    bg-gradient-to-br from-orange-400 to-orange-600
                    flex items-center justify-center
                    shadow-2xl
                    animate-pulse
                    hover:scale-105
                    transition
                  "
                  style={{
                    filter:
                      'drop-shadow(0 0 12px rgba(251,146,60,0.9))'
                  }}
                >
                  <Icon size={32} className="text-white" strokeWidth={2.5} />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="
                flex flex-1 items-center justify-center
                transition-transform duration-150
                active:scale-90
              "
            >
              <Icon
                size={24}
                strokeWidth={2}
                className={`
                  transition-all duration-200
                  ${isActive ? 'text-white scale-110' : 'text-white/70'}
                `}
                style={
                  isActive
                    ? {
                        filter:
                          'drop-shadow(0 0 8px rgba(255,255,255,0.9))'
                      }
                    : {}
                }
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
