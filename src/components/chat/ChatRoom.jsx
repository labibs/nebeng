import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient'; // sesuaikan path

import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';

export default function ChatRoom() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const currentUserId = user?.id;
  const currentClerkId = user?.clerkId;
  const currentUserAvatar = user?.imageUrl || '/default-avatar.png';

  const [recipient, setRecipient] = useState({ name: 'Loading...', imageUrl: '/default-avatar.png' });
  const [postInfo, setPostInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversationPostId, setConversationPostId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch recipient
  useEffect(() => {
    if (!currentUserId || !conversationId) return;

    const fetchRecipient = async () => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', currentUserId);

      if (participants?.length > 0) {
        const opponentId = participants[0].user_id;
        const { data: opponent } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('clerk_id', opponentId)
          .single();

        setRecipient({
          name: opponent?.name || 'User',
          imageUrl: opponent?.avatar_url || '/default-avatar.png',
        });
      }
    };

    fetchRecipient();
  }, [currentUserId, conversationId]);

  // Fetch post info (untuk ongkos awal)
  useEffect(() => {
    if (!conversationId) return;

    const fetchPostInfo = async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select('post_id')
        .eq('id', conversationId)
        .single();

      if (conv?.post_id) {
        const { data: postData } = await supabase
          .from('posts')
          .select('item_description, item_photo, from_city, to_city, price, fee, type')
          .eq('id', conv.post_id)
          .single();

        setPostInfo(postData);
      }
    };

    fetchPostInfo();
  }, [conversationId]);

  // Fetch messages + realtime
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`
          id, content, created_at, sender_id, is_read, message_type, post_id
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    const safeChannelName = `chat_${conversationId.replace(/-/g, '_')}`;

    const channel = supabase
      .channel(safeChannelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Mark as read
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const markAsRead = async () => {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false);
    };

    markAsRead();
  }, [conversationId, currentUserId]);

  // Fetch conversationPostId untuk deal
  useEffect(() => {
    const fetchConversationPostId = async () => {
      if (!conversationId) return;

      const { data } = await supabase
        .from('messages')
        .select('post_id')
        .eq('conversation_id', conversationId)
        .eq('message_type', 'post_card')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setConversationPostId(data?.post_id || null);
    };

    fetchConversationPostId();
  }, [conversationId]);

  if (!conversationId) {
    return <div className="flex h-screen items-center justify-center text-lg">Chat tidak ditemukan</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-base-200">
      {/* Header */}
      <ChatHeader recipient={recipient} />

      {/* Messages Area */}
      <ChatMessages
        messages={messages}
        loading={loading}
        currentUserId={currentUserId}
        currentUserAvatar={currentUserAvatar}
        recipientImageUrl={recipient.imageUrl}
        postInfo={postInfo}
        messagesEndRef={messagesEndRef}
      />

      {/* Input Area */}
      <MessageInput
        currentUserId={currentUserId}
        conversationId={conversationId}
        conversationPostId={conversationPostId}
        setMessages={setMessages}
      />
    </div>
  );
}