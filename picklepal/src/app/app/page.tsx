import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function MyGroupsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-on-background">My Groups</h1>
          <p className="mt-1 text-sm text-on-background/60">
            Welcome back, {user.firstName ?? "Organizer"}
          </p>
        </header>

        {/* TODO: Phase 2b — fetch groups from DB and render group cards */}
        <section className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-on-background/60">
            You don&apos;t have any groups yet.
          </p>
          <a
            href="/onboarding"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90"
          >
            Create Your First Group
          </a>
        </section>
      </div>
    </main>
  );
}
