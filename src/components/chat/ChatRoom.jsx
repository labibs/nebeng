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
  const [carrierId, setCarrierId] = useState(null);
  const [depositorId, setDepositorId] = useState(null);

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
  const resolveParticipantIds = async (conversationId, postInfo) => {
    const { data: opponent } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", postInfo.clerk_user_id)
      .limit(1)
      .single();

    const opponentId = opponent?.user_id ?? null;

    return postInfo.type === "bawa"
      ? {
          carrierId: postInfo.clerk_user_id,
          depositorId: opponentId,
        }
      : {
          carrierId: opponentId,
          depositorId: postInfo.clerk_user_id,
        };
  };

  useEffect(() => {
    if (!conversationId || !postInfo) return;

    const loadIds = async () => {
      const ids = await resolveParticipantIds(conversationId, postInfo);
      if (!ids) return;

      setCarrierId(ids.carrierId);
      setDepositorId(ids.depositorId);
    };

    loadIds();
  }, [conversationId, postInfo]);

  console.log('cek dulu', carrierId, depositorId)


  const insertDeal = async (postId, agreedFee, msgId) => {
    if (!postInfo?.clerk_user_id || !supabaseUserId || !postId) return;

    // Pastikan participant IDs siap
    if (!carrierId || !depositorId) {
      console.warn("carrierId / depositorId belum siap");
      return;
    }

    // 1️⃣ Cek apakah deal sudah ada
    const { data: existingDeal, error: checkError } = await supabase
      .from("deals")
      .select("id")
      .eq("post_id", postId)
      .eq("carrier_id", carrierId)
      .eq("depositor_id", depositorId)
      .maybeSingle(); // 👈 lebih rapi

    if (checkError) {
      console.error("Error checking existing deal:", checkError);
      alert("Gagal memeriksa deal yang ada");
      return;
    }

    let dealId = existingDeal?.id;

    // 2️⃣ Jika deal sudah ada → UPDATE agreed_fee
    if (dealId) {
      const { error: updateError } = await supabase
        .from("deals")
        .update({
          agreed_fee: agreedFee,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", dealId);

      if (updateError) {
        console.error("Error updating deal:", updateError);
        alert("Gagal meng-update deal");
        return;
      }

      alert("Deal sudah ada — fee berhasil diperbarui!");
    }

    // 3️⃣ Jika belum ada → INSERT deal baru
    if (!dealId) {
      const { data, error } = await supabase
        .from("deals")
        .insert({
          carrier_id: carrierId,
          depositor_id: depositorId,
          post_id: postId,
          agreed_fee: agreedFee,
          status: "pending",
          pickup_location: "TBD",
          delivery_location: "TBD",
          pickup_datetime: "2026-01-20 12:00:00",
          item_description: "TBD",
          item_photos: [],
          notes: "",
        })
        .select("id")
        .single(); // 👈 ambil id hasil insert

      if (error) {
        console.error("Error insert deal:", error);
        alert("Gagal membuat deal");
        return;
      }

      dealId = data.id;

      alert("Deal baru berhasil dibuat!");
    }


  // 4️⃣ Update message → ALWAYS pakai dealId final
  if (msgId && dealId) {
    const { error: msgError } = await supabase
      .from("messages")
      .update({
        deal_id: dealId,
      })
      .eq("id", msgId);

    if (msgError) {
      console.error("Gagal update message.deal_id:", msgError);
    }
  }
};


  const updateDealLocation = async (postId, locationData) => {
    if (!postInfo?.clerk_user_id || !currentUserId || !postId) return;

    console.log('cek dulu', postId, postInfo.clerk_user_id, currentUserId);

    // Cari deal yang sudah ada berdasarkan post_id, carrier_id, depositor_id
    // Ambil yang terbaru jika ada multiple
    const { data: existingDeals, error: fetchError } = await supabase
      .from('deals')
      .select('id')
      .eq('post_id', postId)
      .eq('carrier_id', carrierId)
      .eq('depositor_id', depositorId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching deal:', fetchError);
      alert('Gagal mencari deal');
      return;
    }

    let dealId;

    if (!existingDeals || existingDeals.length === 0) {
      // Jika belum ada deal, buat deal baru dengan data default
      const { data: newDeal, error: insertError } = await supabase
        .from('deals')
        .insert({
          carrier_id: carrierId,
          depositor_id: depositorId,
          post_id: postId,
          agreed_fee: postInfo?.fee || 0, // Ambil dari post info jika ada
          status: 'pending',
          pickup_location: 'TBD',
          delivery_location: 'TBD',
          pickup_datetime: '2026-01-20 12:00:00',
          item_description: 'TBD',
          item_photos: [],
          notes: '',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating new deal:', insertError);
        alert('Gagal membuat deal baru');
        return;
      }

      dealId = newDeal.id;
      console.log('Created new deal with ID:', dealId);
    } else {
      dealId = existingDeals[0].id;
    }

    // Update pickup_location dengan koordinat
    const locationString = `${locationData.lat},${locationData.lng}`;
    const { error: updateError } = await supabase
      .from('deals')
      .update({ pickup_location: locationString })
      .eq('id', dealId);

    if (updateError) {
      console.error('Error update deal location:', updateError);
      alert('Gagal update lokasi deal');
    } else {
      alert('Lokasi deal berhasil diupdate!');
    }
  };

  const updateDealTime = async (postId, timeData) => {
    if (!postInfo?.clerk_user_id || !currentUserId || !postId) return;

    console.log('Update deal time:', postId, timeData);

    // Cari deal yang sudah ada berdasarkan post_id, carrier_id, depositor_id
    const { data: existingDeals, error: fetchError } = await supabase
      .from('deals')
      .select('id')
      .eq('post_id', postId)
      .eq('carrier_id', carrierId)
      .eq('depositor_id', depositorId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching deal:', fetchError);
      alert('Gagal mencari deal');
      return;
    }

    let dealId;

    if (!existingDeals || existingDeals.length === 0) {
      // Jika belum ada deal, buat deal baru dengan data default
      const { data: newDeal, error: insertError } = await supabase
        .from('deals')
        .insert({
          carrier_id: carrierId,
          depositor_id: depositorId,
          post_id: postId,
          agreed_fee: postInfo?.fee || 0, // Ambil dari post info jika ada
          status: 'pending',
          pickup_location: 'TBD',
          delivery_location: 'TBD',
          pickup_datetime: '2026-01-20 12:00:00',
          item_description: 'TBD',
          item_photos: [],
          notes: '',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating new deal:', insertError);
        alert('Gagal membuat deal baru');
        return;
      }

      dealId = newDeal.id;
      console.log('Created new deal with ID:', dealId);
    } else {
      dealId = existingDeals[0].id;
    }

    // Update pickup_datetime dan notes
    const { error: updateError } = await supabase
      .from('deals')
      .update({
        pickup_datetime: timeData.datetime,
        notes: timeData.notes || ''
      })
      .eq('id', dealId);

    if (updateError) {
      console.error('Error update deal time:', updateError);
      alert('Gagal update waktu deal');
    } else {
      alert('Waktu deal berhasil diupdate!');
    }
  };

  const updateDealItem = async (postId, itemData) => {
    if (!postInfo?.clerk_user_id || !currentUserId || !postId) return;

    console.log('Update deal item:', postId, itemData);

    // Cari deal yang sudah ada berdasarkan post_id, carrier_id, depositor_id
    const { data: existingDeals, error: fetchError } = await supabase
      .from('deals')
      .select('id')
      .eq('post_id', postId)
      .eq('carrier_id', carrierId)
      .eq('depositor_id', depositorId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching deal:', fetchError);
      alert('Gagal mencari deal');
      return;
    }

    let dealId;

    if (!existingDeals || existingDeals.length === 0) {
      // Jika belum ada deal, buat deal baru dengan data default
      const { data: newDeal, error: insertError } = await supabase
        .from('deals')
        .insert({
          carrier_id: carrierId,
          depositor_id: depositorId,
          post_id: postId,
          agreed_fee: postInfo?.fee || 0, // Ambil dari post info jika ada
          status: 'pending',
          pickup_location: 'TBD',
          delivery_location: 'TBD',
          pickup_datetime: '2026-01-20 12:00:00',
          item_description: 'TBD',
          item_photos: [],
          notes: '',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating new deal:', insertError);
        alert('Gagal membuat deal baru');
        return;
      }

      dealId = newDeal.id;
      console.log('Created new deal with ID:', dealId);
    } else {
      dealId = existingDeals[0].id;
    }

    // Update item_description dan item_photos
    const { error: updateError } = await supabase
      .from('deals')
      .update({
        item_description: itemData.description,
        item_photos: itemData.photos || []
      })
      .eq('id', dealId);

    if (updateError) {
      console.error('Error update deal item:', updateError);
      alert('Gagal update detail barang deal');
    } else {
      alert('Detail barang deal berhasil diupdate!');
    }
  };

  const updateDealDelivery = async (postId, locationData) => {
    if (!postInfo?.clerk_user_id || !currentUserId || !postId) return;

    console.log('Update deal delivery:', postId, locationData);

    // Cari deal yang sudah ada berdasarkan post_id, carrier_id, depositor_id
    const { data: existingDeals, error: fetchError } = await supabase
      .from('deals')
      .select('id')
      .eq('post_id', postId)
      .eq('carrier_id', carrierId)
      .eq('depositor_id', depositorId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching deal:', fetchError);
      alert('Gagal mencari deal');
      return;
    }

    let dealId;

    if (!existingDeals || existingDeals.length === 0) {
      // Jika belum ada deal, buat deal baru dengan data default
      const { data: newDeal, error: insertError } = await supabase
        .from('deals')
        .insert({
          carrier_id: carrierId,
          depositor_id: depositorId,
          post_id: postId,
          agreed_fee: postInfo?.fee || 0, // Ambil dari post info jika ada
          status: 'pending',
          pickup_location: 'TBD',
          delivery_location: 'TBD',
          pickup_datetime: '2026-01-20 12:00:00',
          item_description: 'TBD',
          item_photos: [],
          notes: '',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating new deal:', insertError);
        alert('Gagal membuat deal baru');
        return;
      }

      dealId = newDeal.id;
      console.log('Created new deal with ID:', dealId);
    } else {
      dealId = existingDeals[0].id;
    }

    // Update delivery_location dengan koordinat
    const locationString = `${locationData.lat},${locationData.lng}`;
    const { error: updateError } = await supabase
      .from('deals')
      .update({ delivery_location: locationString })
      .eq('id', dealId);

    if (updateError) {
      console.error('Error update deal delivery:', updateError);
      alert('Gagal update lokasi pengantaran deal');
    } else {
      alert('Lokasi pengantaran deal berhasil diupdate!');
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
        .select('id, content, created_at, sender_id, is_read, message_type, post_id, deal_id', )
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
        onUpdateDealLocation={updateDealLocation}
        onUpdateDealTime={updateDealTime}
        onUpdateDealItem={updateDealItem}
        onUpdateDealDelivery={updateDealDelivery}
      />

      <MessageInput
        currentUserId={currentUserId}
        conversationId={conversationId}
        conversationPostId={conversationPostId}
        postInfo={postInfo}
        setMessages={setMessages}
      />
    </div>
  );
}