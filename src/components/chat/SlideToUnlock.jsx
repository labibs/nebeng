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

  // Calculate knob position within a narrower track
  const trackWidth = 240; // Narrower than container
  const knobOffset = 0; // Track start offset
  const knobPosition = (percent / 100) * trackWidth + knobOffset;

  return (
    <div className="w-full flex justify-center">
      <div className="relative w-80 h-12">
        {/* Track container - narrower */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-72">
          <div
            className={`w-full h-12 rounded-full overflow-hidden
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
              Geser ke transaksi
            </div>

            {/* success text */}
            {done && (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                <Check className="w-4 h-4 mr-1" />
                Transaksi Siap
              </div>
            )}
          </div>
        </div>

        {/* hidden range input - matches track width */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-72">
          <input
            type="range"
            min="0"
            max="100"
            value={percent}
            disabled={done}
            onChange={handleSlide}
            className="w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        {/* knob - positioned based on track */}
        <div
          style={{ 
            left: `${knobPosition}px`,
            transform: 'translate(-50%, -50%)'
          }}
          className={`absolute top-1/2 
          w-11 h-11 rounded-full flex items-center justify-center translate-x-10
          shadow-xl transition-all duration-200 z-20
          ${done
            ? "bg-white text-emerald-600"
            : "bg-amber-600 border border-white/20"
          }`}
        >
          {done ? (
            <Check className="w-5 h-5" />
          ) : (
            <ArrowRight
              className="w-5 h-5 transition-transform duration-200"
            />
          )}
        </div>
      </div>
    </div>
  );
}