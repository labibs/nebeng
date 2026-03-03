import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../lib/supabaseClient";
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
  PackageCheck
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import OpponentSummary from "../components/transaksi/OpponentSummary";
import LiveTrackingModal from "../components/transaksi/LiveTrackingModal";
import SlideToRunning from "../components/transaksi/SlideToRunning";
import SlideToDelivered from "../components/transaksi/SlideToDelivered";
import ReviewBottomSheet from "../components/transaksi/ReviewBottomSheet";
import DealStatusBadge from "../components/common/DealStatusBadge";

function InfoRowCollapse({ icon: Icon, title, value, type, extraData }) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen(!open);

  return (
    <div className="border-b border-base-300/40 py-2">
      <div className="flex justify-between items-start gap-3 cursor-pointer" onClick={toggle}>
        <div className="flex gap-3 items-start">
          <Icon className="w-5 h-5 text-emerald-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm opacity-70 whitespace-pre-wrap">{value || "-"}</p>
          </div>
        </div>

        {/* Tombol + / - */}
        <div className="text-emerald-500 mt-1">
          {open ? <Minus size={18} /> : <Plus size={18} />}
        </div>
      </div>

      {/* Collapse Content */}
      {open && (
        <div className="mt-2 pl-8 space-y-2">
          {type === "photos" && extraData?.length > 0 && (
            <div className="flex gap-2">
              {extraData.slice(0, 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Item ${i + 1}`}
                  className="w-24 h-24 object-cover rounded-lg border border-base-300"
                />
              ))}
            </div>
          )}

          {type === "text" && extraData && (
            <p className="text-sm opacity-70">{extraData}</p>
          )}

          {type === "location" && extraData && (
            <div className="space-y-2">
              {/* Link ke Google Maps */}
              <a
                href={`https://www.google.com/maps?q=${extraData.lat},${extraData.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-600 hover:underline mb-1"
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
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-base-200"}
        ${checked && !disabled ? "border-emerald-500 " : "border-base-300"}
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
        <p className="font-medium">{title}</p>
        <p className="text-sm opacity-70">{desc}</p>
      </div>
      {badge && <span className="badge badge-outline badge-success">{badge}</span>}
    </label>
  );
}

export default function DealPage() {
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

  useEffect(() => {
    if (isLoaded && user) {
      setClerkId(user.id);
    }
  }, [isLoaded, user]);

  // ✅ Load Midtrans Snap script — SEKARANG DI DALAM COMPONENT
  useEffect(() => {
    // Cek apakah script sudah ada (hindari double load)
    if (document.querySelector('script[src*="snap.js"]')) {
      console.log("Midtrans script sudah ada");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "SB-Mid-client-XXXX"); // ganti dengan client key sandbox kamu
    script.async = true;

    script.onload = () => console.log("✅ Midtrans Snap script loaded");
    script.onerror = () => console.error("❌ Gagal load Midtrans Snap script");

    document.body.appendChild(script);

    return () => {
      // Cleanup kalau component unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch deal
  useEffect(() => {
    if (!dealId) {
      setLoading(false);
      return;
    }

    async function fetchDeal() {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          id,
          status,
          carrier_id,
          depositor_id,
          agreed_fee,
          pickup_location,
          delivery_location,
          pickup_datetime,
          item_description,
          item_photos,
          notes,
          delivery_status,
          carrier:users!deals_carrier_id_fkey (
            clerk_id,
            name,
            avatar_url
          ),

          depositor:users!fk_deals_depositor (
            clerk_id,
            name,
            avatar_url
          ),
          
          post:posts!fk_deals_post (
            id,
            from_city,
            to_city,
            type,
            item_photo,
            created_at
          )
        `)
        .eq("id", dealId)
        .single();

      if (error) {
        console.error("Error fetching deal:", error);
        alert("Gagal memuat detail deal");
      } else {
        setDeal(data);
        // Cek apakah user (depositor) sudah memberi ulasan
        if (data.status === "delivered" || data.delivery_status === "delivered") {
          try {
            const { data: reviewData, error: reviewError } = await supabase
              .from("reviews")
              .select("id")
              .eq("deal_id", dealId)
              .maybeSingle();
            if (reviewData) setHasReviewed(true);
            if (reviewError) console.warn("Could not fetch reviews:", reviewError);
          } catch (e) {
            console.warn("Could not fetch reviews:", e);
          }
        }
      }
      setLoading(false);
    }

    fetchDeal();
  }, [dealId]);



  // Fetch transaction
  useEffect(() => {
    if (!trxId) return;

    async function fetchTransaction() {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", trxId)
        .single();

      if (!error) setTransaction(data);
    }

    fetchTransaction();
  }, [trxId]);

  // Real-time synchronization for Deal and Transaction
  useEffect(() => {
    if (!dealId) return;

    // 1. Subscribe to Deal changes
    const dealChannel = supabase
      .channel(`deal-realtime-${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deals',
          filter: `id=eq.${dealId}`,
        },
        (payload) => {
          console.log('🔄 Real-time Deal update:', payload.new);
          // Merging with existing deal data to preserve joined fields (carrier, depositor, post)
          setDeal((prev) => (prev ? { ...prev, ...payload.new } : payload.new));
        }
      )
      .subscribe();

    // 2. Subscribe to Transaction changes
    let trxChannel = null;
    if (trxId) {
      trxChannel = supabase
        .channel(`trx-realtime-${trxId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'transactions',
            filter: `id=eq.${trxId}`,
          },
          (payload) => {
            console.log('🔄 Real-time Transaction update:', payload.new);
            setTransaction(payload.new);
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(dealChannel);
      if (trxChannel) supabase.removeChannel(trxChannel);
    };
  }, [dealId, trxId, clerkId]); // Added clerkId

  // Watch for payment success to send system message
  useEffect(() => {
    if (transaction?.transaction_status === "paid") {
      // Small delay to ensure DB is stable
      const timer = setTimeout(() => {
        sendSystemMessage("Pembayaran berhasil diverifikasi! 💳");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [transaction?.transaction_status]);

  const sendSystemMessage = async (content) => {
    if (!deal || !clerkId) return;

    try {
      // 1. Find conversation (One per post + pair)
      const { data: conv, error: convError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", deal.carrier_id)
        .order("created_at", { ascending: false });

      if (convError || !conv.length) return;

      // Find the one that also has the depositor and correct post_id
      const conversationIds = conv.map(c => c.conversation_id);

      const { data: finalConv, error: finalError } = await supabase
        .from("conversations")
        .select("id")
        .in("id", conversationIds)
        .eq("post_id", deal.post.id || deal.post_id) // adjust based on fetchDeal
        .maybeSingle();

      if (finalError || !finalConv) {
        // Fallback: check other participants if direct find fails
        console.warn("Conversation not found for system message, falling back...");
        // This is heuristic, usually there's only one relevant conversation
      }

      const conversationId = finalConv?.id || conversationIds[0];

      // 2. Insert system message
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: clerkId,
        message_type: "system",
        content: `[system] ${content}`,
        post_id: deal.post.id || deal.post_id
      });
    } catch (err) {
      console.error("Gagal kirim pesan sistem:", err);
    }
  };

  const handleStartDelivery = async () => {
    // 1. Update status deal
    const { error } = await supabase
      .from("deals")
      .update({ delivery_status: "running" })
      .eq("id", deal.id)
      .eq("carrier_id", deal.carrier_id);

    if (error) {
      console.error("Gagal mulai pengantaran:", error);
      return;
    }

    // Update local state
    setDeal(prev => ({ ...prev, delivery_status: "running" }));

    // 2. Mulai live tracking
    startLiveTracking();

    // 3. Kirim pesan sistem
    sendSystemMessage("Pesanan sedang dalam perjalanan! 🚚");
  };

  let trackingInterval = null;

  const startLiveTracking = () => {
    if (!navigator.geolocation) return;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          await supabase
            .from("deal_live_locations")
            .upsert({
              deal_id: deal.id,          // BIGINT
              courier_id: deal.carrier_id, // TEXT (clerk_id)
              lat: latitude,
              lng: longitude,
              updated_at: new Date(),
            });
        },
        (err) => {
          console.error("GPS error:", err);
        },
        { enableHighAccuracy: true }
      );
    };

    // kirim pertama langsung
    sendLocation();

    // interval tiap 1 menit
    trackingInterval = setInterval(sendLocation, 60_000);
  };

  const handleDelivered = async () => {
    // 1. Update status deal
    const { error } = await supabase
      .from("deals")
      .update({
        delivery_status: "delivered",
        status: "completed" // Finalize the deal session
      })
      .eq("id", deal.id)
      .eq("carrier_id", deal.carrier_id);

    if (error) {
      console.error("Gagal diterima:", error);
      return;
    }

    // Update local state
    setDeal(prev => ({
      ...prev,
      delivery_status: "delivered",
      status: "completed"
    }));

    // 2. Mulai live tracking
    stopLiveTracking();

    // 3. Kirim pesan sistem
    sendSystemMessage("Pesanan telah sampai di tujuan! ✅");
  };

  const stopLiveTracking = async () => {
    try {
      const { error } = await supabase
        .from("deal_live_locations")
        .delete()
        .eq("deal_id", deal.id);

      if (error) {
        console.error("Gagal menghentikan live tracking:", error);
      }
    } catch (err) {
      console.error("Stop tracking exception:", err);
    }
  };

  const handleCancelDeal = async () => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan deal ini? Item akan dikembalikan ke keranjang.")) return;

    try {
      // 1. Update status deal & transaction
      const { error: dealError } = await supabase
        .from("deals")
        .update({ status: "cancelled" })
        .eq("id", deal.id);

      if (dealError) throw dealError;

      if (transaction?.id) {
        await supabase
          .from("transactions")
          .update({ transaction_status: "cancelled" })
          .eq("id", transaction.id);
      }

      // 2. Restore cart items (Heuristic)
      await supabase
        .from("warung_cart_items")
        .update({ status: "pending" })
        .eq("user_id", deal.depositor_id)
        .eq("status", "deal");

      alert("Deal dibatalkan. Barang telah dikembalikan ke Keranjang.");
      sendSystemMessage("Deal telah dibatalkan oleh pengguna. ❌");
      navigate("/transaksi");
    } catch (err) {
      console.error("Gagal membatalkan deal:", err);
      alert("Gagal membatalkan deal. Silakan coba lagi.");
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

  if (loading) return <p className="p-8 text-center">Memuat...</p>;
  if (!deal) return <p className="p-8 text-center">Deal tidak ditemukan</p>;

  const statusColor =
    deal.status === "completed"
      ? "badge-success"
      : deal.status === "cancelled"
        ? "badge-error"
        : "badge-warning";

  const canPay = ["draft", "pending"].includes(transaction?.transaction_status);
  const paid = ["paid"].includes(transaction?.transaction_status);
  const running = ["running"].includes(deal?.delivery_status);
  const delivered = ["delivered"].includes(deal?.delivery_status);

  const isCarrierLogin = deal?.carrier_id === clerkId;
  const opponent = isCarrierLogin
    ? deal?.depositor
    : deal?.carrier;
  const opponentRole = isCarrierLogin ? "Customer" : "Kurir";
  const opponentType = isCarrierLogin ? "Bawa" : "Nitip";

  const startChatWithDeal = async (deal, currentClerkId) => {
    // Tentukan lawan chat
    const isCarrierLogin = deal.carrier_id === currentClerkId;
    const opponentId = isCarrierLogin ? deal.depositor_id : deal.carrier_id;

    let conversationId;

    // cek apakah sudah ada conversation berdua
    const { data: participants, error } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .in("user_id", [currentClerkId, opponentId]);

    if (participants && participants.length >= 2) {
      conversationId = participants[0].conversation_id;
    } else {
      // buat conversation baru
      const { data: newConv, error: insertError } = await supabase
        .from("conversations")
        .insert({})
        .select("id")
        .single();

      conversationId = newConv.id;

      // masukkan peserta
      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: currentClerkId },
        { conversation_id: conversationId, user_id: opponentId },
      ]);
    }

    // navigasi ke halaman chat
    navigate(`/chat/${conversationId}`);
  };

  return (
    <>
      <div className="min-h-screen bg-base-200 flex flex-col pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 navbar bg-base-100/90 backdrop-blur-xl border-b border-base-300/40">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 flex items-center justify-between gap-2 px-0 -translate-x-4">
            <div className="px-5 py-0 flex items-center justify-between">
              <div className="flex items-center gap-4 w-full">
                {/* Avatar / Foto Barang */}
                <div className="avatar flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-emerald-500/20">
                    <img
                      src={deal.post?.item_photo || "/default-item.jpg"}
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
                    deliveryStatus={deal.delivery_status}
                    size="sm"
                  />

                  <div className="flex items-center gap-2 text-sm text-base-content/80">
                    <span className="font-semibold">
                      {deal.post?.from_city || "-"}
                    </span>

                    <svg
                      className="w-5 h-5 text-emerald-500"
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

                    <span className="font-semibold">
                      {deal.post?.to_city || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <span className="badge badge-primary badge-sm font-medium">
              {opponentType}
            </span>

          </div>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Carrier Card */}
          <div className="rounded-2xl bg-base-100 shadow-lg border border-base-300/40 overflow-hidden">
            {/* CARD UTAMA */}
            <div className="p-4 flex items-center justify-between">
              {/* Kiri */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="avatar">
                  <div className="w-16 rounded-full ring ring-emerald-500 ring-offset-base-100 ring-offset-2">
                    <img
                      src={opponent?.avatar_url || "/avatar-placeholder.png"}
                      alt="User"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-lg truncate">
                    {opponent?.name || "-"}
                  </p>
                  <p className="text-sm opacity-70">
                    {opponentRole}
                  </p>
                </div>
              </div>

              {/* Kanan */}
              <button
                className="btn btn-circle btn-ghost text-emerald-600 hover:bg-emerald-100"
                title="Chat"
                onClick={() => startChatWithDeal(deal, clerkId)}
              >
                <MessageCircle size={22} />
              </button>
            </div>

            {/* EXTEND CARD – MUNCUL SAAT RUNNING */}
            {(deal?.delivery_status === "running" && !isCarrierLogin) && (
              <div className="border-t border-base-300/40 bg-emerald-50/40 px-4 py-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between gap-3">
                  {/* Status */}
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Truck className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-semibold">
                        Sedang Mengantar
                      </p>
                      <p className="text-xs opacity-70">
                        Kurir dalam perjalanan
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => openLiveTracking(deal.id)}
                    className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    <MapPin className="w-4 h-4" />
                    Posisi Kurir
                  </button>
                </div>
              </div>
            )}
            {(deal?.delivery_status === "draft" && transaction?.transaction_status === "paid" && !isCarrierLogin) && (
              <div className="border-t border-base-300/40 bg-emerald-50/40 px-4 py-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between gap-3">
                  {/* Status */}
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CarFront className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-semibold">
                        Sedang Menunggu
                      </p>
                      <p className="text-xs opacity-70">
                        Persiapan keberangkatan
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  {/* <button
                  onClick={() => openLiveTracking(deal.id)}
                  className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                >
                  <MapPin className="w-4 h-4" />
                  Posisi Kurir
                </button> */}
                </div>
              </div>
            )}
            {(deal?.delivery_status === "delivered" && !isCarrierLogin) && (
              <div className="border-t border-base-300/40 bg-emerald-50/40 px-4 py-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between gap-3">
                  {/* Status */}
                  <div className="flex items-center gap-2 text-emerald-700">
                    <MapPinHouse className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-semibold">
                        Tiba Ditujuan
                      </p>
                      <p className="text-xs opacity-70">
                        Barang sudah diterima
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  {/* <button
                  onClick={() => openLiveTracking(deal.id)}
                  className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                >
                  <MapPin className="w-4 h-4" />
                  Posisi Kurir
                </button> */}
                </div>
              </div>
            )}
          </div>

          {/* Ringkasan */}
          <div className="rounded-2xl bg-base-100 shadow-lg p-4 border border-base-300/40">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-emerald-500" />
              Ringkasan Transaksi
            </h2>
            <p className="text-sm opacity-100">
              <OpponentSummary />
            </p>

          </div>

          {/* Detail Item */}
          <div className="rounded-2xl bg-base-100 shadow-lg p-4 border border-base-300/40 space-y-4">
            <InfoRowCollapse
              icon={ClipboardList}
              title="Deskripsi Barang"
              value={deal.item_description}
              type="photos"
              extraData={deal.item_photos}
            />

            <InfoRowCollapse
              icon={MapPin}
              title="Lokasi Penjemputan"
              value={afterSecondComma(deal.pickup_location)}
              type="location"
              extraData={{
                lat: parseFloat(deal.pickup_location.split(",")[0]),
                lng: parseFloat(deal.pickup_location.split(",")[1]),
                address: deal.pickup_location.split(",").slice(2).join(","),
              }}
            />

            <InfoRowCollapse
              icon={MapPin}
              title="Lokasi Pengantaran"
              value={afterSecondComma(deal.delivery_location)}
              type="location"
              extraData={{
                lat: parseFloat(deal.delivery_location.split(",")[0]),
                lng: parseFloat(deal.delivery_location.split(",")[1]),
                address: deal.delivery_location.split(",").slice(2).join(","),
              }}
            />

            <InfoRowCollapse
              icon={CalendarClock}
              title="Waktu Penjemputan"
              value={
                deal.pickup_datetime
                  ? new Date(deal.pickup_datetime).toLocaleString("id-ID", {
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
            <div className="rounded-2xl bg-base-100 shadow-lg p-4 border border-base-300/40 space-y-3">
              <p className="text-sm opacity-70">Penghasilan dari Jastip</p>
              <p className="text-3xl font-extrabold text-emerald-600">
                {deal.agreed_fee
                  ? Number(deal.agreed_fee).toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  })
                  : "-"}
              </p>

              {/* Perincian biaya */}
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Biaya Penanganan</span>
                  <span>Rp 0</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total yang diterima</span>
                  <span>
                    {deal.agreed_fee
                      ? Number(deal.agreed_fee).toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      })
                      : "-"}
                  </span>
                </div>
              </div>

              {/* <p className="text-xs text-gray-400 mt-1">
            Pembayaran dari customer akan diterima setelah barang diterima.
          </p> */}
            </div>
          )}

          {!isCarrierLogin && (
            <div className="rounded-2xl bg-base-100 shadow-lg p-4 border border-base-300/40 space-y-3">
              <p className="text-sm opacity-70">Total Biaya Nebeng</p>
              <p className="text-3xl font-extrabold text-emerald-600">
                {deal.agreed_fee || deal.item_fee
                  ? (Number(deal.agreed_fee || 0) + Number(deal.item_fee || 0)).toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  })
                  : "-"}
              </p>

              {/* Perincian biaya */}
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Biaya Barang</span>
                  <span>
                    {deal.item_fee
                      ? Number(deal.item_fee).toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      })
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Penanganan</span>
                  <span>Rp 0</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Biaya Nitip</span>
                  <span>
                    {deal.agreed_fee
                      ? Number(deal.agreed_fee).toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      })
                      : "-"}
                  </span>
                </div>
              </div>

              {/* <p className="text-xs text-gray-400 mt-1">
              Dana akan diteruskan ke kurir setelah barang diterima.
            </p> */}
            </div>

          )}
          {/* Metode Pembayaran - hanya muncul jika draft */}
          {canPay && !isCarrierLogin && (
            <div className="rounded-2xl bg-base-100 shadow-lg p-4 border border-base-300/40">
              <h2 className="font-semibold text-lg mb-3">Metode Pembayaran</h2>
              <div className="space-y-2">
                <PaymentOption
                  value="midtrans"
                  title="Transfer / E-Wallet"
                  desc="GoPay, ShopeePay, QRIS, VA Bank"
                  checked={true}
                  onChange={() => { }}
                  badge="Rekomendasi"
                />
                <PaymentOption
                  title="Bayar di Tempat (COD)"
                  desc="Segera hadir"
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
                className="btn btn-ghost btn-sm text-error hover:bg-error/10 w-full rounded-xl gap-2 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Batalkan Deal & Kembalikan ke Keranjang
              </button>
            </div>
          )}

          {/* Beri Ulasan - Jika sudah delivered & belum diulas & adalah depositor */}
          {delivered && !isCarrierLogin && !hasReviewed && (
            <div className="mt-6 px-4 pb-4">
              <button
                onClick={() => setShowReviewModal(true)}
                className="btn btn-primary w-full rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Beri Ulasan ke Jastiper
              </button>
            </div>
          )}

          {hasReviewed && !isCarrierLogin && (
            <div className="mt-6 px-4 pb-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl flex items-center gap-3 border border-emerald-200 dark:border-emerald-800/30">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-sm font-semibold">Ulasan sudah terkirim. Terima kasih!</div>
              </div>
            </div>
          )}
        </div>
        {canPay && !isCarrierLogin && (
          <div className="fixed bottom-4 left-4 right-4 z-20">
            <div className="bg-base-100/95 backdrop-blur-xl border border-base-300/40 shadow-xl rounded-2xl p-4 flex gap-3">
              <button className="btn btn-outline flex-1 rounded-xl" onClick={() => navigate(-1)}>
                Kembali
              </button>
              <button
                className="btn btn-success flex-1 rounded-xl"
                onClick={() =>
                  handlePay({
                    transactionId: transaction?.id,
                    navigate,
                    setPaying,
                  })
                }
                disabled={paying}
              >
                {paying ? <span className="loading loading-spinner"></span> : "Bayar Sekarang"}
              </button>
            </div>
          </div>
        )}
        {/* Status Pembayaran untuk Kurir (jika belum bayar) */}
        {isCarrierLogin && transaction?.transaction_status !== "paid" && (
          <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl bg-base-100 shadow-sm p-3 border border-base-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium opacity-70">Status Pembayaran</span>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${transaction?.transaction_status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : transaction?.transaction_status === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-700"
              }`}>
              {transaction?.transaction_status?.toUpperCase() || "BELUM BAYAR"}
            </span>
          </div>
        )}

        {/* Kurir Mulai Jalan (Paid & Draft) */}
        {isCarrierLogin && paid && deal.delivery_status === "draft" && (
          <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl bg-base-100 shadow-sm p-3 border border-base-300">
            <SlideToRunning
              status={deal.delivery_status}
              onComplete={handleStartDelivery}
            />
          </div>
        )}

        {/* Kustomer/Kurir Selesaikan Pesanan (Running) */}
        {running && (
          <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl bg-base-100 shadow-sm p-3 border border-base-300">
            <SlideToDelivered
              status={deal.delivery_status}
              onComplete={handleDelivered}
            />
          </div>
        )}

        {/* Pesanan Selesai */}
        {delivered && (
          <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-center rounded-xl bg-emerald-500 shadow-lg p-3 text-white font-bold">
            <PackageCheck className="w-5 h-5 mr-2" />
            Pesanan Selesai
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



