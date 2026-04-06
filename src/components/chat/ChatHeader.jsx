import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ChatHeader({ recipient, isLoading = false }) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  if (isLoading) {
    return (
      <div className="navbar bg-base-100 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-circle"
        >
          <svg
            className="w-6 h-6"
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
    );
  }

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle">
        <svg
          className="w-6 h-6"
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
        <div className="avatar online">
          <div className="w-12 rounded-full ring ring-[#4e73df]/30 ring-offset-2 ring-offset-base-100 bg-slate-100 relative overflow-hidden">
            {!imageLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={recipient.imageUrl}
              alt={recipient.name}
              className={imageLoaded ? "block" : "hidden"}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </div>
        </div>
        <div>
          <h2 className="font-bold text-lg">{recipient.name}</h2>
          <p className="text-sm opacity-70">Online</p>
        </div>
      </div>
    </div>
  );
}
