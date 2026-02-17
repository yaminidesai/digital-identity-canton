export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-5 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-40 bg-gray-100 rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-16 bg-gray-200 rounded" />
          <div className="h-7 w-16 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonSummaryCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow border p-4 animate-pulse">
          <div className="h-8 w-12 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-20 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}
