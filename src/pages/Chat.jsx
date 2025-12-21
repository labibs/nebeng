// src/components/Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/clerk-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default function Chat({ conversationId, recipient }) {
  const { user } = useUser();
  const currentUserId = user?.id;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) console.error(error);
      else setMessages(data || []);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
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

  useEffect(() => scrollToBottom(), [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: newMessage.trim(),
    });

    if (error) {
      console.error(error);
      alert('Gagal kirim pesan');
    } else {
      setNewMessage('');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-base-100">
      {/* Header */}
      <div className="navbar bg-base-200 shadow">
        <div className="flex-1 px-4">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img src={recipient?.imageUrl || '/default-avatar.png'} alt={recipient?.name} />
              </div>
            </div>
            <div>
              <div className="font-bold">{recipient?.name || 'Chat'}</div>
              <div className="text-sm opacity-70">Online</div> {/* Bisa dinamis nanti */}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-base-content opacity-50 mt-20">
            Belum ada pesan. Mulai obrolan yuk!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat ${msg.sender_id === currentUserId ? 'chat-end' : 'chat-start'}`}
            >
              <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                  <img
                    src={
                      msg.sender_id === currentUserId
                        ? user?.imageUrl || '/default-avatar.png'
                        : recipient?.imageUrl || '/default-avatar.png'
                    }
                    alt="avatar"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                {msg.sender_id === currentUserId ? 'Kamu' : recipient?.name}
                <time className="text-xs opacity-50 ml-2">
                  {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              <div className="chat-bubble">{msg.content}</div>
              <div className="chat-footer opacity-50 text-xs">Delivered</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-base-200">
        <div className="join w-full">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="input input-bordered join-item w-full"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn btn-primary join-item"
          >
            Kirim
          </button>
        </div>
      </form>
    </div>
  );
}