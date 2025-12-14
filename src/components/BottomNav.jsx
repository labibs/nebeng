import { Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, MessageCircle, Receipt, User } from 'lucide-react'  // Receipt untuk Transaksi

export default function BottomNav() {
  const location = useLocation()

  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/create', icon: PlusCircle, label: 'Buat' },  // Ini yang tengah
    { path: '/transaksi', icon: Receipt, label: 'Transaksi' },
    { path: '/profile', icon: User, label: 'Profil' },
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pb-2">  {/* pb-2 biar nggak ketutup safe area iOS */}
      {/* Background blur */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-base-100/80 backdrop-blur-lg" />
      
      {/* Dock dengan 5 item */}
      <div className="relative flex justify-around items-end px-4 pt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path
          const isCreate = tab.path === '/create'  // Tombol tengah spesial

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`
                flex flex-col items-center justify-center relative
                w-16 pt-2 pb-3 transition-all duration-200
                ${isActive && !isCreate ? 'text-primary' : 'text-base-content/60'}
                ${isCreate ? ' -mt-6' : ''}  // Naik tinggi biar menonjol
              `}
            >
              {/* Circle background untuk tombol Buat */}
              {isCreate && (
                <div className="absolute -top-4 w-16 h-16 rounded-full bg-primary shadow-2xl" />
              )}

              <Icon 
                size={isCreate ? 36 : 26} 
                strokeWidth={isActive ? 3 : 2}
                className={isCreate ? 'text-white relative z-10' : ''}
              />

              <span className="text-xs mt-1">
                {tab.label}
              </span>

              {/* Dot indicator active (kecuali Buat) */}
              {isActive && !isCreate && (
                <span className="absolute top-1 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Garis tipis atas dock */}
      <div className="absolute inset-x-0 top-0 h-px bg-base-300" />
    </div>
  )
}