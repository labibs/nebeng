import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // sesuaikan path
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale/id';

export default function ChatInbox() {
  const navigate = useNavigate();
  const { user } = useUser();
  const currentUserId = user?.id;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchConversations = async () => {
      // 1. Ambil semua conversation yang melibatkan current user
      const { data: participantRows } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (!participantRows || participantRows.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participantRows.map((p) => p.conversation_id);

      // 2. Ambil pesan terakhir untuk setiap conversation
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at, sender_id')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(1000); // cukup untuk group

      // Group pesan terakhir per conversation
      const lastMsgMap = {};
      lastMessages.forEach((msg) => {
        if (
          !lastMsgMap[msg.conversation_id] ||
          new Date(msg.created_at) > new Date(lastMsgMap[msg.conversation_id].created_at)
        ) {
          lastMsgMap[msg.conversation_id] = msg;
        }
      });

      // 3. Ambil info lawan bicara (participant lain)
      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds);

      const opponentIds = allParticipants
        .filter((p) => p.user_id !== currentUserId)
        .map((p) => p.user_id);

      const { data: opponents } = await supabase
        .from('users')
        .select('clerk_id, name, avatar_url')
        .in('clerk_id', opponentIds);

      const opponentMap = {};
      opponents.forEach((o) => {
        opponentMap[o.clerk_id] = {
          name: o.name || 'User',
          avatar_url: o.avatar_url || '/default-avatar.png',
        };
      });

      // 4. Build list conversation
      const convList = conversationIds.map((convId) => {
        const otherParticipant = allParticipants.find(
          (p) => p.conversation_id === convId && p.user_id !== currentUserId
        );
        const opponentId = otherParticipant?.user_id;
        const opponent = opponentMap[opponentId] || { name: 'Unknown', avatar_url: '/default-avatar.png' };

        const lastMsg = lastMsgMap[convId];

        return {
          conversationId: convId,
          opponent,
          lastMessage: lastMsg ? lastMsg.content : 'Belum ada pesan',
          lastTime: lastMsg ? lastMsg.created_at : new Date(),
          unread: lastMsg && lastMsg.sender_id !== currentUserId, // pesan baru dari lawan
        };
      });

      // Sort: terbaru di atas
      convList.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

      setConversations(convList);
      setLoading(false);
    };

    fetchConversations();

    // Realtime: update inbox saat ada pesan baru
    const channel = supabase
      .channel('inbox-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchConversations()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUserId]);

  const openChat = (convId, opponent) => {
    navigate(`/chat/${convId}`, {
      state: { recipient: { name: opponent.name, imageUrl: opponent.avatar_url } },
    });
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="sticky top-0 z-10 navbar bg-base-100 shadow-md">
        <div className="flex-1">
          <h1 className="ml-4 text-xl font-bold">Pesan</h1>
        </div>
      </div>

      {/* Daftar Chat */}
      <div className="divide-y divide-base-300">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-10 text-center text-base-content/60">
            <p className="text-lg">Belum ada obrolan</p>
            <p className="mt-2">Mulai chat dari post yang kamu minati!</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.conversationId}
              onClick={() => openChat(conv.conversationId, conv.opponent)}
              className="w-full flex items-center gap-4 p-4 hover:bg-base-100 transition"
            >
              <div className="avatar online">
                <div className="w-12 rounded-full ring ring-emerald-500 ring-offset-base-100 ring-offset-2">
                  <img src={conv.opponent.avatar_url} alt={conv.opponent.name} />
                </div>
              </div>

              <div className="flex-1 text-left">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-base">{conv.opponent.name}</h3>
                  <time className="text-xs text-base-content/60">
                    {formatDistanceToNow(new Date(conv.lastTime), {
                      addSuffix: true,
                      locale: localeId,
                    })}
                  </time>
                </div>
                <p className="text-sm text-base-content/70 truncate mt-1">
                  {conv.lastMessage}
                </p>
              </div>

              {/* Badge unread */}
              {conv.unread && <div className="badge badge-primary badge-sm">Baru</div>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}