export default function FinancialsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6 space-y-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="h-3 w-40 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="h-6 w-40 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-40 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
