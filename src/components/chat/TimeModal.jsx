import React from 'react';

export default function TimeModal({ isOpen, onClose, onSend }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-100" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-100 isolate">
        <div className="bg-base-100 rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-base-300 rounded-full" />
          </div>

          <div className="px-6 pt-2 pb-4 text-center">
            <h3 className="text-xl font-bold">Pilih Waktu Ketemuan</h3>
            <p className="text-sm text-base-content/70 mt-1">Tentukan kapan serah terima</p>
          </div>

          <TimeForm onSend={onSend} onClose={onClose} />
        </div>
      </div>
    </>
  );
}

// Form terpisah agar lebih rapi
function TimeForm({ onSend, onClose }) {
  const [selectedDate, setSelectedDate] = React.useState('');
  const [selectedTime, setSelectedTime] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const handleSend = () => {
    if (selectedDate && selectedTime) {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      const formattedDate = dateTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = dateTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const message = `[deal_waktu_ketemuan]\n\n🕐 Waktu ketemuan: ${formattedDate}, ${formattedTime}\n📝 Catatan: ${notes || 'Tidak ada catatan'}\n\nKonfirmasi waktu ketemuan ya kak? 🙏`;
      onSend(message);
      onClose();
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <div className="px-6 pb-6">
        <div className="space-y-4">
          {/* Date Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Tanggal Ketemuan</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="input input-bordered w-full"
            />
          </div>

          {/* Time Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Jam Ketemuan</span>
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          {/* Notes Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Catatan (Opsional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika perlu..."
              className="textarea textarea-bordered w-full resize-none"
              rows={3}
            />
          </div>
        </div>

        {selectedDate && selectedTime && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-2xl border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-base-content/80 whitespace-pre-wrap">
              🕐 Waktu ketemuan: {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}, {new Date(`${selectedDate}T${selectedTime}`).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })}{'\n'}
              📝 Catatan: {notes || 'Tidak ada catatan'}{'\n\n'}
              Konfirmasi waktu ketemuan ya kak? 🙏
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 px-6 pb-8">
        <button onClick={onClose} className="flex-1 btn btn-ghost btn-lg rounded-2xl">
          Batal
        </button>
        <button
          onClick={handleSend}
          disabled={!selectedDate || !selectedTime}
          className="flex-1 btn btn-primary btn-lg rounded-2xl text-white font-bold shadow-lg disabled:opacity-50"
        >
          Kirim Waktu
        </button>
      </div>
    </>
  );
}