/**
 * Loading skeleton for the dashboard page.
 * Mirrors the layout of HeroSection + StatsHighlights + Leaderboard/Matches grid.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-2xl bg-surface-muted h-44 sm:h-48" />

      {/* Stats highlights skeleton */}
      <div>
        <div className="h-4 w-24 bg-surface-muted rounded mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      {/* Leaderboard + Recent Matches skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard skeleton */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-28 bg-surface-muted rounded" />
            <div className="h-3 w-24 bg-surface-muted rounded" />
          </div>
          <div className="rounded-xl border border-border-muted bg-surface overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-3 border-b border-border-muted last:border-b-0"
              >
                <div className="w-6 h-6 rounded-full bg-surface-muted" />
                <div className="h-4 flex-1 bg-surface-muted rounded" />
                <div className="h-4 w-10 bg-surface-muted rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent matches skeleton */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-32 bg-surface-muted rounded" />
            <div className="h-3 w-20 bg-surface-muted rounded" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-muted bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="h-4 flex-1 bg-surface-muted rounded" />
                  <div className="h-6 w-16 bg-surface-muted rounded" />
                  <div className="h-4 flex-1 bg-surface-muted rounded" />
                </div>
                <div className="h-3 w-24 bg-surface-muted rounded mx-auto mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border-muted bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 bg-surface-muted rounded" />
          <div className="h-4 w-28 bg-surface-muted rounded" />
          <div className="h-3 w-20 bg-surface-muted rounded" />
        </div>
      </div>
    </div>
  );
}
