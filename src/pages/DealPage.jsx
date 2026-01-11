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
  Truck
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import OpponentSummary from "../components/transaksi/OpponentSummary";
import LiveTrackingModal from "../components/transaksi/LiveTrackingModal";
import SlideToRunning from "../components/transaksi/SlideToRunning";
import SlideToDelivered from "../components/transaksi/SlideToDelivered";

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
            <p className="text-sm opacity-70">{value || "-"}</p>
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

    // 2. Mulai live tracking
    startLiveTracking();
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
      .update({ delivery_status: "delivered" })
      .eq("id", deal.id)
      .eq("carrier_id", deal.carrier_id);

    if (error) {
      console.error("Gagal diterima:", error);
      return;
    }

    // 2. Mulai live tracking
    stopLiveTracking();
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
  const delivered = ["delivered"].includes(deal?.delivery_status);

  const isCarrierLogin = deal?.carrier_id === clerkId;
  const opponent = isCarrierLogin
  ? deal?.depositor
  : deal?.carrier;
  const opponentRole = isCarrierLogin ? "Customer" : "Kurir";
  const opponentType = isCarrierLogin ? "Bawa Titipan" : "Nitip Bawakan";
  
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
                <span className="badge badge-primary badge-sm font-medium">
                    {opponentType}
                  
                </span>
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

          <span className={`badge badge-md ${statusColor}`}>
            {deal.status === "completed" ? "deal" : deal.status || "pending"}
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
          {(deal?.delivery_status === "running" && !isCarrierLogin ) && (
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
            <p className="text-sm opacity-70">Total Biaya Jastip</p>
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
                <span>Total</span>
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
                onChange={() => {}}
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
      </div>
      {canPay && !isCarrierLogin && (
        <div className="fixed bottom-4 left-4 right-4 z-20">
          <div className="bg-base-100/95 backdrop-blur-xl border border-base-300/40 shadow-xl rounded-2xl p-4 flex gap-3">
            <button className="btn btn-outline flex-1 rounded-xl" onClick={() => navigate(-1)}>
              Batal
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
      {/* Kurir tidak perlu tombol bayar */}
      {(isCarrierLogin && !paid) && (
        <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl bg-base-100 shadow-sm p-3 border border-base-300">
          {/* Left section */}
          <div className="flex items-center gap-3">
            {/* Ikon pengguna */}
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 11h18M5 15h4m6 0h4M3 19h18" />
              </svg>
            </div>
            
            {/* Content */}
            <div>
              <div className="flex items-center gap-2"> 
                <span className="text-xs font-medium text-gray-100">Status Pembayaran</span>
              </div>
            </div>
          </div>
          
          {/* Right section */}
          <div className="text-right">
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  transaction?.transaction_status === "paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : transaction?.transaction_status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : transaction?.transaction_status === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {transaction?.transaction_status?.toUpperCase() || "DRAFT"}
                </span>
          </div>
        </div>
      )}
      {/* Kurir tidak perlu tombol bayar */}
      {(!isCarrierLogin && paid) && (
        <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl bg-base-100 shadow-sm p-3 border border-base-300">
           <SlideToDelivered
              status={deal.delivery_status}
              onComplete={handleDelivered}
            />
        </div>
      )}
      {(isCarrierLogin && paid) && (
        <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl bg-base-100 shadow-sm p-3 border border-base-300">
          <SlideToRunning 
            status={deal.delivery_status}
            onComplete={handleStartDelivery} 
          />
        </div>
      )}
    </div>
          {(isCarrierLogin && delivered) && (
        <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl bg-base-100 shadow-sm p-3 border border-base-300">
          <SlideToDelivered
              status={deal.delivery_status}
              onComplete={handleDelivered}
            />
        </div>
      )}
      {showTrackingModal && (
      <LiveTrackingModal
        dealId={selectedDealId}
        deal={deal}
        open={openLiveTracking}
        onClose={closeLiveTracking}
      />
    )}
  </> 
  );
}



