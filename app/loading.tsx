export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}
