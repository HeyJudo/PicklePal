import { notFound } from "next/navigation";
import { getPlayerDetail } from "../actions";
import { PlayerProfile } from "./PlayerProfile";

interface PlayerDetailPageProps {
  readonly params: Promise<{ slug: string; id: string }>;
}

export default async function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const { slug, id } = await params;
  const { player, stats, duos, error } = await getPlayerDetail(slug, id);

  if (error === "Player not found" || !stats || !player) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PlayerProfile stats={stats} duos={duos} groupSlug={slug} player={player} />
    </div>
  );
}
