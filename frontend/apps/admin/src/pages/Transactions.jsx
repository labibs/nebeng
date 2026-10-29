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
  Eye,
  Printer,
  Phone,
  MessageCircle,
} from "lucide-react";

function parseLocationAddress(location) {
  if (!location || typeof location !== "string") return "";
  const parts = location.split(",");
  if (parts.length < 3) return location.trim();
  return parts.slice(2).join(",").trim();
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

function getRouteLabel(location, fallback) {
  return parseLocationAddress(location) || fallback || "-";
}

export default function Transactions() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDealRoutes, setExpandedDealRoutes] = useState(new Set());
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const handleBulkAction = (action) => {
    alert(`Aksi massal "${action}" untuk ${selectedItems.size} ${activeTab}`);
    setSelectedItems(new Set());
  };

  useEffect(() => {
    setSelectedItems(new Set()); // Reset selection when tab changes
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleAction = (type, item) => {
    setActiveMenu(null);
    console.log(`Action ${type} for:`, item);
    alert(`Fitur ${type} sedang disiapkan`);
  };

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

  const currentList =
    activeTab === "transactions" ? filteredTransactions : filteredDeals;

  const toggleSelectAll = () => {
    if (selectedItems.size === currentList.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(currentList.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (id) => {
    const next = new Set(selectedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItems(next);
  };

  const isLongDealRoute = (deal) => {
    const from = getRouteLabel(deal.pickup_location, deal.post?.from_city);
    const to = getRouteLabel(deal.delivery_location, deal.post?.to_city);
    return `${from} ${to}`.length > 32;
  };

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {selectedItems.size > 0 ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
              <span className="text-sm font-black text-[#4e73df] bg-[#4e73df]/10 px-4 py-2 rounded-xl border border-[#4e73df]/20">
                {selectedItems.size} Terpilih
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction("export")}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-black text-[#475569] hover:bg-[#f8fafc] transition-colors"
                >
                  <Printer size={14} />
                  Ekspor PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="h-10" />
          )}
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
                  <th className="w-12 px-6 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#e2e8f0] text-[#4e73df] focus:ring-[#4e73df]/20 cursor-pointer"
                      checked={
                        currentList.length > 0 &&
                        selectedItems.size === currentList.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
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
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`transition-colors ${selectedItems.has(tx.id) ? "bg-[#f0f7ff]/50" : "hover:bg-[#f0f7ff]/30"}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#e2e8f0] text-[#4e73df] focus:ring-[#4e73df]/20 cursor-pointer"
                        checked={selectedItems.has(tx.id)}
                        onChange={() => toggleSelectItem(tx.id)}
                      />
                    </td>
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
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === tx.id ? null : tx.id);
                        }}
                        className={`p-2 transition-colors rounded-lg hover:bg-[#f1f5f9] ${activeMenu === tx.id ? "text-[#0f172a] bg-[#f1f5f9]" : "text-[#94a3b8]"}`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenu === tx.id && (
                        <div className="absolute right-0 top-full mt-2 z-20 w-48 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <button
                            onClick={() => handleAction("detail", tx)}
                            className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#475569] hover:bg-[#f8fafc] hover:text-[#4e73df] transition-colors flex items-center gap-2"
                          >
                            <Eye size={14} />
                            Detail Transaksi
                          </button>
                          <button
                            onClick={() => handleAction("invoice", tx)}
                            className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#475569] hover:bg-[#f8fafc] hover:text-[#4e73df] transition-colors flex items-center gap-2"
                          >
                            <Printer size={14} />
                            Cetak Invoice
                          </button>
                          <div className="h-px bg-[#e2e8f0] my-1 mx-2" />
                          <button
                            onClick={() => handleAction("contact", tx)}
                            className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#475569] hover:bg-[#f8fafc] hover:text-[#4e73df] transition-colors flex items-center gap-2"
                          >
                            <MessageCircle size={14} />
                            Hubungi Pembeli
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
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
                  <th className="w-12 px-6 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#e2e8f0] text-[#4e73df] focus:ring-[#4e73df]/20 cursor-pointer"
                      checked={
                        currentList.length > 0 &&
                        selectedItems.size === currentList.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
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
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className={`transition-colors ${selectedItems.has(deal.id) ? "bg-[#f0f7ff]/50" : "hover:bg-[#f0f7ff]/30"}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#e2e8f0] text-[#4e73df] focus:ring-[#4e73df]/20 cursor-pointer"
                        checked={selectedItems.has(deal.id)}
                        onChange={() => toggleSelectItem(deal.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden border border-[#e2e8f0] flex items-center justify-center">
                          {normalizeItemPhotos(deal.item_photos)[0] ||
                          deal.post?.item_photo ? (
                            <img
                              src={
                                normalizeItemPhotos(deal.item_photos)[0] ||
                                deal.post.item_photo
                              }
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
                    <td className="px-6 py-4 text-center">
                      <div className="flex -space-x-4 items-center justify-center">
                        {/* Depositor Avatar */}
                        <div
                          className="h-9 w-9 rounded-full bg-[#f0f7ff] flex items-center justify-center text-[12px] text-[#4e73df] font-black border-2 border-white shadow-sm overflow-hidden relative cursor-help"
                          title={`Penyewa: ${deal.depositor?.name || "Tidak Diketahui"}`}
                        >
                          {deal.depositor?.avatar_url ? (
                            <img
                              src={deal.depositor.avatar_url}
                              className="h-full w-full object-cover"
                              alt=""
                            />
                          ) : (
                            "D"
                          )}
                        </div>
                        {/* Carrier Avatar */}
                        <div
                          className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-[12px] text-slate-500 font-black border-2 border-white shadow-sm overflow-hidden relative cursor-help"
                          title={`Kurir: ${deal.carrier?.name || "Tidak Diketahui"}`}
                        >
                          {deal.carrier?.avatar_url ? (
                            <img
                              src={deal.carrier.avatar_url}
                              className="h-full w-full object-cover"
                              alt=""
                            />
                          ) : (
                            "C"
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[260px]">
                        <div className="flex items-center gap-2 text-xs font-black text-[#0f172a]">
                          <span
                            className={`${expandedDealRoutes.has(deal.id) ? "" : "max-w-[96px] truncate"}`}
                            title={
                              parseLocationAddress(deal.pickup_location) ||
                              deal.post?.from_city ||
                              ""
                            }
                          >
                            {getRouteLabel(
                              deal.pickup_location,
                              deal.post?.from_city,
                            )}
                          </span>
                          <ArrowRight
                            size={12}
                            className="shrink-0 text-[#94a3b8]"
                          />
                          <span
                            className={`${expandedDealRoutes.has(deal.id) ? "" : "max-w-[96px] truncate"}`}
                            title={
                              parseLocationAddress(deal.delivery_location) ||
                              deal.post?.to_city ||
                              ""
                            }
                          >
                            {getRouteLabel(
                              deal.delivery_location,
                              deal.post?.to_city,
                            )}
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
                      {formatIDR(deal.item_fee || deal.total_price)}
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
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(
                            activeMenu === deal.id ? null : deal.id,
                          );
                        }}
                        className={`p-2 transition-colors rounded-lg hover:bg-[#f1f5f9] ${activeMenu === deal.id ? "text-[#0f172a] bg-[#f1f5f9]" : "text-[#94a3b8]"}`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenu === deal.id && (
                        <div className="absolute right-0 top-full mt-2 z-20 w-48 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <button
                            onClick={() => handleAction("detail", deal)}
                            className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#475569] hover:bg-[#f8fafc] hover:text-[#4e73df] transition-colors flex items-center gap-2"
                          >
                            <Eye size={14} />
                            Detail Deal
                          </button>
                          <button
                            onClick={() =>
                              handleAction("contact_depositor", deal)
                            }
                            className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#475569] hover:bg-[#f8fafc] hover:text-[#4e73df] transition-colors flex items-center gap-2"
                          >
                            <User size={14} />
                            Hubungi Depositor
                          </button>
                          <button
                            onClick={() =>
                              handleAction("contact_carrier", deal)
                            }
                            className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#475569] hover:bg-[#f8fafc] hover:text-[#4e73df] transition-colors flex items-center gap-2"
                          >
                            <Handshake size={14} />
                            Hubungi Carrier
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredDeals.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
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
