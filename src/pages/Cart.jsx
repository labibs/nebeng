// pages/Cart.jsx atau components/Cart.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { ShoppingCart, CheckSquare, Trash2, User } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import CartHeader from "../components/cart/CartHeader";
import CartItemCard from "../components/cart/CartItemCard"; // ← import baru
import { motion } from "framer-motion";

export default function Cart() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectAllKurir, setSelectAllKurir] = useState(false);
  const [selectAllNonKurir, setSelectAllNonKurir] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    async function fetchCart() {
      const { data, error } = await supabase
        .from("warung_cart_items")
        .select(`
          id,
          quantity,
          requested_price,
          estimated_price,
          notes,
          status,
          product:product_id ( name, image_url, estimated_price ),
          warung:warung_id ( name, address, category, status, created_by_clerk_id, owner:users!warungs_created_by_clerk_id_fkey ( avatar_url, name ) )
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetch cart:", error);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    }

    fetchCart();
  }, [user, navigate]);

  const kurirGroups = {};
  const nonKurirGroups = {};

  items.forEach((item) => {
    const ownerId = item.warung?.created_by_clerk_id || "unknown";
    const isKurir = (item.warung?.status || "").toLowerCase() === "kurir";

    const target = isKurir ? kurirGroups : nonKurirGroups;

    if (!target[ownerId]) {
      target[ownerId] = {
        ownerId,
        ownerName: item.warung?.owner?.name || item.warung?.name || "Outlet",
        ownerAvatar: item.warung?.owner?.avatar_url || null,
        warungStatus: item.warung?.status || "unknown",
        items: []
      };
    }
    target[ownerId].items.push(item);
  });

  // Handler toggle select satu item
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }

      // update selectAll flag
      setSelectAll(items.length > 0 && newSet.size === items.length);
      return newSet;
    });
  };

  // Toggle pilih semua
  const toggleSelectAll = () => {
    if (items.length === 0) return;

    if (selectAll || selectedIds.size === items.length) {
      // clear
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(items.map((i) => i.id));
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

  // Toggle select per group (owner)
  const toggleSelectAllKurir = () => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      const kurirItems = items.filter(
        (it) => (it.warung?.status || "").toLowerCase() === "kurir"
      );

      if (selectAllKurir) {
        // deselect semua kurir
        kurirItems.forEach((it) => newSet.delete(it.id));
      } else {
        // select semua kurir
        kurirItems.forEach((it) => newSet.add(it.id));
      }

      setSelectAllKurir(!selectAllKurir);
      // Optional: sync selectAllNonKurir kalau perlu, tapi biasanya tidak
      return newSet;
    });
  };

  const toggleSelectAllNonKurir = () => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      const nonKurirItems = items.filter(
        (it) => (it.warung?.status || "").toLowerCase() !== "kurir"
      );

      if (selectAllNonKurir) {
        nonKurirItems.forEach((it) => newSet.delete(it.id));
      } else {
        nonKurirItems.forEach((it) => newSet.add(it.id));
      }

      setSelectAllNonKurir(!selectAllNonKurir);
      return newSet;
    });
  };

  // Update quantity (bisa langsung update ke supabase juga)
  const updateQuantity = async (id, newQty) => {
    if (newQty < 1) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item
      )
    );

    // Update ke database
    const { error } = await supabase
      .from("warung_cart_items")
      .update({ quantity: newQty })
      .eq("id", id);

    if (error) {
      console.error("Gagal update quantity:", error);
      // rollback jika perlu
    }
  };

  // Hapus item
  const deleteItem = async (id) => {
    if (!confirm("Yakin ingin menghapus item ini?")) return;

    // Optimistic
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      setSelectAll(items.length > 0 && newSet.size === items.length);
      return newSet;
    });

    const { error } = await supabase
      .from("warung_cart_items")
      .delete()
      .eq("id", id);

    if (error) console.error("Gagal hapus:", error);
  };

  // Hapus selected
  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Yakin ingin menghapus ${selectedIds.size} item yang dipilih?`)) return;

    const ids = Array.from(selectedIds);

    // Optimistic
    setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    setSelectAll(false);

    const { error } = await supabase
      .from("warung_cart_items")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("Gagal hapus selected:", error);
      // Optionally refetch or show error
    }
  };

  // Handle deal (create deal for selected items). Disallow if multiple owners selected.
  const handleDealSelected = () => {
    if (selectedIds.size === 0) return;
    if (multipleOwnersSelected) {
      alert("Pilih hanya item dari 1 outlet untuk membuat 1 deal");
      return;
    }

    // Proceed to checkout / deal flow for selectedItems
    // For now show placeholder — replace with actual navigation / deal creation
    // navigate('/checkout', { state: { selectedItems } });
    alert(`Lanjut ke proses deal untuk ${selectedItems.length} item (outlet: ${Array.from(selectedOwners)[0]})`);
  };

  // Hitung total
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const totalQuantity = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = selectedItems.reduce(
    (sum, i) => sum + (Number(i.estimated_price || 0) * i.quantity),
    0
  );

  // Cek owner unik dari selected items -> kalau >1, disable Deal
  const selectedOwners = new Set(selectedItems.map((i) => i.warung?.created_by_clerk_id || "unknown"));
  const multipleOwnersSelected = selectedOwners.size > 1;

  if (!user) return null;

  return (
    <motion.div
      className="min-h-screen bg-base-100 pb-24"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
    >
      <CartHeader />

      <div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200 dark:from-slate-900 dark:to-slate-800 p-4">
        {loading ? (
          <p className="text-center py-10">Memuat keranjang...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-600 dark:text-gray-400">
            <ShoppingCart size={80} className="mx-auto mb-6 opacity-40" />
            <p className="text-lg">Belum ada barang yang kamu nitipkan</p>
          </div>
        ) : (
          <>
          
<div className="space-y-10 mb-32">

  {/* Bagian Kurir */}
  {Object.keys(kurirGroups).length > 0 && (
    <div>
      <h2 className="text-xl font-bold mb-4 px-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
        <span className="text-2xl">🚚</span> Nitip ke Kurir
      </h2>
      {Object.values(kurirGroups).map(group => (
        // render card group sama seperti di atas, tapi pakai styling kurir
        
          <div key={group.ownerId} className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                        {group.ownerAvatar ? (
                          <img src={group.ownerAvatar} alt={group.ownerName} className="w-full h-full object-cover" />
                        ) : (
                          <User size={28} className="text-indigo-300 dark:text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{group.ownerName}</p>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          {/* <span className="text-gray-500 dark:text-gray-400">Kurir / Toko</span> */}
                          {/* Badge status */}
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-medium
                            ${group.warungStatus === 'kurir' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200'
                              : group.warungStatus === 'aktif' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }
                          `}>
                            {group.warungStatus === 'kurir' ? 'Kurir' : 
                            group.warungStatus || 'Status tidak diketahui'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tombol select group */}
                    <button
                      onClick={() => toggleSelectAllKurir(group.ownerId)}
                      className="w-10 h-10 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
                      title="Pilih semua di outlet ini"
                    >
                      {group.items.every((it) => selectedIds.has(it.id)) ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-gray-400">○</span>
                      )}
                    </button>
                  </div>

                  <hr className="my-2 opacity-10" />
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={toggleSelect}
                        onUpdateQuantity={updateQuantity}
                        onDelete={deleteItem}
                      />
                    ))}
                  </div>
                </div>
       
      ))}
    </div>
  )}

  {/* Bagian Non-Kurir */}
  {Object.keys(nonKurirGroups).length > 0 && (
    <div>
      <h2 className="text-xl font-bold mb-4 px-2 flex items-center gap-2">
        <span className="text-2xl">🛒</span> Nitip Beliin
      </h2>
      {Object.values(nonKurirGroups).map(group => (
        // render card group dengan styling normal
        
          <div key={group.ownerId} className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                        {group.ownerAvatar ? (
                          <img src={group.ownerAvatar} alt={group.ownerName} className="w-full h-full object-cover" />
                        ) : (
                          <User size={28} className="text-indigo-300 dark:text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{group.ownerName}</p>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          {/* <span className="text-gray-500 dark:text-gray-400">Kurir / Toko</span> */}
                          {/* Badge status */}
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-medium
                            ${group.warungStatus === 'kurir' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200'
                              : group.warungStatus === 'aktif' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }
                          `}>
                            {group.warungStatus === 'kurir' ? 'Mode Kurir' : 
                            group.warungStatus || 'Status tidak diketahui'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tombol select group */}
                    <button
                      onClick={() => toggleSelectAllNonKurir(group.ownerId)}
                      className="w-10 h-10 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
                      title="Pilih semua di outlet ini"
                    >
                      {group.items.every((it) => selectedIds.has(it.id)) ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-gray-400">○</span>
                      )}
                    </button>
                  </div>

                  <hr className="my-2 opacity-10" />
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={toggleSelect}
                        onUpdateQuantity={updateQuantity}
                        onDelete={deleteItem}
                      />
                    ))}
                  </div>
                </div>
        
      ))}
    </div>
  )}

  {Object.keys(kurirGroups).length === 0 && Object.keys(nonKurirGroups).length === 0 && (
    <p className="text-center py-10 text-gray-500">Belum ada barang di keranjang</p>
  )}
