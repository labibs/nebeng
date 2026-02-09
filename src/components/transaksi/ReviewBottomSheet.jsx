import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ReviewBottomSheet({ deal, reviewerId, revieweeId, onClose, onSuccess }) {
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

            <div className="relative w-full max-w-md bg-base-100 rounded-t-[2.5rem] shadow-2xl p-6 pb-12 animate-slide-up-bottom">
                <div className="w-12 h-1.5 bg-base-300 rounded-full mx-auto mb-6" />

                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">Beri Ulasan</h3>
                    <p className="text-sm opacity-60">Bagaimana pengalaman nitip kamu dengan {deal.carrier?.name}?</p>
                </div>

                {/* STAR RATING */}
                <div className="flex justify-center gap-3 mb-8">
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
                                className={`w-12 h-12 transition-colors ${(hoverRating || rating) >= star
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-base-300 fill-none"
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
                <div className="mb-8">
                    <label className="text-sm font-semibold mb-2 block px-1">Komentar (Opsional)</label>
                    <textarea
                        className="textarea textarea-bordered w-full rounded-2xl h-32 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-base-200/50"
                        placeholder="Ceritakan pengalamanmu..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || rating === 0}
                        className={`btn btn-primary btn-lg w-full rounded-2xl font-bold shadow-lg shadow-primary/20 ${loading ? "loading" : ""
                            }`}
                    >
                        Kirim Ulasan
                    </button>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost w-full rounded-2xl font-semibold opacity-60"
                    >
                        Nanti Saja
                    </button>
                </div>
            </div>
        </div>
    );
}
