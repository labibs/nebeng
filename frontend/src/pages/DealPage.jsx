import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { apiFetch } from "../lib/apiClient";
import { handlePay } from "../lib/handlePay";
import {
  MessageCircle,
  ClipboardList,
  Plus,
  Minus,
  MapPin,
  CalendarClock,
  Info,
  Truck,
  MapPinHouse,
  CarFront,
  PackageCheck,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import OpponentSummary from "../components/transaksi/OpponentSummary";
import LiveTrackingModal from "../components/transaksi/LiveTrackingModal";
import SlideToRunning from "../components/transaksi/SlideToRunning";
import SlideToDelivered from "../components/transaksi/SlideToDelivered";
import ReviewBottomSheet from "../components/transaksi/ReviewBottomSheet";
import DealStatusBadge from "../components/common/DealStatusBadge";
import SlideToUnlock from "../components/chat/SlideToUnlock";
import { useLanguage } from "../lib/LanguageContext";

function InfoRowCollapse({ icon: Icon, title, value, type, extraData }) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen(!open);

  return (
    <div className="border-b border-slate-100 py-2">
      <div
        className="flex justify-between items-start gap-3 cursor-pointer"
        onClick={toggle}
      >
        <div className="flex gap-3 items-start">
          <Icon className="w-4 h-4 text-[#4e73df] mt-0.5" />
          <div>
            <p className="text-xs font-medium text-slate-700">{title}</p>
            <p className="text-xs text-slate-400 whitespace-pre-wrap">
              {value || "-"}
            </p>
          </div>
        </div>

        {/* Tombol + / - */}
        <div className="text-[#4e73df] mt-1">
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </div>
      </div>

      {/* Collapse Content */}
      {open && (
        <div className="mt-2 pl-7 space-y-2">
          {type === "photos" && extraData?.length > 0 && (
            <div className="flex gap-2">
              {extraData.slice(0, 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Item ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-slate-100"
                />
              ))}
            </div>
          )}

          {type === "text" && extraData && (
            <p className="text-xs text-slate-400">{extraData}</p>
          )}

          {type === "location" && extraData && (
            <div className="space-y-2">
              {/* Link ke Google Maps */}
              <a
                href={`https://www.google.com/maps?q=${extraData.lat},${extraData.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#4e73df] hover:underline mb-1"
              >
                Lihat di Google Maps
              </a>

              {/* Peta Leaflet */}
              <div className="w-full h-40 rounded-lg overflow-hidden">
                <MapContainer
                  center={[extraData.lat, extraData.lng]}
                  zoom={15}
                  scrollWheelZoom={false}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[extraData.lat, extraData.lng]}>
                    <Popup>{extraData.address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function afterSecondComma(text) {
  if (!text) return "-";
  const parts = text.split(",");
  if (parts.length < 3) return text.trim();
  return parts.slice(2).join(",").trim();
}

function parseLocation(location) {
  if (!location || typeof location !== "string") return null;

  const parts = location.split(",");
  if (parts.length < 2) return null;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return {
    lat,
    lng,
    address: parts.slice(2).join(",").trim(),
  };
}

function extractCityFromAddress(address) {
  if (!address || typeof address !== "string") return null;

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return null;

  const cityPart = parts.find((part) =>
    /^(kota|kabupaten|kab\.|city)\s/i.test(part),
  );

  if (cityPart) return cityPart;

  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

function normalizeItemPhotos(itemPhotos) {
  if (Array.isArray(itemPhotos)) {
    return itemPhotos.filter(
      (photo) => typeof photo === "string" && photo.trim(),
    );
  }

  if (typeof itemPhotos === "string") {
    const trimmed = itemPhotos.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed)
          ? parsed.filter((photo) => typeof photo === "string" && photo.trim())
          : [];
      } catch {
        return [];
      }
    }

    return [trimmed];
  }

  return [];
}

function parseRupiahNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;

  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

function parseDealOfferPayload(content) {
  if (!content || typeof content !== "string") return null;

  const payloadMatch = content.match(/<!--PAYLOAD:(.*?)-->/);
  if (!payloadMatch) return null;

  try {
    return JSON.parse(payloadMatch[1]);
  } catch {
    return null;
  }
}

function parsePriceBreakdownFromMessage(message) {
  if (!message) return null;

  if (message.message_type === "deal_offer") {
    const payload = parseDealOfferPayload(message.content);
    if (!payload) return null;

    const jastipFee = Number(payload.proposed_fee ?? 0) || 0;
    const itemPrice = Number(payload.total_item_price ?? 0) || 0;
    const total =
      Number(
        payload.total_payment ?? payload.agreed_fee ?? itemPrice + jastipFee,
      ) || 0;

    if (!jastipFee && !itemPrice && !total) return null;

    return { itemPrice, jastipFee, total };
  }

  if (message.message_type === "deal_ongkos_jastip") {
    const feeMatch = message.content?.match(/Rp\s*([0-9.,]+)/i);
    const parsedFee = feeMatch ? parseRupiahNumber(feeMatch[1]) : null;
    if (parsedFee) {
      return { itemPrice: null, jastipFee: parsedFee, total: null };
    }
  }

  return null;
}

function matchesDealParticipants(payload, deal) {
  if (!payload || !deal) return false;

  return (
    String(payload.carrier_id || "") === String(deal.carrier_id || "") &&
    String(payload.depositor_id || "") === String(deal.depositor_id || "")
  );
}

function PaymentOption({
  value,
  title,
  desc,
  checked,
  onChange,
  disabled = false,
  badge,
}) {
  return (
    <label
      className={`
        flex items-center gap-3 p-3 rounded-xl border transition-all
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-slate-50"}
        ${checked && !disabled ? "border-[#4e73df]" : "border-slate-200"}
      `}
    >
      <input
        type="radio"
        name="payment_method"
        className="radio radio-success"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      {badge && (
        <span className="badge badge-outline badge-success badge-sm">
          {badge}
        </span>
      )}
    </label>
  );
}

export default function DealPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get("deal");
  const trxId = searchParams.get("trx");

  const [deal, setDeal] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const { user, isLoaded } = useUser();
  const [clerkId, setClerkId] = useState(null);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState(null);

  useEffect(() => {
    if (isLoaded && user) {
      setClerkId(user.id);
    }
  }, [isLoaded, user]);

  // Fetch deal
  useEffect(() => {
    if (!dealId) {
      setLoading(false);
      return;
    }

    async function fetchDeal() {
      try {
        const data = await apiFetch('/deals/' + dealId);
        setDeal(data);
        // Cek apakah user (depositor) sudah memberi ulasan
        if (
          data.status === "delivered" ||
          data.delivery_status === "delivered"
        ) {
          try {
            const reviews = await apiFetch(
              '/reviews?reviewable_type=deal&reviewable_id=' + dealId
            );
            if (reviews && reviews.length > 0) setHasReviewed(true);
          } catch (e) {
            console.warn("Could not fetch reviews:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching deal:", error);
        alert(t("Gagal memuat detail deal"));
      }
      setLoading(false);
    }

    fetchDeal();
  }, [dealId]);

  useEffect(() => {
    if (!dealId || !deal) return;

    async function fetchPriceBreakdown() {
      try {
        const data = await apiFetch('/deals/' + dealId + '/messages');
        const filtered = (data || []).filter(
          (m) => m.message_type === 'deal_offer' || m.message_type === 'deal_ongkos_jastip'
        );

        let parsedBreakdown = filtered
          .map(parsePriceBreakdownFromMessage)
          .find(Boolean);

        if (!parsedBreakdown && deal?.post?.id) {
          // Fallback: try fetching from post info endpoint
          try {
            const dealInfo = await apiFetch('/deals/post/' + deal.post.id + '/info');
            if (dealInfo && dealInfo.price_breakdown) {
              parsedBreakdown = dealInfo.price_breakdown;
            }
          } catch (e) {
            // ignore fallback error
          }
        }

        if (parsedBreakdown) {
          setPriceBreakdown(parsedBreakdown);
        }
      } catch (error) {
        console.warn("Could not fetch deal price breakdown:", error);
      }
    }

    fetchPriceBreakdown();
  }, [dealId, deal]);

  // Fetch transaction
  useEffect(() => {
    if (!trxId) return;

    async function fetchTransaction() {
      try {
        const data = await apiFetch('/deals/' + dealId + '/transaction');
        if (data) setTransaction(data);
      } catch (error) {
        console.error("Error fetching transaction:", error);
      }
    }

    fetchTransaction();
  }, [trxId]);

  // Polling for Deal and Transaction updates
  const POLL_INTERVAL = 5000;
  const pollRef = useRef(null);

  useEffect(() => {
    if (!dealId) return;

    const pollUpdates = async () => {
      try {
        const dealData = await apiFetch('/deals/' + dealId);
        if (dealData) {
          setDeal((prev) => (prev ? { ...prev, ...dealData } : dealData));
        }
      } catch (e) {
        // ignore polling errors
      }

      if (trxId) {
        try {
          const trData = await apiFetch('/deals/' + dealId + '/transaction');
          if (trData) setTransaction(trData);
        } catch (e) {
          // ignore polling errors
        }
      }
    };

    pollRef.current = setInterval(pollUpdates, POLL_INTERVAL);

    return () => {
      clearInterval(pollRef.current);
    };
  }, [dealId, trxId, clerkId]);

  // Watch for payment success to send system message
  useEffect(() => {
    if (transaction?.payment_status === "paid") {
      // Small delay to ensure DB is stable
      const timer = setTimeout(() => {
        sendSystemMessage("Pembayaran berhasil diverifikasi! 💳");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [transaction?.payment_status]);

  const sendSystemMessage = async (content) => {
    if (!deal || !clerkId) return;

    try {
      // Find or create conversation for this deal
      let conversationId;
      try {
        const result = await apiFetch("/conversations", {
          method: "POST",
          body: JSON.stringify({
            opponent_id: deal.carrier_id === clerkId ? deal.depositor_id : deal.carrier_id,
            post_id: deal.post?.id || deal.post_id,
          }),
        });
        conversationId = result.conversation_id;
      } catch (e) {
        console.warn("Could not find/create conversation:", e);
        return;
      }

      // Insert system message
      await apiFetch("/messages", {
        method: "POST",
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: clerkId,
          message_type: "system",
          content: `[system] ${content}`,
          post_id: deal.post?.id || deal.post_id,
          deal_id: deal.id,
        }),
      });
    } catch (err) {
      console.error("Gagal kirim pesan sistem:", err);
    }
  };

  const handleStartDelivery = async () => {
    try {
      await apiFetch('/deals/' + deal.id, {
        method: 'PUT',
        body: JSON.stringify({ delivery_status: "running" }),
      });

      // Update local state
      setDeal((prev) => ({ ...prev, delivery_status: "running" }));

      // 2. Mulai live tracking
      startLiveTracking();

      // 3. Kirim pesan sistem
      sendSystemMessage("Pesanan sedang dalam perjalanan! 🚚");
    } catch (error) {
      console.error("Gagal mulai pengantaran:", error);
    }
  };

  let trackingInterval = null;

  const startLiveTracking = () => {
    if (!navigator.geolocation) return;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          try {
            await apiFetch('/deals/' + deal.id + '/live-location', {
              method: 'POST',
              body: JSON.stringify({
                deal_id: deal.id,
                courier_id: deal.carrier_id,
                lat: latitude,
                lng: longitude,
              }),
            });
          } catch (err) {
            console.error("Error sending location:", err);
          }
        },
        (err) => {
          console.error("GPS error:", err);
        },
        { enableHighAccuracy: true },
      );
    };

    // kirim pertama langsung
    sendLocation();

    // interval tiap 1 menit
    trackingInterval = setInterval(sendLocation, 60_000);
  };

  const handleDelivered = async () => {
    try {
      await apiFetch('/deals/' + deal.id, {
        method: 'PUT',
        body: JSON.stringify({
          delivery_status: "delivered",
          status: "completed",
        }),
      });

      // Update local state
      setDeal((prev) => ({
        ...prev,
        delivery_status: "delivered",
        status: "completed",
      }));

      // 2. Stop live tracking
      stopLiveTracking();

      // 3. Kirim pesan sistem
      sendSystemMessage("Pesanan telah sampai di tujuan! ✅");
    } catch (error) {
      console.error("Gagal diterima:", error);
    }
  };

  const stopLiveTracking = async () => {
    try {
      if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
      }
    } catch (err) {
      console.error("Stop tracking exception:", err);
    }
  };

  const handleCancelDeal = async () => {
    if (
      !window.confirm(
        t("Apakah Anda yakin ingin membatalkan deal ini? Item akan dikembalikan ke keranjang."),
      )
    )
      return;

    try {
      // 1. Update deal status to cancelled
      await apiFetch('/deals/' + deal.id, {
        method: 'PUT',
        body: JSON.stringify({ status: "cancelled" }),
      });

      // 2. Cancel transaction if exists
      if (transaction?.id) {
        await apiFetch('/transactions/' + transaction.id, {
          method: 'PUT',
          body: JSON.stringify({
            transaction_status: "cancelled",
            payment_status: "cancelled",
          }),
        });
      }

      alert(t("Deal dibatalkan. Barang telah dikembalikan ke Keranjang."));
      sendSystemMessage("Deal telah dibatalkan oleh pengguna. ❌");
      navigate("/transaksi");
    } catch (err) {
      console.error("Gagal membatalkan deal:", err);
      alert(t("Gagal membatalkan deal. Silakan coba lagi."));
    }
  };

  const openLiveTracking = (dealId) => {
    setSelectedDealId(dealId);
    setShowTrackingModal(true);
  };

  const closeLiveTracking = () => {
    setShowTrackingModal(false);
    setSelectedDealId(null);
  };

  const handleCreateTransaction = async () => {
    if (!deal?.id) return;

    try {
      setPaying(true);

      const payload = {
        deal_id: deal.id,
        gross_amount: totalTransactionAmount,
        transaction_status: "ready_to_ship",
        payment_status: "pending",
      };

      const data = await apiFetch('/deals/' + deal.id + '/transaction', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setTransaction(data);
      navigate(`/deal?deal=${deal.id}&trx=${data.id}`, { replace: true });
      return data;
    } catch (error) {
      console.error("Gagal membuat transaksi:", error);
      alert(t("Gagal melanjutkan ke transaksi. Coba lagi."));
      return null;
    } finally {
      setPaying(false);
    }
  };

  const handleProceedToPayment = async () => {
    const currentTransaction = transaction || (await handleCreateTransaction());
    if (!currentTransaction?.id) return;

    await handlePay({
      transactionId: currentTransaction.id,
      navigate,
      setPaying,
    });
  };

  if (loading) return <p className="p-8 text-center">{t("Memuat...")}</p>;
  if (!deal) return <p className="p-8 text-center">{t("Deal tidak ditemukan")}</p>;

  const statusColor =
    deal.status === "completed"
      ? "badge-success"
      : deal.status === "cancelled"
        ? "badge-error"
        : "badge-warning";

  const canPay = ["draft", "pending", "expire", "expired"].includes(
    transaction?.payment_status,
  );
  const paid = ["paid"].includes(transaction?.payment_status);
  const paymentExpired = ["expire", "expired"].includes(
    transaction?.payment_status,
  );
  const running = ["running"].includes(deal?.delivery_status);
  const delivered = ["delivered"].includes(deal?.delivery_status);

  const isCarrierLogin = deal?.carrier_id === clerkId;
  const opponent = isCarrierLogin ? deal?.depositor : deal?.carrier;
  const opponentRole = isCarrierLogin ? t("Customer") : t("Kurir");
  const opponentType = isCarrierLogin ? t("Bawa") : t("Nitip");
  const needsTransaction = !transaction;
  const pickupLocationData = parseLocation(deal?.pickup_location);
  const deliveryLocationData = parseLocation(deal?.delivery_location);
  const itemPhotos = normalizeItemPhotos(deal?.item_photos);
  const headerItemPhoto =
    itemPhotos[0] ||
    deal?.post?.item_photo ||
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80";
  const pickupCity =
    extractCityFromAddress(pickupLocationData?.address) ||
    deal?.post?.from_city ||
    "-";
  const deliveryCity =
    extractCityFromAddress(deliveryLocationData?.address) ||
    deal?.post?.to_city ||
    "-";
  const agreedFee = Number(deal?.agreed_fee || 0);
  const storedItemFee = Number(deal?.item_fee || 0);
  const grossAmount = Number(transaction?.gross_amount || 0);
  const itemFee = storedItemFee || priceBreakdown?.itemPrice || 0;
  const jastipFee =
    agreedFee ||
    priceBreakdown?.jastipFee ||
    Math.max(0, grossAmount - itemFee);
  const totalTransactionAmount =
    priceBreakdown?.total ?? (grossAmount || itemFee + jastipFee);

  const startChatWithDeal = async (deal, currentClerkId) => {
    const isCarrierLogin = deal.carrier_id === currentClerkId;
    const opponentId = isCarrierLogin ? deal.depositor_id : deal.carrier_id;

    try {
      const result = await apiFetch("/conversations", {
        method: "POST",
        body: JSON.stringify({ opponent_id: opponentId }),
      });

      if (result.conversation_id) {
        navigate(`/chat/${result.conversation_id}`);
      } else {
        alert(t("Gagal membuka chat"));
      }
    } catch (err) {
      console.error("Gagal membuka chat:", err);
      alert(t("Gagal membuka chat"));
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f0f7ff] flex flex-col pb-24 text-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 navbar bg-white/90 backdrop-blur-xl border-b border-slate-100 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-circle"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1 flex items-center justify-between gap-2 px-0 -translate-x-4">
            <div className="px-5 py-0 flex items-center justify-between">
              <div className="flex items-center gap-4 w-full">
                {/* Avatar / Foto Barang */}
                <div className="avatar flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-[#4e73df]/20">
                    <img
                      src={headerItemPhoto}
                      alt="Barang"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info Lokasi */}
                <div className="flex-1 min-w-0">
                  <DealStatusBadge
                    dealStatus={deal.status}
                    transactionStatus={transaction?.transaction_status}
                    paymentStatus={transaction?.payment_status}
                    deliveryStatus={deal.delivery_status}
                    size="sm"
                  />

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {pickupCity}
                    </span>

                    <svg
                      className="w-4 h-4 text-[#4e73df]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>

                    <span className="font-medium text-slate-700">
                      {deliveryCity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <span className="badge badge-primary badge-xs font-medium text-[10px] bg-[#4e73df] border-none">
              {opponentType}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Carrier Card */}
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            {/* CARD UTAMA */}
            <div className="p-4 flex items-center justify-between">
              {/* Kiri */}
              <div
                className="flex items-center gap-4 min-w-0 cursor-pointer active:opacity-70 transition-opacity"
                onClick={() =>
                  navigate(`/profile/detail/${opponent?.clerk_id}`)
                }
              >
                <div className="avatar">
                  <div className="w-14 h-14 rounded-full ring-2 ring-[#4e73df]/20">
                    <img
                      src={opponent?.avatar_url || "/avatar-placeholder.png"}
                      alt="User"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-base truncate">
                    {opponent?.name || "-"}
                  </p>
                  <p className="text-xs text-slate-400">{opponentRole}</p>
                </div>
              </div>

              {/* Kanan */}
              <button
                className="btn btn-circle btn-ghost text-[#4e73df] hover:bg-slate-50"
                title="Chat"
                onClick={() => startChatWithDeal(deal, clerkId)}
              >
                <MessageCircle size={18} />
              </button>
            </div>

            {/* EXTEND CARD – MUNCUL SAAT RUNNING */}
            {deal?.delivery_status === "running" && !isCarrierLogin && (
              <div className="border-t border-slate-100 bg-blue-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  {/* Status */}
                  <div className="flex items-center gap-2 text-[#4e73df]">
                    <Truck className="w-4 h-4" />
                    <div>
                      <p className="text-xs font-semibold">{t("Sedang Mengantar")}</p>
                        <p className="text-[10px] text-slate-400">{t("Kurir dalam perjalanan")}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => openLiveTracking(deal.id)}
                    className="btn btn-xs bg-[#4e73df] hover:bg-[#3b59bd] text-white gap-1 rounded-full"
                  >
                    <MapPin className="w-3 h-3" />
                    {t("Posisi Kurir")}
                  </button>
                </div>
              </div>
            )}
            {deal?.delivery_status === "draft" &&
              transaction?.payment_status === "paid" &&
              !isCarrierLogin && (
                <div className="border-t border-slate-100 bg-blue-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    {/* Status */}
                    <div className="flex items-center gap-2 text-[#4e73df]">
                      <CarFront className="w-4 h-4" />
                      <div>
                        <p className="text-xs font-semibold">{t("Sedang Menunggu")}</p>
                        <p className="text-[10px] text-slate-400">{t("Persiapan keberangkatan")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            {deal?.delivery_status === "delivered" && !isCarrierLogin && (
              <div className="border-t border-slate-100 bg-blue-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  {/* Status */}
                  <div className="flex items-center gap-2 text-[#4e73df]">
                    <MapPinHouse className="w-4 h-4" />
                    <div>
                        <p className="text-xs font-semibold">{t("Tiba Ditujuan")}</p>
                      <p className="text-[10px] text-slate-400">{t("Barang sudah diterima")}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ringkasan */}
          <div className="rounded-2xl bg-white shadow-sm p-4 border border-slate-100">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-[#4e73df]" />
              {t("Ringkasan Transaksi")}
            </h2>
            <p className="text-xs text-slate-500">
              <OpponentSummary isCarrierLogin={isCarrierLogin} />
            </p>
          </div>

          {/* Detail Item */}
          <div className="rounded-2xl bg-white shadow-sm p-4 border border-slate-100 space-y-4">
            <InfoRowCollapse
              icon={ClipboardList}
              title={t("Deskripsi Barang")}
              value={deal.item_description}
              type="photos"
              extraData={itemPhotos}
            />

            <InfoRowCollapse
              icon={MapPin}
              title={t("Lokasi Penjemputan")}
              value={afterSecondComma(deal.pickup_location)}
              type="location"
              extraData={pickupLocationData}
            />

            <InfoRowCollapse
              icon={MapPin}
              title={t("Lokasi Pengantaran")}
              value={afterSecondComma(deal.delivery_location)}
              type="location"
              extraData={deliveryLocationData}
            />

            <InfoRowCollapse
              icon={CalendarClock}
              title={t("Waktu Penjemputan")}
              value={
                deal.pickup_datetime
                  ? new Date(deal.pickup_datetime).toLocaleString(language === "en" ? "en-US" : "id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"
              }
              type="text"
              extraData={deal.notes}
            />
          </div>

          {/* Biaya */}
          {isCarrierLogin && (
            <div className="rounded-2xl bg-white shadow-sm p-4 border border-slate-100 space-y-3">
              <p className="text-xs text-slate-400">{t("Penghasilan dari Jastip")}</p>
              <p className="text-2xl font-bold text-[#4e73df]">
                {jastipFee
                  ? jastipFee.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    })
                  : "-"}
              </p>
              <p className="text-xs text-slate-400">
                Ongkos jastip yang menjadi penghasilan Anda
              </p>

              {/* Perincian biaya */}
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>{t("Harga Barang")}</span>
                  <span>
                    {itemFee
                      ? itemFee.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("Ongkos Jastip")}</span>
                  <span>
                    {jastipFee
                      ? jastipFee.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{t("Total Nominal Transaksi")}</span>
                  <span>
                    {totalTransactionAmount
                      ? totalTransactionAmount.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!isCarrierLogin && (
            <div className="rounded-2xl bg-white shadow-sm p-4 border border-slate-100 space-y-3">
              <p className="text-xs text-slate-400">{t("Total Biaya Numpak")}</p>
              <p className="text-2xl font-bold text-[#4e73df]">
                {totalTransactionAmount
                  ? totalTransactionAmount.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    })
                  : "-"}
              </p>

              {/* Perincian biaya */}
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>{t("Biaya Barang")}</span>
                  <span>
                    {itemFee
                      ? itemFee.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("Biaya Penanganan")}</span>
                  <span>Rp 0</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{t("Biaya Nitip")}</span>
                  <span>
                    {jastipFee
                      ? jastipFee.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Metode Pembayaran - muncul jika masih bisa bayar / bayar ulang */}
          {canPay && !isCarrierLogin && (
            <div className="rounded-2xl bg-white shadow-sm p-4 border border-slate-100">
              <h2 className="text-sm font-semibold mb-3 text-slate-700">
                {t("Metode Pembayaran")}
              </h2>
              {paymentExpired && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {t("Pembayaran sebelumnya sudah kedaluwarsa. Silakan buat sesi pembayaran baru.")}
                </div>
              )}
              <div className="space-y-2">
                <PaymentOption
                  value="midtrans"
                  title={t("Transfer / E-Wallet")}
                  desc="GoPay, ShopeePay, QRIS, VA Bank"
                  checked={true}
                  onChange={() => {}}
                  badge={t("Rekomendasi")}
                />
                <PaymentOption
                  title={t("Bayar di Tempat (COD)")}
                  desc={t("Segera hadir")}
                  disabled
                />
              </div>
            </div>
          )}

          {/* Batalkan Deal - Hanya jika belum dibayar & bukan kurir (atau kurir sebelum running?) */}
          {!paid && deal.status !== "cancelled" && (
            <div className="mt-4 px-4">
              <button
                onClick={handleCancelDeal}
                className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 w-full rounded-xl gap-2 text-xs font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {t("Batalkan Deal & Kembalikan ke Keranjang")}
              </button>
            </div>
          )}

          {/* Beri Ulasan - Jika sudah delivered & belum diulas & adalah depositor */}
          {delivered && !isCarrierLogin && !hasReviewed && (
            <div className="mt-6 px-4 pb-4">
              <button
                onClick={() => setShowReviewModal(true)}
                className="btn btn-primary w-full rounded-2xl gap-2 text-sm font-semibold shadow-sm bg-[#4e73df] border-none text-white hover:bg-[#3d64c7]"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                {t("Beri Ulasan ke Jastiper")}
              </button>
            </div>
          )}

          {hasReviewed && !isCarrierLogin && (
            <div className="mt-6 px-4 pb-4">
              <div className="bg-blue-50 text-[#4e73df] p-4 rounded-2xl flex items-center gap-3 border border-blue-100">
                <div className="w-7 h-7 rounded-full bg-[#4e73df] flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="text-xs font-semibold">
                  {t("Ulasan sudah terkirim. Terima kasih!")}
                </div>
              </div>
            </div>
          )}
        </div>
        {needsTransaction && !isCarrierLogin && (
          <div className="fixed bottom-4 left-4 right-4 z-20">
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-4">
              <SlideToUnlock onComplete={handleProceedToPayment} />
            </div>
          </div>
        )}
        {canPay && !isCarrierLogin && !needsTransaction && (
          <div className="fixed bottom-4 left-4 right-4 z-20">
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-4 flex gap-3">
              <button
                className="btn btn-outline flex-1 rounded-xl text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => navigate(-1)}
              >
                {t("Kembali")}
              </button>
              <button
                className="btn flex-1 rounded-xl border-none bg-[#4e73df] text-white hover:bg-[#3d64c7] text-xs"
                onClick={() =>
                  handlePay({
                    transactionId: transaction?.id,
                    navigate,
                    setPaying,
                  })
                }
                disabled={paying}
              >
                {paying ? (
                  <span className="loading loading-spinner"></span>
                ) : paymentExpired ? (
                  t("Bayar Ulang")
                ) : (
                  t("Bayar Sekarang")
                )}
              </button>
            </div>
          </div>
        )}
        {/* Kurir Mulai Jalan (Paid & Draft) */}
        {isCarrierLogin && paid && deal.delivery_status === "draft" && (
          <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl bg-white shadow-sm p-3 border border-slate-100">
            <SlideToRunning
              status={deal.delivery_status}
              onComplete={handleStartDelivery}
            />
          </div>
        )}

        {/* Kustomer/Kurir Selesaikan Pesanan (Running) */}
        {running && (
          <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl bg-white shadow-sm p-3 border border-slate-100">
            <SlideToDelivered
              status={deal.delivery_status}
              onComplete={handleDelivered}
            />
          </div>
        )}

        {/* Pesanan Selesai */}
        {delivered && (
          <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-center rounded-xl bg-[#4e73df] shadow-sm p-3 text-white text-sm font-semibold">
            <PackageCheck className="w-4 h-4 mr-2" />
            {t("Pesanan Selesai")}
          </div>
        )}
      </div>
      {showTrackingModal && (
        <LiveTrackingModal
          dealId={selectedDealId}
          deal={deal}
          open={openLiveTracking}
          onClose={closeLiveTracking}
        />
      )}

      {showReviewModal && (
        <ReviewBottomSheet
          deal={deal}
          reviewerId={clerkId}
          revieweeId={deal.carrier_id}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => setHasReviewed(true)}
        />
      )}
    </>
  );
}
