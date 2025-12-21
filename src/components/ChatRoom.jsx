// src/components/ChatRoom.jsx
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient'; // sesuaikan path

export default function ChatRoom() {
  const { conversationId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { user } = useUser();
  const currentUserId = user?.id;
  const currentUserAvatar = user?.imageUrl || '/default-avatar.png';

  // Recipient = pemosting post (nama & avatar diambil dari state saat navigate)
  const [recipient, setRecipient] = useState({
    name: 'Loading...',
    imageUrl: '/default-avatar.png',
  });

  useEffect(() => {
    if (!currentUserId || !conversationId) return;

    const fetchRecipient = async () => {
      // Ambil participant lain (bukan current user)
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', currentUserId); // bukan diri sendiri

      if (participants && participants.length > 0) {
        const opponentClerkId = participants[0].user_id;

        // Ambil data user lawan bicara
        const { data: opponentUser } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('clerk_id', opponentClerkId)
          .single();

        if (opponentUser) {
          setRecipient({
            name: opponentUser.name || 'User',
            imageUrl: opponentUser.avatar_url || '/default-avatar.png',
          });
        }
      } else {
        setRecipient({ name: 'User Tidak Ditemukan', imageUrl: '/default-avatar.png' });
      }
    };

    fetchRecipient();
  }, [currentUserId, conversationId]);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error);
      else setMessages(data || []);

      setLoading(false);
    };

    fetchMessages();

    // Realtime: pesan baru masuk
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
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: newMessage.trim(),
    });

    if (error) {
      console.error('Gagal kirim:', error);
      alert('Pesan gagal terkirim');
    } else {
      setNewMessage('');
    }
  };

  if (!conversationId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Chat tidak ditemukan</p>
      </div>
    );
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
            <div className="w-12 rounded-full ring ring-emerald-500 ring-offset-base-100 ring-offset-2">
              <img src={recipient.imageUrl} alt={recipient.name} />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-lg">{recipient.name}</h2>
            <p className="text-sm opacity-70">Online</p>
          </div>
        </div>
      </div>

      {/* Daftar Pesan */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
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
                      src={
                        msg.sender_id === currentUserId
                          ? currentUserAvatar
                          : recipient.imageUrl
                      }
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
                      ? 'chat-bubble-primary'  // Hijau/emerald untuk pesan kamu
                      : 'chat-bubble-neutral'  // Abu-abu untuk pesan lawan
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

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-base-100 border-t">
        <div className="join w-full">
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
        </div>
      </form>
    </div>
  );
}