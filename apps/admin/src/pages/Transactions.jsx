import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import LoadingLogo from "../components/LoadingLogo";
import {
  Search,
  Filter,
  MoreVertical,
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: txError } = await supabase
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
          .order("created_at", { ascending: false });

        if (txError) {
          console.error("Supabase Error:", txError);
          const { data: simpleData, error: simpleError } = await supabase
            .from("transactions")
            .select("*")
            .order("created_at", { ascending: false });

          if (simpleError) throw simpleError;
          setTransactions(simpleData || []);
          setError(
            "Data terbatas: Gagal memuat detail pengguna (Kesalahan Join)",
          );
        } else {
          setTransactions(data || []);
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
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

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingLogo />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "settlement" || s === "capture" || s === "success") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
          <CheckCircle2 size={12} />
          Berhasil
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
          <Clock size={12} />
          Menunggu
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
        <AlertCircle size={12} />
        Gagal
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a]">
            Riwayat Transaksi
          </h1>
          <p className="text-sm font-semibold text-[#64748b]">
            Pantau pembayaran dan aktivitas keuangan
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
              placeholder="Cari transaksi..."
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
                        {tx.id?.split("-")[0]}...
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-100 overflow-hidden border border-[#e2e8f0]">
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
        </div>
      </div>
    </div>
  );
}
