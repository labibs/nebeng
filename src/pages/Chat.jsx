// src/pages/Chat.jsx
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale/id';

export default function ChatInbox() {
  const navigate = useNavigate();
  const { user } = useUser();
  const currentUserId = user?.id;
  const currentClerkId = user?.clerk_id;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const loadUsers = async () => {
    setLoadingUsers(true);

    const { data } = await supabase
      .from("users")
      .select("id, name, avatar_url, clerk_id")
      .neq("clerk_id", currentUserId)
      .order("name", { ascending: true });

    setUserList(data || []);
    setLoadingUsers(false);
  };

  const startChatWith = async (selectedUser) => {
    setShowUserPicker(false);

    let conversationId;

    // cek apakah sudah ada conversation berdua
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .in("user_id", [currentClerkId, selectedUser.clerk_id]);

    if (participants && participants.length >= 2) {
      conversationId = participants[0].conversation_id;
    } else {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({})
        .select("id")
        .single();

      conversationId = newConv.id;

      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: currentUserId },
        { conversation_id: conversationId, user_id: selectedUser.clerk_id },
      ]);
    }

    navigate(`/chat/${conversationId}`);
  };

  const fetchConversations = async () => {

    console.log('🔄 fetchConversations dipanggil, searchQuery:', searchQuery);
    if (!currentUserId) return;

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
      .select('id, conversation_id, content, created_at, sender_id, is_read, post_id')
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
        lastMsgMap[msg.conversation_id] = {
          content: msg.content,
          created_at: msg.created_at,
          post_id: msg.post_id,  // ← tambah ini
        };
      }
    });

    // Kumpulkan semua post_id unik dari last messages
    const postIds = [...new Set(
      Object.values(lastMsgMap)
        .map(lm => lm.post_id)
        .filter(id => id !== null)
    )];

    let postMap = {};

    if (postIds.length > 0) {
      console.log('🔗 Mengambil post dengan ID:', postIds);

      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, from_city, to_city, travel_date, item_description, description, armada, location, price, fee, type')
        .in('id', postIds);

      if (error) {
        console.error('❌ Error fetch posts:', error);
      } else {
        console.log('✅ Berhasil ambil', posts?.length, 'post');
        posts?.forEach(post => {
          console.log(`   Post ${post.id}: ${post.from_city || '?'} → ${post.to_city || '?'}, "${post.item_description || post.description || 'tanpa deskripsi'}"`);
        });
      }

  posts?.forEach(post => {
    postMap[post.id] = post;
  });
}

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
        relatedPost: lastMsg?.post_id ? postMap[lastMsg.post_id] : null,  // ← tambah ini
      };
    });

    convList.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

    console.log('📊 Total conversations sebelum filter:', convList.length);

    let filteredConvList = convList;

    if (searchQuery.trim()) {
  const lowerQuery = searchQuery.toLowerCase().trim();
  console.log('🔍 Mulai filtering dengan query:', lowerQuery);

  filteredConvList = convList.filter(conv => {
    let found = false;

    // 1. Nama lawan bicara
    if (conv.opponent.name && conv.opponent.name.toLowerCase().includes(lowerQuery)) {
      console.log('✅ Match NAMA:', conv.opponent.name);
      found = true;
    }

    // 2. Isi pesan terakhir
    if (conv.lastMessage && conv.lastMessage.toLowerCase().includes(lowerQuery)) {
      console.log('✅ Match PESAN:', conv.lastMessage.substring(0, 50));
      found = true;
    }

    // 3. Data POST — ini yang kita debug intensif
    if (conv.relatedPost) {
      const post = conv.relatedPost;
      console.log('📌 Conversation ini punya relatedPost ID:', post.id);

      // Gabungkan semua field yang ingin dicari
      const searchableFields = [
        post.from_city,
        post.to_city,
        post.item_description,
        post.description,
        post.armada,
        post.location,
        post.type,
        post.price?.toString(),
        post.fee?.toString(),
      ].filter(Boolean).join(' ').toLowerCase();

      console.log('🔖 Searchable text dari post:', searchableFields);

      if (searchableFields.includes(lowerQuery)) {
        console.log('✅ MATCH POST TEXT!');
        found = true;
      }

      // Khusus travel_date
      if (post.travel_date) {
        const date = new Date(post.travel_date);
        const dateStr = date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        const dateShort = date.toLocaleDateString('id-ID'); // 26/12/2025

        console.log('📅 Tanggal post:', dateStr, '|', dateShort);

        if (dateStr.toLowerCase().includes(lowerQuery) || dateShort.includes(lowerQuery)) {
          console.log('✅ MATCH TANGGAL!');
          found = true;
        }
      }
    } else {
      // Kalau tidak ada relatedPost, log juga biar tahu
      if (conv.lastMsgMap && conv.lastMsgMap.post_id) {
        console.log('⚠️ Ada post_id di message tapi tidak ada di postMap:', conv.lastMsgMap.post_id);
      }
    }

    return found;
  });

    console.log(`🎯 Hasil filter: ${filteredConvList.length} dari ${convList.length} conversations`);
    }
  
    setConversations(filteredConvList);
    setLoading(false);
  };
  
    useEffect(() => {
    if (showUserPicker) loadUsers();
  }, [showUserPicker]);

  const inputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      // beri sedikit delay agar animasi/DOM siap
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isSearchOpen]);

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
  }, [currentUserId, searchQuery]);

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
  <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-[#f0f8f1] to-[#d9f0e0] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#1e293b] text-base-content flex flex-col">

    {/* Navbar – transparan dengan blur */}
    <div className="sticky top-0 z-10 navbar bg-base-100/80 dark:bg-base-900/80 backdrop-blur-xl shadow-md border-b border-base-300/20">
      <div className="flex-1">
        <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#81c784] to-[#a5d6a7]">
          Chat
        </h3>
      </div>

      <div className="flex-none flex items-center gap-3">
        {/* Search Button + Input */}
        <div className="relative">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
           className="btn btn-ghost btn-circle text-green-600/70"
                aria-label="Search"
              >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Input Search – posisi lebih baik & terlihat jelas */}
          <div className={`absolute right-14 -top-0 w-54 transition-all duration-300 ease-in-out ${
            isSearchOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'
          }`}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari chat, nama, atau post..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
              autoFocus
              className="input input-bordered w-full bg-base-100 dark:bg-base-800 border-base-300/50 shadow-xl focus:outline-none focus:border-[#81c784] text-base-content placeholder-base-content/50"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tombol + */}
        <button
  onClick={() => setShowUserPicker(true)}
  className="btn btn-ghost btn-circle text-green-600/70"
