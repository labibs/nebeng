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
      { rootMargin: "400px" },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative w-full h-full overflow-hidden">
      {!loaded && (
        <div
          className="
            absolute inset-0 rounded-xl
            bg-gradient-to-br from-[#e4edff] via-[#edf3ff] to-[#e4edff]
            animate-pulse
          "
        />
      )}

      {visible && (
        <img
          src={src}
          alt={alt}
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`
            absolute inset-0 w-full h-full object-cover
            transition-all duration-300 ease-out
            ${
              loaded
                ? "opacity-100 blur-0 scale-100"
                : "opacity-0 blur-sm scale-105"
            }
            ${className}
          `}
        />
      )}
    </div>
  );
}
