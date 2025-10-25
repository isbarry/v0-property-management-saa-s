export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </div>

      {/* Profile card skeleton */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 bg-muted animate-pulse rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>

        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}
