export default function PlayersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-2xl bg-surface-muted h-[88px]" />

      {/* Player cards */}
      <div className="grid gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center overflow-hidden rounded-xl border border-border-muted bg-surface"
          >
            <div className="w-1.5 self-stretch bg-surface-muted shrink-0" />
            <div className="flex items-center gap-3.5 flex-1 p-4">
              <div className="h-9 w-9 rounded-full bg-surface-muted shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-4 w-28 bg-surface-muted rounded" />
                <div className="h-3 w-16 bg-surface-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
