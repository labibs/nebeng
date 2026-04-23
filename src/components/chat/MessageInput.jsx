import { useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import QuickReplies from "./QuickReplies";
import DealMenu from "./DealMenu";
import NegoModal from "./NegoModal";
import LocationModal from "./LocationModal";
import TimeModal from "./TimeModal";
import ItemModal from "./ItemModal";
import DeliveryModal from "./DeliveryModal";
import { Send, Image, Smile, Handshake, X } from "lucide-react";
import { uploadPostImage } from "../../lib/uploadPostImage";

export default function MessageInput({
  currentUserId,
  conversationId,
  conversationPostId,
  postInfo,
  carrierId,
  depositorId,
  setMessages,
}) {
  const [newMessage, setNewMessage] = useState("");
  const [showDealMenu, setShowDealMenu] = useState(false);
  const [showNegoModal, setShowNegoModal] = useState(false);
  const [negoInitialPrice, setNegoInitialPrice] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);

  const emojis = ["😊", "😂", "👍", "🙏", "👌", "📦", "🛵", "🤝", "📍", "💰"];

  const extractMessageType = (content) => {
    const match = content.trim().match(/^\[([a-zA-Z0-9_]+)\]/);
    return match ? match[1] : null;
  };

  const sendMessage = async (content = newMessage, type = null) => {
    if (!content.trim() && !type) return;

    const message_type = type || extractMessageType(content) || "text";
    const trimmedContent = content.trim();

    const tempId = "temp-" + Date.now();
    const optimisticMsg = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: trimmedContent,
      message_type: message_type,
      created_at: new Date().toISOString(),
      is_read: false,
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");

    const insertData = {
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: trimmedContent,
      message_type: message_type,
    };

    if (message_type.startsWith("deal_")) {
      if (conversationPostId) {
        insertData.post_id = conversationPostId;
      }
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => {
        const alreadyExists = prev.some((msg) => msg.id === data.id);
        if (alreadyExists) {
          return prev.filter((msg) => msg.id !== tempId);
        }
        return prev.map((msg) =>
          msg.id === tempId ? { ...data, post: msg.post } : msg,
        );
      });
    } catch (error) {
      console.error("Error kirim pesan:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      alert("Gagal mengirim pesan");
      setNewMessage(trimmedContent);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadPostImage(file, { folder: "nebeng/chat" });
      await sendMessage(url, "image");
    } catch (err) {
      console.error(err);
      alert("Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleQuickReply = (text) => {
    setNewMessage(text);
    document.getElementById("message-input")?.focus();
  };

  const handleSelectDeal = (tag, title, template) => {
    setNewMessage(`[${tag}] ${title} ✅\n\n${template}`);
    setShowDealMenu(false);
    document.getElementById("message-input")?.focus();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-50 pb-[env(safe-area-inset-bottom)]">
      <QuickReplies onSelect={handleQuickReply} />

      <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col gap-3">
        {/* Emoji Picker Simple */}
        {showEmojiPicker && (
          <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Menu Handshake / Deal */}
          <button
            onClick={() => setShowDealMenu(!showDealMenu)}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all ${
              showDealMenu
                ? "bg-[#4e73df] text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <Handshake size={22} />
          </button>

          {/* Input Area */}
          <div className="flex-1 flex items-center gap-2.5 rounded-[24px] bg-[#f5f7ff] px-4 py-1.5 shadow-inner border border-slate-100/50">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-slate-400 hover:text-[#4e73df] transition-colors"
            >
              <Smile size={20} />
            </button>

            <input
              id="message-input"
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Tulis pesan..."
              className="w-full bg-transparent text-[14px] py-2.5 text-slate-700 outline-none placeholder:text-slate-400"
            />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-slate-400 hover:text-[#4e73df] transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-[#4e73df] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Image size={20} />
              )}
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={() => sendMessage()}
            disabled={!newMessage.trim() || uploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4e73df] text-white shadow-[0_8px_20px_rgba(78,115,223,0.3)] active:scale-95 transition-all disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {showDealMenu && (
        <DealMenu
          onClose={() => setShowDealMenu(false)}
          onSelectDeal={handleSelectDeal}
          onOpenNego={() => {
            setShowNegoModal(true);
            setShowDealMenu(false);
          }}
          onOpenLocation={() => {
            setShowLocationModal(true);
            setShowDealMenu(false);
          }}
          onOpenTime={() => {
            setShowTimeModal(true);
            setShowDealMenu(false);
          }}
          onOpenItem={() => {
            setShowItemModal(true);
            setShowDealMenu(false);
          }}
          onOpenDelivery={() => {
            setShowDeliveryModal(true);
            setShowDealMenu(false);
          }}
          postId={conversationPostId}
          postInfo={postInfo}
          currentUserId={currentUserId}
          carrierId={carrierId}
          depositorId={depositorId}
          conversationId={conversationId}
        />
      )}

      {/* Modals are kept as they were */}
      <NegoModal
        isOpen={showNegoModal}
        onClose={() => setShowNegoModal(false)}
        onSend={(msg) => sendMessage(msg)}
        initialPrice={negoInitialPrice}
        postInfo={postInfo}
      />
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSend={(msg) => sendMessage(msg)}
        postInfo={postInfo}
      />
      <TimeModal
        isOpen={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onSend={(msg) => sendMessage(msg)}
        postInfo={postInfo}
      />
      <ItemModal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        onSend={(msg) => sendMessage(msg)}
        postInfo={postInfo}
      />
      <DeliveryModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        onSend={(msg) => sendMessage(msg)}
        postInfo={postInfo}
      />
    </div>
  );
}
