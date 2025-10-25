export default function PropertiesLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-36 bg-muted animate-pulse rounded" />
      </div>

      {/* Filters skeleton */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Property grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="h-48 bg-muted animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
