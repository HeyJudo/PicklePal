export default function HistoryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-2xl bg-surface-muted h-[88px]" />

      {/* Session groups */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Session header */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="h-6 w-24 rounded-full bg-surface-muted" />
            <div className="h-4 w-32 bg-surface-muted rounded" />
          </div>
          {/* Match rows */}
          <div className="rounded-xl border border-border-muted bg-surface px-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="flex items-center gap-3 py-3 border-b border-border-muted last:border-0"
              >
                <div className="flex-1 h-4 bg-surface-muted rounded" />
                <div className="h-6 w-16 bg-surface-muted rounded shrink-0" />
                <div className="flex-1 h-4 bg-surface-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
