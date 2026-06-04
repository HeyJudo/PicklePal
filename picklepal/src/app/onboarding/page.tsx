import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-lg">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-on-background">
            Create Your Group
          </h1>
          <p className="mt-1 text-sm text-on-background/60">
            Set up your pickleball crew in seconds.
          </p>
        </header>

        {/* TODO: Phase 2c — multi-step onboarding form (name → slug → players) */}
        <section className="rounded-xl border border-border bg-surface p-8">
          <p className="text-center text-on-background/60">
            Onboarding form coming soon.
          </p>
        </section>
      </div>
    </main>
  );
}
