import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import LoadingLogo from "../components/LoadingLogo";
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
  ChevronDown,
  ChevronRight,
  Package,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";

export default function Outlets() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    async function fetchOutletsAndProducts() {
      try {
        const { data, error } = await supabase
          .from("warungs")
          .select(
            "*, owner:users(name, avatar_url, role), products:warung_products(*)",
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOutlets(data || []);
      } catch (err) {
        console.error("Error fetching outlets:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOutletsAndProducts();
  }, []);

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatRole = (role) => {
    if (!role) return "Pemilik";
    return role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getRoleBadgeClass = (role) => {
    const roleClasses = {
      admin: "bg-purple-50 text-purple-600 border-purple-100",
      kurir: "bg-sky-50 text-sky-600 border-sky-100",
      carrier: "bg-sky-50 text-sky-600 border-sky-100",
      pemilik: "bg-amber-50 text-amber-700 border-amber-100",
      owner: "bg-amber-50 text-amber-700 border-amber-100",
      pembeli: "bg-emerald-50 text-emerald-600 border-emerald-100",
      buyer: "bg-emerald-50 text-emerald-600 border-emerald-100",
      user: "bg-slate-50 text-slate-600 border-slate-100",
    };

    return roleClasses[role?.toLowerCase()] || "bg-zinc-50 text-zinc-600 border-zinc-100";
  };

  const filteredOutlets = outlets.filter(
    (outlet) =>
      outlet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outlet.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outlet.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
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
    if (s === "kurir" || s === "carrier") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-600 border border-sky-100">
          <Clock size={12} />
          {status}
        </span>
      );
    }
    if (s === "milik" || s === "pemilik" || s === "owner") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
          <CheckCircle2 size={12} />
          {status}
        </span>
      );
    }
    if (s === "pembeli" || s === "buyer") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
          <CheckCircle2 size={12} />
          {status}
        </span>
      );
    }
    if (s === "verified") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-600 border border-sky-100">
          <CheckCircle2 size={12} />
          Verified
        </span>
      );
    }
    if (s === "active") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
          <CheckCircle2 size={12} />
          Active
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
    if (s === "inactive") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-100">
          <AlertCircle size={12} />
          Inactive
        </span>
      );
    }
    if (s === "rejected" || s === "suspended") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
          <AlertCircle size={12} />
          {status}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-50 text-violet-600 border border-violet-100">
        <AlertCircle size={12} />
        {status || "N/A"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a]">
            Manajemen Toko & Produk
          </h1>
          <p className="text-sm font-semibold text-[#64748b]">
            Kelola toko dan inventaris produk mereka dalam satu tempat
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
              placeholder="Cari toko atau pemilik..."
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
                <th className="w-10 px-6 py-4"></th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Toko
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Pemilik
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Produk
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
                <React.Fragment key={outlet.id}>
                  <tr
                    className={`group cursor-pointer transition-colors ${expandedRows.has(outlet.id) ? "bg-[#f0f7ff]/50" : "hover:bg-[#f0f7ff]/30"}`}
                    onClick={() => toggleRow(outlet.id)}
                  >
                    <td className="px-6 py-4">
                      <div
                        className={`p-1.5 rounded-lg transition-all ${expandedRows.has(outlet.id) ? "bg-[#4e73df] text-white" : "bg-slate-100 text-[#94a3b8]"}`}
                      >
                        {expandedRows.has(outlet.id) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </div>
                    </td>
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
                        <div className="h-7 w-7 rounded-full bg-slate-100 overflow-hidden border border-[#e2e8f0]">
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
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${getRoleBadgeClass(outlet.owner?.role || "pemilik")}`}
                        >
                          {formatRole(outlet.owner?.role || "pemilik")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Package size={14} className="text-[#94a3b8]" />
                        <span className="text-sm font-black text-[#0f172a]">
                          {outlet.products?.length || 0}
                        </span>
                        <span className="text-[10px] font-bold text-[#94a3b8] uppercase">
                          Item
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(outlet.status)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="p-2 text-[#94a3b8] hover:text-[#0f172a] transition-colors rounded-lg hover:bg-[#f1f5f9]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Product Content */}
                  {expandedRows.has(outlet.id) && (
                    <tr>
                      <td colSpan="6" className="p-0 bg-[#f8fafc]">
                        <div className="px-20 py-8 border-l-4 border-[#4e73df] animate-slide-down">
                          <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-sm font-black text-[#0f172a] flex items-center gap-2">
                              <Package size={18} className="text-[#4e73df]" />
                              Daftar Produk {outlet.name}
                            </h3>
                            <span className="text-[10px] font-black bg-[#4e73df]/10 text-[#4e73df] px-3 py-1 rounded-full uppercase tracking-widest">
                              {outlet.products?.length || 0} Produk Tersedia
                            </span>
                          </div>

                          {outlet.products && outlet.products.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {outlet.products.map((product) => (
                                <div
                                  key={product.id}
                                  className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-sm flex items-center gap-4 hover:shadow-md transition-all group/item"
                                >
                                  <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden border border-[#f1f5f9] flex items-center justify-center shrink-0">
                                    {product.image_url ? (
                                      <img
                                        src={product.image_url}
                                        className="h-full w-full object-cover group-hover/item:scale-110 transition-transform"
                                        alt=""
                                      />
                                    ) : (
                                      <ImageIcon
                                        size={20}
                                        className="text-slate-300"
                                      />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-[#0f172a] truncate">
                                      {product.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <Tag
                                        size={12}
                                        className="text-[#4e73df]"
                                      />
                                      <span className="text-[10px] font-bold text-[#64748b] truncate uppercase">
                                        {product.category_name || "Umum"}
                                      </span>
                                    </div>
                                    <p className="text-xs font-black text-[#4e73df] mt-1">
                                      {formatIDR(product.estimated_price)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-slate-200">
                              <Package
                                size={32}
                                className="text-slate-200 mb-3"
                              />
                              <p className="text-sm font-bold text-[#94a3b8]">
                                Toko ini belum memiliki produk.
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredOutlets.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
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
