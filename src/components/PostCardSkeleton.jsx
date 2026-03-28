export default function PostCardSkeleton() {
  return (
    <div className="rounded-3xl p-4 bg-base-100 shadow-lg animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-base-300" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-base-300 rounded mb-2" />
          <div className="h-3 w-24 bg-base-300 rounded" />
        </div>
      </div>

      {/* Route */}
      <div className="flex justify-center items-center gap-3 mb-4">
        <div className="h-4 w-20 bg-base-300 rounded" />
        <div className="h-4 w-6 bg-base-300 rounded" />
        <div className="h-4 w-20 bg-base-300 rounded" />
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full bg-base-300 rounded" />
        <div className="h-3 w-5/6 bg-base-300 rounded" />
      </div>

      {/* Item */}
      <div className="h-8 bg-base-300 rounded-xl mb-4" />

      {/* CTA */}
      <div className="h-12 bg-base-300 rounded-full" />
    </div>
  )
}
