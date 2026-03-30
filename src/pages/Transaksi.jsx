import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import { FileText, Wallet, BaggageClaim, Truck, MapPin } from "lucide-react";
import { handlePay } from "../lib/handlePay";
import { useNavigate } from "react-router-dom";
import LiveTrackingModal from "../components/transaksi/LiveTrackingModal";
import TransaksiHeader from "../components/transaksi/TransaksiHeader";
import DealStatusBadge from "../components/common/DealStatusBadge";

// ⬆️ sesuaikan path supabase client kamu

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

export default function TransaksiPage() {
  const { user, isLoaded } = useUser();
  const [clerkId, setClerkId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [transaksi, setTransaksi] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoaded && user) {
      setClerkId(user.id);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    setError(null);
    fetchTransactions()
      .catch((err) => {
        setError(err.message || "Failed to fetch transactions");
      })
      .finally(() => setLoading(false));
  }, [isLoaded, user]);

  async function fetchTransactions() {
    try {
      console.log("\n");
      console.log(
        "╔════════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║ 🚀 === Transaksi Page: fetchTransactions START ===       ║",
      );
      console.log(
        "╚════════════════════════════════════════════════════════════╝",
      );
      console.log("📌 User loaded:", isLoaded);
      console.log("👤 User object exists:", !!user);
      console.log("🔑 User Clerk ID:", user?.id);
      console.log("📋 clerkId from state:", clerkId);
      console.log("\n🌐 API Request Details:");
      console.log("   Method: GET");
      console.log("   Endpoint: /api/transactions");
      console.log(
        "   API URL:",
        import.meta.env.VITE_API_URL || "http://localhost:8080",
      );
      console.log("\n⏳ Calling API...");

      const data = await apiFetch("/api/transactions");

      console.log(
        "\n╔════════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║ ✅ API Response Received                                ║",
      );
      console.log(
        "╚════════════════════════════════════════════════════════════╝",
      );
      console.log("📊 Response Type:", typeof data);
      console.log("📊 Is Array:", Array.isArray(data));
      console.log("📊 Item Count:", Array.isArray(data) ? data.length : "N/A");
      console.log("📄 Response Data:", JSON.stringify(data, null, 2));

      console.log(
        "\n✅ Setting state with",
        Array.isArray(data) ? data.length : 0,
        "items",
      );

      setRows(data || []);
      setTransaksi(data || []);
      return data || [];
    } catch (err) {
      console.log(
        "\n╔════════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║ ❌ API Request Failed                                   ║",
      );
      console.log(
        "╚════════════════════════════════════════════════════════════╝",
      );
      console.error("❌ Error fetching transactions:", err);
      console.error("   Error message:", err.message);
      console.error("   Full error:", err);
      setError(err.message || "Failed to fetch transactions");
      throw err;
    }
  }

  // Real-time synchronization for Transaksi list
  useEffect(() => {
    if (!clerkId) return;

    // Listen to changes in transactions and deals
    const channel = supabase
      .channel(`transaksi-list-realtime-${clerkId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          console.log("🔄 Real-time Transaction update in list, refetching...");
          fetchTransactions();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deals" },
        () => {
          console.log("🔄 Real-time Deal update in list, refetching...");
          fetchTransactions();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clerkId]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!clerkId) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading user...
      </div>
    );
  }

  const openLiveTracking = (dealId) => {
    setSelectedDealId(dealId);
    setShowTrackingModal(true);
  };

  const closeLiveTracking = () => {
    setShowTrackingModal(false);
    setSelectedDealId(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-[#f0f8f1] to-[#d9f0e0] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#1e293b] flex flex-col mb-15">
        <TransaksiHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Transaction List / Loading / Empty */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="alert alert-error">
              <div>
                <span>❌ Error: {error}</span>
              </div>
            </div>
          )}
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="border border-base-300/30 dark:border-base-700/30 rounded-2xl p-4 space-y-3 animate-pulse"
              >
                <div className="flex justify-between">
                  <div className="skeleton h-4 w-32 bg-base-300/40" />
                  <div className="skeleton h-4 w-20 bg-base-300/40" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="skeleton w-12 h-12 rounded-full bg-base-300/40" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-40 bg-base-300/40" />
                    <div className="skeleton h-3 w-24 bg-base-300/30" />
                  </div>
                </div>
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xl font-medium text-base-content/60">
                Belum ada transaksi
              </p>
            </div>
          ) : (
            rows.map((trx) => (
              <div
                key={trx.id}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/deal?deal=${trx.deal?.id}&trx=${trx.id}`);
                }}
                className="cursor-pointer rounded-2xl bg-base-100 border border-base-300/30
                        hover:bg-base-200/30 transition overflow-hidden"
              >
                {/* ================= HEADER ================= */}
                <div className="px-4 pt-4 flex items-center justify-between">
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-base-200 text-base-content/70">
                    {new Date(trx.created_at).toLocaleDateString("id-ID")}
                  </span>

                  <DealStatusBadge
                    dealStatus={trx.deal?.status}
                    transactionStatus={trx.transaction_status}
                    deliveryStatus={trx.deal?.delivery_status}
                    size="sm"
                  />
                </div>

                {/* ================= BODY ================= */}
                <div className="p-4 flex items-center justify-between gap-4">
                  {/* Left */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="avatar">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-base-200 shadow-sm border border-base-300/30">
                        <img
                          src={
                            normalizeItemPhotos(trx.deal?.item_photos)[0] ||
                            trx.deal?.post?.item_photo ||
                            "/default-avatar.png"
                          }
                          alt=""
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {trx.deal?.carrier_id === clerkId ? (
                          <span className="badge badge-error badge-xs font-bold text-[10px] px-1.5 py-2 rounded-md">
                            JASTIPER
                          </span>
                        ) : (
                          <span className="badge badge-info badge-xs font-bold text-[10px] px-1.5 py-2 rounded-md">
                            NITIPERS
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-base leading-tight truncate">
                        {trx.deal?.item_description ||
                          "Detail barang tidak ada"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs opacity-60 mt-0.5">
                        <span className="font-medium">
                          {trx.deal?.post?.from_city}
                        </span>
                        <svg
                          className="w-3 h-3 text-emerald-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                        <span className="font-medium">
                          {trx.deal?.post?.to_city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">
                      Rp{" "}
                      {Number(
                        trx.gross_amount ?? trx.deal?.agreed_fee ?? 0,
                      ).toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-base-content/50">
                      {trx.payment_type?.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* ================= FOOTER ================= */}
                <div className="px-4 pb-4 flex items-center justify-between border-t border-base-300/20">
                  <span className="text-xs text-base-content/50">
                    {trx.deal?.carrier_id === clerkId
                      ? `Customer: ${trx.deal?.depositor?.name ?? "-"}`
                      : `Kurir: ${trx.deal?.carrier?.name ?? "-"}`}
                  </span>

                  <div className="flex items-center gap-3">
                    {/* Live tracking icon (ringkas) */}
                    {/* {trx.deal?.delivery_status === "running" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDeal(trx.deal);
                        openLiveTracking();
                      }}
                      className="text-blue-600 hover:text-blue-700"
                      title="Live Tracking"
                    >
                      <BaggageClaim size={20} />
                    </button>
                  )} */}
                  </div>
                </div>

                {/* ================= EXTEND (RUNNING ONLY) ================= */}
                {trx.deal?.delivery_status === "running" && (
                  <div
                    className="border-t border-base-300/40 bg-emerald-50/40 px-4 py-3
                                animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="flex items-center justify-between">
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeal(trx.deal);
                          openLiveTracking();
                        }}
                        className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <MapPin className="w-4 h-4" />
                        Posisi Kurir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {showTrackingModal && selectedDeal && (
        <LiveTrackingModal
          dealId={selectedDeal.id}
          deal={selectedDeal}
          open={showTrackingModal}
          onClose={closeLiveTracking}
        />
      )}
    </>
  );
}
