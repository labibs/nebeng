import { useState, useEffect } from "react";
import { ArrowRight, BaggageClaim , Check, ClipboardCheck, Truck, MapPin, MapPinHouse, PackageCheck } from "lucide-react";

export default function SlideToDelivered({ onComplete, status }) {
  const [percent, setPercent] = useState(0);
  const [done, setDone] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSlide = (e) => {
    const v = Number(e.target.value);
    setPercent(v);

    if (v >= 100 && !done) {
      setDone(true);
      onComplete?.();
    }
  };

  const handleArrowClick = () => {
    if (done || isAnimating) return;
    
    setIsAnimating(true);
    // Animate from current position to 100%
    const duration = 800; // ms
    const startPercent = percent;
    const endPercent = 100;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentPercent = startPercent + (endPercent - startPercent) * easeOutQuart;
      
      setPercent(currentPercent);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setPercent(100);
        setDone(true);
        setIsAnimating(false);
        onComplete?.();
      }
    };
    
    requestAnimationFrame(animate);
  };

  // Calculate knob position within a narrower track
  const trackWidth = 240; // Narrower than container
  const knobOffset = 0; // Track start offset
  const knobPosition = (percent / 100) * trackWidth + knobOffset;

  useEffect(() => {
    if (status === "delivered") {
        setPercent(100);
        setDone(true);
        setIsAnimating(false);
    }
    }, [status]);


  // Reset animation state when percent changes
  useEffect(() => {
    if (percent === 100 && !done) {
      setDone(true);
      setIsAnimating(false);
      onComplete?.();
    }
  }, [percent, done, onComplete]);

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
                bg-emerald-400/25 transition-all duration-150 rounded-full translate-x-1"
              />
            )}

            {/* label text */}
            <div
              className={`absolute inset-0 flex items-center justify-center
              text-xs font-medium tracking-wide transition-all duration-300 
              ${done ? "opacity-0" : "opacity-80"}
            `}
            >
              Titipan Sudah Sampai
              <MapPinHouse className="w-4 h-4 ml-2 opacity-70" />
            </div>

            {/* success text */}
            {done && (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                <PackageCheck className="w-4 h-4 mr-1" />
                Barang Diterima
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
            disabled={done || status === "delivered"}
            onChange={handleSlide}
            className="w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        {/* Arrow left button */}
        <button
          onClick={handleArrowClick}
          disabled={done || isAnimating || status === "delivered"}
          className={`absolute left-0 top-1/2 -translate-y-1/2
            w-11 h-11 rounded-full flex items-center justify-center
            transition-all duration-200 z-30 translate-x-5
            ${done || isAnimating
              ? "opacity-0 cursor-not-allowed"
              : "hover:scale-110 active:scale-95 cursor-pointer"
            }
            ${done
              ? "bg-white text-emerald-600"
              : "bg-emerald-500 border border-white/20 text-white"
            }`}
        >
          {done ? (
            <BaggageClaim className="w-4 h-4" />
          ) : isAnimating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <BaggageClaim className="w-4 h-4" />
          )}
        </button>

        {/* knob - positioned based on track */}
        <div
          style={{ 
            left: `${knobPosition}px`,
            transform: 'translate(-50%, -50%)'
          }}
          className={`absolute top-1/2 
          w-11 h-11 rounded-full flex items-center justify-center translate-x-10
          shadow-xl transition-all duration-200 z-20
          ${isAnimating ? "transition-all duration-100" : ""}
          ${done
            ? "bg-white text-emerald-600"
            : "bg-emerald-500 border border-white/20"
          }`}
        >
          {done ? (
            <MapPinHouse className="w-5 h-5" />
          ) : (
            <Truck
              className="w-5 h-5 transition-transform duration-200"
            />
          )}
        </div>
      </div>
    </div>
  );
}