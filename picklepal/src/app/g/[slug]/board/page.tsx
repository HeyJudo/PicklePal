export default function BoardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
        <p className="text-text-secondary mt-1">
          Rankings based on all completed matches.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
        <p className="text-text-muted text-sm">
          Player rankings with win rate, games played, and point differential
          will appear here.
        </p>
      </div>
    </div>
  );
}
