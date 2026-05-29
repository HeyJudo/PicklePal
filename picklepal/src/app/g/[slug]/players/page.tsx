export default function PlayersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Players</h1>
        <p className="text-text-secondary mt-1">
          Your crew roster and player profiles.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
        <p className="text-text-muted text-sm">
          Player cards with stats, colors, and management options will appear
          here.
        </p>
      </div>
    </div>
  );
}
