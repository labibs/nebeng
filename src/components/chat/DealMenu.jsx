import { useState, useEffect } from "react";
import LoadingLogo from "../LoadingLogo";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
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
}) {
  const [approvedMessages, setApprovedMessages] = useState([]);
  const [lastPendingMessage, setLastPendingMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dealData, setDealData] = useState(null);
  const [localPostInfo, setLocalPostInfo] = useState(postInfo);
  const [allDone, setAllDone] = useState(false);

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

  const config = postTypeConfig[localPostInfo?.type] || {
    label: "post",
    icon: "📝",
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
      <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-[env(safe-area-inset-bottom)]">
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 border border-slate-100 flex flex-col">
          {/* Header Rapi: Gambar + Kategori */}
          <div className="p-5 flex items-center justify-between border-b border-slate-50 bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-sm">
                <img
                  src={
                    localPostInfo?.item_photo ||
                    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&q=80"
                  }
                  className="w-full h-full object-cover"
                  alt="item"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm">{config.icon}</span>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">
                    {config.label}
                  </h3>
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  Sepakati detail transaksi
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 active:scale-90 transition-transform"
            >
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-86 overflow-y-auto">
            {deals.map((dealItem, i) => {
              const color = colorMap[dealItem.tag];
              return (
                <button
                  key={dealItem.tag}
                  onClick={() => handleSelect(dealItem)}
                  disabled={dealItem.isCompleted}
                  className={`w-full text-left px-5 py-4 flex items-center justify-between transition-colors ${
                    i !== 0 ? "border-t border-base-300/50" : ""
                  } ${dealItem.isCompleted ? "opacity-60 cursor-not-allowed" : "hover:bg-base-200"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-100 text-${color}-600`}
                    >
                      {dealItem.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-base">
                        {dealItem.title}
                      </div>
                      <div className="text-xs opacity-70">{dealItem.ket}</div>
                      <div className="text-xs opacity-70">{dealItem.desc}</div>
                    </div>
                  </div>
                  {dealItem.isCompleted && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
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
          <div className="p-3 bg-base-200 text-center border-t border-base-300/50">
            {allDone ? (
              <SlideToUnlock
                onComplete={async () => {
                  try {
                    const { data: trx, error } = await supabase
                      .from("transactions")
                      .upsert(
                        {
                          deal_id: dealData?.id,
                          gross_amount:
                            Number(dealData?.agreed_fee || 0) +
                            Number(dealData?.item_fee || 0),
                          transaction_status: "ready_to_ship",
                          payment_status: "pending",
                        },
                        {
                          onConflict: "deal_id",
                        },
                      )
                      .select()
                      .single();

                    if (error) throw error;

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
                className="text-sm font-medium text-base-content/70 hover:text-base-content"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