>
  <span className="text-3xl leading-none -translate-y-0.5">
    +
  </span>
</button>

      </div>
    </div>

    {/* Modal Pilih Kontak – lebih clean & adaptif dark/light */}
    {showUserPicker && (
      <dialog className="modal modal-open">
        <div className="modal-box bg-base-100/95 dark:bg-base-900/95 backdrop-blur-md shadow-2xl border border-base-300/20 max-w-md w-full">
          <h3 className="font-bold text-xl mb-4 text-base-content">Pilih Kontak</h3>

          {loadingUsers ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton w-12 h-12 rounded-full bg-base-300/40 dark:bg-base-700/40" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 bg-base-300/30 dark:bg-base-700/30 mb-2" />
                    <div className="skeleton h-3 w-20 bg-base-300/20 dark:bg-base-700/20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-1">
              {userList.map(user => (
                <button
                  key={user.id}
                  onClick={() => startChatWith(user)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-base-200/50 dark:hover:bg-base-700/50 transition"
                >
                  <div className="avatar">
                    <div className="w-12 rounded-full ring ring-base-300/20">
                      <img src={user.avatar_url || "/default-avatar.png"} alt={user.name} />
                    </div>
                  </div>
                  <span className="text-base font-medium text-base-content truncate">{user.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="modal-action mt-6">
            <button className="btn btn-ghost text-base-content/70" onClick={() => setShowUserPicker(false)}>
              Tutup
            </button>
          </div>
        </div>
      </dialog>
    )}

    {/* Chat List / Loading / Empty */}
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="p-4 space-y-6">
          {[1,2,3,4,5].map(i => (
            <div key={i}>
              <div className="flex items-center gap-4 px-2">
                <div className="skeleton w-14 h-14 rounded-full bg-base-300/40 dark:bg-base-700/40" />
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-5 w-40 bg-base-300/30 dark:bg-base-700/30" />
                  <div className="skeleton h-4 w-64 bg-base-300/20 dark:bg-base-700/20" />
                </div>
              </div>
              <div className="h-px mt-6 bg-base-300/20 dark:bg-base-700/20 mx-4" />
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-xl font-medium text-base-content/60">Belum ada obrolan</p>
          <p className="mt-4 text-base text-base-content/50">Mulai chat dari post yang kamu minati!</p>
        </div>
      ) : (
        <div className="divide-y divide-base-300/10 dark:divide-base-700/20">
          {conversations.map((conv) => (
            <div key={conv.conversationId}>
              <button
                onClick={() => openChat(conv.conversationId, conv.opponent)}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-base-200/30 dark:hover:bg-base-700/30 transition text-left"
              >
                <div className="avatar">
                  <div className="w-14 rounded-full ring-2 ring-base-300/30 dark:ring-base-700/30">
                    <img src={conv.opponent.avatar_url || '/default-avatar.png'} alt={conv.opponent.name} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-base truncate pr-3 text-base-content">
                      {conv.opponent.name}
                    </h3>
                    <time className="text-xs text-base-content/50">
                      {formatDistanceToNow(new Date(conv.lastTime), { addSuffix: true, locale: localeId })}
                    </time>
                  </div>
                  <p className="text-sm text-base-content/60 truncate">
                    {conv.lastMessage || 'Mulai obrolan...'}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <div className="badge badge-success badge-sm font-bold">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </div>
                )}
              </button>
              {/* garis bawah adaptif */}
                <div
                  className="
                    h-px mx-4
                    bg-base-content/20
                    mask-linear-to-r
                    from-transparent via-base-content/60 to-transparent
                  "
                />
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}