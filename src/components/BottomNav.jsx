import { Link, useLocation } from 'react-router-dom'
import { Home, Plus, MessageCircle, Receipt, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient' // sesuaikan path
import { useUser } from '@clerk/clerk-react'

export default function BottomNav() {
  const location = useLocation()
  const { user } = useUser()
  const currentUserId = user?.id

  const [hidden, setHidden] = useState(false)
  const [lastScroll, setLastScroll] = useState(0)
  const [totalUnread, setTotalUnread] = useState(0)

  // Hitung total unread dari semua conversation
  useEffect(() => {
    if (!currentUserId) {
      setTotalUnread(0)
      return
    }

    const fetchTotalUnread = async () => {
      // Ambil semua conversation user
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (!participants || participants.length === 0) {
        setTotalUnread(0)
        return;
      }

      const convIds = participants.map(p => p.conversation_id);

      // Hitung pesan dari lawan yang belum dibaca
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id')
        .in('conversation_id', convIds)
        .neq('sender_id', currentUserId)
        .eq('is_read', false);

      setTotalUnread(unreadMessages?.length || 0);
    };

    fetchTotalUnread();

    // Realtime: update total unread saat ada pesan baru atau dibaca
    const channel = supabase
      .channel('bottomnav-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchTotalUnread()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => fetchTotalUnread()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUserId]);

  // Hide on scroll
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
      <div className="relative w-[90%] max-w-md h-14">
        {/* NAVBAR BACKGROUND */}
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
            WebkitMaskImage: `radial-gradient(circle 30px at 50% 0px, transparent 99%, black 100%)`,
            maskImage: `radial-gradient(circle 30px at 50% 0px, transparent 99%, black 100%)`,
          }}
        >
          <NavItem to="/" icon={Home} activePath={location.pathname} />
          
          {/* Chat Icon dengan Badge Unread */}
          <NavItem to="/chat" icon={MessageCircle} activePath={location.pathname}>
            {totalUnread > 0 && (
              <div className="absolute -top-1 -right-1">
                <div className="badge badge-error badge-xs text-white font-bold">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </div>
              </div>
            )}
          </NavItem>

          <div className="w-16" />

          <NavItem to="/transaksi" icon={Receipt} activePath={location.pathname} />
          <NavItem to="/profile" icon={User} activePath={location.pathname} />
        </div>

        {/* Tombol + */}
        <Link
          to="/create"
          className="absolute left-1/2 -top-7 -translate-x-1/2 active:scale-90 transition-transform z-50"
        >
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_10px_30px_rgba(37,99,235,0.6)]">
            <Plus size={26} className="text-white" strokeWidth={2.5} />
          </div>
        </Link>
      </div>
    </div>
  )
}

function NavItem({ to, icon: Icon, activePath, children }) {
  const isActive = activePath === to

  return (
    <Link to={to} className="flex-1 flex items-center justify-center relative">
      <div className="relative">
        {isActive && (
          <div className="absolute inset-0 bg-blue-600 rounded-full blur-md opacity-70 -z-10" />
        )}
        <Icon
          size={22}
          className={
            isActive
              ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]'
              : 'text-blue-600/70'
          }
        />
        {children}
      </div>
    </Link>
  )
}