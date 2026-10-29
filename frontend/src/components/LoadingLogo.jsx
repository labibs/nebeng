export default function LoadingLogo({ size = "w-16 h-16", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <img
        src="/logo.svg"
        alt="Loading..."
        className={`${size} animate-pulse`}
      />
      <p className="text-sm text-slate-400 font-medium">Memuat...</p>
    </div>
  );
}
