import { useState } from "react";
import { ArrowUp, Check, CircleFadingPlus, ClipboardCheck, SearchAlertIcon, SearchCheckIcon } from "lucide-react";

export default function SlideToCreate({ onComplete }) {
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    if (done) return;
    
    setIsLoading(true);
    
    // Simulasi loading sebelum complete
    setTimeout(() => {
      setDone(true);
      setIsLoading(false);
      onComplete?.();
    }, 800);
  };

  return (
    <div className="w-full flex justify-center mt-4">
      <div className="relative w-80 h-12">
        {/* TRACK */}
        <div
          className={`relative w-full h-12 rounded-full overflow-hidden
          border backdrop-blur-md transition-all duration-500
          ${done
            ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-400/30"
            : "bg-gradient-to-r from-base-300/70 to-base-200/70 border-white/10"
          }`}
        >
          {/* SUCCESS BACKGROUND ANIMATION */}
          {done && (
            <div className="absolute inset-0 bg-emerald-500 animate-pulse-once" />
          )}

          {/* LOADING ANIMATION */}
          {isLoading && !done && (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-emerald-400/40 to-emerald-500/20 animate-shimmer" />
          )}

          {/* LABEL */}
          {!done && (
            <div className="absolute inset-0 flex items-center justify-center
                            text-xs font-medium z-10">
              <span className="relative z-10 opacity-90 flex items-center gap-2">
                Tambahkan
                <CircleFadingPlus className="w-6 h-6" />
              </span>
            </div>
          )}

          {/* SUCCESS TEXT */}
          {done && (
            <div className="absolute inset-0 flex items-center justify-center
                            text-sm font-semibold text-white z-10">
              <span className="flex items-center gap-2">
                Berhasi ditambahkan
                
              </span>
            </div>
          )}

          {/* ICON BUTTON */}
          <button
            onClick={handleClick}
            disabled={done || isLoading}
            className={`absolute left-1 top-1/2 -translate-y-1/2 z-20
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
              disabled:cursor-not-allowed transition-all duration-300
              ${done ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
          >
            <div className="relative w-10 h-10 rounded-full
                            bg-emerald-500 text-white
                            flex items-center justify-center overflow-hidden
                            shadow-lg transition-all duration-300">

              {/* LOADING SPINNER */}
              {isLoading && !done && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* ARROW (visible when not loading and not done) */}
              <ArrowUp
                className={`w-5 h-5 transition-all duration-300
                ${isLoading || done ? "opacity-0" : "opacity-100"}
                ${isLoading ? "scale-0" : "scale-100"}`}
              />

              {/* CHECK (visible when done) */}
              <Check
                className={`absolute w-5 h-5 transition-all duration-500
                ${done
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-0"
                }`}
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}