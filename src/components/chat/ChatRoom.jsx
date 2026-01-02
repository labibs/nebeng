// src/components/chat/ChatRoom.jsx
import { useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';
import { useSupabaseUserId } from '../../lib/UserContext';

export default function ChatRoom() {
  const { conversationId } = useParams();
  const { user } = useUser();
  const { supabaseUserId } = useSupabaseUserId();
  
  const currentUserId = user?.id;
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

  const extractMessageType = (content) => {
    const match = content.trim().match(/^\[([a-zA-Z0-9_]+)\]/);
    return match ? match[1] : null;
  };

  const sendMessage = async (content) => {
    if (!content.trim() || !currentUserId) return;

    const message_type = extractMessageType(content) || 'text';

    const insertData = {
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
    };

    if (message_type.startsWith('deal_')) {
      insertData.message_type = message_type;
      if (conversationPostId) {
        insertData.post_id = conversationPostId;
      }
    }

    const { error } = await supabase.from('messages').insert(insertData);

    if (error) {
      console.error('Error kirim pesan:', error);
      alert('Gagal mengirim pesan');
    }
  };

  const userUuId = user?.id;

  // console.log('Current User ID:', userUuId);

  const insertDeal = async (postId, agreedFee) => {
    if (!postInfo?.clerk_user_id || !supabaseUserId || !postId) return;

    const { error } = await supabase.from('deals').insert({
      carrier_id: postInfo.clerk_user_id,
      depositor_id: currentUserId,
      post_id: postId,
      agreed_fee: agreedFee,
      status: 'pending',
      pickup_location: 'TBD',
      delivery_location: 'TBD',
      pickup_datetime: '2026-01-20 12:00:00',
      item_description: 'TBD',
      item_photos: [],
      notes: '',
    });

    if (error) {
      console.error('Error insert deal:', error);
      alert('Gagal membuat deal');
    } else {
      alert('Deal berhasil dibuat!');
    }
  };

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

  // Fetch post info (untuk ongkos & post card)
  useEffect(() => {
    if (!conversationId) return;

    const fetchPostInfo = async () => {
      // Ambil post_id dari pesan terakhir dengan message_type 'post_card'
      const { data: messageData, error: msgError } = await supabase
        .from('messages')
        .select('post_id')
        .eq('conversation_id', conversationId)
        .eq('message_type', 'post_card')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Message data for post_id:', messageData, 'Error:', msgError);

      if (messageData?.post_id) {
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('item_description, item_photo, from_city, to_city, price, fee, type, user_id, clerk_user_id')
          .eq('id', messageData.post_id)
          .single();

        console.log('Post data:', postData, 'Error:', postError);
        setPostInfo(postData);
      } else {
        console.log('No post_id found in messages');
        setPostInfo(null);
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
        .select('id, content, created_at, sender_id, is_read, message_type, post_id')
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
          setMessages((prev) => prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg)));
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
      <ChatHeader recipient={recipient} />

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
      />

      <MessageInput
        currentUserId={currentUserId}
        conversationId={conversationId}
        conversationPostId={conversationPostId}
        setMessages={setMessages}
      />
    </div>
  );
}