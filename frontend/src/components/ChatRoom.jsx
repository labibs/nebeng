// src/components/ChatRoom.jsx
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/apiClient";
import NegoModal from "./chat/NegoModal";

const POLL_INTERVAL = 4000;

export default function ChatRoom() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const { user } = useUser();
  const currentUserId = user?.id;
  const currentUserAvatar = user?.imageUrl || "/default-avatar.png";

  const [recipient, setRecipient] = useState({
    name: "Loading...",
    imageUrl: "/default-avatar.png",
  });
  const [postInfo, setPostInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showDealMenu, setShowDealMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationPostId, setConversationPostId] = useState(null);
  const [showNegoModal, setShowNegoModal] = useState(false);
  const [negoInitialPrice, setNegoInitialPrice] = useState("");
  const [lastTimestamp, setLastTimestamp] = useState(null);

  const location = useLocation();

  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch recipient
  useEffect(() => {
    if (!currentUserId || !conversationId) return;

    const fetchRecipient = async () => {
      try {
        const msgs = await apiFetch(
          `/conversations/${conversationId}/messages`,
        );
        const opponentMsg = msgs.find((m) => m.sender_id !== currentUserId);
        if (opponentMsg) {
          const opponentId = opponentMsg.sender_id;
          try {
            const opponent = await apiFetch(`/users/${opponentId}`);
            setRecipient({
              name: opponent?.name || "User",
              imageUrl: opponent?.avatar_url || "/default-avatar.png",
            });
          } catch (e) {
            if (opponentMsg.sender) {
              setRecipient({
                name: opponentMsg.sender.name || "User",
                imageUrl: opponentMsg.sender.avatar_url || "/default-avatar.png",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching recipient:", error);
      }
    };

    fetchRecipient();
  }, [currentUserId, conversationId]);

  // Fetch post info
  useEffect(() => {
    if (!conversationId) return;

    const fetchPostInfo = async () => {
      try {
        const msgs = await apiFetch(
          `/conversations/${conversationId}/messages`,
        );
        const postCardMsg = msgs
          .filter((m) => m.message_type === "post_card" && m.post_id)
          .sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
          )[0];

        if (postCardMsg?.post_id) {
          const postData = await apiFetch(`/posts/${postCardMsg.post_id}`);
          setPostInfo(postData);
        }
      } catch (error) {
        console.error("Error fetching post info:", error);
      }
    };

    fetchPostInfo();
  }, [conversationId]);

  // Fetch messages (initial load)
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const data = await apiFetch(
          `/conversations/${conversationId}/messages`,
        );
        setMessages(data || []);
        setLoading(false);
        if (data && data.length > 0) {
          setLastTimestamp(data[data.length - 1].created_at);
        } else {
          setLastTimestamp(new Date().toISOString());
        }
        scrollToBottom();
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // Polling for new/updated messages (replaces Supabase realtime)
  useEffect(() => {
    if (!conversationId || !lastTimestamp || loading) return;

    const poll = async () => {
      try {
        const newMessages = await apiFetch(
          `/conversations/${conversationId}/messages/new?after=${encodeURIComponent(lastTimestamp)}`,
        );
        if (newMessages && newMessages.length > 0) {
          setMessages((prev) => {
            let updated = [...prev];
            for (const newMsg of newMessages) {
              const existingIndex = updated.findIndex(
                (m) => m.id === newMsg.id,
              );
              if (existingIndex >= 0) {
                // Update existing message
                updated[existingIndex] = newMsg;
              } else {
                // New message
                if (newMsg.sender_id === currentUserId) {
                  const tempIndex = updated.findIndex(
                    (m) => m.sending && m.content === newMsg.content,
                  );
                  if (tempIndex >= 0) {
                    updated[tempIndex] = newMsg;
                    continue;
                  }
                }
                updated.push(newMsg);
              }
            }
            return updated;
          });
          setLastTimestamp(
            newMessages[newMessages.length - 1].created_at,
          );
          scrollToBottom();
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [conversationId, lastTimestamp, loading, currentUserId]);

  // Mark unread messages as read ketika buka chat
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const markAsRead = async () => {
      try {
        await apiFetch("/messages/read", {
          method: "POST",
          body: JSON.stringify({ conversation_id: conversationId }),
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markAsRead();
  }, [conversationId, currentUserId]);

  useEffect(() => {
    const fetchConversationPostId = async () => {
      if (!conversationId) return;

      try {
        const msgs = await apiFetch(
          `/conversations/${conversationId}/messages`,
        );
        const postCardMsg = msgs
          .filter((m) => m.message_type === "post_card" && m.post_id)
          .sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
          )[0];
        setConversationPostId(postCardMsg?.post_id || null);
      } catch (error) {
        setConversationPostId(null);
      }
    };

    fetchConversationPostId();
  }, [conversationId]);

  // Ekstrak message_type dari content (jika ada tag [deal_xxx])
  const extractMessageType = (content) => {
    const match = content.trim().match(/^\[([a-zA-Z0-9_]+)\]/);
    return match ? match[1] : null;
  };

  // Kirim pesan dengan message_type otomatis
  const sendMessage = async (e, content = null) => {
    if (e) e.preventDefault();
    const messageContent = content || newMessage.trim();
    if (!messageContent || !currentUserId) return;

    const message_type = extractMessageType(messageContent) || "text";

    if (!content) setNewMessage("");

    const insertData = {
      conversation_id: conversationId,
      content: messageContent,
    };

    // Hanya jika ini pesan deal, isi post_id dan message_type
    if (message_type && message_type.startsWith("deal_")) {
      insertData.message_type = message_type;

      if (conversationPostId) {
        insertData.post_id = conversationPostId;
      } else {
        console.warn("Conversation ini tidak punya post_id!");
      }
    }

    try {
      await apiFetch("/messages", {
        method: "POST",
        body: JSON.stringify(insertData),
      });
    } catch (error) {
      console.error("Error kirim pesan:", error);
      setNewMessage(content);
    }
  };

  // Cek state dari halaman Checkout untuk mengirim offer otomatis
  useEffect(() => {
    if (location.state?.pendingDealOffer && currentUserId && conversationId) {
      const {
        item_ids,
        opponent_id,
        pickupLocStr,
        deliveryLocStr,
        notes,
        proposedFee,
        items,
      } = location.state.pendingDealOffer;

      const itemCount = items ? items.length : item_ids.length;
      const itemName =
        items && items.length > 0
          ? items[0].product?.name || items[0].notes
          : "Barang Jastip";

      const payload = {
        item_ids,
        opponent_id,
        pickup_location: pickupLocStr,
        delivery_location: deliveryLocStr,
        notes,
        proposed_fee: proposedFee,
      };

      const payloadStr = JSON.stringify(payload);
      const textMessage = `[deal_offer]
📦 ${itemCount} Barang: ${itemName}
📍 Dari: ${pickupLocStr}
📍 Ke: ${deliveryLocStr}
💰 Penawaran Ongkos: Rp${proposedFee.toLocaleString("id-ID")}
📝 Catatan: ${notes || "-"}
<!--PAYLOAD:${payloadStr}-->`;

      sendMessage(null, textMessage);

      // Bersihkan state agar tidak terkirim ulang kalau user refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, currentUserId, conversationId]);

  // Pilih template deal → otomatis tambah tag [deal_xxx]
  const selectDealType = (tag, title, template) => {
    setNewMessage(`[${tag}] ${title} ✅\n\n${template}`);
    setShowDealMenu(false);
    document.getElementById("message-input")?.focus();
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
    document.getElementById("message-input")?.focus();
  };

  const handleOpenNegoFromDeal = (initialPrice) => {
    setNegoInitialPrice(initialPrice);
    setShowNegoModal(true);
  };

  const handleSendNegoFromDeal = (message) => {
    sendMessage(null, message);
  };

  if (!conversationId) {
    return (
      <div className="flex h-screen items-center justify-center text-lg">
        Chat tidak ditemukan
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-circle"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
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
              <div
                key={i}
                className={`chat ${i % 2 === 0 ? "chat-end" : "chat-start"}`}
              >
                <div className="chat-bubble bg-base-300 animate-pulse w-64 h-20 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => {
              if (msg.message_type === "system") {
                return (
                  <div key={msg.id} className="flex justify-center my-4">
                    <div className="bg-base-300/50 text-base-content/60 px-4 py-1.5 rounded-full text-xs font-medium border border-base-300">
                      {msg.content.replace(/^\[system\]\s*/, "").trim()}
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={msg.id}
                  className={`chat ${msg.sender_id === currentUserId ? "chat-end" : "chat-start"}`}
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
                      {new Date(msg.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>

                  {msg.message_type === "deal_ongkos_jastip" ? (
                    // CARD DEAL ONGKOS JASTIP - REFACTORED
                    <div
                      className={`
    relative max-w-md px-5 py-4 rounded-2xl shadow-lg overflow-hidden border
    ${
      msg.sender_id === currentUserId
        ? "bg-gradient-to-r from-[#81c784]/10 to-[#66bb6a]/10 border-emerald-300 rounded-br-none"
        : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 rounded-bl-none"
    }
  `}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold text-emerald-700 dark:text-emerald-300">
                            Deal Ongkos Jastip
                          </div>
                          <div className="text-xs opacity-70">
                            {msg.sender_id === currentUserId
                              ? "Menunggu konfirmasi dari lawan..."
                              : "Pilih aksi"}
                          </div>
                        </div>
                      </div>

                      {/* Isi Pesan (tanpa tag [deal_...]) */}
                      <div className="mb-5 whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed">
                        💰 Ongkos awal jastip : Rp{" "}
                        {msg.post
                          ? parseInt(msg.post.fee).toLocaleString("id-ID")
                          : ""}{" "}
                        <br />
                        {msg.content.replace(/^\[[^\]]+\]\s*/, "").trim()}
                      </div>

                      {/* Ekstrak ongkos yang diusulkan */}
                      {(() => {
                        const ongkosMatch =
                          msg.content.match(/💰[^0-9]*([0-9.,]+)/);
                        const ongkosText = ongkosMatch
                          ? ongkosMatch[1].replace(/\./g, "")
                          : null;
                        const ongkos = ongkosText
                          ? parseInt(ongkosText.replace(/,/g, ""), 10)
                          : null;

                        // Hanya tampilkan tombol jika pesan dari LAWAN
                        if (msg.sender_id !== currentUserId) {
                          return (
                            <div className="flex gap-3">
                              {/* Tombol Deal / Konfirmasi */}
                              <button
                                onClick={() => {
                                  const replyText = ongkos
                                    ? `Deal! Ongkos jastip Rp${ongkos.toLocaleString("id-ID")} ✅\nTerima kasih kak, kapan mau ketemuan?`
                                    : `Deal! Ongkos jastip sesuai kesepakatan ✅\nKapan mau ketemuan ya kak?`;
                                  handleQuickReply(replyText);
                                }}
                                className="flex-1 btn btn-success btn-sm rounded-xl text-white font-medium shadow-md hover:shadow-lg transition-all"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Deal
                              </button>

                              {/* Tombol Nego */}
                              <button
                                onClick={() => {
                                  const defaultPrice = ongkos
                                    ? Math.floor(ongkos * 0.9)
                                    : 30000;
                                  setNegoInitialPrice(defaultPrice.toString());
                                  setShowNegoModal(true);
                                }}
                                className="flex-1 btn btn-outline btn-warning btn-sm rounded-xl font-medium hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-all"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Nego
                              </button>
                            </div>
                          );
                        }

                        // Jika pesan dari diri sendiri → tidak tampilkan tombol apa pun
                        return null;
                      })()}

                      {/* Custom Tail Lancip */}
                      <div
                        className={`
      absolute w-3 h-5 top-6
      ${msg.sender_id === currentUserId ? "right-0 translate-x-full" : "left-0 -translate-x-full"}
    `}
                      >
                        <svg
                          viewBox="0 0 8 16"
                          className="w-full h-full drop-shadow-md"
                        >
                          <path
                            d="M0,0 Q8,8 0,16 L0,0"
                            fill={
                              msg.sender_id === currentUserId
                                ? "#66bb6a"
                                : "#dcfce7"
                            }
                            className="dark:fill-emerald-900/50"
                          />
                        </svg>
                      </div>
                    </div>
                  ) : msg.message_type === "deal_offer" ? (
                    // CARD DEAL OFFER (DARI CHECKOUT CART)
                    <div
                      className={`
      relative max-w-md px-5 py-4 rounded-2xl shadow-lg overflow-hidden border
      ${
        msg.sender_id === currentUserId
          ? "bg-gradient-to-r from-[#81c784]/10 to-[#66bb6a]/10 border-emerald-300 rounded-br-none"
          : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 rounded-bl-none"
      }
    `}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold text-blue-700 dark:text-blue-300">
                            Penawaran Keranjang
                          </div>
                          <div className="text-xs opacity-70">
                            {msg.sender_id === currentUserId
                              ? "Menunggu konfirmasi dari lawan..."
                              : "Pilih aksi"}
                          </div>
                        </div>
                      </div>

                      {/* Isi Pesan (hide payload) */}
                      <div className="mb-5 whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed">
                        {msg.content
                          .replace(/^\[deal_offer\]\s*/, "")
                          .split("<!--PAYLOAD:")[0]
                          .trim()}
                      </div>

                      {/* Aksi Konfirmasi */}
                      {(() => {
                        const payloadMatch =
                          msg.content.match(/<!--PAYLOAD:(.*?)-->/);
                        const payload = payloadMatch
                          ? JSON.parse(payloadMatch[1])
                          : null;

                        // Tombol hanya untuk lawan
                        if (msg.sender_id !== currentUserId && payload) {
                          return (
                            <div className="flex gap-3">
                              <button
                                onClick={async (e) => {
                                  e.target.disabled = true;
                                  e.target.innerText = "Memproses...";
                                  try {
                                    const result = await apiFetch(
                                      "/cart/deal",
                                      {
                                        method: "POST",
                                        body: JSON.stringify(payload),
                                      },
                                    );

                                    // Kirim balasan deal
                                    sendMessage(
                                      null,
                                      `Deal! Penawaran belanja keranjang dikonfirmasi ✅\nPesanan segera kubelikan ya.`,
                                    );

                                    // Arahkan ke DealPage
                                    navigate(`/deal?deal=${result.deal_id}`);
                                  } catch (err) {
                                    console.error("Deal confirm error:", err);
                                    alert(
                                      "Gagal mengonfirmasi deal: " +
                                        err.message,
                                    );
                                    e.target.disabled = false;
                                    e.target.innerText = "Deal / Confirm";
                                  }
                                }}
                                className="flex-1 btn btn-info btn-sm rounded-xl text-white font-medium shadow-md hover:shadow-lg transition-all"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Terima
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div
                        className={`
                          absolute w-3 h-5 top-6
                          ${msg.sender_id === currentUserId ? "right-0 translate-x-full" : "left-0 -translate-x-full"}
                        `}
                      >
                        <svg
                          viewBox="0 0 8 16"
                          className="w-full h-full drop-shadow-md"
                        >
                          <path
                            d="M0,0 Q8,8 0,16 L0,0"
                            fill={
                              msg.sender_id === currentUserId
                                ? "#66bb6a"
                                : "#eff6ff"
                            }
                            className="dark:fill-emerald-900/50"
                          />
                        </svg>
                      </div>
                    </div>
                  ) : msg.message_type === "post_card" ? (
                    // CARD POST (hanya dari sender yang memulai chat)
                    <div
                      className={`
  relative max-w-md px-5 py-4 rounded-2xl shadow-lg overflow-hidden
  bg-base-100 border border-base-300
  ${
    msg.sender_id === currentUserId
      ? "rounded-br-none" // tail di kanan (pesan sendiri)
      : "rounded-bl-none" // tail di kiri (pesan lawan)
  }
`}
                    >
                      {/* Isi Post Card */}
                      <div className="flex gap-4 items-start">
                        {/* Gambar Barang */}
                        <div className="avatar flex-shrink-0">
                          <div className="w-24 h-24 rounded-xl overflow-hidden ring-2 ring-emerald-500/20">
                            <img
                              src={msg.post?.item_photo || "/default-item.jpg"}
                              alt="Barang"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Info Post */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-end mb-2">
                            <div className="badge badge-primary badge-sm font-medium">
                              {msg.post?.type === "titip"
                                ? "Mau Titip"
                                : "Bisa Bawa"}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-base-content/80 mt-3">
                            <span className="font-semibold">
                              {msg.post?.from_city}
                            </span>
                            <svg
                              className="w-5 h-5 text-emerald-500 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                              />
                            </svg>
                            <span className="font-semibold">
                              {msg.post?.to_city}
                            </span>
                          </div>

                          <div className="mt-4">
                            <p className="text-emerald-600 font-bold text-lg">
                              Fee: Rp{msg.post?.fee?.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <hr className="my-4 border-base-300" />

                      <p className="text-xs text-center text-base-content/60 -mb-1">
                        {msg.content || "saya tertarik dengan penawaran ini."}
                      </p>

                      {/* Custom Tail Lancip - Warna sesuai bg-base-100 */}
                      <div
                        className={`
    absolute w-3 h-5 top-6
    ${
      msg.sender_id === currentUserId
        ? "right-0 translate-x-full"
        : "left-0 -translate-x-full"
    }
  `}
                      >
                        <svg
                          viewBox="0 0 8 16"
                          className="w-full h-full drop-shadow-md"
                        >
                          <path
                            d="M0,0 Q8,8 0,16 L0,0"
                            fill="#f5f5f5" // bg-base-100 di light mode (daisyUI default)
                            className="dark:fill-base-100" // otomatis ikut dark mode
                          />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`
                      relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-white shadow-md
                      ${
                        msg.sender_id === currentUserId
                          ? "bg-gradient-to-r from-[#81c784] to-[#66bb6a] rounded-br-none"
                          : "bg-emerald-600 rounded-bl-none"
                      }
                    `}
                    >
                      {/* Isi pesan */}
                      <div className="whitespace-pre-wrap text-sm">
                        {msg.content}
                      </div>

                      {/* Custom Tail / Panah Lancip - Mengarah ke Avatar */}
                      <div
                        className={`
                        absolute bottom-0 w-0 h-0 border-[12px] border-transparent
                        ${
                          msg.sender_id === currentUserId
                            ? "-right-3 border-l-[#66bb6a]" // tail kanan (pesan sendiri)
                            : "-left-3 border-r-emerald-600" // tail kiri (pesan lawan)
                        }
                      `}
                        style={{
                          // Untuk gradient (hanya pesan sendiri), pakai clip-path atau background matching
                          // Tapi karena border tidak support gradient langsung, kita pakai pseudo + background
                          ...(msg.sender_id === currentUserId && {
                            background:
                              "linear-gradient(to right, #81c784, #66bb6a)",
                            WebkitBackgroundClip: "border-box",
                            clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                            width: "12px",
                            height: "20px",
                            right: "-12px",
                            backgroundClip: "padding-box",
                          }),
                        }}
                      />
                    </div>
                  )}

                  {/* Status terbaca (hanya pesan sendiri) */}
                  {msg.sender_id === currentUserId && (
                    <div
                      className={`chat-footer text-xs mt-1 ${msg.is_read ? "text-blue-500" : "opacity-70"}`}
                    >
                      {msg.is_read ? "Terbaca ✓✓" : "Terkirim ✓"}
                    </div>
                  )}
                </div>
              );
            })}
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
        <form
          onSubmit={sendMessage}
          className="px-4 pb-4 pt-2 flex items-center gap-2"
        >
          <div className="flex-1 flex items-center gap-2 bg-base-200 border border-base-300 rounded-2xl px-3 focus-within:ring-2 focus-within:ring-emerald-400/60">
            <input
              id="message-input"
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tulis pesan atau pilih deal…"
              className="input input-ghost focus:outline-none
              bg-transparent w-full text-sm py-4"
            />
            {/* Icon PLUS kembali! */}
            <button
              type="button"
              onClick={() => setShowDealMenu(!showDealMenu)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-base-300 transition-colors"
              aria-label="Pilih template deal"
            >
              <svg
                className="w-6 h-6 text-emerald-400/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </button>
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
                <h3 className="font-bold text-lg text-center">
                  Pilih Jenis Deal
                </h3>
                <p className="text-xs text-center opacity-70 mt-1">
                  Tag otomatis ditambahkan saat kirim
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {/* 1. Ongkos Jastip */}
                <button
                  onClick={() => {
                    setNegoInitialPrice(""); // reset input
                    setShowNegoModal(true); // buka modal
                    setShowDealMenu(false); // tutup menu
                  }}
                  className="w-full text-left px-5 py-4 hover:bg-base-200 transition-colors flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-7 h-7 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-base">Ongkos Jastip</div>
                    <div className="text-xs opacity-70">
                      Sepakati biaya jasa titip / belanja
                    </div>
                  </div>
                </button>

                {/* 2. Lokasi Ketemuan */}
                <button
                  onClick={() =>
                    selectDealType(
                      "deal_lokasi_ketemuan",
                      "Deal Lokasi Ketemuan",
                      "📍 Lokasi ketemuan: \n🕐 Jam ketemuan: \n💰 Ongkos tetap: \n📝 Catatan lokasi: ",
                    )
                  }
                  className="w-full text-left px-5 py-4 hover:bg-base-200 transition-colors flex items-center gap-4 border-t border-base-300/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-7 h-7 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-base">
                      Lokasi Ketemuan
                    </div>
                    <div className="text-xs opacity-70">
                      Tentukan tempat serah terima
                    </div>
                  </div>
                </button>

                {/* 3. Waktu Ketemuan */}
                <button
                  onClick={() =>
                    selectDealType(
                      "deal_waktu_ketemuan",
                      "Deal Waktu Ketemuan",
                      "🕐 Jam ketemuan: \n📍 Lokasi: \n💰 Ongkos final: \n📝 Konfirmasi jadwal: ",
                    )
                  }
                  className="w-full text-left px-5 py-4 hover:bg-base-200 transition-colors flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-7 h-7 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-base">
                      Waktu Ketemuan
                    </div>
                    <div className="text-xs opacity-70">
                      Sepakati jam & hari bertemu
                    </div>
                  </div>
                </button>

                {/* 4. Barang Titipan */}
                <button
                  onClick={() =>
                    selectDealType(
                      "deal_barang_titipan",
                      "Deal Barang Titipan",
                      "📦 Detail barang: \n⚖️ Ukuran & berat: \n💰 Ongkos final: \n📝 Lampirkan foto/detail jika ada",
                    )
                  }
                  className="w-full text-left px-5 py-4 hover:bg-base-200 transition-colors flex items-center gap-4 border-t border-base-300/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-7 h-7 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-base">
                      Barang Titipan
                    </div>
                    <div className="text-xs opacity-70">
                      Konfirmasi detail barang yang dititipkan
                    </div>
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
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDealMenu(false)}
            />
          </>
        )}
        {/* Modal Nego Harga - Bottom Sheet */}
        <NegoModal
          isOpen={showNegoModal}
          onClose={() => setShowNegoModal(false)}
          onSend={handleSendNegoFromDeal}
          initialPrice={negoInitialPrice}
        />
      </div>
    </div>
  );
}
