import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.clerk_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#4e73df]"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a]">
            Manajemen Pengguna
          </h1>
          <p className="text-sm font-semibold text-[#64748b]">
            Kelola dan pantau semua pengguna yang terdaftar
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
              placeholder="Cari pengguna..."
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
                  Pengguna
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Clerk ID
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Tanggal Bergabung
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Peran
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#f0f7ff]/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#f0f7ff] overflow-hidden border border-[#e2e8f0]">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[#4e73df] font-black">
                            {user.name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#0f172a]">
                          {user.name || "Pengguna Tanpa Nama"}
                        </p>
                        <p className="text-xs font-semibold text-[#64748b]">
                          {user.phone || user.email || "Tidak ada kontak"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[11px] bg-[#f1f5f9] px-2 py-1 rounded text-[#475569] border border-[#e2e8f0]">
                      {user.clerk_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
                      <Calendar size={14} />
                      {new Date(user.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        user.role === "admin"
                          ? "bg-purple-50 text-purple-600 border border-purple-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}
                    >
                      {user.role || "Pengguna"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-[#94a3b8] hover:text-[#0f172a] transition-colors rounded-lg hover:bg-[#f1f5f9]">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-sm font-semibold text-[#94a3b8]"
                  >
                    Tidak ada pengguna yang ditemukan sesuai pencarian Anda.
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