</div>
            
            {/* Daftar item (grouped by warung owner) */}
            <div className="space-y-6 mb-28">
              
            </div>

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900  p-4 shadow-2xl z-10">
              <div className="max-w-3xl mx-auto">
                {selectedIds.size > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="font-medium">
                          {selectedIds.size} item dipilih
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total {totalQuantity} pcs
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">
                          Rp {totalPrice.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <hr className="my-2 opacity-10" />
                  </div>
                )}

                
                <div className="flex gap-3">
                  {/* Pilih Semua (kecil) */}
                  <button
                    onClick={toggleSelectAll}
                    className={`w-12 h-12 border border-gray-200 dark:border-slate-700 rounded-xl
                               flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 transition-all`}
                    title="Pilih Semua"
                  >
                    <CheckSquare size={20} className={`${selectAll ? 'text-emerald-600' : ''}`} />
                  </button>

                  {/* Jika ada yang di select, tampilkan Hapus + Deal, else tampilkan Deal disabled */}
                  {selectedIds.size > 0 ? (
                    <>
                      <div className="flex-1">
                        {multipleOwnersSelected && (
                          <p className="text-sm text-yellow-600 mb-2">⚠️ Pilih hanya item dari 1 outlet untuk membuat 1 deal</p>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={deleteSelected}
                            className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl
                                       flex items-center justify-center gap-2 text-sm font-semibold text-red-600 bg-red-50/40 hover:bg-red-100 active:scale-95 transition-all"
                          >
                            <Trash2 size={16} />
                            <span>Hapus ({selectedIds.size})</span>
                          </button>

                          <button
                            className={`flex-1 rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all ${multipleOwnersSelected ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600/70 text-white shadow-indigo-200'}`}
                            onClick={() => handleDealSelected()}
                            disabled={multipleOwnersSelected}
                            title={multipleOwnersSelected ? 'Tidak bisa deal item dari outlet berbeda' : 'Lanjut ke proses deal / checkout'}
                          >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>{multipleOwnersSelected ? 'Deal (berbeda outlet)' : `Deal (${selectedIds.size})`}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <button
                      className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl
                                flex items-center justify-center gap-2 text-sm font-semibold
                                text-gray-400 cursor-not-allowed"
                      disabled
                      title="Pilih minimal 1 item untuk mulai deal"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Deal</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}