import { useState } from "react";
import { ArrowRight, Check, Unlock } from "lucide-react";

export default function SlideToUnlock({ onComplete }) {
  const [percent, setPercent] = useState(0);
  const [done, setDone] = useState(false);

  const handleSlide = (e) => {
    const v = Number(e.target.value);
    setPercent(v);

    if (v >= 100 && !done) {
      setDone(true);
      onComplete?.();
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div
        className={`relative w-72 h-12 rounded-full overflow-hidden
        border backdrop-blur-md transition-all duration-400
        ${done
          ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-400/30"
          : "bg-gradient-to-r from-base-300/70 to-base-200/70 border-white/10"
        }`}
      >
        {/* progress fill */}
        {!done && (
          <div
            style={{ width: `${percent}%` }}
            className="absolute inset-y-0 left-0
            bg-emerald-400/25 transition-all duration-150"
          />
        )}

        {/* label text */}
        <div
          className={`absolute inset-0 flex items-center justify-center
          text-xs font-medium tracking-wide transition-all duration-300
          ${done ? "opacity-0" : "opacity-80"}
        `}
        >
          <Unlock className="w-4 h-4 mr-1 opacity-70" />
          Geser untuk lanjut transaksi
        </div>

        {/* success text */}
        {done && (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
            <Check className="w-4 h-4 mr-1" />
            Transaksi Siap
          </div>
        )}

        {/* hidden range */}
        <input
          type="range"
          min="0"
          max="100"
          value={percent}
          disabled={done}
          onChange={handleSlide}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {/* knob */}
        <div
          style={{ left: `calc(${percent}% - 22px)` }}
          className={`absolute top-1/2 -translate-y-1/2 translate-x-6
          w-11 h-11 rounded-full flex items-center justify-center
          shadow-xl transition-all duration-200
          ${done
            ? "bg-white text-emerald-600"
            : "bg-base-100/95 border border-white/20"
          }`}
        >
          {done ? (
            <Check className="w-5 h-5" />
          ) : (
            <ArrowRight
              className="w-5 h-5 transition-transform duration-200"
              style={{ transform: `translateX(${percent / 10}px)` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
