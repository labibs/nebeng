import { useState, useRef, useEffect } from "react";

export default function LazyImage({ src, alt = "", className = "" }) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" } // mulai load sebelum terlihat penuh
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="relative w-full h-full">

      {/* Skeleton */}
      {!loaded && (
        <div className="
          absolute inset-0
          bg-gray-300/30 dark:bg-white/10
          animate-pulse rounded-xl
        " />
      )}

      {/* Image (baru render jika visible) */}
      {visible && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`
            absolute inset-0 w-full h-full object-cover
            transition-opacity duration-500
            ${loaded ? "opacity-100" : "opacity-0"}
            ${className}
          `}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
    </div>
  );
}
