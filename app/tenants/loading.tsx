export default function TenantsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-56 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
        <div className="h-10 w-40 bg-muted animate-pulse rounded" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
