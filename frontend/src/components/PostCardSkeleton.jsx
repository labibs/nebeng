export default function PostCardSkeleton() {
  return (
    <div className="rounded-3xl p-4 bg-gradient-to-br from-[#e4edff] to-[#edf3ff] shadow-lg animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#d4e4ff]" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-[#d4e4ff] rounded mb-2" />
          <div className="h-3 w-24 bg-[#d4e4ff] rounded" />
        </div>
      </div>

      {/* Route */}
      <div className="flex justify-center items-center gap-3 mb-4">
        <div className="h-4 w-20 bg-[#d4e4ff] rounded" />
        <div className="h-4 w-6 bg-[#d4e4ff] rounded" />
        <div className="h-4 w-20 bg-[#d4e4ff] rounded" />
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full bg-[#d4e4ff] rounded" />
        <div className="h-3 w-5/6 bg-[#d4e4ff] rounded" />
      </div>

      {/* Item */}
      <div className="h-8 bg-[#d4e4ff] rounded-xl mb-4" />

      {/* CTA */}
      <div className="h-12 bg-[#d4e4ff] rounded-full" />
    </div>
  );
}
