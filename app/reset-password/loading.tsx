export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Loading</h2>
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </div>
      </div>
    </div>
  )
}
