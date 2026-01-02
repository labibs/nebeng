import MessageBubble from './MessageBubble';

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
}) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`chat ${i % 2 === 0 ? 'chat-end' : 'chat-start'}`}>
              <div className="chat-bubble bg-base-300 animate-pulse w-64 h-20 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-32">
      <div className="space-y-6">
        {messages.map((msg) => (
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
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}