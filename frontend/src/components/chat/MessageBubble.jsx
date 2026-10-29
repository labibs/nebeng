import DealCard from "./DealCard";
import PostCard from "./PostCard";
import CartNegoModal from "./CartNegoModal";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/apiClient";
import { useEffect, useState } from "react";

export default function MessageBubble({
  msg,
  currentUserId,
  currentUserAvatar,
  recipientImageUrl,
  postInfo,
  onOpenNego,
  onSendNego,
  onInsertDeal,
  onUpdateDealLocation,
  onUpdateDealTime,
  onUpdateDealItem,
  onUpdateDealDelivery,
}) {
  const isMine = msg.sender_id === currentUserId;
  const avatar = isMine ? currentUserAvatar : recipientImageUrl;
  const navigate = useNavigate();

  const [showCartNegoModal, setShowCartNegoModal] = useState(false);
  const [cartNegoData, setCartNegoData] = useState(null);
  const [hasTransaction, setHasTransaction] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkTransaction() {
      if (!msg?.deal_id) {
        if (isMounted) setHasTransaction(false);
        return;
      }

      try {
        const transaction = await apiFetch(
          `/deals/${msg.deal_id}/transaction`,
        );
        if (!isMounted) return;
        setHasTransaction(!!transaction);
      } catch (error) {
        if (!isMounted) return;
        console.error("Gagal cek transaksi deal_offer:", error);
        setHasTransaction(false);
      }
    }

    checkTransaction();

    return () => {
      isMounted = false;
    };
  }, [msg?.deal_id]);

  // Helper untuk menghilangkan koordinat (lat,lng, ) dari tampilan
  const stripCoordinates = (text) => {
    if (!text) return "";
    // Regex untuk mencocokkan pattern "-7.123,110.123, " atau "7.123,-110.123, "
    return text.replace(/[-+]?\d*\.\d+,\s*[-+]?\d*\.\d+,\s*/g, "");
  };

  // Pesan Deal Offer (Dari keranjang belanja)
  if (msg.message_type === "deal_offer") {
    const displayContent = stripCoordinates(
      msg.content
        .replace(/^\[deal_offer\]\s*/, "")
        .split("<!--PAYLOAD:")[0]
        .trim(),
    );

    return (
      <div
        className={`chat ${msg.sender_id === currentUserId ? "chat-end" : "chat-start"}`}
      >
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <img src={avatar} alt="avatar" />
          </div>
        </div>

        <div className="chat-header">
          <time className="text-xs opacity-70">
            {new Date(msg.created_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>

        <div
          className={`
            relative max-[85vw] md:max-w-md px-5 py-4 rounded-2xl shadow-lg overflow-hidden border
            ${
              msg.sender_id === currentUserId
                ? "bg-gradient-to-r from-[#81c784]/10 to-[#66bb6a]/10 border-emerald-300 rounded-br-none"
                : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 rounded-bl-none"
            }
          `}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <div className="font-bold text-blue-700 dark:text-blue-300">
                Ajukan Deal
              </div>
              <div className="text-xs opacity-70">
                {hasTransaction || msg.deal_id
                  ? "Sudah deal"
                  : msg.sender_id === currentUserId
                    ? "Menunggu konfirmasi dari lawan..."
                    : "Pilih aksi"}
              </div>
            </div>
          </div>

          {/* Isi Pesan (hide payload) */}
          <div className="mb-5 whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed">
            {displayContent}
          </div>

          {/* Aksi Konfirmasi */}
          {(() => {
            const payloadMatch = msg.content.match(/<!--PAYLOAD:(.*?)-->/);
            const payload = payloadMatch ? JSON.parse(payloadMatch[1]) : null;

            // Tombol hanya untuk lawan
            if (
              msg.sender_id !== currentUserId &&
              payload &&
              !msg.deal_id &&
              !hasTransaction
            ) {
              return (
                <div className="flex gap-3">
                  <button
                    onClick={async (e) => {
                      const button = e.currentTarget;
                      button.disabled = true;
                      button.innerText = "Memproses...";
                      try {
                        const result = onInsertDeal
                          ? await onInsertDeal(payload, payload.agreed_fee, msg?.id)
                          : await apiFetch("/deals/from-post", {
                              method: "POST",
                              body: JSON.stringify({
                                ...payload,
                                message_id: msg?.id,
                              }),
                            });

                        // Arahkan ke DealPage
                        const dealId = result?.id || result?.deal_id || result;
                        if (!dealId) {
                          throw new Error("Deal tidak terbentuk");
                        }
                        if (dealId) {
                          navigate(`/deal?deal=${dealId}`);
                        }
                      } catch (err) {
                        console.error("Deal confirm error:", err);
                        alert("Gagal mengonfirmasi deal: " + err.message);
                        button.disabled = false;
                        button.innerText = "Terima";
                      }
                    }}
                    className="flex-1 btn btn-info btn-sm rounded-xl text-white font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Terima
                  </button>
                  <button
                    onClick={() => {
                      const lines = msg.content.split("\n");
                      const warungNameMatch = lines
                        .find((l) => l.startsWith("🏪"))
                        ?.replace("🏪 Warung:", "")
                        .trim();
                      const itemCountMatch = lines
                        .find((l) => l.startsWith("📦"))
                        ?.match(/📦 (\d+) Barang: (.*)/);
                      const pickupLocMatch = lines
                        .find((l) => l.startsWith("📍 Dari:"))
                        ?.replace("📍 Dari:", "")
                        .trim();

                      setCartNegoData({
                        payload,
                        warungName:
                          warungNameMatch || payload.warung_name || "Warung",
                        itemCount: itemCountMatch ? itemCountMatch[1] : 1,
                        itemName: itemCountMatch
                          ? itemCountMatch[2]
                          : "Barang Jastip",
                        pickupLoc: pickupLocMatch || payload.pickup_location,
                      });
                      setShowCartNegoModal(true);
                    }}
                    className="flex-1 btn btn-outline btn-warning btn-sm rounded-xl font-medium hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-all"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Nego
                  </button>
                </div>
              );
            }
            return null;
          })()}

          {/* Tail lancip */}
          <div
            className={`
              absolute w-3 h-5 top-6
              ${msg.sender_id === currentUserId ? "right-0 translate-x-full" : "left-0 -translate-x-full"}
            `}
          >
            <svg viewBox="0 0 8 16" className="w-full h-full drop-shadow-md">
              <path
                d="M0,0 Q8,8 0,16 L0,0"
                fill={msg.sender_id === currentUserId ? "#66bb6a" : "#eff6ff"}
                className="dark:fill-emerald-900/50"
              />
            </svg>
          </div>
        </div>

        {/* Status terbaca - hanya untuk pesan sendiri */}
        {msg.sender_id === currentUserId && (
          <div
            className={`chat-footer text-xs mt-1 ${msg.is_read ? "text-blue-500" : "opacity-70"}`}
          >
            {msg.is_read ? "Terbaca ✓✓" : "Terkirim ✓"}
          </div>
        )}

        {/* Modal Nego Cart (Pesanan) */}
        <CartNegoModal
          isOpen={showCartNegoModal}
          onClose={() => setShowCartNegoModal(false)}
          onSend={(text) => onSendNego(text)}
          data={cartNegoData}
        />
      </div>
    );
  }

  // Pesan Deal Ongkos Jastip
  if (msg.message_type === "deal_ongkos_jastip") {
    return (
      <DealCard
        msg={msg}
        isMine={isMine}
        avatar={avatar}
        postInfo={postInfo}
        currentUserId={currentUserId}
        onOpenNego={onOpenNego}
        onSendNego={onSendNego}
        onInsertDeal={onInsertDeal}
        onUpdateDealLocation={onUpdateDealLocation}
      />
    );
  }

  // Pesan Deal Lokasi Ketemuan
  if (msg.message_type === "deal_lokasi_ketemuan") {
    return (
      <DealCard
        msg={msg}
        isMine={isMine}
        avatar={avatar}
        postInfo={postInfo}
        currentUserId={currentUserId}
        onOpenNego={onOpenNego}
        onSendNego={onSendNego}
        onInsertDeal={onInsertDeal}
        onUpdateDealLocation={onUpdateDealLocation}
      />
    );
  }

  // Pesan Deal Waktu Ketemuan
  if (msg.message_type === "deal_waktu_ketemuan") {
    return (
      <DealCard
        msg={msg}
        isMine={isMine}
        avatar={avatar}
        postInfo={postInfo}
        currentUserId={currentUserId}
        onOpenNego={onOpenNego}
        onSendNego={onSendNego}
        onInsertDeal={onInsertDeal}
        onUpdateDealLocation={onUpdateDealLocation}
        onUpdateDealTime={onUpdateDealTime}
        onUpdateDealItem={onUpdateDealItem}
        onUpdateDealDelivery={onUpdateDealDelivery}
      />
    );
  }

  // Pesan Deal Barang Titipan
  if (msg.message_type === "deal_barang_titipan") {
    return (
      <DealCard
        msg={msg}
        isMine={isMine}
        avatar={avatar}
        postInfo={postInfo}
        currentUserId={currentUserId}
        onOpenNego={onOpenNego}
        onSendNego={onSendNego}
        onInsertDeal={onInsertDeal}
        onUpdateDealLocation={onUpdateDealLocation}
        onUpdateDealTime={onUpdateDealTime}
        onUpdateDealItem={onUpdateDealItem}
        onUpdateDealDelivery={onUpdateDealDelivery}
      />
    );
  }

  // Pesan Deal Lokasi Pengantaran
  if (msg.message_type === "deal_lokasi_pengantaran") {
    return (
      <DealCard
        msg={msg}
        isMine={isMine}
        avatar={avatar}
        postInfo={postInfo}
        currentUserId={currentUserId}
        onOpenNego={onOpenNego}
        onSendNego={onSendNego}
        onInsertDeal={onInsertDeal}
        onUpdateDealLocation={onUpdateDealLocation}
        onUpdateDealTime={onUpdateDealTime}
        onUpdateDealItem={onUpdateDealItem}
        onUpdateDealDelivery={onUpdateDealDelivery}
      />
    );
  }

  // Pesan Post Card
  if (msg.message_type === "post_card") {
    return (
      <PostCard msg={msg} isMine={isMine} avatar={avatar} postInfo={postInfo} />
    );
  }

  // Pesan Gambar
  if (msg.message_type === "image") {
    return (
      <div className={`chat ${isMine ? "chat-end" : "chat-start"}`}>
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <img src={avatar} alt="avatar" />
          </div>
        </div>

        <div className="chat-header">
          <time className="text-xs opacity-70">
            {new Date(msg.created_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>

        <div
          className={`
            relative max-w-[70vw] overflow-hidden rounded-2xl shadow-sm border border-slate-100
            ${isMine ? "rounded-br-none" : "rounded-bl-none"}
          `}
        >
          <img
            src={msg.content}
            alt="Chat Image"
            className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(msg.content, "_blank")}
          />
        </div>

        {isMine && (
          <div
            className={`chat-footer text-xs mt-1 ${msg.is_read ? "text-blue-500" : "opacity-70"}`}
          >
            {msg.is_read ? "Terbaca ✓✓" : "Terkirim ✓"}
          </div>
        )}
      </div>
    );
  }

  // Pesan Teks Biasa
  return (
    <div className={`chat ${isMine ? "chat-end" : "chat-start"}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img src={avatar} alt="avatar" />
        </div>
      </div>

      <div className="chat-header">
        <time className="text-xs opacity-70">
          {new Date(msg.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>

      <div
        className={`
          relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-white shadow-md
          ${
            isMine
              ? "bg-gradient-to-r from-[#81c784] to-[#66bb6a] rounded-br-none"
              : "bg-emerald-600 rounded-bl-none"
          }
        `}
      >
        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
      </div>

      {/* Status terbaca - hanya untuk pesan sendiri */}
      {isMine && (
        <div
          className={`chat-footer text-xs mt-1 ${msg.is_read ? "text-blue-500" : "opacity-70"}`}
        >
          {msg.is_read ? "Terbaca ✓✓" : "Terkirim ✓"}
        </div>
      )}
    </div>
  );
}
