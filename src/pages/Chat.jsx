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
  <div className="min-h-screen bg-linear-to-br from-primary to-secondary text-white flex flex-col">

    {/* Navbar */}
    <div className="sticky top-0 z-10 navbar bg-base-100/70 backdrop-blur-xl shadow-sm">
      <div className="flex-1">
        <h3 className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Chat
        </h3>
      </div>

      <div className="flex-none flex items-center gap-3">

        {/* Search Button + Input */}
        <div className="relative">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="btn btn-circle btn-sm bg-primary/10 border border-primary/30 hover:bg-primary/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Input muncul saat diklik atau hover */}
          <div className={`absolute right-12 -top-1 w-54 transition-all duration-300 ease-in-out ${
            isSearchOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
          }`}>
            <input
              type="text"
              placeholder="Cari chat atau kontak..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Trigger refetch jika perlu real-time filter (bisa debounce)
              }}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)} // biar bisa klik di luar
              autoFocus
              className="input input-bordered w-full bg-base-100 shadow-lg rounded-2xl pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tombol tambah chat */}
        <button
          onClick={() => setShowUserPicker(true)}
          className="btn btn-circle btn-sm bg-primary/10 border border-primary/30 hover:bg-primary/20 flex items-center justify-center"
        >
          <span className="text-xl text-primary font-bold leading-none translate-y-[-2px]">+</span>
        </button>
      </div>
    </div>

    {showUserPicker && (
      <dialog className="modal modal-open">
        <div className="modal-box bg-base-100/90 backdrop-blur-xl">
          
          <h3 className="font-bold text-lg mb-3">Pilih Kontak</h3>

          {loadingUsers ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-full" />
                  <div className="skeleton h-4 w-40" />
                </div>
              ))}
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {userList.map(user => (
                <button
                  key={user.id}
                  onClick={() => startChatWith(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-base-200/70 transition"
                >
                  <div className="avatar">
                    <div className="w-10 rounded-full">
                      <img src={user.avatar_url || "/default-avatar.png"} />
                    </div>
                  </div>

                  <span className="text-sm font-medium truncate">{user.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={() => setShowUserPicker(false)}>
              Tutup
            </button>
          </div>
        </div>
      </dialog>
    )}

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