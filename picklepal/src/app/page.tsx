export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-court-green">
          🏓 PicklePal
        </h1>
        <p className="text-lg text-text-secondary max-w-md">
          The scoreboard for your pickleball crew.
        </p>
        <p className="text-sm text-text-muted">
          Live scoring • Fair rotations • Persistent rankings
        </p>
      </div>
    </main>
  );
}
