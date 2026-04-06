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
      const data = await apiFetch("/api/transactions");

      const sortedData = [...(data || [])].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setRows(sortedData);
      setTransaksi(sortedData);
      return sortedData;
    } catch (err) {
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
          fetchTransactions();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deals" },
        () => {
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
  }, [searchQuery, rows.length]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#f0f7ff] p-4">
        <div className="space-y-3 pt-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex h-[120px] items-stretch overflow-hidden rounded-[24px] border border-[#e4edff] bg-white p-2 animate-pulse"
            >
              <div className="w-[90px] shrink-0 rounded-[16px] bg-[#e4edff]" />
              <div className="flex-1 p-3 space-y-2.5">
                <div className="flex justify-between">
                  <div className="h-2.5 w-14 rounded-full bg-[#edf3ff]" />
                  <div className="h-2.5 w-16 rounded-full bg-[#e4edff]" />
                </div>
                <div className="h-3.5 w-3/4 rounded-full bg-[#edf3ff]" />
                <div className="h-2.5 w-2/5 rounded-full bg-[#e4edff]" />
                <div className="mt-3 flex justify-between items-end">
                  <div className="h-4 w-20 rounded-full bg-[#edf3ff]" />
                  <div className="h-7 w-16 rounded-lg bg-[#e4edff]" />
                </div>
              </div>
            </div>
          ))}
        </div>
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

  const filteredRows = rows.filter((trx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const itemDesc = trx.deal?.item_description?.toLowerCase() || "";
    const pickup = getRouteLabel(
      trx.deal?.pickup_location,
      trx.deal?.post?.from_city,
    ).toLowerCase();
    const delivery = getRouteLabel(
      trx.deal?.delivery_location,
      trx.deal?.post?.to_city,
    ).toLowerCase();
    const opponentName =
      (trx.deal?.carrier_id === clerkId
        ? trx.deal?.depositor?.name
        : trx.deal?.carrier?.name
      )?.toLowerCase() || "";

    return (
      itemDesc.includes(q) ||
      pickup.includes(q) ||
      delivery.includes(q) ||
      opponentName.includes(q)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / ITEMS_PER_PAGE),
  );
  const paginatedRows = filteredRows.slice(
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
                className="flex h-[120px] items-stretch overflow-hidden rounded-[24px] border border-[#e4edff] bg-white p-2 animate-pulse"
              >
                <div className="w-[90px] shrink-0 rounded-[16px] bg-[#e4edff]" />
                <div className="flex-1 p-3 space-y-2.5">
                  <div className="flex justify-between">
                    <div className="h-2.5 w-14 rounded-full bg-[#edf3ff]" />
                    <div className="h-2.5 w-16 rounded-full bg-[#e4edff]" />
                  </div>
                  <div className="h-3.5 w-3/4 rounded-full bg-[#edf3ff]" />
                  <div className="h-2.5 w-2/5 rounded-full bg-[#e4edff]" />
                  <div className="mt-3 flex justify-between items-end">
                    <div className="h-4 w-20 rounded-full bg-[#edf3ff]" />
                    <div className="h-7 w-16 rounded-lg bg-[#e4edff]" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xl font-medium text-base-content/60">
                {searchQuery
                  ? "Tidak ada transaksi yang cocok"
                  : "Belum ada transaksi"}
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

              return (
                <div
                  key={trx.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/deal?deal=${trx.deal?.id}&trx=${trx.id}`);
                  }}
                  className="group relative flex h-[115px] cursor-pointer items-stretch overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)]"
                >
                  {/* Left: Image Section */}
                  <div className="relative h-[115px] w-[115px] shrink-0 p-2.5">
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
                      <div className="absolute left-1.5 top-1.5">
                        {trx.deal?.carrier_id === clerkId ? (
                          <span className="rounded-full bg-rose-500/80 px-2 py-0.5 text-[7px] font-extrabold text-white backdrop-blur-md tracking-wider uppercase">
                            Carrier
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-500/80 px-2 py-0.5 text-[7px] font-extrabold text-white backdrop-blur-md tracking-wider uppercase">
                            Owner
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Content Section */}
                  <div className="flex flex-1 flex-col justify-between overflow-hidden p-3 pl-0">
                    {/* Header: Date & Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">
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
                        size="sm"
                      />
                    </div>

                    {/* Body: Title & Route */}
                    <div className="space-y-0.5 mt-1">
                      <h3 className="line-clamp-1 text-[13px] font-bold tracking-tight text-slate-800">
                        {trx.deal?.item_description || "Item"}
                      </h3>

                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                        <span className="truncate max-w-[80px]">
                          {pickupLabel}
                        </span>
                        <div className="h-[2px] w-2 bg-slate-200" />
                        <span className="truncate max-w-[80px]">
                          {deliveryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Footer Row: Price & Action (Now Profile) */}
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <p className="text-[14px] font-extrabold text-[#4e73df] tracking-tight">
                        Rp{" "}
                        {Number(
                          trx.gross_amount ?? trx.deal?.agreed_fee ?? 0,
                        ).toLocaleString("id-ID")}
                      </p>

                      <div className="flex items-center gap-2">
                        {/* Profile Badge - Permanent at bottom right */}
                        <div className="flex h-7 items-center gap-1.5 rounded-full border border-slate-100 bg-white px-1 pr-2.5 shadow-sm">
                          <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-100">
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
                          <span className="max-w-[64px] truncate text-[10px] font-bold text-slate-600 tracking-tight">
                            {trx.deal?.carrier_id === clerkId
                              ? trx.deal?.depositor?.name?.split(" ")[0] ||
                                "Owner"
                              : trx.deal?.carrier?.name?.split(" ")[0] ||
                                "Carrier"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {!loading && filteredRows.length > ITEMS_PER_PAGE && (
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
