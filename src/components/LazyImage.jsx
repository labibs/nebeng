import { useState, useRef, useEffect } from "react";

export default function LazyImageFancy({ src, alt = "", className = "" }) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // load sedikit lebih awal
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative w-full h-full overflow-hidden">

      {/* Skeleton shimmer */}
      {!loaded && (
        <div
          className="
            absolute inset-0 rounded-xl
            bg-gradient-to-r from-gray-300/40 via-gray-200/30 to-gray-300/40
            dark:from-white/10 dark:via-white/5 dark:to-white/10
            animate-pulse
          "
        />
      )}

      {visible && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`
            absolute inset-0 w-full h-full object-cover
            transition-all duration-700 ease-out
            ${loaded
              ? "opacity-100 blur-0 scale-100"
              : "opacity-0 blur-md scale-105"
            }
            ${className}
          `}
        />
      )}
    </div>
  );
}
