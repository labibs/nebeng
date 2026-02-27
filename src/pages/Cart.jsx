// pages/Cart.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import { ShoppingCart, CheckSquare, Trash2, User, Plus } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import CartHeader from "../components/cart/CartHeader";
import CartItemCard from "../components/cart/CartItemCard";
import { motion } from "framer-motion";

export default function Cart() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/cart');
      setItems(data || []);
    } catch (error) {
      console.error("Error fetch cart:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchCart();

    // Realtime tetap dari Supabase langsung
    const channel = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'warung_cart_items' },
        () => {
          console.log('🔄 Real-time Cart update, refetching...');
          fetchCart();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const groupItems = () => {
    const kurirGroups = {};
    const pembeliGroups = {};
    const milikGroups = {};

    items.forEach((item) => {
      if (!item || !item.warung) return;

      const isMyRequest = item.user_id === user?.id;
      const status = (item.warung?.status || "").toLowerCase();

      let target = null;
      let groupType = "";
      let key = "";
      let partnerName = "";
      let partnerAvatar = null;

      if (status === "kurir") {
        target = kurirGroups;
        groupType = "kurir";
        key = isMyRequest ? `kurir-${item.warung.id}` : `kurir-to-me-${item.user_id}`;
        partnerName = isMyRequest ? item.warung.name : (item.buyer?.name || "Pembeli");
        partnerAvatar = isMyRequest ? item.warung.owner?.avatar_url : (item.buyer?.avatar_url);
      } else if (status === "pembeli") {
        target = pembeliGroups;
        groupType = "pembeli";
        key = isMyRequest ? `pembeli-${item.warung.id}` : `pembeli-to-me-${item.user_id}`;
        partnerName = isMyRequest ? item.warung.name : (item.buyer?.name || "Pembeli");
        partnerAvatar = isMyRequest ? item.warung.owner?.avatar_url : (item.buyer?.avatar_url);
      } else if (status === "milik") {
        target = milikGroups;
        groupType = "milik";
        key = `milik-${item.warung.id}-${item.user_id}`;
        partnerName = item.buyer?.name || "Customer";
        partnerAvatar = item.buyer?.avatar_url;
      }

      if (!target) return;

      if (!target[key]) {
        target[key] = {
          key,
          warungId: item.warung?.id,
          warungName: item.warung?.name,
          warungStatus: status,
          partnerId: isMyRequest ? item.warung?.created_by_clerk_id : item.user_id,
          partnerName,
          partnerAvatar,
          groupType,
          items: [],
        };
      }
      target[key].items.push(item);
    });

    return { kurirGroups, pembeliGroups, milikGroups };
  };

  const {
    kurirGroups,
    pembeliGroups,
    milikGroups
  } = groupItems();

  const toggleSelectGroup = (key, targetGroups) => {
    const group = targetGroups[key];
    if (!group) return;

    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      const groupItemIds = group.items.map(it => it.id);
      const allSelected = groupItemIds.every(id => newSet.has(id));

      if (allSelected) {
        groupItemIds.forEach(id => newSet.delete(id));
      } else {
        groupItemIds.forEach(id => newSet.add(id));
      }

      setSelectAll(items.length > 0 && newSet.size === items.length);
      return newSet;
    });
  };

  const toggleSelect = id => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setSelectAll(items.length > 0 && newSet.size === items.length);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (items.length === 0) return;
    if (selectAll || selectedIds.size === items.length) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(items.map(i => i.id));
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

  const updateQuantity = async (id, newQty) => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item
      )
    );
    try {
      await apiFetch(`/api/cart/${id}/quantity`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQty }),
      });
    } catch (err) {
      console.error("Gagal update quantity:", err.message);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Yakin ingin menghapus item ini?")) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      setSelectAll(items.length > 0 && newSet.size === items.length);
      return newSet;
    });
    try {
      await apiFetch(`/api/cart/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Gagal hapus:", err.message);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Yakin ingin menghapus ${selectedIds.size} item?`)) return;
    const ids = Array.from(selectedIds);
    setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    setSelectAll(false);
    try {
      await apiFetch('/api/cart', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      console.error("Gagal hapus selected:", err.message);
    }
  };

  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const totalQuantity = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = selectedItems.reduce(
    (sum, i) => sum + (Number(i.estimated_price || 0) * i.quantity),
    0
  );

  const selectedPairs = new Set(selectedItems.map((i) => `${i.warung?.id}-${i.user_id}`));
  const multipleOwnersSelected = selectedPairs.size > 1;

  const handleDealSelected = async () => {
    if (selectedItems.length === 0 || multipleOwnersSelected || isProcessing) return;
    setIsProcessing(true);
    const firstItem = selectedItems[0];
    const isBuyer = firstItem.user_id === user?.id;
    const opponentId = isBuyer ? firstItem.warung?.created_by_clerk_id : firstItem.user_id;
    const opponentName = isBuyer ? (firstItem.warung?.owner?.name || "Owner") : (firstItem.buyer?.name || "Pembeli");
    const opponentAvatar = isBuyer ? firstItem.warung?.owner?.avatar_url : firstItem.buyer?.avatar_url;

    if (!opponentId) {
      alert("Gagal mengidentifikasi partner");
      setIsProcessing(false);
      return;
    }

    try {
      const result = await apiFetch('/api/cart/deal', {
        method: 'POST',
        body: JSON.stringify({
          item_ids: Array.from(selectedIds),
          opponent_id: opponentId,
        }),
      });

      navigate(`/chat/${result.conversation_id}`, {
        state: { recipient: { name: opponentName, imageUrl: opponentAvatar }, dealItems: selectedItems }
      });
    } catch (err) {
      console.error("Deal error:", err);
      alert("Gagal memulai deal: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

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
          <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-emerald-600"></span></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-in">
            <div className="w-32 h-32 bg-white/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-8 shadow-xl backdrop-blur-sm relative">
              <ShoppingCart size={64} className="text-emerald-500/40" />
              <div className="absolute -top-1 -right-1 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                <Plus size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-black mb-3 text-slate-800 dark:text-white">Wah, Keranjang Kosong!</h3>
            <p className="text-base opacity-60 text-slate-600 dark:text-slate-300 max-w-xs mx-auto mb-10">Mulai titip kebutuhanmu ke teman perjalanan atau tetangga di Market.</p>
            <button onClick={() => navigate("/market")} className="btn btn-primary btn-lg rounded-2xl px-12 font-bold shadow-xl bg-emerald-600 border-none text-white">Cari Jastiper</button>
          </div>
        ) : (
          <>
            <div className="space-y-10 mb-32">
              {/* 1. Kurir Groups */}
              {Object.keys(kurirGroups).length > 0 && (
                <section>
                  <h2 className="text-xl font-black mb-4 px-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg"><ShoppingCart size={20} /></div>
                      <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Nitip ke Kurir</span>
                    </div>
                    <div className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold border border-blue-200">{Object.keys(kurirGroups).length} tujuan</div>
                  </h2>
                  {Object.values(kurirGroups).map(group => (
                    <div key={group.key} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm mb-5 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                            {group.partnerAvatar ? <img src={group.partnerAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><User size={20} /></div>}
                          </div>
                          <div><p className="font-bold text-sm">{group.partnerName}</p><p className="text-[10px] opacity-60 uppercase tracking-wider">{group.warungName}</p></div>
                        </div>
                        <button onClick={() => toggleSelectGroup(group.key, kurirGroups)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all active:scale-90">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${group.items.every(it => selectedIds.has(it.id)) ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-200' : 'border-gray-300'}`}>
                            {group.items.every(it => selectedIds.has(it.id)) && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {group.items.map(item => <CartItemCard key={item.id} item={item} isSelected={selectedIds.has(item.id)} onToggleSelect={toggleSelect} onUpdateQuantity={updateQuantity} onDelete={deleteItem} />)}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* 2. Pembeli Groups */}
              {Object.keys(pembeliGroups).length > 0 && (
                <section>
                  <h2 className="text-xl font-black mb-4 px-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg"><Plus size={20} /></div>
                      <span className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Permintaan Nitip</span>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-200">{Object.keys(pembeliGroups).length} tujuan</div>
                  </h2>
                  {Object.values(pembeliGroups).map(group => (
                    <div key={group.key} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm mb-5 border-l-4 border-emerald-500">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                            {group.partnerAvatar ? <img src={group.partnerAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><User size={20} /></div>}
                          </div>
                          <div><p className="font-bold text-sm">{group.partnerName}</p><span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Rekomendasi</span></div>
                        </div>
                        <button onClick={() => toggleSelectGroup(group.key, pembeliGroups)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all active:scale-90">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${group.items.every(it => selectedIds.has(it.id)) ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-200' : 'border-gray-300'}`}>
                            {group.items.every(it => selectedIds.has(it.id)) && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {group.items.map(item => <CartItemCard key={item.id} item={item} isSelected={selectedIds.has(item.id)} onToggleSelect={toggleSelect} onUpdateQuantity={updateQuantity} onDelete={deleteItem} />)}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* 3. Milik Groups */}
              {Object.keys(milikGroups).length > 0 && (
                <section>
                  <h2 className="text-xl font-black mb-4 px-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg"><ShoppingCart size={20} /></div>
                      <span className="bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">Order di Warung</span>
                    </div>
                    <div className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-200">{Object.keys(milikGroups).length} pesanan</div>
                  </h2>
                  {Object.values(milikGroups).map(group => (
                    <div key={group.key} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm mb-5 border-l-4 border-amber-500">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                            {group.partnerAvatar ? <img src={group.partnerAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><User size={20} /></div>}
                          </div>
                          <div><p className="font-bold text-sm">{group.partnerName}</p><span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Customer</span></div>
                        </div>
                        <button onClick={() => toggleSelectGroup(group.key, milikGroups)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all active:scale-90">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${group.items.every(it => selectedIds.has(it.id)) ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-200' : 'border-gray-300'}`}>
                            {group.items.every(it => selectedIds.has(it.id)) && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {group.items.map(item => <CartItemCard key={item.id} item={item} isSelected={selectedIds.has(item.id)} onToggleSelect={toggleSelect} onUpdateQuantity={updateQuantity} onDelete={deleteItem} />)}
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10 border-t border-white/20">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4 px-1">
                  <button onClick={toggleSelectAll} className="flex items-center gap-2.5 group active:scale-95 transition-all">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${selectAll ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                      {selectAll && (
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-wider transition-colors ${selectAll ? 'text-emerald-600' : 'text-gray-400'}`}>Pilih Semua</span>
                  </button>
                  {selectedIds.size > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight leading-none">{selectedIds.size} Item Dipilih</p>
                      <p className="text-xl font-black text-emerald-600">Rp {totalPrice.toLocaleString("id-ID")}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {selectedIds.size > 0 && (
                    <button onClick={deleteSelected} className="w-12 h-12 rounded-2xl flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 active:scale-90 transition-all">
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDealSelected()}
                    disabled={selectedIds.size === 0 || multipleOwnersSelected || isProcessing}
                    className={`flex-1 rounded-2xl h-12 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${selectedIds.size === 0 || multipleOwnersSelected || isProcessing ? 'bg-gray-100 text-gray-400 shadow-none' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-200'}`}
                  >
                    {isProcessing ? <span className="loading loading-spinner loading-sm"></span> : (
                      <>
                        <ShoppingCart size={18} />
                        <span>{multipleOwnersSelected ? 'Pilih 1 Outlet' : (selectedIds.size === 0 ? 'Pilih Item' : `Deal Sekarang (${selectedIds.size})`)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}