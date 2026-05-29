export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">History</h1>
        <p className="text-text-secondary mt-1">
          All past matches grouped by session.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
        <p className="text-text-muted text-sm">
          Chronological match history with scores and player details will appear
          here.
        </p>
      </div>
    </div>
  );
}
