import React from "react";
import { X, Clock } from "lucide-react";

export default function TimeModal({ isOpen, onClose, onSend }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-100" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-100 isolate">
        <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pb-2 flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock size={20} />
              Pilih Waktu Ketemuan
            </h3>
            <button
              onClick={onClose}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <TimeForm onSend={onSend} onClose={onClose} />
        </div>
      </div>
    </>
  );
}

// Form terpisah agar lebih rapi
function TimeForm({ onSend, onClose }) {
  const [selectedDate, setSelectedDate] = React.useState("");
  const [selectedTime, setSelectedTime] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const handleSend = () => {
    if (selectedDate && selectedTime) {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      const formattedDate = dateTime.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = dateTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = `[deal_waktu_ketemuan]\n\n🕐 Waktu ketemuan: ${formattedDate}, ${formattedTime}\n📝 Catatan: ${notes || "Tidak ada catatan"}\n\nKonfirmasi waktu ketemuan ya kak? 🙏`;
      onSend(message);
      onClose();
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Date Input */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-slate-600">
              Tanggal Ketemuan
            </span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={today}
            className="input input-bordered w-full rounded-2xl bg-slate-50"
          />
        </div>

        {/* Time Input */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-slate-600">
              Jam Ketemuan
            </span>
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="input input-bordered w-full rounded-2xl bg-slate-50"
          />
        </div>

        {/* Notes Input */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-slate-600">
              Catatan (Opsional)
            </span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tambahkan catatan jika perlu..."
            className="textarea textarea-bordered w-full resize-none rounded-2xl bg-slate-50"
            rows={3}
          />
        </div>

        {selectedDate && selectedTime && (
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <p className="text-sm text-orange-700 whitespace-pre-wrap">
              🕐 Waktu ketemuan:{" "}
              {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString(
                "id-ID",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
              ,{" "}
              {new Date(`${selectedDate}T${selectedTime}`).toLocaleTimeString(
                "id-ID",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
              {"\n"}
              📝 Catatan: {notes || "Tidak ada catatan"}
              {"\n\n"}
              Konfirmasi waktu ketemuan ya kak? 🙏
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white pb-8">
        <button
          onClick={handleSend}
          disabled={!selectedDate || !selectedTime}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4e73df] text-white py-3 text-[13px] font-semibold hover:bg-[#3d64c7] transition-colors shadow-sm disabled:opacity-50"
        >
          Kirim Waktu
        </button>
      </div>
    </>
  );
}
