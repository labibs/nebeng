import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import LoadingLogo from "../components/LoadingLogo";
import {
  Search,
  Filter,
  MoreVertical,
  Receipt,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Handshake,
  User,
  ArrowRight,
} from "lucide-react";

export default function Transactions() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDealRoutes, setExpandedDealRoutes] = useState(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [txRes, dealsRes] = await Promise.all([
          supabase
            .from("transactions")
            .select(
              `
              *,
              deals (
                id,
                depositor:users!fk_deals_depositor (
                  name,
                  avatar_url
                )
              )
            `,
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("deals")
            .select(
              `
              *,
              post:posts(item_photo, from_city, to_city),
              depositor:users!fk_deals_depositor(name, avatar_url),
              carrier:users!deals_carrier_id_fkey(name, avatar_url)
            `,
            )
            .order("created_at", { ascending: false }),
        ]);

        if (txRes.error) console.error("Tx Error:", txRes.error);
        if (dealsRes.error) console.error("Deals Error:", dealsRes.error);

        setTransactions(txRes.data || []);
        setDeals(dealsRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.deals?.depositor?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      tx.payment_type?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredDeals = deals.filter(
    (d) =>
      d.item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.depositor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.carrier?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isLongDealRoute = (deal) =>
    `${deal.post?.from_city || ""} ${deal.post?.to_city || ""}`.length > 32;

  const toggleDealRoute = (dealId) => {
    setExpandedDealRoutes((current) => {
      const next = new Set(current);
      if (next.has(dealId)) {
        next.delete(dealId);
      } else {
        next.add(dealId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingLogo />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    const statusConfig = {
      settlement: {
        label: "Berhasil",
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-600 border-emerald-100",
      },
      capture: {
        label: "Berhasil",
        icon: CheckCircle2,
        className: "bg-green-50 text-green-600 border-green-100",
      },
      success: {
        label: status,
        icon: CheckCircle2,
        className: "bg-teal-50 text-teal-600 border-teal-100",
      },
      paid: {
        label: "Paid",
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      },
      completed: {
        label: status,
        icon: CheckCircle2,
        className: "bg-blue-50 text-blue-600 border-blue-100",
      },
      accepted: {
        label: status,
        icon: CheckCircle2,
        className: "bg-sky-50 text-sky-600 border-sky-100",
      },
      pending: {
        label: status,
        icon: Clock,
        className: "bg-amber-50 text-amber-600 border-amber-100",
      },
      on_going: {
        label: status,
        icon: Clock,
        className: "bg-cyan-50 text-cyan-600 border-cyan-100",
      },
      draft: {
        label: status,
        icon: Clock,
        className: "bg-slate-50 text-slate-600 border-slate-100",
      },
      running: {
        label: status,
        icon: Clock,
        className: "bg-indigo-50 text-indigo-600 border-indigo-100",
      },
      delivered: {
        label: status,
        icon: CheckCircle2,
        className: "bg-lime-50 text-lime-700 border-lime-100",
      },
      cancelled: {
        label: status,
        icon: AlertCircle,
        className: "bg-rose-50 text-rose-600 border-rose-100",
      },
      canceled: {
        label: status,
        icon: AlertCircle,
        className: "bg-rose-50 text-rose-600 border-rose-100",
      },
      expired: {
        label: status,
        icon: AlertCircle,
        className: "bg-orange-50 text-orange-600 border-orange-100",
      },
      expire: {
        label: status,
        icon: AlertCircle,
        className: "bg-orange-50 text-orange-600 border-orange-100",
      },
      failed: {
        label: status,
        icon: AlertCircle,
        className: "bg-red-50 text-red-600 border-red-100",
      },
      fail: {
        label: status,
        icon: AlertCircle,
        className: "bg-red-50 text-red-600 border-red-100",
      },
      denied: {
        label: status,
        icon: AlertCircle,
        className: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
      },
      deny: {
        label: status,
        icon: AlertCircle,
        className: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
      },
      fraud_review: {
        label: status,
        icon: AlertCircle,
        className: "bg-purple-50 text-purple-600 border-purple-100",
      },
    };
    const config = statusConfig[s] || {
      label: status || "N/A",
      icon: AlertCircle,
      className: "bg-zinc-50 text-zinc-600 border-zinc-100",
    };
    const Icon = config.icon;

    return (
      <span
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${config.className}`}
      >
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a]">
            Riwayat Aktivitas
          </h1>
          <p className="text-sm font-semibold text-[#64748b]">
            Pantau transaksi dan kesepakatan platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
              size={18}
            />
            <input
              type="text"
              placeholder={
                activeTab === "transactions"
                  ? "Cari transaksi..."
                  : "Cari kesepakatan..."
              }
              className="pl-10 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4e73df]/20 transition-all w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 bg-white border border-[#e2e8f0] rounded-xl text-[#64748b] hover:bg-[#f8fafc] transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#f1f5f9] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "transactions"
              ? "bg-white text-[#4e73df] shadow-sm"
              : "text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          Riwayat Transaksi
        </button>
        <button
          onClick={() => setActiveTab("deals")}
          className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "deals"
              ? "bg-white text-[#4e73df] shadow-sm"
              : "text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          Riwayat Deal
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-[28px] border border-[#e2e8f0] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          {activeTab === "transactions" ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-bottom border-[#e2e8f0]">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    ID Pesanan
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Pelanggan
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Jumlah
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Pembayaran
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#f0f7ff]/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#f8fafc] flex items-center justify-center text-[#64748b] border border-[#e2e8f0]">
                          <Receipt size={20} />
                        </div>
                        <span className="font-mono text-xs font-bold text-[#475569]">
                          {String(tx.id)?.split("-")[0]}...
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden border border-[#e2e8f0]">
                          {tx.deals?.depositor?.avatar_url ? (
                            <img
                              src={tx.deals.depositor.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-slate-400">
                              {(tx.deals?.depositor?.name || "U").charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-black text-[#475569]">
                          {tx.deals?.depositor?.name || "Tidak Diketahui"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-[#0f172a]">
                      {formatIDR(tx.gross_amount)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wide">
                      {tx.payment_type || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tx.transaction_status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
                        <Calendar size={14} />
                        {new Date(tx.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-sm font-semibold text-[#94a3b8]"
                    >
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-bottom border-[#e2e8f0]">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Barang
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Pihak Terlibat
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Rute
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Harga
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="hover:bg-[#f0f7ff]/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden border border-[#e2e8f0] flex items-center justify-center">
                          {deal.post?.item_photo ? (
                            <img
                              src={deal.post.item_photo}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Handshake size={20} className="text-slate-400" />
                          )}
                        </div>
                        <div className="max-w-[180px]">
                          <p className="text-sm font-black text-[#0f172a] truncate">
                            {deal.item_description || "Jasa Titip / Barang"}
                          </p>
                          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                            ID: {String(deal.id)?.split("-")[0]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[#f0f7ff] flex items-center justify-center text-[10px] text-[#4e73df] font-black border border-[#4e73df]/20">
                            {deal.depositor?.avatar_url ? (
                              <img
                                src={deal.depositor.avatar_url}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              "D"
                            )}
                          </div>
                          <span className="text-xs font-black text-[#475569]">
                            {deal.depositor?.name || "Penyewa"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-black border border-slate-200">
                            {deal.carrier?.avatar_url ? (
                              <img
                                src={deal.carrier.avatar_url}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              "C"
                            )}
                          </div>
                          <span className="text-xs font-bold text-[#64748b]">
                            {deal.carrier?.name || "Kurir"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[260px]">
                        <div className="flex items-center gap-2 text-xs font-black text-[#0f172a]">
                          <span
                            className={`${expandedDealRoutes.has(deal.id) ? "" : "max-w-[96px] truncate"}`}
                            title={deal.post?.from_city || ""}
                          >
                            {deal.post?.from_city || "Asal"}
                          </span>
                          <ArrowRight
                            size={12}
                            className="shrink-0 text-[#94a3b8]"
                          />
                          <span
                            className={`${expandedDealRoutes.has(deal.id) ? "" : "max-w-[96px] truncate"}`}
                            title={deal.post?.to_city || ""}
                          >
                            {deal.post?.to_city || "Tujuan"}
                          </span>
                        </div>
                        {isLongDealRoute(deal) && (
                          <button
                            type="button"
                            className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#4e73df] hover:text-[#2447c6]"
                            onClick={() => toggleDealRoute(deal.id)}
                          >
                            {expandedDealRoutes.has(deal.id)
                              ? "Tampilkan ringkas"
                              : "Selengkapnya"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-[#0f172a]">
                      {formatIDR(deal.total_price)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(deal.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
                        <Calendar size={14} />
                        {new Date(deal.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDeals.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-sm font-semibold text-[#94a3b8]"
                    >
                      Tidak ada kesepakatan ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
