import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { apiFetch } from "../lib/apiClient";
import LoadingLogo from "../components/LoadingLogo";
import {
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Activity,
  ChevronDown,
  Trash,
} from "lucide-react";

export default function Users() {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const toggleSelectUser = (id) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedUsers(next);
  };

  const handleBulkAction = (action) => {
    alert(`Aksi massal "${action}" untuk ${selectedUsers.size} pengguna`);
    setSelectedUsers(new Set());
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleAction = (type, user) => {
    setActiveMenu(null);
    console.log(`Action ${type} for user:`, user);
    if (type === "delete") {
      if (confirm(`Apakah Anda yakin ingin menghapus ${user.name}?`)) {
        alert("Fitur hapus akan segera hadir");
      }
    } else {
      alert(`Fitur ${type} sedang dalam pengembangan`);
    }
  };

  useEffect(() => {
    if (!user) return;
    async function fetchUsers() {
      try {
        const data = await apiFetch("/admin/users", { clerkId: user.id });
        setUsers(data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [user]);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.clerk_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatRole = (role) => {
    if (!role) return "Pengguna";
    const r = role.toLowerCase();
    if (r === "buyer" || r === "pembeli" || r === "user") return "User";
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
      user: "bg-emerald-50 text-emerald-600 border-emerald-100",
    };

    return (
      roleClasses[role?.toLowerCase()] ||
      "bg-zinc-50 text-zinc-600 border-zinc-100"
    );
  };

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
        <div className="flex items-center gap-4">
          {selectedUsers.size > 0 ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
              <span className="text-sm font-black text-[#4e73df] bg-[#4e73df]/10 px-4 py-2 rounded-xl border border-[#4e73df]/20">
                {selectedUsers.size} Terpilih
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-black hover:bg-rose-100 transition-colors"
                >
                  <Trash size={14} />
                  Hapus
                </button>
                <button
                  onClick={() => handleBulkAction("change_role")}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-black text-[#475569] hover:bg-[#f8fafc] transition-colors"
                >
                  Ubah Peran
                  <ChevronDown size={14} />
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
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#e2e8f0] text-[#4e73df] focus:ring-[#4e73df]/20 cursor-pointer"
                    checked={
                      filteredUsers.length > 0 &&
                      selectedUsers.size === filteredUsers.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
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
                  className={`transition-colors ${selectedUsers.has(user.id) ? "bg-[#f0f7ff]/50" : "hover:bg-[#f0f7ff]/30"}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#e2e8f0] text-[#4e73df] focus:ring-[#4e73df]/20 cursor-pointer"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                    />
                  </td>
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
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getRoleBadgeClass(user.role)}`}
                    >
                      {formatRole(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === user.id ? null : user.id);
                      }}
                      className={`p-2 transition-colors rounded-lg hover:bg-[#f1f5f9] ${activeMenu === user.id ? "text-[#0f172a] bg-[#f1f5f9]" : "text-[#94a3b8]"}`}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeMenu === user.id && (
                      <div className="absolute right-0 top-full mt-2 z-20 w-48 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={() => handleAction("detail", user)}
                          className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#475569] hover:bg-[#f8fafc] hover:text-[#4e73df] transition-colors flex items-center gap-2"
                        >
                          <Eye size={14} />
                          Lihat Detail
                        </button>
                        <button
                          onClick={() => handleAction("activity", user)}
                          className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#475569] hover:bg-[#f8fafc] hover:text-[#4e73df] transition-colors flex items-center gap-2"
                        >
                          <Activity size={14} />
                          Log Aktivitas
                        </button>
                        <button
                          onClick={() => handleAction("edit", user)}
                          className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#475569] hover:bg-[#f8fafc] hover:text-[#4e73df] transition-colors flex items-center gap-2"
                        >
                          <Edit2 size={14} />
                          Edit Profil
                        </button>
                        <div className="h-px bg-[#e2e8f0] my-1 mx-2" />
                        <button
                          onClick={() => handleAction("delete", user)}
                          className="w-full px-4 py-2.5 text-left text-xs font-black text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Hapus Pengguna
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
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
