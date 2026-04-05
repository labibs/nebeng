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

function parseLocationAddress(location) {
  if (!location || typeof location !== "string") return "";

  const parts = location.split(",");
  if (parts.length < 3) return location.trim();

  return parts.slice(2).join(",").trim();
}

function extractCityFromAddress(address) {
  if (!address || typeof address !== "string") return "";

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return "";

  const cityPart = parts.find((part) =>
    /^(kota|kabupaten|kab\.|city)\s/i.test(part),
  );

  if (cityPart) return cityPart;

  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

function getRouteLabel(location, fallback) {
  return (
    extractCityFromAddress(parseLocationAddress(location)) || fallback || "-"
  );
}

export default function TransaksiPage() {
  const ITEMS_PER_PAGE = 10;
  const { user, isLoaded } = useUser();
  const [clerkId, setClerkId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [transaksi, setTransaksi] = useState([]);
  const [error, setError] = useState(null);
  const [payingId, setPayingId] = useState(null);

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

      const sortedData = [...(data || [])].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setRows(sortedData);
      setTransaksi(sortedData);
      return sortedData;
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

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

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

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const paginatedRows = rows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

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
                className="flex h-[148px] items-stretch overflow-hidden rounded-[28px] border border-slate-100 bg-white p-2.5 animate-pulse"
              >
                <div className="w-[110px] shrink-0 rounded-[20px] bg-slate-100" />
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 rounded-full bg-slate-100" />
                    <div className="h-3 w-20 rounded-full bg-slate-100" />
                  </div>
                  <div className="h-4 w-3/4 rounded-full bg-slate-100" />
                  <div className="h-3 w-1/2 rounded-full bg-slate-100" />
                  <div className="mt-4 flex justify-between items-end">
                    <div className="h-5 w-24 rounded-full bg-slate-100" />
                    <div className="h-8 w-20 rounded-xl bg-slate-100" />
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
            paginatedRows.map((trx) => {
              const pickupLabel = getRouteLabel(
                trx.deal?.pickup_location,
                trx.deal?.post?.from_city,
              );
              const deliveryLabel = getRouteLabel(
                trx.deal?.delivery_location,
                trx.deal?.post?.to_city,
              );
              const paymentExpired = ["expire", "expired"].includes(
                trx.payment_status,
              );
              const canRetryPayment =
                trx.deal?.depositor_id === clerkId &&
                trx.deal?.status !== "cancelled" &&
                ["draft", "pending", "expire", "expired"].includes(
                  trx.payment_status,
                );

              return (
                <div
                  key={trx.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/deal?deal=${trx.deal?.id}&trx=${trx.id}`);
                  }}
                  className="group relative flex h-[128px] cursor-pointer items-stretch overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)]"
                >
                  {/* Left: Image Section (Symmetric) */}
                  <div className="relative h-[128px] w-[128px] shrink-0 p-2">
                    <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-slate-100">
                      <img
                        src={
                          normalizeItemPhotos(trx.deal?.item_photos)[0] ||
                          trx.deal?.post?.item_photo ||
                          "/default-avatar.png"
                        }
                        alt={trx.deal?.item_description}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />

                      {/* Floating Role Badge */}
                      <div className="absolute left-2 top-2">
                        {trx.deal?.carrier_id === clerkId ? (
                          <span className="rounded-full bg-rose-500/60 px-2 py-0.5 text-[7px] font-bold text-white backdrop-blur-md">
                            JASTIPER
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-500/60 px-2 py-0.5 text-[7px] font-bold text-white backdrop-blur-md">
                            NITIPERS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Content Section */}
                  <div className="flex flex-1 flex-col justify-between overflow-hidden p-3.5 pl-0.5">
                    {/* Header: Date & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-medium text-slate-400">
                        {new Date(trx.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <DealStatusBadge
                        dealStatus={trx.deal?.status}
                        transactionStatus={trx.transaction_status}
                        paymentStatus={trx.payment_status}
                        deliveryStatus={trx.deal?.delivery_status}
                        size="xs"
                      />
                    </div>

                    {/* Body: Title & Route */}
                    <div className="space-y-0.5">
                      <h3 className="line-clamp-1 text-[13px] font-bold leading-tight text-slate-900">
                        {trx.deal?.item_description ||
                          "Detail barang tidak ada"}
                      </h3>

                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                        <span className="truncate">{pickupLabel}</span>
                        <svg
                          className="w-3 h-3 text-[#4e73df] shrink-0"
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
                        <span className="truncate">{deliveryLabel}</span>
                      </div>

                      <p className="text-[14px] font-extrabold text-[#4e73df] mt-1">
                        Rp{" "}
                        {Number(
                          trx.gross_amount ?? trx.deal?.agreed_fee ?? 0,
                        ).toLocaleString("id-ID")}
                      </p>
                    </div>

                    {/* Footer Row: Counterparty & Action */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className="flex h-6.5 items-center gap-1 rounded-full border border-slate-100 bg-slate-50 px-1 pr-2 shadow-sm">
                          <div className="h-4.5 w-4.5 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-100">
                            <img
                              src={
                                trx.deal?.carrier_id === clerkId
                                  ? trx.deal?.depositor?.avatar_url ||
                                    "/default-avatar.png"
                                  : trx.deal?.carrier?.avatar_url ||
                                    "/default-avatar.png"
                              }
                              className="h-full w-full object-cover"
                              alt=""
                            />
                          </div>
                          <span className="max-w-[48px] truncate text-[8px] font-medium text-slate-600">
                            {trx.deal?.carrier_id === clerkId
                              ? trx.deal?.depositor?.name?.split(" ")[0] ||
                                "Customer"
                              : trx.deal?.carrier?.name?.split(" ")[0] ||
                                "Kurir"}
                          </span>
                        </div>

                        {trx.deal?.delivery_status === "running" && (
                          <div className="flex h-6.5 items-center rounded-full border border-blue-100/50 bg-blue-50 px-2 animate-pulse">
                            <Truck size={10} className="text-[#4e73df] mr-1" />
                            <span className="text-[8px] font-bold text-[#4e73df]">
                              OTW
                            </span>
                          </div>
                        )}
                      </div>

                      {canRetryPayment && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePay({
                              transactionId: trx.id,
                              navigate,
                              setPaying: (isPaying) =>
                                setPayingId(isPaying ? trx.id : null),
                            });
                          }}
                          className={`h-6.5 px-2.5 rounded-full text-[9px] font-bold text-white shadow-sm transition-all ${paymentExpired ? "bg-rose-500 hover:bg-rose-600" : "bg-[#4e73df] hover:bg-[#3b59bd]"}`}
                          disabled={payingId === trx.id}
                        >
                          {payingId === trx.id ? (
                            <span className="loading loading-spinner w-3 h-3"></span>
                          ) : paymentExpired ? (
                            "Ulangi Bayar"
                          ) : (
                            "Bayar"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {!loading && rows.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Prev
              </button>

              <span className="text-sm text-base-content/70">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                type="button"
                className="btn btn-sm btn-outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                Next
              </button>
            </div>
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
