export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-brand-surface flex flex-col">
      {/* Simulated Navbar skeleton */}
      <div className="h-16 bg-white border-b border-brand-border px-4 flex items-center">
        <div className="shimmer h-8 w-36 rounded-lg" />
        <div className="ml-auto flex gap-4">
          <div className="shimmer h-8 w-20 rounded-lg" />
          <div className="shimmer h-8 w-20 rounded-lg" />
          <div className="shimmer h-8 w-24 rounded-full" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="h-64 bg-brand-black/10 flex items-center justify-center px-4">
        <div className="text-center max-w-xl w-full">
          <div className="shimmer h-10 w-3/4 rounded-xl mx-auto mb-3" />
          <div className="shimmer h-5 w-1/2 rounded-lg mx-auto" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
                <div className="shimmer h-12 w-12 rounded-xl mb-4" />
                <div className="shimmer h-5 w-3/4 rounded mb-2" />
                <div className="shimmer h-4 w-full rounded mb-1" />
                <div className="shimmer h-4 w-2/3 rounded mb-4" />
                <div className="shimmer h-8 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
