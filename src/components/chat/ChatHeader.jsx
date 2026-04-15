import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ChatHeader({ recipient, isLoading = false }) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  if (isLoading) {
    return (
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-100 shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95"
          >
            <svg
              className="w-5 h-5 text-slate-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex-1 flex items-center gap-3">
            <div className="skeleton w-12 h-12 rounded-full shrink-0 bg-[#e4edff]" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="skeleton h-5 w-32 bg-[#edf3ff]" />
              <div className="skeleton h-4 w-16 bg-[#e4edff]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-100 shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95"
        >
          <svg
            className="w-5 h-5 text-slate-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div
          className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer active:opacity-70 transition-opacity"
          onClick={() => navigate(`/profile/detail/${recipient.id}`)}
        >
          <div className="avatar online">
            <div className="w-12 rounded-full ring ring-[#4e73df]/30 ring-offset-2 ring-offset-white bg-slate-100 relative overflow-hidden">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-[#e4edff] animate-pulse" />
              )}
              <img
                src={recipient.imageUrl}
                alt={recipient.name}
                className={imageLoaded ? "block" : "hidden"}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-base text-slate-900 truncate">
              {recipient.name}
            </h2>
            <p className="text-xs text-slate-400">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
