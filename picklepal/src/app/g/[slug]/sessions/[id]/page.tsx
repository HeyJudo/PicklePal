import { notFound } from "next/navigation";
import { getSessionDetail } from "./actions";
import { SessionDetail } from "./SessionDetail";

interface SessionDetailPageProps {
  readonly params: Promise<{ slug: string; id: string }>;
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { slug, id } = await params;
  const { session, summary, awards, matches, playerNames, error } = await getSessionDetail(slug, id);

  if (error === "Session not found" || !session || !summary || !awards) {
    notFound();
  }

  return (
    <SessionDetail
      session={session}
      summary={summary}
      awards={awards}
      matches={matches}
      playerNames={playerNames}
      groupSlug={slug}
    />
  );
}
