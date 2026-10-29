import { useState, useEffect } from "react";
import LoadingLogo from "../LoadingLogo";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/apiClient";
import SlideToUnlock from "./SlideToUnlock";

import { X } from "lucide-react";

export default function DealMenu({
  onClose,
  onOpenNego,
  onOpenLocation,
  onOpenTime,
  onOpenItem,
  onOpenDelivery,
  postId,
  postInfo,
  currentUserId,
  conversationId,
  carrierId,
  depositorId,
}) {
  const [loading, setLoading] = useState(true);
  const [dealData, setDealData] = useState(null);
  const [allDone, setAllDone] = useState(false);
  const navigate = useNavigate();

  const postTypeConfig = {
    nitip_bawakan: { label: "nitip bawain", icon: "🧳" },
    nitip_belikan: { label: "nitip beliin", icon: "🛍️" },
    cari_boncengan: { label: "cari boncengan", icon: "🛵" },
    tukang: { label: "cari tukang", icon: "👷" },
    perjalanan: { label: "dalam perjalanan", icon: "🚚" },
    keliling: { label: "jualan keliling", icon: "🛺" },
    content: { label: "konten", icon: "🎥" },
    warung: { label: "outlet", icon: "🏪" },
  };

  const config = postTypeConfig[postInfo?.type] || {
    label: "post",
    icon: "📝",
  };

  // Fetch existing deal data
  useEffect(() => {
    const fetchDeal = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch(`/deals/post/${postId}`);
        setDealData(data);
      } catch (err) {
        console.error("Error fetching deal:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [postId]);

  // Check if all deal steps are done
  useEffect(() => {
    if (!dealData) {
      setAllDone(false);
      return;
    }

    const hasFee = dealData.agreed_fee != null && dealData.agreed_fee > 0;
    const hasPickup =
      dealData.pickup_location && dealData.pickup_location !== "TBD";
    const hasDelivery =
      dealData.delivery_location && dealData.delivery_location !== "TBD";
    const hasTime =
      dealData.pickup_datetime && !dealData.pickup_datetime.includes("TBD");
    const hasItem =
      dealData.item_description && dealData.item_description !== "TBD";

    setAllDone(hasFee && hasPickup && hasDelivery && hasTime && hasItem);
  }, [dealData]);

  const colorMap = {
    ongkos: { bg: "bg-emerald-100", text: "text-emerald-600" },
    lokasi: { bg: "bg-blue-100", text: "text-blue-600" },
    waktu: { bg: "bg-purple-100", text: "text-purple-600" },
    barang: { bg: "bg-orange-100", text: "text-orange-600" },
    pengantaran: { bg: "bg-rose-100", text: "text-rose-600" },
  };

  const deals = [
    {
      tag: "ongkos",
      title: "Ongkos Jastip",
      icon: "💰",
      ket: "Sepakati biaya jasa titip / belanja",
      desc:
        dealData?.agreed_fee && dealData.agreed_fee > 0
          ? `Rp${Number(dealData.agreed_fee).toLocaleString("id-ID")}`
          : "Belum disepakati",
      isCompleted: dealData?.agreed_fee != null && dealData.agreed_fee > 0,
      onOpen: onOpenNego,
    },
    {
      tag: "lokasi",
      title: "Lokasi Ketemuan",
      icon: "📍",
      ket: "Tentukan tempat serah terima",
      desc:
        dealData?.pickup_location && dealData.pickup_location !== "TBD"
          ? dealData.pickup_location
          : "Belum ditentukan",
      isCompleted:
        dealData?.pickup_location && dealData.pickup_location !== "TBD",
      onOpen: onOpenLocation,
    },
    {
      tag: "waktu",
      title: "Waktu Ketemuan",
      icon: "🕐",
      ket: "Sepakati jam & hari bertemu",
      desc:
        dealData?.pickup_datetime && !dealData.pickup_datetime.includes("TBD")
          ? new Date(dealData.pickup_datetime).toLocaleString("id-ID")
          : "Belum ditentukan",
      isCompleted:
        dealData?.pickup_datetime && !dealData.pickup_datetime.includes("TBD"),
      onOpen: onOpenTime,
    },
    {
      tag: "barang",
      title: "Barang Titipan",
      icon: "📦",
      ket: "Konfirmasi detail barang yang dititipkan",
      desc:
        dealData?.item_description && dealData.item_description !== "TBD"
          ? dealData.item_description
          : "Belum dikonfirmasi",
      isCompleted:
        dealData?.item_description && dealData.item_description !== "TBD",
      onOpen: onOpenItem,
    },
    {
      tag: "pengantaran",
      title: "Lokasi Pengantaran",
      icon: "🚚",
      ket: "Tentukan lokasi tujuan pengantaran",
      desc:
        dealData?.delivery_location && dealData.delivery_location !== "TBD"
          ? dealData.delivery_location
          : "Belum ditentukan",
      isCompleted:
        dealData?.delivery_location && dealData.delivery_location !== "TBD",
      onOpen: onOpenDelivery,
    },
  ];

  const handleSelect = (dealItem) => {
    if (dealItem.onOpen) {
      dealItem.onOpen();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <LoadingLogo size="w-16 h-16" />
      </div>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Drag Handle */}
        <div className="py-3 flex justify-center flex-shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Header: Gambar + Kategori */}
        <div className="px-4 pb-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-sm">
              <img
                src={
                  postInfo?.item_photo ||
                  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&q=80"
                }
                className="w-full h-full object-cover"
                alt="item"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xs">{config.icon}</span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                  {config.label}
                </h3>
              </div>
              <p className="text-[10px] font-medium text-slate-400">
                Sepakati detail transaksi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {deals.map((dealItem, i) => {
            const color = colorMap[dealItem.tag];
            return (
              <button
                key={dealItem.tag}
                onClick={() => handleSelect(dealItem)}
                disabled={dealItem.isCompleted}
                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                  i !== 0 ? "border-t border-slate-100" : ""
                } ${dealItem.isCompleted ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-base ${color.bg} ${color.text}`}
                  >
                    {dealItem.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {dealItem.title}
                    </div>
                    <div className="text-[11px] opacity-70">{dealItem.ket}</div>
                    <div className="text-[11px] opacity-70">
                      {dealItem.desc}
                    </div>
                  </div>
                </div>
                {dealItem.isCompleted && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-white"
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
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white pb-8">
          {allDone ? (
            <SlideToUnlock
              onComplete={async () => {
                try {
                  const trx = await apiFetch("/transactions/create-snap", {
                    method: "POST",
                    body: JSON.stringify({
                      deal_id: dealData?.id,
                      gross_amount:
                        Number(dealData?.agreed_fee || 0) +
                        Number(dealData?.item_fee || 0),
                    }),
                  });

                  navigate(`/deal?deal=${dealData?.id}&trx=${trx.id}`);
                } catch (err) {
                  console.error(
                    "Gagal membuat / update transaksi:",
                    err.message,
                  );
                }
              }}
            />
          ) : (
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-slate-100 text-slate-600 py-3 text-[13px] font-semibold hover:bg-slate-200 transition-colors"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </>
  );
}
