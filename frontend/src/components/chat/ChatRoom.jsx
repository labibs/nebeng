import { useParams, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../../lib/apiClient";
import {
  buildDirectDealPayload,
  createOrReuseDealFromPayload,
  inferDealRoles,
} from "../../lib/dealFlow";

import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import MessageInput from "./MessageInput";

const POLL_INTERVAL = 4000;

export default function ChatRoom() {
  const { conversationId } = useParams();
  const { user } = useUser();

  const currentUserId = user?.id;
  const currentUserAvatar =
    user?.imageUrl || "https://www.gravatar.com/avatar/0?d=mp";

  const [recipient, setRecipient] = useState({
    name: "Loading...",
    imageUrl: "https://www.gravatar.com/avatar/0?d=mp",
  });
  const [postInfo, setPostInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversationPostId, setConversationPostId] = useState(null);
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const dealParticipants = inferDealRoles(postInfo, currentUserId);
  const carrierId = dealParticipants?.carrierId || null;
  const depositorId = dealParticipants?.depositorId || null;

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractMessageType = (content) => {
    const match = content.trim().match(/^\[([a-zA-Z0-9_]+)\]/);
    return match ? match[1] : null;
  };

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !currentUserId) return;

    const message_type = extractMessageType(content) || "text";

    const insertData = {
      conversation_id: conversationId,
      content: content.trim(),
    };

    if (message_type.startsWith("deal_")) {
      insertData.message_type = message_type;
      if (conversationPostId) {
        insertData.post_id = conversationPostId;
      }
    }

    try {
      const data = await apiFetch("/messages", {
        method: "POST",
        body: JSON.stringify(insertData),
      });
      return data?.id;
    } catch (error) {
      console.error("Error kirim pesan:", error);
      alert("Gagal mengirim pesan");
      return null;
    }
  }, [conversationId, conversationPostId, currentUserId]);

  const location = useLocation();
  // Auto-send deal summary if arriving from Checkout
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
      const warungName =
        items && items.length > 0 ? items[0].warung?.name : "Warung";

      const totalItemPrice = items
        ? items.reduce(
            (sum, i) => sum + Number(i.estimated_price || 0) * i.quantity,
            0,
          )
        : 0;
      const totalPayment = totalItemPrice + proposedFee;

      const payload = {
        item_ids,
        opponent_id,
        carrier_id: opponent_id, // Default: opponent is current courier if I'm from Checkout
        depositor_id: currentUserId,
        post_id: conversationPostId || null,
        agreed_fee: proposedFee,
        status: "pending",
        pickup_location: pickupLocStr,
        delivery_location: deliveryLocStr,
        pickup_datetime:
          new Date().toISOString().replace("T", " ").split(".")[0] + "+07",
        item_description:
          items?.map((i) => i.product?.name || i.notes).join(", ") || itemName,
        item_photos:
          items?.[0]?.product?.image_url || items?.[0]?.warung?.item_photo
            ? [items[0].product?.image_url || items[0].warung?.item_photo]
            : [],
        notes: notes || "",
        delivery_status: "draft",
        // Optional extras
        warung_name: warungName,
        total_item_price: totalItemPrice,
        total_payment: totalPayment,
      };

      const payloadStr = JSON.stringify(payload);
      const textMessage = `[deal_offer]
🏪 Warung: ${warungName}
📦 ${itemCount} Barang: ${itemName}
📍 Dari: ${pickupLocStr}
📍 Ke: ${deliveryLocStr}
💰 Harga Barang: Rp${totalItemPrice.toLocaleString("id-ID")}
💰 Jastip/Ongkos: Rp${proposedFee.toLocaleString("id-ID")}
🔥 Total Pembayaran: Rp${totalPayment.toLocaleString("id-ID")}
📝 Catatan: ${notes || "-"}
<!--PAYLOAD:${payloadStr}-->`;

      // Call sendMessage
      sendMessage(textMessage).then((msgId) => {
        if (msgId) {
          // Deal offer sent successfully
        }
      });

      // Bersihkan state agar tidak terkirim ulang kalau user refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, currentUserId, conversationId, conversationPostId, sendMessage]);

  const findOrCreateDeal = async (finalPostId, msgId) => {
    if (!finalPostId || !currentUserId || !postInfo) return null;

    const payload = buildDirectDealPayload(
      { ...postInfo, id: finalPostId },
      currentUserId,
    );

    if (!payload) return null;

    const deal = await createOrReuseDealFromPayload(apiFetch, {
      ...payload,
      message_id: msgId,
    });

    return deal?.id || deal?.deal_id || null;
  };

  const insertDeal = async (postIdOrPayload, agreedFee, msgId) => {
    if (!currentUserId) return null;

    const payload =
      typeof postIdOrPayload === "object" && postIdOrPayload !== null
        ? {
            ...postIdOrPayload,
            message_id: msgId ?? postIdOrPayload.message_id ?? null,
          }
        : null;

    const finalPostId =
      payload?.post_id || postIdOrPayload || conversationPostId;

    try {
      const finalPayload =
        payload ||
        buildDirectDealPayload(
          { ...postInfo, id: finalPostId },
          currentUserId,
        );

      if (!finalPayload) {
        throw new Error("Payload deal belum siap");
      }

      const deal = await createOrReuseDealFromPayload(apiFetch, {
        ...finalPayload,
        agreed_fee:
          agreedFee ?? finalPayload.agreed_fee ?? postInfo?.fee ?? 0,
        status: "pending",
        delivery_status: "draft",
        message_id: msgId,
      });

      const dealId = deal?.id || deal?.deal_id || null;

      if (!dealId) {
        throw new Error("Deal tidak terbentuk");
      }

      return dealId;
    } catch (error) {
      console.error("Error deal operation:", error);
      return null;
    }
  };

  const updateDealLocation = async (postId, locationData, msgId) => {
    if (!postInfo?.clerk_user_id || !currentUserId) return;

    const finalPostId = postId || conversationPostId;

    try {
      const dealId = await findOrCreateDeal(finalPostId, msgId);

      const locationString = `${locationData.lat},${locationData.lng}, ${locationData.name}`;
      await apiFetch(`/deals/${dealId}`, {
        method: "PUT",
        body: JSON.stringify({
          pickup_location: locationString,
          message_id: msgId,
        }),
      });

      alert("Lokasi deal berhasil diupdate!");
    } catch (error) {
      console.error("Error update deal location:", error);
      alert("Gagal update lokasi deal");
    }
  };

  const updateDealTime = async (postId, timeData, msgId) => {
    if (!postInfo?.clerk_user_id || !currentUserId) return;

    const finalPostId = postId || conversationPostId;

    try {
      const dealId = await findOrCreateDeal(finalPostId, msgId);

      await apiFetch(`/deals/${dealId}`, {
        method: "PUT",
        body: JSON.stringify({
          pickup_datetime: timeData.datetime,
          notes: timeData.notes || "",
          message_id: msgId,
        }),
      });

      alert("Waktu deal berhasil diupdate!");
    } catch (error) {
      console.error("Error update deal time:", error);
      alert("Gagal update waktu deal");
    }
  };

  const updateDealItem = async (postId, itemData, msgId) => {
    if (!postInfo?.clerk_user_id || !currentUserId) return;

    const finalPostId = postId || conversationPostId;

    try {
      const dealId = await findOrCreateDeal(finalPostId, msgId);

      await apiFetch(`/deals/${dealId}`, {
        method: "PUT",
        body: JSON.stringify({
          item_description: itemData.description,
          item_photos: itemData.photos || [],
          message_id: msgId,
        }),
      });

      alert("Detail barang deal berhasil diupdate!");
    } catch (error) {
      console.error("Error update deal item:", error);
      alert("Gagal update detail barang deal");
    }
  };

  const updateDealDelivery = async (postId, locationData, msgId) => {
    if (!postInfo?.clerk_user_id || !currentUserId) return;

    const finalPostId = postId || conversationPostId;

    try {
      const dealId = await findOrCreateDeal(finalPostId, msgId);

      const locationString = `${locationData.lat},${locationData.lng}, ${locationData.name}`;
      await apiFetch(`/deals/${dealId}`, {
        method: "PUT",
        body: JSON.stringify({
          delivery_location: locationString,
          message_id: msgId,
        }),
      });

      alert("Lokasi pengantaran deal berhasil diupdate!");
    } catch (error) {
      console.error("Error update deal delivery:", error);
      alert("Gagal update lokasi pengantaran deal");
    }
  };

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
      } catch {
            // Fallback: use sender info embedded in message if available
            if (opponentMsg.sender) {
              setRecipient({
                name: opponentMsg.sender.name || "User",
                imageUrl:
                  opponentMsg.sender.avatar_url || "/default-avatar.png",
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

  // Fetch post info (untuk ongkos & post card)
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
        } else {
          setPostInfo(null);
        }
      } catch (error) {
        console.error("Error fetching post info:", error);
        setPostInfo(null);
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
        setMessages(data ?? []);
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
                // Update existing message (handles UPDATE events from old realtime)
                updated[existingIndex] = newMsg;
              } else {
                // New message (handles INSERT events from old realtime)
                if (newMsg.sender_id === currentUserId) {
                  const tempIndex = updated.findIndex(
                    (m) => m.sending && m.content === newMsg.content,
                  );
                  if (tempIndex >= 0) {
                    // Replace optimistic message with real one
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

  // Mark as read
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

  // Fetch conversationPostId untuk deal
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
      } catch {
        setConversationPostId(null);
      }
    };

    fetchConversationPostId();
  }, [conversationId]);

  if (!conversationId) {
    return (
      <div className="flex h-screen items-center justify-center text-lg">
        Chat tidak ditemukan
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#f0f7ff]">
      <div className="shrink-0">
        <ChatHeader recipient={recipient} isLoading={loading} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <ChatMessages
          messages={messages}
          loading={loading}
          currentUserId={currentUserId}
          currentUserAvatar={currentUserAvatar}
          recipientImageUrl={recipient.imageUrl}
          postInfo={postInfo}
          messagesEndRef={messagesEndRef}
          onSendNego={sendMessage}
          onInsertDeal={insertDeal}
          onUpdateDealLocation={updateDealLocation}
          onUpdateDealTime={updateDealTime}
          onUpdateDealItem={updateDealItem}
          onUpdateDealDelivery={updateDealDelivery}
        />
      </div>

      <div className="shrink-0">
        <MessageInput
          currentUserId={currentUserId}
          conversationId={conversationId}
          conversationPostId={conversationPostId}
          postInfo={postInfo}
          setMessages={setMessages}
          carrierId={carrierId}
          depositorId={depositorId}
        />
      </div>
    </div>
  );
}
