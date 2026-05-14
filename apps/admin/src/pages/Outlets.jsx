import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Search,
  Filter,
  MoreVertical,
  Store,
  Tag,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function Outlets() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchOutlets() {
      try {
        const { data, error } = await supabase
          .from("warungs")
          .select("*, owner:users(name, avatar_url)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOutlets(data || []);
      } catch (err) {
        console.error("Error fetching outlets:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOutlets();
  }, []);

  const filteredOutlets = outlets.filter(
    (outlet) =>
      outlet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outlet.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#4e73df]"></span>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "verified" || s === "active") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
          <CheckCircle2 size={12} />
          Aktif
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
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-100">
        <AlertCircle size={12} />
        {status || "Tidak Diketahui"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a]">Manajemen Toko</h1>
          <p className="text-sm font-semibold text-[#64748b]">
            Pantau dan verifikasi toko yang terdaftar di marketplace
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
              placeholder="Cari toko..."
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

      <div className="bg-white rounded-[28px] border border-[#e2e8f0] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-bottom border-[#e2e8f0]">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Toko
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Pemilik
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Kategori
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredOutlets.map((outlet) => (
                <tr
                  key={outlet.id}
                  className="hover:bg-[#f0f7ff]/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#f0f7ff] flex items-center justify-center text-[#4e73df] border border-[#e2e8f0]">
                        <Store size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#0f172a]">
                          {outlet.name || "Toko Tanpa Nama"}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#64748b]">
                          <MapPin size={12} />
                          <span className="truncate max-w-[200px]">
                            {outlet.address || "Tidak ada alamat"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-100 overflow-hidden border border-[#e2e8f0]">
                        {outlet.owner?.avatar_url ? (
                          <img
                            src={outlet.owner.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-slate-400">
                            {outlet.owner?.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-black text-[#475569]">
                        {outlet.owner?.name || "Tidak Diketahui"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b]">
                      <Tag size={14} className="text-[#4e73df]" />
                      {outlet.category || "Umum"}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(outlet.status)}</td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-[#94a3b8] hover:text-[#0f172a] transition-colors rounded-lg hover:bg-[#f1f5f9]">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOutlets.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-sm font-semibold text-[#94a3b8]"
                  >
                    Tidak ada toko ditemukan.
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
