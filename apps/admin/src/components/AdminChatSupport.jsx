import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../lib/supabaseClient";
import {
  MessageCircle,
  X,
  Search,
  Send,
  ChevronLeft,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale/id";

// Helper to fetch data (copied/adapted from main app logic if needed,
// or just use supabase directly for simplicity in admin)
const apiFetch = async (path, options = {}) => {
  // Simple implementation for admin if full apiClient isn't shared
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;

  if (path === '/api/conversations' && method === 'GET') {
    // List conversations for current admin
    const clerkId = options.clerkId;
    const { data: participants, error: pError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', clerkId);

    if (pError) throw pError;
    const convIds = (participants || []).map(p => p.conversation_id);
    if (!convIds.length) return [];

    const { data: messages, error: mError } = await supabase
      .from('messages')
      .select('id, conversation_id, content, created_at, sender_id, is_read')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    if (mError) throw mError;

    // Get opponents
    const { data: allParticipants, error: apError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds);

    if (apError) throw apError;
    const opponentIds = allParticipants.filter(p => p.user_id !== clerkId).map(p => p.user_id);

    const { data: opponents, error: oError } = await supabase
      .from('users')
      .select('clerk_id, name, avatar_url')
      .in('clerk_id', opponentIds);

    if (oError) throw oError;
    const opponentMap = new Map(opponents.map(o => [o.clerk_id, o]));

    const lastMsgMap = new Map();
    const unreadMap = new Map();
    messages.forEach(msg => {
      if (!lastMsgMap.has(msg.conversation_id)) lastMsgMap.set(msg.conversation_id, msg);
      if (msg.sender_id !== clerkId && !msg.is_read) {
        unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
      }
    });

    const results = convIds.map(id => {
      const oppId = allParticipants.find(p => p.conversation_id === id && p.user_id !== clerkId)?.user_id;
      const opponent = opponentMap.get(oppId) || { name: 'Unknown', avatar_url: null };
      const lastMsg = lastMsgMap.get(id);
      return {
        conversationId: id,
        opponent,
        lastMessage: lastMsg?.content || 'Belum ada pesan',
        lastTime: lastMsg?.created_at || '',
        unreadCount: unreadMap.get(id) || 0
      };
    });

    return results.sort((a, b) => b.lastTime.localeCompare(a.lastTime));
  }
  return [];
};

export default function AdminChatSupport({ isOpen, onClose }) {
  const { user } = useUser();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchConversations();
    }
  }, [isOpen, user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/conversations', { clerkId: user.id });
      setConversations(data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (!error) {
      setMessages(data);
      scrollToBottom();
    }

    // Mark as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", convId)
      .neq("sender_id", user.id)
      .eq("is_read", false);
  };

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.conversationId);

      const channel = supabase
        .channel(`chat_${selectedConv.conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConv.conversationId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConv]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConv.conversationId,
      sender_id: user.id,
      content,
    });

    if (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#e2e8f0] animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#4e73df] p-4 text-white">
        <div className="flex items-center gap-3">
          {selectedConv ? (
            <button
              onClick={() => setSelectedConv(null)}
              className="rounded-full p-1 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <MessageCircle size={22} />
          )}
          <h3 className="font-bold">
            {selectedConv ? selectedConv.opponent.name : "Bantuan Chat"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#f8fafc]">
        {!selectedConv ? (
          /* List Conversations */
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400 font-medium">
                Memuat percakapan...
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
                  <MessageCircle size={32} />
                </div>
                <p className="text-sm font-bold text-slate-500">Belum ada chat bantuan</p>
                <p className="text-xs text-slate-400 mt-1">Pesan dari user akan muncul di sini</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  onClick={() => setSelectedConv(conv)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all text-left group"
                >
                  <div className="relative">
                    <img
                      src={conv.opponent.avatar_url || "https://www.gravatar.com/avatar/0?d=mp"}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="font-bold text-slate-800 truncate group-hover:text-[#4e73df] transition-colors">
                        {conv.opponent.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                        {conv.lastTime ? formatDistanceToNow(new Date(conv.lastTime), { addSuffix: false, locale: localeId }) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate font-medium">
                      {conv.lastMessage}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          /* Chat Detail */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div
                    key={msg.id || i}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm ${
                        isMe
                          ? "bg-[#4e73df] text-white rounded-tr-none"
                          : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                      }`}
                    >
                      {msg.content}
                      <p className={`text-[10px] mt-1 ${isMe ? "text-white/70" : "text-slate-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t border-slate-100"
            >
              <div className="flex items-center gap-2 bg-[#f8fafc] rounded-full px-4 py-1.5 border border-slate-200 focus-within:border-[#4e73df] focus-within:ring-4 focus-within:ring-[#4e73df]/5 transition-all">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 bg-transparent py-2 text-sm font-medium outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="rounded-full bg-[#4e73df] p-2 text-white shadow-md shadow-[#4e73df]/20 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
