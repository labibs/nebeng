// src/components/ChatRoom.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

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
  const [showDealMenu, setShowDealMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch recipient
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

  // Fetch post info
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

  // Realtime messages + mark as read
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`
          id, content, created_at, sender_id, is_read, message_type,
          post:posts (*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    const safeChannelName = `chat_${conversationId.replace(/-/g, '_')}`;

    const channel = supabase
      .channel(safeChannelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Mark unread messages as read ketika buka chat
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const markAsRead = async () => {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false);
    };

    markAsRead();
  }, [conversationId, currentUserId]);

  // Ekstrak message_type dari content (jika ada tag [deal_xxx])
  const extractMessageType = (content) => {
    const match = content.trim().match(/^\[([a-zA-Z0-9_]+)\]/);
    return match ? match[1] : null;
  };

  // Kirim pesan dengan message_type otomatis
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    const content = newMessage.trim();
    const message_type = extractMessageType(content);

    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content,
      message_type: message_type, // ← INI YANG PENTING!
    });

    if (error) {
      console.error('Gagal kirim:', error);
      alert('Gagal mengirim pesan.');
      setNewMessage(content);
    }
  };

  // Pilih template deal → otomatis tambah tag [deal_xxx]
  const selectDealType = (tag, title, template) => {
    setNewMessage(`[${tag}] ${title} ✅\n\n${template}`);
    setShowDealMenu(false);
    document.getElementById('message-input')?.focus();
  };

  // Shortcut cepat
  const quickReplies = [
    "Bisa nego fee / ongkos jastip?",
    "Boleh COD / ketemuan di lokasi?",
    "Kapan jadwal keberangkatan?",
    "Barangnya ukuran & beratnya berapa?",
    "Apakah aman dibawa di bagasi?",
  ];

  const handleQuickReply = (text) => {
    setNewMessage(text);
    document.getElementById('message-input')?.focus();
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

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {loading ? (
          <div className="space-y-6">
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
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <img src={msg.sender_id === currentUserId ? currentUserAvatar : recipient.imageUrl} alt="avatar" />
                  </div>
                </div>

                <div className="chat-header">
                  <time className="text-xs opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>

                {/* Render berdasarkan message_type */}
                {msg.message_type === 'post_card' ? (
                  <div className="chat-bubble bg-base-100 border border-base-300 max-w-md shadow-lg">
                    {/* Card post content (sama seperti sebelumnya) */}
                    {/* ... (di sini kamu bisa copy bagian card post yang lama) */}
                  </div>
                ) : (
                  <div className={`
                    chat-bubble text-white
                    ${msg.sender_id === currentUserId
                      ? 'bg-gradient-to-r from-[#81c784] to-[#66bb6a] shadow-md'
                      : 'bg-emerald-600'
                    }
                  `}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                )}

                {/* Status terbaca (hanya pesan sendiri) */}
                {msg.sender_id === currentUserId && (
                  <div className={`chat-footer text-xs mt-1 ${msg.is_read ? 'text-blue-500' : 'opacity-70'}`}>
                    {msg.is_read ? 'Terbaca ✓✓' : 'Terkirim ✓'}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 pb-safe">
        {/* Quick Replies */}
        <div className="px-4 py-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {quickReplies.map((text, i) => (
              <button
                key={i}
                onClick={() => handleQuickReply(text)}
                className="btn btn-xs rounded-full whitespace-nowrap bg-base-200 hover:bg-base-300"
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={sendMessage} className="px-4 pb-4 pt-2 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-base-200 border border-base-300 rounded-2xl px-3 focus-within:ring-2 focus-within:ring-emerald-400/60">
            {/* Icon PLUS kembali! */}
            <button
                type="button"
                onClick={() => setShowDealMenu(!showDealMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-base-300 transition-colors"
                aria-label="Pilih template deal"
              >
                <svg className="w-6 h-6 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
           </button>

            <input
              id="message-input"
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tulis pesan atau pilih deal…"
              className="input input-ghost focus:outline-none
              bg-transparent w-full text-sm py-4"
            />
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn bg-gradient-to-r from-[#81c784] to-[#66bb6a] text-white rounded-2xl px-6 disabled:opacity-50"
          >
            Kirim
          </button>
        </form>

        {/* Deal Menu - Di dalam fixed bottom area */}
{showDealMenu && (
  <>
    <div className="absolute bottom-20 left-4 right-4 bg-base-100 border border-base-300 rounded-2xl shadow-2xl overflow-hidden z-50">
      <div className="p-4 border-b border-base-300 bg-base-200/50">
        <h3 className="font-bold text-lg text-center">Pilih Jenis Deal</h3>
        <p className="text-xs text-center opacity-70 mt-1">Tag otomatis ditambahkan saat kirim</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {/* 1. Ongkos Jastip */}
        <button
          onClick={() =>
            selectDealType(
              'deal_ongkos_jastip',
              'Deal Ongkos Jastip',
              '💰 Ongkos jastip: \n📍 Lokasi ketemuan: \n🕐 Jam ketemuan: \n📝 Catatan tambahan: '
            )
          }
          className="w-full text-left px-5 py-4 hover:bg-base-200 transition-colors flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-base">Ongkos Jastip</div>
            <div className="text-xs opacity-70">Sepakati biaya jasa titip / belanja</div>
          </div>
        </button>

        {/* 2. Lokasi Ketemuan */}
        <button
          onClick={() =>
            selectDealType(
              'deal_lokasi_ketemuan',
              'Deal Lokasi Ketemuan',
              '📍 Lokasi ketemuan: \n🕐 Jam ketemuan: \n💰 Ongkos tetap: \n📝 Catatan lokasi: '
            )
          }
          className="w-full text-left px-5 py-4 hover:bg-base-200 transition-colors flex items-center gap-4 border-t border-base-300/50"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-base">Lokasi Ketemuan</div>
            <div className="text-xs opacity-70">Tentukan tempat serah terima</div>
          </div>
        </button>

        {/* 3. Waktu Ketemuan */}
        <button
          onClick={() =>
            selectDealType(
              'deal_waktu_ketemuan',
              'Deal Waktu Ketemuan',
              '🕐 Jam ketemuan: \n📍 Lokasi: \n💰 Ongkos final: \n📝 Konfirmasi jadwal: '
            )
          }
          className="w-full text-left px-5 py-4 hover:bg-base-200 transition-colors flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-base">Waktu Ketemuan</div>
            <div className="text-xs opacity-70">Sepakati jam & hari bertemu</div>
          </div>
        </button>

        {/* 4. Barang Titipan */}
        <button
          onClick={() =>
            selectDealType(
              'deal_barang_titipan',
              'Deal Barang Titipan',
              '📦 Detail barang: \n⚖️ Ukuran & berat: \n💰 Ongkos final: \n📝 Lampirkan foto/detail jika ada'
            )
          }
          className="w-full text-left px-5 py-4 hover:bg-base-200 transition-colors flex items-center gap-4 border-t border-base-300/50"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-base">Barang Titipan</div>
            <div className="text-xs opacity-70">Konfirmasi detail barang yang dititipkan</div>
          </div>
        </button>
      </div>

      <div className="p-3 bg-base-200 text-center border-t border-base-300/50">
        <button
          type="button"
          onClick={() => setShowDealMenu(false)}
          className="text-sm font-medium text-base-content/70 hover:text-base-content"
        >
          Tutup
        </button>
      </div>
    </div>

    {/* Overlay */}
    <div className="fixed inset-0 z-40" onClick={() => setShowDealMenu(false)} />
  </>
)}
      </div>
    </div>
  );
}