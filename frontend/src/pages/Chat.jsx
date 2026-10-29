// src/pages/Chat.jsx
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { apiFetch } from "../lib/apiClient";
import { useCachedFetch } from "../lib/useCachedFetch";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { openChat } from "../lib/chatHelper";
import { Search, X } from "lucide-react";

export default function ChatInbox() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const currentUserId = user?.id;

  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const conversationCacheKey = useMemo(() => {
    const params = new URLSearchParams();
    if (currentUserId) params.set("user", currentUserId);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    const qs = params.toString();
    return `conversations:${qs}`;
  }, [currentUserId, searchQuery]);

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return [];

    const params = searchQuery.trim()
      ? `?search=${encodeURIComponent(searchQuery.trim())}`
      : "";
    const data = await apiFetch(`/conversations${params}`);
    return data || [];
  }, [currentUserId, searchQuery]);

  const {
    data: conversations = [],
    loading,
    refresh: refreshConversations,
  } = useCachedFetch(conversationCacheKey, {
    enabled: isLoaded && !!currentUserId,
    fetcher: fetchConversations,
  });

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiFetch("/users");
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
      const result = await apiFetch("/conversations", {
        method: "POST",
        body: JSON.stringify({ opponent_id: selectedUser.clerk_id }),
      });
      navigate(`/chat/${result.conversation_id}`);
    } catch (err) {
      console.error("Failed to start chat:", err.message);
    }
  };

  useEffect(() => {
    if (showUserPicker) loadUsers();
  }, [showUserPicker]);

  // Initial load + polling
  const POLL_INTERVAL = 5000;
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!currentUserId) return;

    refreshConversations();
    intervalRef.current = setInterval(refreshConversations, POLL_INTERVAL);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [currentUserId, refreshConversations]);

  // Force refresh saat kembali ke tab / halaman inbox
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        refreshConversations();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", refreshConversations);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", refreshConversations);
    };
  }, [currentUserId, refreshConversations]);

  // const openChat = (convId, opponent) => {
  //   navigate(`/chat/${convId}`, {
  //     state: { recipient: { name: opponent.name, imageUrl: opponent.avatar_url } },
  //   });
  // };

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-base-content flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#f0f7ff] px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <div className="flex items-center justify-between mb-3">
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
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
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
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
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
                      <div className="w-12 h-12 rounded-full bg-[#e4edff]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-[#edf3ff] rounded" />
                        <div className="h-3 w-20 bg-[#e4edff] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {userList
                    .filter((u) => {
                      const hasChat = conversations.some(
                        (conv) => conv.opponent?.clerk_id === u.clerk_id,
                      );
                      const matchesSearch = u.name
                        ?.toLowerCase()
                        .includes(contactSearchQuery.toLowerCase());
                      return hasChat && matchesSearch;
                    })
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="flex items-center gap-4 px-2">
                  <div className="skeleton w-14 h-14 rounded-full bg-[#e4edff]" />
                  <div className="flex-1 space-y-3">
                    <div className="skeleton h-5 w-40 bg-[#edf3ff]" />
                    <div className="skeleton h-4 w-64 bg-[#e4edff]" />
                  </div>
                </div>
                <div className="h-px mt-6 bg-[#e4edff]/30 mx-4" />
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
