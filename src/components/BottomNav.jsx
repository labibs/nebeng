import { Link, useLocation } from 'react-router-dom'
import { Home, Plus, MessageCircle, Receipt, User, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '@clerk/clerk-react'

export default function BottomNav() {
  const location = useLocation()
  const { user } = useUser()
  const currentUserId = user?.id

  const [hidden, setHidden] = useState(false)
  const [lastScroll, setLastScroll] = useState(0)
  const [totalUnread, setTotalUnread] = useState(0)

  // Deteksi apakah tombol + sedang aktif (user di halaman /create)
  const isCreateActive = location.pathname === '/create'

  // === Hitung total unread chat ===
  useEffect(() => {
    if (!currentUserId) {
      setTotalUnread(0)
      return
    }

    const fetchTotalUnread = async () => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId)

      if (!participants?.length) {
        setTotalUnread(0)
        return
      }

      const convIds = participants.map(p => p.conversation_id)

      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id')
        .in('conversation_id', convIds)
        .neq('sender_id', currentUserId)
        .eq('is_read', false)

      setTotalUnread(unreadMessages?.length || 0)
    }

    fetchTotalUnread()

    // Realtime listener
    const channel = supabase
      .channel('bottomnav-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        fetchTotalUnread
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'is_read=eq.true' },
        fetchTotalUnread
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [currentUserId])

  // === Hide on scroll down ===
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      if (current > lastScroll && current > 80) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      setLastScroll(current)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScroll])

  return (
    <div
      className={`
        fixed inset-x-0 bottom-1 z-50 flex justify-center pointer-events-none
        transition-all duration-300
        ${hidden ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}
      `}
    >
      <div className="relative w-[95%] max-w-md h-20 pointer-events-auto">
        {/* Background navbar dengan notch di tengah untuk tombol + */}
        <div
          className="
            absolute inset-x-0 top-4 h-14
            flex items-center px-4
            rounded-full
            backdrop-blur-xl bg-white/20
            border border-white/30
            shadow-[0_8px_30px_rgba(0,0,0,0.25)]
          "
          style={{
            WebkitMaskImage: `radial-gradient(circle 32px at 50% 0, transparent 30px, black 32px)`,
            maskImage: `radial-gradient(circle 32px at 50% 0, transparent 30px, black 32px)`,
          }}
        >
          <NavItem to="/" icon={Home} currentPath={location.pathname} />
          
          <NavItem to="/chat" icon={MessageCircle} currentPath={location.pathname}>
            {totalUnread > 0 && (
              <div className="absolute -top-3 -right-4">
                <span className="badge badge-error badge-xs text-white font-bold text-[10px]">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              </div>
            )}
          </NavItem>

          {/* Spacer tengah untuk tombol + */}
          <div className="w-20" />

          <NavItem to="/transaksi" icon={Receipt} currentPath={location.pathname} />
          <NavItem to="/market" icon={Store} currentPath={location.pathname} />
        </div>

        {/* Tombol Floating + (Create) */}
        <Link to="/create" className="absolute left-1/2 -top-3 -translate-x-1/2">
          <div
            className={`
              w-14 h-14 rounded-full bg-blue-600
              flex items-center justify-center
              shadow-[0_10px_30px_rgba(37,99,235,0.6)]
              transition-all duration-300
              ${isCreateActive
                ? 'ring-3 ring-white shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-90'
                : 'ring-0 hover:scale-105'
              }
              active:scale-95
            `}
          >
            <Plus
              size={22}
              strokeWidth={2.8}
              className={`
                text-white transition-all duration-300
                ${isCreateActive ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.95)]' : ''}
              `}
            />
          </div>
        </Link>
      </div>
    </div>
  )
}

// === Komponen NavItem yang reusable ===
function NavItem({ to, icon: Icon, currentPath, children }) {
  const isActive = currentPath === to

  return (
    <Link to={to} className="flex-1 flex items-center justify-center relative">
      <div className="relative p-2">
        {/* Blur background saat active */}
        {isActive && (
          <div className="absolute inset-0 bg-blue-600 rounded-full blur-lg opacity-60 -z-10 scale-150" />
        )}

        <Icon
          size={24}
          className={`
            transition-all duration-300
            ${isActive
              ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]'
              : 'text-blue-600/70'
            }
          `}
        />

        {children}
      </div>
    </Link>
  )
}