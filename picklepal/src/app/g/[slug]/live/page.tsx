export default function LivePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Live</h1>
        <p className="text-text-secondary mt-1">
          Start a Game Day session and score matches in real time.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
        <p className="text-text-muted text-sm">
          The Game Day loop — session management, matchups, and live court
          scoring — will be built here.
        </p>
      </div>
    </div>
  );
}
