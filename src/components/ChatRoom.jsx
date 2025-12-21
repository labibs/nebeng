// src/components/ChatRoom.jsx
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ChatRoom() {
  const { conversationId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { user } = useUser();
  const currentUserId = user?.id;
  const currentUserAvatar = user?.imageUrl || '/default-avatar.png';

  // Recipient dari state atau fallback
  const [recipient, setRecipient] = useState(
    state?.recipient || { name: 'Loading...', imageUrl: '/default-avatar.png' }
  );

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto scroll ke bawah saat pesan baru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch recipient dari database (biar selalu akurat)
  useEffect(() => {
    if (!currentUserId || !conversationId) return;

    const fetchRecipient = async () => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', currentUserId);

      if (participants?.length > 0) {
        const opponentId = participants[0].user_id;
        const { data: opponent } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('clerk_id', opponentId)
          .single();

        setRecipient({
          name: opponent?.name || 'User',
          imageUrl: opponent?.avatar_url || '/default-avatar.png',
        });
      }
    };

    fetchRecipient();
  }, [currentUserId, conversationId]);

  // Fetch messages + realtime
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
      setLoading(false);
      scrollToBottom(); // langsung scroll ke bawah saat pertama load
    };

    fetchMessages();

    // Realtime: pesan baru dari siapa pun langsung muncul
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          // Scroll ke bawah saat pesan baru (termasuk dari lawan)
          setTimeout(scrollToBottom, 100); // delay kecil biar render dulu
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    // 1. Buat object pesan sementara (optimistic)
    const tempMessage = {
      id: `temp-${Date.now()}`, // ID sementara biar React gak error key
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
    };

    // 2. Tampilkan langsung di UI (optimistic update)
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    setTimeout(scrollToBottom, 100); // scroll langsung

    // 3. Kirim ke Supabase
    const { data: newMsg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      })
      .select() // penting: return data yang baru diinsert
      .single();

    if (error) {
      console.error('Gagal kirim pesan:', error);
      alert('Pesan gagal terkirim');
      // Hapus pesan sementara kalau gagal
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    } else {
      // Ganti pesan sementara dengan data real dari server
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempMessage.id ? newMsg : msg))
      );
    }
  };

  if (!conversationId) {
    return <div className="flex h-screen items-center justify-center text-lg">Chat tidak ditemukan</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100 shadow-lg">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="avatar online">
            <div className="w-12 rounded-full ring ring-emerald-500 ring-offset-2">
              <img src={recipient.imageUrl} alt={recipient.name} />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-lg">{recipient.name}</h2>
            <p className="text-sm opacity-70">Online</p>
          </div>
        </div>
      </div>

      {/* Area Chat - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pb-20"> {/* pb-20 biar gak ketutup input fixed */}
        {loading ? (
          <div className="flex justify-center mt-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-base-content/50 mt-20">
            Belum ada pesan. Mulai deal yuk! 💰
          </p>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat ${msg.sender_id === currentUserId ? 'chat-end' : 'chat-start'}`}
              >
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <img
                      src={msg.sender_id === currentUserId ? currentUserAvatar : recipient.imageUrl}
                      alt="avatar"
                    />
                  </div>
                </div>
                <div className="chat-header">
                  <time className="text-xs opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <div
                  className={`chat-bubble ${
                    msg.sender_id === currentUserId
                      ? 'chat-bubble-primary'
                      : 'chat-bubble-neutral'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.sender_id === currentUserId && (
                  <div className="chat-footer opacity-70 text-xs mt-1">Terkirim</div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Fixed di Bawah - Selalu Kelihatan */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-base-100 border-t shadow-lg">
        <form onSubmit={sendMessage} className="join w-full max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan deal..."
            className="input input-bordered join-item w-full"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn btn-primary join-item rounded-r-2xl"
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}