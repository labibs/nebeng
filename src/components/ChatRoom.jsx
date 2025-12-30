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

  const handleShortcut = (text) => {
    setNewMessage(text);
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

  // Fetch messages dan setup realtime
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          is_read,
          message_type,
          post:posts (*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Nama channel AMAN: hanya huruf, angka, underscore
    const safeChannelName = `chat_${conversationId.replace(/-/g, '_')}`;

    const channel = supabase
      .channel(safeChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Pesan baru masuk:', payload.new);
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(scrollToBottom, 100);
        }
      )
      // TAMBAH INI: listener untuk UPDATE is_read
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Pesan dibaca (update is_read):', payload.new);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id
                ? { ...msg, is_read: payload.new.is_read }
                : msg
            )
          );
        }
      )

      .subscribe((status, error) => {
        console.log('Realtime status:', status);
        if (error) {
          console.error('Realtime error:', error);
        }
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected! Sync messages...');
          fetchMessages(); // refresh sekali saat connect
        }
      });

    return () => {
      console.log('Cleaning up realtime channel...');
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Mark pesan dari lawan sebagai terbaca saat buka room
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const markAsRead = async () => {
      // Update semua pesan dari lawan (sender_id != currentUserId) jadi is_read = true
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false); // hanya yang belum dibaca

      if (error) {
        console.error('Error marking messages as read:', error);
      } else {
        // Update state lokal biar UI langsung berubah tanpa refresh
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender_id !== currentUserId ? { ...msg, is_read: true } : msg
        
          )
          
        );
        
      }
    };

    markAsRead();
  }, [conversationId, currentUserId]);

  

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    const content = newMessage.trim();
    setNewMessage(''); // kosongkan input dulu biar UX cepat

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content,
    });

    if (error) {
      console.error('Gagal kirim pesan:', error);
      alert('Pesan gagal terkirim. Coba lagi.');
      // Kembalikan input kalau gagal
      setNewMessage(content);
    }
    // Tidak perlu tambah apa-apa ke state — realtime akan handle munculnya pesan
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
          {/* Skeleton Avatar */}
          <div className="avatar online">
            <div className="w-12 rounded-full ring ring-emerald-500 ring-offset-base-100 ring-offset-2">
              {recipient.imageUrl && recipient.imageUrl !== '/default-avatar.png' ? (
                <img src={recipient.imageUrl} alt={recipient.name} className="object-cover" />
              ) : (
                // Skeleton Avatar: lingkaran berdenyut
                <div className="w-full h-full bg-gradient-to-r from-base-300 to-base-200 rounded-full animate-pulse shadow-lg" />
              )}
            </div>
          </div>

          {/* Skeleton Nama & Status */}
          <div>
            {recipient.name !== 'Loading...' ? (
              <>
                <h2 className="font-bold text-lg">{recipient.name}</h2>
                <p className="text-sm opacity-70">Online</p>
              </>
            ) : (
              // Skeleton Nama + Status
              <div className="space-y-1.5">
                <div className="h-6 bg-gradient-to-r from-base-300 to-base-200 rounded-full w-28 animate-pulse" />
                <div className="h-4 bg-gradient-to-r from-base-300 to-base-200 rounded w-20 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
<div className="flex-1 overflow-y-auto p-4 pb-20">
  {loading ? (
    <div className="space-y-6 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`chat ${i % 2 === 0 ? 'chat-end' : 'chat-start'}`}>
          <div className="chat-bubble bg-base-300 animate-pulse w-64 h-20 rounded-2xl" />
        </div>
      ))}
    </div>
  ) : (
    <div className="space-y-6">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`chat ${msg.sender_id === currentUserId ? 'chat-end' : 'chat-start'}`}
        >
          {/* Avatar */}
          <div className="chat-image avatar">
            <div className="w-10 rounded-full">
              <img
                src={msg.sender_id === currentUserId ? currentUserAvatar : recipient.imageUrl}
                alt="avatar"
              />
            </div>
          </div>

          {/* Header (waktu) */}
          <div className="chat-header">
            <time className="text-xs opacity-70">
              {(() => {
                const messageDate = new Date(msg.created_at);
                const today = new Date();
                const isToday =
                  messageDate.getDate() === today.getDate() &&
                  messageDate.getMonth() === today.getMonth() &&
                  messageDate.getFullYear() === today.getFullYear();

                if (isToday) {
                  return messageDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                } else {
                  return messageDate.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                }
              })()}
            </time>
          </div>

          {/* Bubble Content - Bedakan berdasarkan message_type */}
          {msg.message_type === 'post_card' ? (
            // CARD POST (hanya dari sender yang memulai chat)
            <div className="chat-bubble bg-base-100 border border-base-300 max-w-md shadow-lg">
              <div className="flex gap-4 items-start px-0 py-2">
                {/* Gambar Barang Kecil */}
                <div className="avatar">
                  <div className="w-24 h-24 rounded-xl overflow-hidden">
                    <img
                      src={msg.post?.item_photo || '/default-item.jpg'} // asumsi post data ada di msg.post
                      alt="Barang"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info Post */}
                <div className="flex-1">
                  <div className="mb-2 text-end">
                    <div className="badge badge-primary badge-sm">
                      {msg.post?.type === 'titip' ? 'Mau Titip' : 'Bisa Bawa'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-base-content/80 mt-3">
                    <span className="font-medium">{msg.post?.from_city}</span>
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="font-medium">{msg.post?.to_city}</span>
                  </div>

                  <div className="flex justify-between items-end mt-3 text-sm">
                    <p className="text-emerald-600 font-bold">
                      Fee: Rp{msg.post?.fee?.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              <hr className="my-2" />

<p className="text-xs text-center text-base-content/60 mt-2">
  {msg.content || 'saya tertarik dengan penawaran ini.'}
</p>

{/* Quick Reply Shortcuts */}
<div className="mt-3 px-1">
  <div
    className="
      flex gap-2 overflow-x-auto no-scrollbar
      snap-x snap-mandatory
      w-70
      -mx-1 px-1 pb-1
    "
  >
    {[
      "Bisa nego fee / ongkos jastip?",
      "Boleh COD / ketemuan di lokasi?",
      "Kapan jadwal keberangkatan?",
      "Barangnya ukuran & beratnya berapa?",
      "Apakah aman dibawa di bagasi?",
    ].map((text, i) => (
      <button
        key={i}
        onClick={() => handleShortcut(text)}
        className="
          btn btn-xs rounded-full snap-start whitespace-nowrap
          border border-base-300 bg-base-200 hover:bg-base-300
          dark:bg-base-300/30 dark:hover:bg-base-300/50
        "
      >
        {text}
      </button>
    ))}
  </div>
</div>


            </div>
          ) : (
            // PESAN TEKS BIASA
            <div
  className={`chat-bubble ${
    msg.sender_id === currentUserId
      ? 'chat-bubble-primary'
      : 'chat-bubble-neutral'
  }`}
>
  {/* Isi pesan */}
  {msg.content}

  {/* Shortcut — hanya tampil di pesan post / sistem / seller */}
  {msg.post && (
    <div className="mt-3 px-1">
      <div
        className="
          flex gap-2 overflow-x-auto no-scrollbar
          snap-x snap-mandatory
          -mx-1 px-1 pb-1
        "
      >
        {[
          "Bisa nego fee / ongkos jastip?",
          "Boleh COD / ketemuan di lokasi?",
          "Kapan jadwal keberangkatan?",
          "Barangnya ukuran & beratnya berapa?",
          "Apakah aman dibawa di bagasi?",
        ].map((text, i) => (
          <button
            key={i}
            onClick={() => handleShortcut(text)}
            className="
              btn btn-xs rounded-full snap-start whitespace-nowrap
              border border-base-300 bg-base-200 hover:bg-base-300
              dark:bg-base-300/30 dark:hover:bg-base-300/50
            "
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )}
</div>

          )}

          {/* Footer: status terkirim/terbaca - hanya untuk pesan dari current user */}
          {msg.sender_id === currentUserId && (
            <div
              className={`chat-footer text-xs mt-1 flex items-center gap-1 ${
                msg.is_read ? 'text-blue-500' : 'opacity-70'
              }`}
            >
              {msg.is_read ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 10l4 4L16 6" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M8 10l4 4L20 6" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  <span>Terbaca</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 10l4 4L16 6" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  <span>Terkirim</span>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Auto scroll ke bawah */}
      <div ref={messagesEndRef} />
    </div>
  )}
</div>

      {/* Input Fixed */}
      {/* Input Fixed */}
<div className="
  fixed bottom-0 left-0 right-0 z-50
  bg-base-100/80 backdrop-blur-xl
  border-t border-base-300/60
">
  <form
    onSubmit={sendMessage}
    className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2"
  >
    {/* Input Box */}
    <div className="
      flex items-center gap-2
      flex-1
      bg-base-200 border border-base-300
      rounded-2xl px-3
      focus-within:ring-2 focus-within:ring-emerald-400/60
      transition-all
    ">
      <svg
        className="w-5 h-5 opacity-60"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5l-4-4H9a5 5 0 01-5-5V7a5 5 0 015-5h6a5 5 0 015 5v5a5 5 0 01-5 5"
        />
      </svg>

      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Tulis pesan deal atau pilih shortcut…"
        className="
          input input-ghost focus:outline-none
          bg-transparent w-full text-sm
        "
      />
    </div>

    {/* Send Button */}
    <button
      type="submit"
      disabled={!newMessage.trim()}
      className="
        btn btn-primary rounded-2xl px-5
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      Kirim
    </button>
  </form>
</div>

    </div>
  );
}