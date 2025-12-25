// src/pages/Chat.jsx
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale/id';

export default function ChatInbox() {
  const navigate = useNavigate();
  const { user } = useUser();
  const currentUserId = user?.id;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!currentUserId) return;

    console.log('Refreshing inbox conversations...');

    // 1. Ambil conversation user
    const { data: participantRows } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (!participantRows || participantRows.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationIds = participantRows.map(p => p.conversation_id);

    // 2. Ambil semua pesan relevan untuk last message + unread count
    const { data: messages } = await supabase
      .from('messages')
      .select('id, conversation_id, content, created_at, sender_id, is_read')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    if (!messages || messages.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Last message per conversation
    const lastMsgMap = {};
    messages.forEach(msg => {
      if (!lastMsgMap[msg.conversation_id] || new Date(msg.created_at) > new Date(lastMsgMap[msg.conversation_id].created_at)) {
        lastMsgMap[msg.conversation_id] = msg;
      }
    });

    // Unread count per conversation
    const unreadCountMap = {};
    messages.forEach(msg => {
      if (msg.sender_id !== currentUserId && !msg.is_read) {
        unreadCountMap[msg.conversation_id] = (unreadCountMap[msg.conversation_id] || 0) + 1;
      }
    });

    // 3. Ambil lawan bicara
    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', conversationIds);

    const opponentIds = allParticipants
      .filter(p => p.user_id !== currentUserId)
      .map(p => p.user_id);

    const { data: opponents } = await supabase
      .from('users')
      .select('clerk_id, name, avatar_url')
      .in('clerk_id', opponentIds);

    const opponentMap = {};
    opponents?.forEach(o => {
      opponentMap[o.clerk_id] = {
        name: o.name || 'User',
        avatar_url: o.avatar_url || '/default-avatar.png',
      };
    });

    // 4. Build list
    const convList = conversationIds.map(convId => {
      const opponentId = allParticipants.find(p => p.conversation_id === convId && p.user_id !== currentUserId)?.user_id;
      const opponent = opponentMap[opponentId] || { name: 'Unknown', avatar_url: '/default-avatar.png' };

      const lastMsg = lastMsgMap[convId];

      return {
        conversationId: convId,
        opponent,
        lastMessage: lastMsg ? lastMsg.content : 'Belum ada pesan',
        lastTime: lastMsg ? lastMsg.created_at : new Date(),
        unreadCount: unreadCountMap[convId] || 0,
      };
    });

    convList.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

    setConversations(convList);
    setLoading(false);
  };

  // Initial load + realtime
  useEffect(() => {
    if (!currentUserId) return;

    fetchConversations();

    const channel = supabase
      .channel('inbox-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Force refresh saat kembali ke tab / halaman inbox
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        fetchConversations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', fetchConversations);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', fetchConversations);
    };
  }, [currentUserId]);

  const openChat = (convId, opponent) => {
    navigate(`/chat/${convId}`, {
      state: { recipient: { name: opponent.name, imageUrl: opponent.avatar_url } },
    });
  };

  return (
  <div className="min-h-screen bg-transparent">

    {/* Navbar */}
    <div className="sticky top-0 z-10 navbar bg-base-100/70 backdrop-blur-xl shadow-sm">
      <div className="flex-1">
        <h3 className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Chat
        </h3>
      </div>
    </div>

    <div className="bg-transparent">
      {loading ? (
        /* ============================
           💀 Skeleton Chat List Loader
        ============================ */
        <div className="p-4 space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i}>
              <div className="flex items-center gap-4">
                <div className="skeleton w-12 h-12 rounded-full"></div>

                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32"></div>
                  <div className="skeleton h-3 w-52"></div>
                </div>
              </div>

              {/* garis bawah fade kiri–kanan */}
              <div className="h-px mt-4 bg-white/20 mask-linear-to-r from-transparent via-white/60 to-transparent" />
            </div>
          ))}
        </div>

      ) : conversations.length === 0 ? (

        <div className="p-12 text-center text-base-content/60">
          <p className="text-lg font-medium">Belum ada obrolan</p>
          <p className="mt-3 text-sm">Mulai chat dari post yang kamu minati!</p>
        </div>

      ) : (

        /* ============================
           📩 Chat List Nyata
        ============================ */
        <div className="divide-y divide-transparent">
          {conversations.map((conv, index) => (
            <div key={conv.conversationId}>
              <button
                onClick={() => openChat(conv.conversationId, conv.opponent)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition duration-200 text-left"
              >
                {/* Avatar */}
                <div className="avatar">
                  <div className="w-12 rounded-full">
                    <img
                      src={conv.opponent.avatar_url || '/default-avatar.png'}
                      alt={conv.opponent.name}
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Nama + pesan */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-base truncate pr-2">
                      {conv.opponent.name}
                    </h3>

                    <time className="text-xs text-base-content/60 shrink-0">
                      {(() => {
                        const diff = Math.floor((Date.now() - new Date(conv.lastTime)) / 1000);
                        if (diff < 60) return 'Baru saja';
                        return formatDistanceToNow(new Date(conv.lastTime), {
                          addSuffix: true,
                          locale: localeId,
                        });
                      })()}
                    </time>
                  </div>

                  <p className="text-sm text-base-content/70 truncate">
                    {conv.lastMessage || 'Mulai obrolan...'}
                  </p>
                </div>

                {/* Badge unread */}
                {conv.unreadCount > 0 && (
                  <div className="badge badge-primary badge-sm font-bold min-w-6">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </div>
                )}
              </button>

              {/* garis bawah — simple + elegant */}
              <div className="h-px bg-white/20 mx-4
                  mask-linear-to-r from-transparent via-white/70 to-transparent" />
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

}