import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Calendar, Trophy, Plus, Zap, Crown, Shield } from "lucide-react";
import { getMyGroups } from "./actions";

export default async function MyGroupsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { groups, error } = await getMyGroups();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-headline text-lg font-bold text-on-background">
              DinkDay
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-on-surface-variant">
              {user.firstName ?? user.emailAddresses[0]?.emailAddress ?? "Organizer"}
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Welcome section */}
        <section className="mb-8">
          <h2 className="font-headline text-2xl font-bold text-on-background">
            My Groups
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage your pickleball crews and game days.
          </p>
        </section>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-error/20 bg-error-container/10 px-4 py-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Groups grid */}
        {groups.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/g/${group.slug}`}
                className="group cursor-pointer rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
              >
                {/* Group name + active badge */}
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-headline text-base font-semibold text-on-background group-hover:text-primary">
                    {group.name}
                  </h3>
                  {group.activeSession && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Zap className="h-3 w-3" />
                      Live
                    </span>
                  )}
                </div>

                {/* Role badge */}
                <div className="mb-3">
                  {group.role === "owner" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ball-yellow/10 px-2 py-0.5 text-xs font-medium text-ball-yellow">
                      <Crown className="h-3 w-3" />
                      Owner
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-on-surface-variant/10 px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {group.playerCount} players
                  </span>
                  {group.lastSession && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatRelativeDate(group.lastSession.startedAt)}
                    </span>
                  )}
                </div>

                {/* Active session callout */}
                {group.activeSession && (
                  <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2">
                    <p className="text-xs font-medium text-primary">
                      {group.activeSession.title ?? "Game Day"} in progress
                    </p>
                  </div>
                )}
              </Link>
            ))}

            {/* Create new group card */}
            <Link
              href="/onboarding"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-container-low p-5 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-on-surface-variant">
                Create Group
              </span>
            </Link>
          </div>
        ) : (
          /* Empty state */
          <section className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-headline text-lg font-semibold text-on-background">
              No groups yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-on-surface-variant">
              Create your first group to start running game days with your
              pickleball crew.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Your First Group
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
