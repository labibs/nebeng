import MessageBubble from "./MessageBubble";

function formatDateSeparator(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export default function ChatMessages({
  messages,
  loading,
  currentUserId,
  currentUserAvatar,
  recipientImageUrl,
  postInfo,
  messagesEndRef,
  onOpenNego,
  onSendNego,
  onInsertDeal,
  onUpdateDealLocation,
  onUpdateDealTime,
  onUpdateDealItem,
  onUpdateDealDelivery,
}) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`chat ${i % 2 === 0 ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-bubble bg-[#e4edff] animate-pulse w-64 h-20 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- GROUP PESAN PER TANGGAL ---
  const grouped = messages.reduce((acc, msg) => {
    const key = new Date(msg.created_at).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Jakarta",
    });

    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);

    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto relative p-4 pb-32">
      {Object.entries(grouped).map(([dateKey, msgs]) => (
        <div key={dateKey} className="space-y-6">
          {/* 🔹 STICKY DATE SEPARATOR */}
          <div className="sticky top-0 z-20 flex justify-center py-1">
            <div
              className="px-3 py-1 rounded-full text-xs
              bg-base-300/90 dark:bg-base-700/90 backdrop-blur"
            >
              {formatDateSeparator(msgs[0].created_at)}
            </div>
          </div>

          {/* 🔹 CHAT BUBBLES FOR THIS DATE */}
          {msgs.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              currentUserId={currentUserId}
              currentUserAvatar={currentUserAvatar}
              recipientImageUrl={recipientImageUrl}
              postInfo={postInfo}
              onOpenNego={onOpenNego}
              onSendNego={onSendNego}
              onInsertDeal={onInsertDeal}
              onUpdateDealLocation={onUpdateDealLocation}
              onUpdateDealTime={onUpdateDealTime}
              onUpdateDealItem={onUpdateDealItem}
              onUpdateDealDelivery={onUpdateDealDelivery}
            />
          ))}
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
