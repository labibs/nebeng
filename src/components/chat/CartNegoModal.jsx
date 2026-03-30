import { useState, useEffect } from "react";

export default function CartNegoModal({ isOpen, onClose, onSend, data }) {
  const [fee, setFee] = useState("");
  const [deliveryLoc, setDeliveryLoc] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen && data && data.payload) {
      setFee(
        data.payload.proposed_fee
          ? Number(data.payload.proposed_fee).toLocaleString("id-ID")
          : "0",
      );
      setDeliveryLoc(data.payload.delivery_location || "");
      setNotes(data.payload.notes || "");
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!data || !data.payload) return;

    const numericFee = parseInt(fee.replace(/\D/g, "")) || 0;
    const totalItemPrice = data.payload.total_item_price || 0;
    const totalPayment = totalItemPrice + numericFee;
    const warungName = data.warungName || data.payload.warung_name || "Warung";

    const updatedPayload = {
      ...data.payload,
      proposed_fee: numericFee,
      agreed_fee: numericFee,
      delivery_location: deliveryLoc,
      notes: notes,
      total_item_price: totalItemPrice,
      total_payment: totalPayment,
      // Pastikan item_photos tetap array
      item_photos: Array.isArray(data.payload.item_photos)
        ? data.payload.item_photos
        : data.payload.item_photo
          ? [data.payload.item_photo]
          : [],
    };
    // Refresh pickup_datetime if missing or update it
    if (!updatedPayload.pickup_datetime) {
      updatedPayload.pickup_datetime =
        new Date().toISOString().replace("T", " ").split(".")[0] + "+07";
    }

    const payloadStr = JSON.stringify(updatedPayload);
    const textMessage = `[deal_offer]
🏪 Warung: ${warungName}
📦 ${data.itemCount} Barang: ${data.itemName}
📍 Dari: ${data.pickupLoc}
📍 Ke: ${deliveryLoc}
💰 Harga Barang: Rp${totalItemPrice.toLocaleString("id-ID")}
💰 Jastip/Ongkos: Rp${numericFee.toLocaleString("id-ID")}
🔥 Total Pembayaran: Rp${totalPayment.toLocaleString("id-ID")}
📝 Catatan: ${notes || "-"}
<!--PAYLOAD:${payloadStr}-->`;

    if (onSend) {
      onSend(textMessage);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="bg-base-100 rounded-t-3xl shadow-2xl overflow-hidden">
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-base-300 rounded-full" />
          </div>

          <div className="px-6 pt-2 pb-4 text-center">
            <h3 className="text-xl font-bold">Nego Penawaran</h3>
            <p className="text-sm text-base-content/70 mt-1">
              Sesuaikan tujuan, ongkos, atau catatan
            </p>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold">
                  Tujuan Pengantaran
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-base-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                value={deliveryLoc}
                onChange={(e) => setDeliveryLoc(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold">
                  Ongkos / Jastip (Rp)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-[22px] -translate-y-1/2 font-medium text-base-content/60">
                  Rp
                </span>
                <input
                  type="text"
                  className="input input-lg w-full pl-12 pr-4 text-2xl font-bold bg-base-200 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
                  value={fee}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setFee(val ? Number(val).toLocaleString("id-ID") : "");
                  }}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold">
                  Catatan Tambahan
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full bg-base-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              ></textarea>
            </div>
          </div>

          <div className="flex gap-3 px-6 pb-8">
            <button
              className="flex-1 btn btn-ghost btn-lg rounded-2xl"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              className="flex-1 btn btn-warning btn-lg rounded-2xl text-white font-bold shadow-lg"
              onClick={handleSend}
            >
              Kirim Nego
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
