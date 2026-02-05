// pages/Cart.jsx atau components/Cart.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { ShoppingCart, CheckSquare, Trash2 } from "lucide-react";
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
          warung:warung_id ( name, address )
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

  // Hitung total
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const totalQuantity = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = selectedItems.reduce(
    (sum, i) => sum + (Number(i.estimated_price || 0) * i.quantity),
    0
  );

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
            {/* Daftar item */}
            <div className="space-y-4 mb-28">
              {items.map((item) => (
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

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900  p-4 shadow-2xl z-10">
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-medium">
                      {selectedIds.size} barang dipilih
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
                      <button
                        onClick={deleteSelected}
                        className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl
                                   flex items-center justify-center gap-2 text-sm font-semibold text-red-600 bg-red-50/40 hover:bg-red-100 active:scale-95 transition-all"
                      >
                        <Trash2 size={16} />
                        <span>Hapus ({selectedIds.size})</span>
                      </button>

                      <button
                        className="flex-1 rounded-xl bg-green-600/70 text-white
                                   py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 active:scale-95 transition-all"
                        onClick={() => alert('Lanjut ke proses deal / checkout')}
                      >
                        <ShoppingCart size={16} />
                        <span>Deal ({selectedIds.size})</span>
                      </button>
                    </>
                  ) : (
                    <button
                      className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl
                                flex items-center justify-center gap-2 text-sm font-semibold
                                text-gray-400 cursor-not-allowed"
                      disabled
                      title="Pilih minimal 1 item untuk mulai deal"
                    >
                      <ShoppingCart size={16} />
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