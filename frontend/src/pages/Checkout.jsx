import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  ClipboardList,
  Info,
  Truck,
  Wallet,
} from "lucide-react";
import { apiFetch } from "../lib/apiClient";
import LocationPicker from "../components/create/LocationPicker";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedIds, items, opponent } = location.state || {};

  const [pickupLocation, setPickupLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null); // Changed to object to hold LocationPicker data
  const [notes, setNotes] = useState("");
  const [proposedFee, setProposedFee] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!selectedIds || !items || !opponent || items.length === 0) {
      navigate("/cart");
      return;
    }

    // Auto-fill pickup location from warung data
    const warung = items[0]?.warung;
    if (warung) {
      if (warung.latitude && warung.longitude) {
        setPickupLocation({
          lat: warung.latitude,
          lng: warung.longitude,
          address: warung.address || "",
          name: warung.name || "",
        });
      } else if (warung.name || warung.address) {
        setPickupLocation({
          lat: 0,
          lng: 0,
          address: warung.address || "",
          name: warung.name || warung.address,
        });
      }
    }

    // Fetch current location for default delivery
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            );
            const data = await res.json();
            setDeliveryLocation({
              lat: latitude,
              lng: longitude,
              address: data.display_name,
              name: data.name || data.display_name,
            });
          } catch (err) {
            console.error("Error reverse geocoding delivery location:", err);
          }
        },
        (error) => {
          console.error("Error getting geolocation:", error);
        },
      );
    }
  }, [selectedIds, items, opponent, navigate]);

  if (!selectedIds || !items || !opponent) return null;

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + Number(i.estimated_price || 0) * i.quantity,
    0,
  );

  // Helper untuk mengambil alamat pendek (misal: "Jl. Merdeka, Menteng")
  const getShortAddress = (address) => {
    if (!address) return "";
    const parts = address.split(",").map((p) => p.trim());
    // Ambil maksimal 2 bagian pertama agar ringkas
    return parts.slice(0, 2).join(", ");
  };

  const handleConfirmDeal = async () => {
    if (!pickupLocation || !deliveryLocation) {
      alert("Lokasi pickup dan delivery harus diisi");
      return;
    }

    setIsProcessing(true);
    try {
      // Prioritaskan alamat pendek untuk tampilan label, tapi tetap simpan lat,lng
      const pickupLabel =
        getShortAddress(pickupLocation.address) ||
        pickupLocation.name ||
        "Peta Location";
      const deliveryLabel =
        getShortAddress(deliveryLocation.address) ||
        deliveryLocation.name ||
        "Peta Location";

      const pickupLocStr = `${pickupLocation.lat},${pickupLocation.lng}, ${pickupLabel}`;
      const deliveryLocStr = `${deliveryLocation.lat},${deliveryLocation.lng}, ${deliveryLabel}`;

      // Bikin chat dulu dengan opponent kalau belum ada
      const result = await apiFetch("/conversations", {
        method: "POST",
        body: JSON.stringify({ opponent_id: opponent.clerk_id || opponent.id }),
      });

      // Redirect ke chat dengan state membawa data offer
      navigate(`/chat/${result.conversation_id}`, {
        state: {
          pendingDealOffer: {
            item_ids: Array.from(selectedIds),
            opponent_id: opponent.id,
            pickupLocStr,
            deliveryLocStr,
            notes,
            proposedFee: Number(proposedFee) || 0,
            items, // for UI display in chat
          },
        },
        replace: true,
      });
    } catch (err) {
      console.error("Deal error:", err);
      alert("Gagal memulai deal: " + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-base-200 pb-24"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 navbar bg-base-100/90 backdrop-blur-xl border-b border-base-300/40">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-circle"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="font-bold text-lg">Ajukan Deal</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {/* Info Partner */}
        <div className="bg-base-100 rounded-2xl p-4 shadow-sm border border-base-300">
          <h2 className="font-bold text-sm text-base-content/60 mb-3 uppercase tracking-wider">
            Partner Deal
          </h2>
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-12 h-12 rounded-full border border-base-300">
                <img
                  src={opponent.imageUrl || "/avatar-placeholder.png"}
                  alt={opponent.name}
                />
              </div>
            </div>
            <div>
              <p className="font-bold text-base">{opponent.name}</p>
              <p className="text-sm opacity-70">Akan membuat obrolan baru</p>
            </div>
          </div>
        </div>

        {/* Ringkasan Item */}
        <div className="bg-base-100 rounded-2xl p-4 shadow-sm border border-base-300">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="text-[#4e73df] w-5 h-5" />
            <h2 className="font-bold text-base">Ringkasan Pesanan</h2>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 items-start border-b border-base-200 pb-3 last:border-0 last:pb-0"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-base-200 flex-shrink-0">
                  <img
                    src={
                      item.product?.image_url ||
                      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80"
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-2">
                    {item.product?.name || item.notes || "Item"}
                  </p>
                  <p className="text-xs opacity-70 mt-0.5">
                    {item.quantity} x Rp{" "}
                    {(item.estimated_price || 0).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm">
                    Rp{" "}
                    {(
                      item.quantity * Number(item.estimated_price || 0)
                    ).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-base-200">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm text-base-content/70">
                Subtotal ({totalQuantity} barang)
              </p>
              <p className="font-semibold">
                Rp {totalPrice.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-base-content/70">
                Penawaran Ongkos/Jastip
              </p>
              <p className="font-semibold">
                Rp {(Number(proposedFee) || 0).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex justify-between items-center border-t border-base-200 pt-2 mt-2">
              <p className="font-bold text-base-content/70">Total Penawaran</p>
              <p className="font-black text-lg text-[#4e73df]">
                Rp{" "}
                {(totalPrice + (Number(proposedFee) || 0)).toLocaleString(
                  "id-ID",
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Form Pengiriman */}
        <div className="bg-base-100 rounded-2xl p-4 shadow-sm border border-base-300 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="text-[#4e73df] w-5 h-5" />
            <h2 className="font-bold text-base">
              Detail Pengiriman & Penawaran
            </h2>
          </div>

          <div className="form-control w-full space-y-2">
            <label className="label py-1">
              <span className="label-text font-semibold flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#4e73df]" /> Lokasi Pickup/Beli
                (Warung/Lokasi)
              </span>
            </label>
            <LocationPicker
              label="Pilih Lokasi Pickup"
              value={pickupLocation}
              onSelect={setPickupLocation}
            />
          </div>

          <div className="form-control w-full space-y-2">
            <label className="label py-1">
              <span className="label-text font-semibold flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#4e73df]" /> Tujuan Pengantaran
              </span>
            </label>
            <LocationPicker
              label="Pilih Tujuan Pengantaran"
              value={deliveryLocation}
              onSelect={setDeliveryLocation}
            />
          </div>

          <div className="form-control w-full space-y-2">
            <label className="label py-1">
              <span className="label-text font-semibold flex items-center gap-1">
                <Wallet className="w-4 h-4 text-[#4e73df]" /> Penawaran
                Ongkos/Jastip
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-base-content/60">
                Rp
              </span>
              <input
                type="number"
                placeholder="0"
                className="w-full py-3 pl-12 pr-4 rounded-2xl border bg-white/70 dark:bg-white/5 font-medium text-sm focus:outline-none focus:border-[#4e73df]"
                value={proposedFee}
                onChange={(e) => setProposedFee(e.target.value)}
              />
            </div>
            <p className="text-xs opacity-60 px-1 mt-1">
              Estimasi tambahan biaya untuk kurir
            </p>
          </div>

          <div className="form-control w-full space-y-2">
            <label className="label py-1">
              <span className="label-text font-semibold flex items-center gap-1">
                <Info className="w-4 h-4 text-blue-500" /> Catatan Tambahan
                (Opsional)
              </span>
            </label>
            <textarea
              className="w-full p-4 rounded-2xl border bg-white/70 dark:bg-white/5 text-sm active:outline-none focus:outline-none"
              placeholder="Contoh: Tolong belikan yang rasa cokelat ya kalau ada"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            ></textarea>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-200 p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex justify-between items-end px-1">
            <div>
              <p className="text-xs font-medium text-base-content/70 mb-1">
                Total Pembayaran
              </p>
              <p className="font-black text-xl text-[#4e73df] leading-none">
                Rp{" "}
                {(totalPrice + (Number(proposedFee) || 0)).toLocaleString(
                  "id-ID",
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium text-base-content/50">
                Termasuk Jastip <br />
                Rp {(Number(proposedFee) || 0).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
          <button
            onClick={handleConfirmDeal}
            disabled={isProcessing || !pickupLocation || !deliveryLocation}
            className="btn w-full rounded-2xl h-14 font-black shadow-lg shadow-blue-200/50 bg-[#4e73df] border-none text-white disabled:bg-base-300 disabled:text-base-content/40 hover:bg-[#3b59bd] active:scale-[0.98] transition-all"
          >
            {isProcessing ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Ajukan Deal"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
