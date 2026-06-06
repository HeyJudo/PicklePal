import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient, type Group } from "@/lib/supabase";
import { isGroupAdmin } from "@/lib/membership";
import { getDashboardData } from "./actions";
import { HeroSection } from "./dashboard/HeroSection";
import { StatsHighlights } from "./dashboard/StatsHighlights";
import { LeaderboardPreview } from "./dashboard/LeaderboardPreview";
import { RecentMatches } from "./dashboard/RecentMatches";
import { EmptyDashboard } from "./dashboard/EmptyDashboard";

interface HomePageProps {
  readonly params: Promise<{ slug: string }>;
}

async function getGroup(slug: string): Promise<Group | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .single();

  return data;
}

export default async function HomePage({ params }: HomePageProps) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  const { data: dashboard } = await getDashboardData(slug);

  // Check if current user is an admin (for showing settings gear)
  const user = await currentUser();
  const userIsAdmin = user ? await isGroupAdmin(user.id, group.id) : false;

  // Show welcoming empty state for brand-new groups with no games
  if (!dashboard || dashboard.totalGamesPlayed === 0) {
    return <EmptyDashboard groupName={group.name} groupSlug={slug} isAdmin={userIsAdmin} />;
  }

  return (
    <div className="space-y-6">
      <HeroSection
        groupName={group.name}
        groupSlug={slug}
        activeSession={dashboard.activeSession}
        totalGamesPlayed={dashboard.totalGamesPlayed}
        totalSessions={dashboard.totalSessions}
        isAdmin={userIsAdmin}
      />

      <StatsHighlights
        topPlayer={dashboard.topPlayer}
        hottestDuo={dashboard.hottestDuo}
        latestMvp={dashboard.latestMvp}
      />

      {/* Leaderboard + Recent Matches: side-by-side on tablet+, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardPreview
          entries={dashboard.leaderboardPreview}
          groupSlug={slug}
        />
        <RecentMatches
          matches={dashboard.recentMatches}
          groupSlug={slug}
        />
      </div>
    </div>
  );
}
