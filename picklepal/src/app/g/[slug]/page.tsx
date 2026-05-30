import { notFound } from "next/navigation";
import { createServerClient, type Group } from "@/lib/supabase";
import { getDashboardData } from "./actions";
import { HeroSection } from "./dashboard/HeroSection";
import { StatsHighlights } from "./dashboard/StatsHighlights";

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

  return (
    <div className="space-y-6">
      <HeroSection
        groupName={group.name}
        groupSlug={slug}
        activeSession={dashboard?.activeSession ?? null}
        totalGamesPlayed={dashboard?.totalGamesPlayed ?? 0}
        totalSessions={dashboard?.totalSessions ?? 0}
      />

      <StatsHighlights
        topPlayer={dashboard?.topPlayer ?? null}
        hottestDuo={dashboard?.hottestDuo ?? null}
        latestMvp={dashboard?.latestMvp ?? null}
      />
    </div>
  );
}
