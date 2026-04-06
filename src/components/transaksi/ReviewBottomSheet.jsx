import { useState } from "react";
import { X, Star, MessageSquare } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function ReviewBottomSheet({
  deal,
  reviewerId,
  revieweeId,
  onClose,
  onSuccess,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Silakan pilih rating bintang terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        deal_id: deal.id,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating: rating,
        comment: comment.trim(),
      });

      if (error) throw error;

      alert("Terima kasih atas ulasan Anda!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal mengirim ulasan:", err.message);
      alert("Gagal mengirim ulasan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] shadow-2xl animate-slide-up-bottom flex flex-col max-h-[85vh]">
        {/* Handle */}
        <div className="py-3 flex justify-center flex-shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-2 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare size={20} />
            Beri Ulasan
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <p className="px-6 text-sm text-slate-400 flex-shrink-0">
          Bagaimana pengalaman nitip kamu dengan {deal.carrier?.name}?
        </p>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* STAR RATING */}
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform active:scale-90"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <svg
                  className={`w-12 h-12 transition-colors ${
                    (hoverRating || rating) >= star
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-slate-200 fill-none"
                  }`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            ))}
          </div>

          {/* COMMENT AREA */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 block px-1 text-slate-600">
              Komentar (Opsional)
            </label>
            <textarea
              className="textarea textarea-bordered w-full rounded-2xl h-32 text-base focus:ring-2 focus:ring-[#4e73df]/20 focus:border-[#4e73df] transition-all bg-slate-50"
              placeholder="Ceritakan pengalamanmu..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white pb-8">
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4e73df] text-white py-3 text-[13px] font-semibold hover:bg-[#3d64c7] transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? "Mengirim..." : "Kirim Ulasan"}
          </button>
        </div>
      </div>
    </div>
  );
}
