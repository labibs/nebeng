import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import LoadingLogo from "../components/LoadingLogo";
import {
  Search,
  Filter,
  MoreVertical,
  Calendar,
  ArrowRight,
} from "lucide-react";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRoutes, setExpandedRoutes] = useState(new Set());

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*, users!inner(name, avatar_url)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const formatIDR = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const formatPostType = (type) => {
    if (!type) return "N/A";
    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getPostTypeBadgeClass = (type) => {
    const typeClasses = {
      titip: "bg-blue-50 text-blue-600 border-blue-100",
      bawa: "bg-emerald-50 text-emerald-600 border-emerald-100",
      jual: "bg-orange-50 text-orange-600 border-orange-100",
      nitip_bawakan: "bg-sky-50 text-sky-600 border-sky-100",
      nitip_belikan: "bg-violet-50 text-violet-600 border-violet-100",
      cari_boncengan: "bg-lime-50 text-lime-700 border-lime-100",
      tukang: "bg-amber-50 text-amber-700 border-amber-100",
      perjalanan: "bg-teal-50 text-teal-600 border-teal-100",
      keliling: "bg-yellow-50 text-yellow-700 border-yellow-100",
      content: "bg-rose-50 text-rose-600 border-rose-100",
      warung: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };

    return typeClasses[type] || "bg-slate-50 text-slate-600 border-slate-100";
  };

  const isLongRoute = (post) =>
    `${post.from_city || ""} ${post.to_city || ""}`.length > 32;

  const toggleRoute = (postId) => {
    setExpandedRoutes((current) => {
      const next = new Set(current);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.from_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.to_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingLogo />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a]">
            Manajemen Postingan
          </h1>
          <p className="text-sm font-semibold text-[#64748b]">
            Pantau tawaran perjalanan dan aktivitas kurir
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
              placeholder="Cari kota atau pengguna..."
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
                  Kurir
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Rute
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Tanggal Perjalanan
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Tipe
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Biaya/Harga
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredPosts.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-[#f0f7ff]/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden border border-[#e2e8f0]">
                        {post.users?.avatar_url ? (
                          <img
                            src={post.users.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[#4e73df] font-black">
                            {post.users?.name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-black text-[#0f172a]">
                        {post.users?.name || "Tanpa Nama"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[260px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold text-[#0f172a] ${expandedRoutes.has(post.id) ? "" : "max-w-[96px] truncate"}`}
                          title={post.from_city || ""}
                        >
                          {post.from_city || "Asal"}
                        </span>
                        <ArrowRight
                          size={12}
                          className="shrink-0 text-[#94a3b8]"
                        />
                        <span
                          className={`text-xs font-bold text-[#0f172a] ${expandedRoutes.has(post.id) ? "" : "max-w-[96px] truncate"}`}
                          title={post.to_city || ""}
                        >
                          {post.to_city || "Tujuan"}
                        </span>
                      </div>
                      {isLongRoute(post) && (
                        <button
                          type="button"
                          className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#4e73df] hover:text-[#2447c6]"
                          onClick={() => toggleRoute(post.id)}
                        >
                          {expandedRoutes.has(post.id)
                            ? "Tampilkan ringkas"
                            : "Selengkapnya"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
                      <Calendar size={14} />
                      {post.travel_date
                        ? new Date(post.travel_date).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getPostTypeBadgeClass(post.type)}`}
                    >
                      {formatPostType(post.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-[#0f172a]">
                      {post.type === "titip"
                        ? formatIDR(post.fee)
                        : formatIDR(post.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-[#94a3b8] hover:text-[#0f172a] transition-colors rounded-lg hover:bg-[#f1f5f9]">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-sm font-semibold text-[#94a3b8]"
                  >
                    Tidak ada postingan ditemukan.
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
