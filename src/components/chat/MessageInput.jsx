import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // sesuaikan path
import QuickReplies from './QuickReplies';
import DealMenu from './DealMenu';
import NegoModal from './NegoModal';
import LocationModal from './LocationModal';

export default function MessageInput({
  currentUserId,
  conversationId,
  conversationPostId,
  setMessages,
}) {
  const [newMessage, setNewMessage] = useState('');
  const [showDealMenu, setShowDealMenu] = useState(false);
  const [showNegoModal, setShowNegoModal] = useState(false);
  const [negoInitialPrice, setNegoInitialPrice] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const extractMessageType = (content) => {
    const match = content.trim().match(/^\[([a-zA-Z0-9_]+)\]/);
    return match ? match[1] : null;
  };

  const sendMessage = async (content = newMessage) => {
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
    } else {
      setNewMessage('');
    }
  };

  const handleQuickReply = (text) => {
    setNewMessage(text);
    document.getElementById('message-input')?.focus();
  };

  const handleSelectDeal = (tag, title, template) => {
    setNewMessage(`[${tag}] ${title} ✅\n\n${template}`);
    setShowDealMenu(false);
    document.getElementById('message-input')?.focus();
  };

  const handleOpenNego = (initial = '') => {
    setNegoInitialPrice(initial);
    setShowNegoModal(true);
    setShowDealMenu(false);
  };

  const handleSendNego = (message) => {
    sendMessage(message);
  };

  const handleOpenLocation = () => {
    setShowLocationModal(true);
    setShowDealMenu(false);
  };

  const handleSendLocation = (message) => {
    sendMessage(message);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 pb-safe">
        <QuickReplies onSelect={handleQuickReply} />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="px-4 pb-4 pt-2 flex items-center gap-2"
        >
          <div className="flex-1 flex items-center gap-2 bg-base-200 border border-base-300 rounded-2xl px-3 focus-within:ring-2 focus-within:ring-emerald-400/60">
            <input
              id="message-input"
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tulis pesan atau pilih deal…"
              className="input input-ghost focus:outline-none bg-transparent w-full text-sm py-4"
            />
            <button
              type="button"
              onClick={() => setShowDealMenu(!showDealMenu)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-base-300 transition-colors"
            >
              <svg className="w-6 h-6 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

        {showDealMenu && (
          <DealMenu
            onClose={() => setShowDealMenu(false)}
            onSelectDeal={handleSelectDeal}
            onOpenNego={() => handleOpenNego('')}
            onOpenLocation={handleOpenLocation}
          />
        )}

        <NegoModal
          isOpen={showNegoModal}
          onClose={() => setShowNegoModal(false)}
          onSend={handleSendNego}
          initialPrice={negoInitialPrice}
        />

        <LocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSend={handleSendLocation}
        />
      </div>
    </>
  );
}