import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../lib/supabaseClient";
import { FileText, Wallet, BaggageClaim} from "lucide-react";
import { handlePay } from "../lib/handlePay";
import { useNavigate } from 'react-router-dom'
import TransaksiHeader from "../components/transaksi/TransaksiHeader";

// ⬆️ sesuaikan path supabase client kamu

export default function TransaksiPage() {
  const { user, isLoaded } = useUser();
  const [clerkId, setClerkId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && user) {
      setClerkId(user.id);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    fetchTransactions(user.id)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [isLoaded, user]);

  async function fetchTransactions(clerkId) {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        id,
        transaction_status,
        gross_amount,
        payment_type,
        created_at,

        deal:deals!inner (
          id,
          status,
          agreed_fee,
          carrier_id,
          depositor_id,
          pickup_location,
          delivery_location,
          pickup_datetime,
          item_description,

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
        )
      `)
      .or(
        `carrier_id.eq.${clerkId},depositor_id.eq.${clerkId}`,
        { foreignTable: "deals" }
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return data || [];
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-[#f0f8f1] to-[#d9f0e0] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#1e293b] flex flex-col">
    
    <TransaksiHeader
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    />
    
        {/* Transaction List / Loading / Empty */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
        onClick={() => openTransaction(trx)}
        className="cursor-pointer border border-base-300/30 dark:border-base-700/30 rounded-2xl p-4 bg-base-100 hover:bg-base-200/30 transition"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-base-200 text-base-content/70">
            {new Date(trx.created_at).toLocaleDateString("id-ID")}
          </span>
          
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              trx.transaction_status === "settlement"
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {trx.transaction_status?.toUpperCase()}
          </span>
        </div>

        {/* Body */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="avatar">
               <div className="w-16 h-16 rounded-xl overflow-hidden bg-base-200 flex items-center justify-center">
                <img
                  src={
                    trx.deal?.post?.item_photo ||
                    "/default-avatar.png"
                  }
                  alt=""
                />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-sm text-base-content/60 truncate">
                {trx.deal?.carrier_id === clerkId
              ? 'Bawa Titipan'
              : 'Nitip Bawakan' }
              </p>
              <h3 className="font-semibold truncate">
                {trx.deal?.item_description}
              </h3>
              <p className="text-sm text-base-content/60 truncate">
                {trx.deal?.post?.from_city} →{" "}
                {trx.deal?.post?.to_city}
              </p>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right">
            <p className="font-bold text-green-600">
              Rp{" "}
              {Number(
                trx.gross_amount ??
                  trx.deal?.agreed_fee ??
                  0
              ).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-base-content/50">
              {trx.payment_type?.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-base-300/20 dark:border-base-700/20 flex justify-between items-center">
          <span className="text-xs text-base-content/50">
            
            {trx.deal?.carrier_id === clerkId
              ? `Customer : ${trx.deal?.depositor?.name ?? "-"}`
              : `Kurir : ${trx.deal?.carrier?.name ?? "-"}`
            }

          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // navigasi ke halaman live tracking, kirim deal + trx sebagai query
                navigate(`/tracking?deal=${trx.deal?.id}&trx=${trx.id}`);
              }}
              className="group flex items-center gap-1 text-blue-600 hover:text-blue-700 transition"
              title="Live Tracking"
            >
              <BaggageClaim size={22} className="group-hover:scale-110 transition" />
              {/* <span className="text-xs font-medium">Tracking</span> */}
            </button>
            {/* Ke halaman Deal */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/deal?deal=${trx.deal?.id}&trx=${trx.id}`);
              }}
              className="group flex items-center gap-1 text-green-600 hover:text-green-700 transition"
              title="Lihat Deal"
            >
              <FileText size={22} className="group-hover:scale-110 transition" />
              {/* <span className="text-xs font-medium">Deal</span> */}
            </button>

            {/* Ke halaman Pembayaran */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePay({
                  transactionId: trx.id,
                  navigate,
                });
              }}
              className="group flex items-center gap-1 text-orange-600 hover:text-orange-700 transition"
              title="Pembayaran"
            >
              <Wallet size={22} className="group-hover:scale-110 transition" />
              {/* <span className="text-xs font-medium">Bayar</span> */}
            </button>
          </div>

        </div>
      </div>
    ))
  )}
</div>

    </div>
  );
}
