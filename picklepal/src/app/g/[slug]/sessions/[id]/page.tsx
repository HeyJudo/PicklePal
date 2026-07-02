import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGroupPrivacyBySlug } from "@/lib/privacy";
import { getSessionDetail } from "./actions";
import { SessionDetail } from "./SessionDetail";

interface SessionDetailPageProps {
  readonly params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({
  params,
}: SessionDetailPageProps): Promise<Metadata> {
  const { slug, id } = await params;

  const privacy = await getGroupPrivacyBySlug(slug);

  // Private groups: return generic metadata, no group/session details, no indexing
  if (!privacy || privacy.privacyMode !== "public_link") {
    return {
      title: "DinkDay",
      robots: { index: false, follow: false },
    };
  }

  const { session } = await getSessionDetail(slug, id);

  if (!session) {
    return {
      title: "DinkDay",
      robots: { index: false, follow: false },
    };
  }

  const date = new Date(session.started_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const title = `Game Day Recap — ${date} · DinkDay`;
  const description = `Check out the full Game Day recap from ${date} on DinkDay.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.dinkday.site/g/${slug}/sessions/${id}`,
      siteName: "DinkDay",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { slug, id } = await params;
  const { session, summary, awards, matches, playerNames, playerColors, playerAvatars, groupName, error } = await getSessionDetail(slug, id);

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
      playerColors={playerColors}
      playerAvatars={playerAvatars}
      groupSlug={slug}
      groupName={groupName}
    />
  );
}
