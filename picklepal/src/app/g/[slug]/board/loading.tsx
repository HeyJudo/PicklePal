export default function BoardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-2xl bg-surface-muted h-[88px]" />

      {/* Leaderboard rows */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-muted bg-surface p-3.5 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-surface-muted shrink-0" />
            <div className="h-9 w-9 rounded-full bg-surface-muted shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-3.5 w-28 bg-surface-muted rounded" />
              <div className="h-3 w-20 bg-surface-muted rounded" />
            </div>
            <div className="text-right space-y-2 shrink-0">
              <div className="h-5 w-12 bg-surface-muted rounded" />
              <div className="h-3 w-8 bg-surface-muted rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
