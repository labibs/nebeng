// src/pages/Chat.jsx
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { openChat } from "../lib/chatHelper";
import { Search, X } from "lucide-react";

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
  const [contactSearchQuery, setContactSearchQuery] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiFetch("/api/users");
      setUserList(data || []);
    } catch (err) {
      console.error("Failed to load users:", err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const startChatWith = async (selectedUser) => {
    setShowUserPicker(false);
    try {
      const result = await apiFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ opponent_id: selectedUser.clerk_id }),
      });
      navigate(`/chat/${result.conversation_id}`);
    } catch (err) {
      console.error("Failed to start chat:", err.message);
    }
  };

  const fetchConversations = async () => {
    if (!currentUserId) return;
    try {
      const params = searchQuery.trim()
        ? `?search=${encodeURIComponent(searchQuery)}`
        : "";
      const data = await apiFetch(`/api/conversations${params}`);
      setConversations(data || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const _unusedFetchOld = async () => {
    if (!currentUserId) return;
    const { data: participantRows } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    if (!participantRows || participantRows.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationIds = participantRows.map((p) => p.conversation_id);

    // 2. Ambil semua pesan relevan untuk last message + unread count
    const { data: messages } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, content, created_at, sender_id, is_read, post_id",
      )
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (!messages || messages.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Last message per conversation
    const lastMsgMap = {};
    messages.forEach((msg) => {
      if (
        !lastMsgMap[msg.conversation_id] ||
        new Date(msg.created_at) >
          new Date(lastMsgMap[msg.conversation_id].created_at)
      ) {
        lastMsgMap[msg.conversation_id] = {
          content: msg.content,
          created_at: msg.created_at,
          post_id: msg.post_id, // ← tambah ini
        };
      }
    });

    // Kumpulkan semua post_id unik dari last messages
    const postIds = [
      ...new Set(
        Object.values(lastMsgMap)
          .map((lm) => lm.post_id)
          .filter((id) => id !== null),
      ),
    ];

    let postMap = {};

    if (postIds.length > 0) {
      console.log("🔗 Mengambil post dengan ID:", postIds);

      const { data: posts, error } = await supabase
        .from("posts")
        .select(
          "id, from_city, to_city, travel_date, item_description, description, armada, location, price, fee, type",
        )
        .in("id", postIds);

      if (error) {
        console.error("❌ Error fetch posts:", error);
      } else {
        console.log("✅ Berhasil ambil", posts?.length, "post");
        posts?.forEach((post) => {
          console.log(
            `   Post ${post.id}: ${post.from_city || "?"} → ${post.to_city || "?"}, "${post.item_description || post.description || "tanpa deskripsi"}"`,
          );
        });
      }

      posts?.forEach((post) => {
        postMap[post.id] = post;
      });
    }

    // Unread count per conversation
    const unreadCountMap = {};
    messages.forEach((msg) => {
      if (msg.sender_id !== currentUserId && !msg.is_read) {
        unreadCountMap[msg.conversation_id] =
          (unreadCountMap[msg.conversation_id] || 0) + 1;
      }
    });

    // 3. Ambil lawan bicara
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds);

    const opponentIds = allParticipants
      .filter((p) => p.user_id !== currentUserId)
      .map((p) => p.user_id);

    const { data: opponents } = await supabase
      .from("users")
      .select("clerk_id, name, avatar_url")
      .in("clerk_id", opponentIds);

    const opponentMap = {};
    opponents?.forEach((o) => {
      opponentMap[o.clerk_id] = {
        name: o.name || "User",
        avatar_url: o.avatar_url || "/default-avatar.png",
      };
    });

    // 4. Build list
    const convList = conversationIds.map((convId) => {
      const opponentId = allParticipants.find(
        (p) => p.conversation_id === convId && p.user_id !== currentUserId,
      )?.user_id;
      const opponent = opponentMap[opponentId] || {
        name: "Unknown",
        avatar_url: "/default-avatar.png",
      };

      const lastMsg = lastMsgMap[convId];

      return {
        conversationId: convId,
        opponent,
        lastMessage: lastMsg ? lastMsg.content : "Belum ada pesan",
        lastTime: lastMsg ? lastMsg.created_at : new Date(),
        unreadCount: unreadCountMap[convId] || 0,
        relatedPost: lastMsg?.post_id ? postMap[lastMsg.post_id] : null, // ← tambah ini
      };
    });

    convList.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

    console.log("📊 Total conversations sebelum filter:", convList.length);

    let filteredConvList = convList;

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      console.log("🔍 Mulai filtering dengan query:", lowerQuery);

      filteredConvList = convList.filter((conv) => {
        let found = false;

        // 1. Nama lawan bicara
        if (
          conv.opponent.name &&
          conv.opponent.name.toLowerCase().includes(lowerQuery)
        ) {
          console.log("✅ Match NAMA:", conv.opponent.name);
          found = true;
        }

        // 2. Isi pesan terakhir
        if (
          conv.lastMessage &&
          conv.lastMessage.toLowerCase().includes(lowerQuery)
        ) {
          console.log("✅ Match PESAN:", conv.lastMessage.substring(0, 50));
          found = true;
        }

        // 3. Data POST — ini yang kita debug intensif
        if (conv.relatedPost) {
          const post = conv.relatedPost;
          console.log("📌 Conversation ini punya relatedPost ID:", post.id);

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
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          console.log("🔖 Searchable text dari post:", searchableFields);

          if (searchableFields.includes(lowerQuery)) {
            console.log("✅ MATCH POST TEXT!");
            found = true;
          }

          // Khusus travel_date
          if (post.travel_date) {
            const date = new Date(post.travel_date);
            const dateStr = date.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const dateShort = date.toLocaleDateString("id-ID"); // 26/12/2025

            console.log("📅 Tanggal post:", dateStr, "|", dateShort);

            if (
              dateStr.toLowerCase().includes(lowerQuery) ||
              dateShort.includes(lowerQuery)
            ) {
              console.log("✅ MATCH TANGGAL!");
              found = true;
            }
          }
        } else {
          // Kalau tidak ada relatedPost, log juga biar tahu
          if (conv.lastMsgMap && conv.lastMsgMap.post_id) {
            console.log(
              "⚠️ Ada post_id di message tapi tidak ada di postMap:",
              conv.lastMsgMap.post_id,
            );
          }
        }

        return found;
      });

      console.log(
        `🎯 Hasil filter: ${filteredConvList.length} dari ${convList.length} conversations`,
      );
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
      .channel("inbox-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => fetchConversations(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => fetchConversations(),
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

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", fetchConversations);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", fetchConversations);
    };
  }, [currentUserId]);

  // const openChat = (convId, opponent) => {
  //   navigate(`/chat/${convId}`, {
  //     state: { recipient: { name: opponent.name, imageUrl: opponent.avatar_url } },
  //   });
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-[#f0f8f1] to-[#d9f0e0] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#1e293b] text-base-content flex flex-col mb-15">
      {/* Floating Header */}
      <div
        className={`sticky top-0 z-30 px-4 pt-5 pb-3 transition-all duration-300 ${
          isScrolled
            ? "bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="bg-gradient-to-r from-[#4e73df] to-[#6c8ef8] bg-clip-text text-[26px] font-extrabold text-transparent tracking-tight">
            Chat
          </h3>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-50 bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95 relative"
              aria-label="Search"
            >
              <Search
                size={20}
                className={
                  isSearchVisible ? "text-[#4e73df]" : "text-slate-500"
                }
              />
              {searchQuery && !isSearchVisible && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white" />
              )}
            </button>

            <button
              onClick={() => setShowUserPicker(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-50 bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95 text-[#4e73df]"
            >
              <span className="text-3xl leading-none -translate-y-0.5">+</span>
            </button>
          </div>
        </div>

        {isSearchVisible && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100">
              <Search size={18} className="shrink-0 text-[#4e73df]" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari chat, nama, atau isi pesan..."
                className="w-full min-w-0 bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Pilih Kontak */}
      {showUserPicker && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-white p-0 overflow-hidden rounded-[32px] border-none shadow-2xl max-w-md w-[92%]">
            <div className="p-6 pb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-slate-900">
                  Pilih Kontak
                </h3>
                <button
                  onClick={() => setShowUserPicker(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search Input in Modal (Market Style) */}
              <div className="flex items-center gap-2.5 rounded-[22px] bg-[#f5f7ff] px-3.5 py-3 shadow-inner mb-4">
                <Search size={18} className="shrink-0 text-[#4e73df]" />
                <input
                  type="text"
                  placeholder="Cari nama kontak..."
                  value={contactSearchQuery}
                  className="w-full min-w-0 bg-transparent text-[14px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                />
                {contactSearchQuery && (
                  <button
                    onClick={() => setContactSearchQuery("")}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-2 pb-6">
              {loadingUsers ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-slate-100 rounded" />
                        <div className="h-3 w-20 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {userList
                    .filter((u) =>
                      u.name
                        ?.toLowerCase()
                        .includes(contactSearchQuery.toLowerCase()),
                    )
                    .map((user) => (
                      <button
                        key={user.id}
                        onClick={() => startChatWith(user)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition text-left"
                      >
                        <div className="avatar">
                          <div className="w-12 h-12 rounded-full ring-2 ring-slate-50">
                            <img
                              src={user.avatar_url || "/default-avatar.png"}
                              alt={user.name}
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            @{user.clerk_id?.slice(-8)}
                          </p>
                        </div>
                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-50 text-[#4e73df]">
                          <span className="text-lg">+</span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowUserPicker(false)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}

      {/* Chat List / Loading / Empty */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
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
            <p className="text-xl font-medium text-base-content/60">
              Belum ada obrolan
            </p>
            <p className="mt-4 text-base text-base-content/50">
              Mulai chat dari post yang kamu minati!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-base-300/10 dark:divide-base-700/20">
            {conversations.map((conv) => (
              <div key={conv.conversationId}>
                <button
                  onClick={() =>
                    openChat(conv.conversationId, conv.opponent, navigate)
                  }
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-base-200/30 dark:hover:bg-base-700/30 transition text-left"
                >
                  <div className="avatar">
                    <div className="w-14 rounded-full ring-2 ring-base-300/30 dark:ring-base-700/30">
                      <img
                        src={conv.opponent.avatar_url || "/default-avatar.png"}
                        alt={conv.opponent.name}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-base truncate pr-3 text-base-content">
                        {conv.opponent.name}
                      </h3>
                      <time className="text-xs text-base-content/50">
                        {conv.lastTime
                          ? formatDistanceToNow(new Date(conv.lastTime), {
                              addSuffix: true,
                              locale: localeId,
                            })
                          : ""}
                      </time>
                    </div>
                    <p className="text-sm text-base-content/60 truncate">
                      {conv.lastMessage || "Mulai obrolan..."}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <div className="badge badge-success badge-sm font-bold">
                      {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
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
