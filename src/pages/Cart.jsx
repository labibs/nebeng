// pages/Cart.jsx
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  CheckSquare,
  Trash2,
  User,
  Plus,
  Bike,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/apiClient";
import LoadingLogo from "../components/LoadingLogo";
import CartHeader from "../components/cart/CartHeader";
import CartItemCard from "../components/cart/CartItemCard";

export default function Cart() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch("/api/cart");
      setItems(data || []);
    } catch (error) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchCart();

    const channel = supabase
      .channel("cart-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "warung_cart_items" },
        () => {
          fetchCart();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getShortAddress = (address) => {
    if (!address) return "";
    const short = address
      .split(",")
      .map((p) => p.trim())
      .slice(0, 2)
      .join(", ");
    return short.length > 30 ? short.substring(0, 30) + "..." : short;
  };

  const groupItems = () => {
    const kurirGroups = {};
    const pembeliGroups = {};
    const milikGroups = {};

    items.forEach((item) => {
      if (!item || !item.warung) return;

      const isMyRequest = item.user_id === user?.id;
      const status = (item.warung?.status || "").toLowerCase();

      let target = null;
      let key = "";
      let partnerName = "";
      let partnerAvatar = null;

      if (status === "kurir") {
        target = kurirGroups;
        key = isMyRequest
          ? `kurir-${item.warung.id}`
          : `kurir-to-me-${item.user_id}`;
        partnerName = isMyRequest
          ? item.warung.name
          : item.buyer?.name || "Pembeli";
        partnerAvatar = isMyRequest
          ? item.warung.owner?.avatar_url
          : item.buyer?.avatar_url;
      } else if (status === "pembeli") {
        target = pembeliGroups;
        key = isMyRequest
          ? `pembeli-${item.warung.id}`
          : `pembeli-to-me-${item.user_id}`;
        partnerName = isMyRequest
          ? item.warung.name
          : item.buyer?.name || "Pembeli";
        partnerAvatar = isMyRequest
          ? item.warung.owner?.avatar_url
          : item.buyer?.avatar_url;
      } else if (status === "milik") {
        target = milikGroups;
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
          warungAddress: item.warung?.address,
          warungStatus: status,
          partnerId: isMyRequest
            ? item.warung?.created_by_clerk_id
            : item.user_id,
          partnerName,
          partnerAvatar,
          groupType: status,
          items: [],
        };
      }
      target[key].items.push(item);
    });

    return { kurirGroups, pembeliGroups, milikGroups };
  };

  const { kurirGroups, pembeliGroups, milikGroups } = groupItems();

  const groupedIds = new Set([
    ...Object.values(kurirGroups).flatMap((g) => g.items.map((i) => i.id)),
    ...Object.values(pembeliGroups).flatMap((g) => g.items.map((i) => i.id)),
    ...Object.values(milikGroups).flatMap((g) => g.items.map((i) => i.id)),
  ]);

  const ungroupedItems = items.filter((item) => !groupedIds.has(item.id));
  const hasVisibleSections =
    Object.keys(kurirGroups).length > 0 ||
    Object.keys(pembeliGroups).length > 0 ||
    Object.keys(milikGroups).length > 0 ||
    ungroupedItems.length > 0;

  const toggleSelectGroup = (key, targetGroups) => {
    const group = targetGroups[key];
    if (!group) return;
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      const groupItemIds = group.items.map((it) => it.id);
      const allSelected = groupItemIds.every((id) => newSet.has(id));
      if (allSelected) groupItemIds.forEach((id) => newSet.delete(id));
      else groupItemIds.forEach((id) => newSet.add(id));
      setSelectAll(items.length > 0 && newSet.size === items.length);
      return newSet;
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
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
      setSelectedIds(new Set(items.map((i) => i.id)));
      setSelectAll(true);
    }
  };

  const updateQuantity = async (id, newQty) => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item,
      ),
    );
    try {
      await apiFetch(`/api/cart/${id}/quantity`, {
        method: "PATCH",
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
      await apiFetch(`/api/cart/${id}`, { method: "DELETE" });
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
      await apiFetch("/api/cart", {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      console.error("Gagal hapus selected:", err.message);
    }
  };

  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const totalPrice = selectedItems.reduce(
    (sum, i) => sum + Number(i.estimated_price || 0) * i.quantity,
    0,
  );
  const selectedPairs = new Set(
    selectedItems.map((i) => `${i.warung?.id}-${i.user_id}`),
  );
  const multipleOwnersSelected = selectedPairs.size > 1;

  const handleDealSelected = async () => {
    if (selectedItems.length === 0 || multipleOwnersSelected || isProcessing)
      return;
    setIsProcessing(true);
    const firstItem = selectedItems[0];
    const isBuyer = firstItem.user_id === user?.id;
    const opponentId = isBuyer
      ? firstItem.warung?.created_by_clerk_id
      : firstItem.user_id;
    const opponentName = isBuyer
      ? firstItem.warung?.owner?.name || "Owner"
      : firstItem.buyer?.name || "Pembeli";
    const opponentAvatar = isBuyer
      ? firstItem.warung?.owner?.avatar_url
      : firstItem.buyer?.avatar_url;

    if (!opponentId) {
      alert("Gagal mengidentifikasi partner");
      setIsProcessing(false);
      return;
    }

    try {
      navigate("/checkout", {
        state: {
          selectedIds: Array.from(selectedIds),
          items: selectedItems,
          opponent: {
            id: opponentId,
            name: opponentName,
            imageUrl: opponentAvatar,
          },
        },
      });
    } catch (err) {
      console.error("Deal error:", err);
      alert("Gagal melanjutkan deal: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter by search
  const filteredGroups = (groups) => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return Object.fromEntries(
      Object.entries(groups).filter(
        ([_, g]) =>
          g.partnerName?.toLowerCase().includes(q) ||
          g.warungName?.toLowerCase().includes(q) ||
          g.warungAddress?.toLowerCase().includes(q) ||
          g.items.some((i) => i.product_name?.toLowerCase().includes(q)),
      ),
    );
  };

  const filteredKurir = filteredGroups(kurirGroups);
  const filteredPembeli = filteredGroups(pembeliGroups);
  const filteredMilik = filteredGroups(milikGroups);

  if (!user) return null;

  if (loading) {
    return (
      <motion.div
        className="min-h-screen bg-[#f0f7ff] pb-24"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "-100%", opacity: 0 }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
      >
        <CartHeader />
        <div className="px-4 pb-8 space-y-4 pt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex h-[120px] items-stretch overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 animate-pulse"
            >
              <div className="w-20 h-20 shrink-0 rounded-xl bg-[#e4edff]" />
              <div className="flex-1 ml-3 space-y-2.5">
                <div className="h-3.5 w-3/4 rounded-full bg-[#edf3ff]" />
                <div className="h-2.5 w-1/2 rounded-full bg-[#e4edff]" />
                <div className="h-2.5 w-1/3 rounded-full bg-[#edf3ff]" />
                <div className="mt-3 flex justify-between items-end">
                  <div className="h-4 w-20 rounded-full bg-[#e4edff]" />
                  <div className="h-8 w-24 rounded-full bg-[#edf3ff]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-[#f0f7ff] pb-24"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
    >
      <CartHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="px-4 pb-8 space-y-6">
        {items.length === 0 || !hasVisibleSections ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm relative">
              <ShoppingCart size={64} className="text-[#4e73df]/40" />
              <div className="absolute -top-1 -right-1 w-10 h-10 bg-[#4e73df] rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                <Plus size={24} />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-700">
              Wah, Keranjang Kosong!
            </h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mb-8">
              Mulai titip kebutuhanmu ke teman perjalanan atau tetangga di
              Market.
            </p>
            <button
              onClick={() => navigate("/market")}
              className="w-full max-w-xs h-12 rounded-2xl bg-[#4e73df] text-white text-sm font-semibold hover:bg-[#3d64c7] transition-colors shadow-sm"
            >
              Cari Jastiper
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Select All + Delete */}
            {items.length > 0 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2.5"
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectAll ? "bg-[#4e73df] border-[#4e73df]" : "border-slate-300"}`}
                  >
                    {selectAll && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={4}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-600">
                    Pilih Semua
                  </span>
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Trash2 size={14} />
                    Hapus ({selectedIds.size})
                  </button>
                )}
              </div>
            )}

            {/* Kurir Groups */}
            {Object.keys(filteredKurir).length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                    <Bike size={16} />
                  </div>
                  Nitip ke Kurir
                  <span className="text-xs font-medium text-slate-400">
                    ({Object.keys(filteredKurir).length})
                  </span>
                </h2>
                {Object.values(filteredKurir).map((group) => (
                  <div
                    key={group.key}
                    className="bg-white rounded-2xl border border-slate-100 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100">
                          {group.partnerAvatar ? (
                            <img
                              src={group.partnerAvatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={16} className="text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {group.partnerName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {getShortAddress(group.warungAddress)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          toggleSelectGroup(group.key, kurirGroups)
                        }
                        className="w-7 h-7 flex items-center justify-center"
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${group.items.every((it) => selectedIds.has(it.id)) ? "bg-[#4e73df] border-[#4e73df]" : "border-slate-300"}`}
                        >
                          {group.items.every((it) =>
                            selectedIds.has(it.id),
                          ) && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={4}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                    <div className="space-y-2">
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
              </section>
            )}

            {/* Pembeli Groups */}
            {Object.keys(filteredPembeli).length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#e4edff] flex items-center justify-center text-[#4e73df]">
                    <Plus size={16} />
                  </div>
                  Permintaan Nitip
                  <span className="text-xs font-medium text-slate-400">
                    ({Object.keys(filteredPembeli).length})
                  </span>
                </h2>
                {Object.values(filteredPembeli).map((group) => (
                  <div
                    key={group.key}
                    className="bg-white rounded-2xl border border-slate-100 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100">
                          {group.partnerAvatar ? (
                            <img
                              src={group.partnerAvatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={16} className="text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {group.partnerName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {getShortAddress(group.warungAddress)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          toggleSelectGroup(group.key, pembeliGroups)
                        }
                        className="w-7 h-7 flex items-center justify-center"
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${group.items.every((it) => selectedIds.has(it.id)) ? "bg-[#4e73df] border-[#4e73df]" : "border-slate-300"}`}
                        >
                          {group.items.every((it) =>
                            selectedIds.has(it.id),
                          ) && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={4}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                    <div className="space-y-2">
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
              </section>
            )}

            {/* Milik Groups */}
            {Object.keys(filteredMilik).length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <ShoppingCart size={16} />
                  </div>
                  Order di Warung
                  <span className="text-xs font-medium text-slate-400">
                    ({Object.keys(filteredMilik).length})
                  </span>
                </h2>
                {Object.values(filteredMilik).map((group) => (
                  <div
                    key={group.key}
                    className="bg-white rounded-2xl border border-slate-100 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100">
                          {group.partnerAvatar ? (
                            <img
                              src={group.partnerAvatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={16} className="text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {group.partnerName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {getShortAddress(group.warungAddress)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          toggleSelectGroup(group.key, milikGroups)
                        }
                        className="w-7 h-7 flex items-center justify-center"
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${group.items.every((it) => selectedIds.has(it.id)) ? "bg-[#4e73df] border-[#4e73df]" : "border-slate-300"}`}
                        >
                          {group.items.every((it) =>
                            selectedIds.has(it.id),
                          ) && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={4}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                    <div className="space-y-2">
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
              </section>
            )}

            {/* Ungrouped */}
            {ungroupedItems.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <ShoppingCart size={16} />
                  </div>
                  Lainnya
                  <span className="text-xs font-medium text-slate-400">
                    ({ungroupedItems.length})
                  </span>
                </h2>
                <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
                  {ungroupedItems.map((item) => (
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
              </section>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400">
                  {selectedItems.length} item dipilih
                </p>
                <p className="text-lg font-bold text-slate-900">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={handleDealSelected}
                disabled={multipleOwnersSelected || isProcessing}
                className="h-12 px-6 rounded-2xl bg-[#4e73df] text-white text-sm font-semibold hover:bg-[#3d64c7] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : multipleOwnersSelected ? (
                  "Pilih 1 Toko"
                ) : (
                  <>
                    Ajukan Deal <CheckSquare size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
