export default function HomePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Home</h1>
        <p className="text-text-secondary mt-1">
          Welcome to your pickleball crew dashboard.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
        <p className="text-text-muted text-sm">
          Session summaries, quick actions, and recent activity will appear
          here.
        </p>
      </div>
    </div>
  );
}
