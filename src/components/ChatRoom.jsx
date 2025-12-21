// src/components/ChatRoom.jsx
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient'; // sesuaikan path

export default function ChatRoom() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const { user } = useUser();
  const currentUserId = user?.id;
  const currentUserAvatar = user?.imageUrl || '/default-avatar.png';

  const [recipient, setRecipient] = useState({ name: 'Loading...', imageUrl: '/default-avatar.png' });
  const [postInfo, setPostInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch recipient (lawan bicara)
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

  // Fetch postInfo dari conversations.post_id
  useEffect(() => {
    if (!conversationId) return;

    const fetchPostInfo = async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select('post_id')
        .eq('id', conversationId)
        .single();

      if (conv?.post_id) {
        const { data: postData } = await supabase
          .from('posts')
          .select('item_description, item_photo, from_city, to_city, price, fee, type')
          .eq('id', conv.post_id)
          .single();

        setPostInfo(postData);
      }
    };

    fetchPostInfo();
  }, [conversationId]);

  // Fetch messages + realtime
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

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
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    setTimeout(scrollToBottom, 100);

    const { data: newMsg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Gagal kirim:', error);
      alert('Pesan gagal terkirim');
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    } else {
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

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {loading ? (
          <div className="flex justify-center mt-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Card Post di sisi sender (kanan) */}
            {postInfo && (
  <div className="chat chat-end my-8">
    <div className="chat-image avatar">
      <div className="w-10 rounded-full">
        <img src={currentUserAvatar} alt="avatar" />
      </div>
    </div>

    <div className="chat-bubble bg-base-100 border border-base-300 max-w-md shadow-lg">
      {/* Card Post Horizontal - Gambar kecil kiri, info kanan */}
      <div className="flex gap-4 items-start px-0 py-2">
        {/* Gambar Barang Kecil */}
        <div className="avatar">
          <div className="w-24 h-24 rounded-xl overflow-hidden">
            <img
              src={postInfo.item_photo || '/default-item.jpg'}
              alt="Barang"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Info Post */}
        <div className="flex-1">
          {/* Badge Tipe */}
          <div className="mb-2 text-end">
            <div className="badge badge-primary badge-sm">
              {postInfo.type === 'titip' ? 'Mau Titip' : 'Bisa Bawa'}
            </div>
          </div>

          {/* Deskripsi Barang */}
          {/* <h3 className="font-semibold text-base leading-tight">
            {postInfo.item_description || 'Barang Jastip'}
          </h3> */}

          {/* Rute */}
          <div className="flex items-center gap-2 text-sm text-base-content/80 mt-3">
            <span className="font-medium">{postInfo.from_city}</span>
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="font-medium">{postInfo.to_city}</span>
          </div>

          {/* Harga & Fee */}
          <div className="flex justify-between items-end mt-3 text-sm">
            
            <p className="text-emerald-600 font-bold">
              Fee: Rp{postInfo.fee.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Caption kecil di bawah card */}
      <hr className="my-2" />
      <p className="text-xs text-center text-base-content/60 mt-2">
        Saya tertarik dengan penawaran ini
      </p>
    </div>

    <div className="chat-footer opacity-70 text-xs mt-1">Terkirim</div>
  </div>
)}

            {/* Pesan teks biasa */}
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

      {/* Input Fixed */}
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