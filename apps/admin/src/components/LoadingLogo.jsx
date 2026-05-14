export default function LoadingLogo({ size = "w-20 h-20", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[#4e73df]/20 rounded-full blur-xl animate-pulse" />
        <img
          src="/logo.svg"
          alt="Loading..."
          className={`${size} relative z-10 animate-bounce duration-[2s]`}
        />
      </div>
      <div className="flex flex-col items-center">
        <p className="text-sm font-black text-[#0f172a] tracking-widest uppercase opacity-40">Nebeng</p>
        <div className="flex gap-1 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4e73df] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#4e73df] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#4e73df] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
