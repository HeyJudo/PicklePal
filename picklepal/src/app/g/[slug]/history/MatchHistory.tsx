"use client";

import Link from "next/link";
import type { SessionGroup, MatchWithPlayers } from "./actions";

interface MatchHistoryProps {
  readonly sessionGroups: readonly SessionGroup[];
  readonly groupSlug: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function TeamDisplay({
  playerIds,
  playerNames,
  isWinner,
}: {
  readonly playerIds: readonly string[];
  readonly playerNames: Record<string, string>;
  readonly isWinner: boolean;
}) {
  const names = playerIds.map((id) => playerNames[id] ?? "Unknown");

  return (
    <div className={`flex-1 min-w-0 ${isWinner ? "" : "opacity-70"}`}>
      <p
        className={`text-sm truncate ${
          isWinner ? "font-semibold text-text-primary" : "text-text-secondary"
        }`}
      >
        {names.join(" & ")}
      </p>
    </div>
  );
}

function MatchRow({ match }: { readonly match: MatchWithPlayers }) {
  const teamAWon = match.winning_team === "A";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border-muted last:border-0">
      {/* Team A */}
      <TeamDisplay
        playerIds={match.team_a_player_ids}
        playerNames={match.playerNames}
        isWinner={teamAWon}
      />

      {/* Score */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={`text-sm font-bold tabular-nums ${
            teamAWon ? "text-court-green" : "text-text-secondary"
          }`}
        >
          {match.team_a_score}
        </span>
        <span className="text-text-muted text-xs">–</span>
        <span
          className={`text-sm font-bold tabular-nums ${
            !teamAWon ? "text-court-green" : "text-text-secondary"
          }`}
        >
          {match.team_b_score}
        </span>
      </div>

      {/* Team B */}
      <TeamDisplay
        playerIds={match.team_b_player_ids}
        playerNames={match.playerNames}
        isWinner={!teamAWon}
      />

      {/* Match type badge */}
      <span className="text-[10px] uppercase tracking-wider text-text-muted bg-surface-muted px-1.5 py-0.5 rounded shrink-0">
        {match.match_type === "doubles" ? "2v2" : "1v1"}
      </span>
    </div>
  );
}

function SessionSection({ group, groupSlug }: { readonly group: SessionGroup; readonly groupSlug: string }) {
  const { session, matches } = group;
  const sessionDate = formatDate(session.started_at);
  const sessionTitle = session.title ?? `Game Day`;

  return (
    <section className="space-y-1">
      {/* Session header */}
      <Link
        href={`/g/${groupSlug}/sessions/${session.id}`}
        className="flex items-baseline justify-between px-1 py-2 hover:opacity-80 transition-opacity cursor-pointer"
      >
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {sessionTitle}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">{sessionDate}</p>
        </div>
        <span className="text-xs text-text-muted">
          {matches.length} match{matches.length !== 1 ? "es" : ""} →
        </span>
      </Link>

      {/* Matches */}
      <div className="rounded-xl border border-border bg-surface px-4">
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}

export function MatchHistory({ sessionGroups, groupSlug }: MatchHistoryProps) {
  if (sessionGroups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
        <p className="text-text-muted text-sm">
          No completed matches yet. Play some games to see history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sessionGroups.map((group) => (
        <SessionSection key={group.session.id} group={group} groupSlug={groupSlug} />
      ))}
    </div>
  );
}
