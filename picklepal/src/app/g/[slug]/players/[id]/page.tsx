import { notFound } from "next/navigation";
import { getPlayerDetail } from "../actions";
import { PlayerProfile } from "./PlayerProfile";
import { getViewerAccess } from "@/lib/auth";

interface PlayerDetailPageProps {
  readonly params: Promise<{ slug: string; id: string }>;
}

export default async function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const { slug, id } = await params;
  const [
    {
      player,
      stats,
      duos,
      rivalries,
      playerReigns,
      leaderboardRank,
      currentStreak,
      groupName,
      error,
    },
    viewerAccess,
  ] = await Promise.all([getPlayerDetail(slug, id), getViewerAccess(slug)]);

  if (error === "Player not found" || !stats || !player) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PlayerProfile
        stats={stats}
        duos={duos}
        rivalries={rivalries ?? []}
        groupSlug={slug}
        groupName={groupName ?? ""}
        player={player}
        isAdmin={viewerAccess.isAdmin}
        playerReigns={playerReigns ?? []}
        leaderboardRank={leaderboardRank}
        currentStreak={currentStreak}
      />
    </div>
  );
}
