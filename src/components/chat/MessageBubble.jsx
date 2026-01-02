import DealCard from './DealCard';
import PostCard from './PostCard';

export default function MessageBubble({
  msg,
  currentUserId,
  currentUserAvatar,
  recipientImageUrl,
  postInfo,
}) {
  const isMine = msg.sender_id === currentUserId;
  const avatar = isMine ? currentUserAvatar : recipientImageUrl;

  // Pesan Deal Ongkos Jastip
  if (msg.message_type === 'deal_ongkos_jastip') {
    return (
      <DealCard
        msg={msg}
        isMine={isMine}
        avatar={avatar}
        postInfo={postInfo}
        currentUserId={currentUserId}
      />
    );
  }

  // Pesan Post Card
  if (msg.message_type === 'post_card') {
    return (
      <PostCard
        msg={msg}
        isMine={isMine}
        avatar={avatar}
        postInfo={postInfo}
      />
    );
  }

  // Pesan Teks Biasa
  return (
    <div className={`chat ${isMine ? 'chat-end' : 'chat-start'}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img src={avatar} alt="avatar" />
        </div>
      </div>

      <div className="chat-header">
        <time className="text-xs opacity-70">
          {new Date(msg.created_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>

      <div
        className={`
          relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-white shadow-md
          ${isMine
            ? 'bg-gradient-to-r from-[#81c784] to-[#66bb6a] rounded-br-none'
            : 'bg-emerald-600 rounded-bl-none'
          }
        `}
      >
        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
      </div>

      {/* Status terbaca - hanya untuk pesan sendiri */}
      {isMine && (
        <div className={`chat-footer text-xs mt-1 ${msg.is_read ? 'text-blue-500' : 'opacity-70'}`}>
          {msg.is_read ? 'Terbaca ✓✓' : 'Terkirim ✓'}
        </div>
      )}
    </div>
  );
}