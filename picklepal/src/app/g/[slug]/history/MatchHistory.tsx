"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteSession } from "./session-actions";
import type { SessionGroup, MatchWithPlayers } from "./actions";

interface MatchHistoryProps {
  readonly sessionGroups: readonly SessionGroup[];
  readonly groupSlug: string;
  readonly isAdmin?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function MatchRow({ match }: { readonly match: MatchWithPlayers }) {
  const teamAWon = match.winning_team === "A";
  const teamANames = match.team_a_player_ids
    .map((id) => match.playerNames[id] ?? "Unknown")
    .join(" & ");
  const teamBNames = match.team_b_player_ids
    .map((id) => match.playerNames[id] ?? "Unknown")
    .join(" & ");

  return (
    <div className="flex items-center gap-2.5 py-3 border-b border-border-muted last:border-0">
      {/* Team A */}
      <div className={`flex-1 min-w-0 ${teamAWon ? "" : "opacity-45"}`}>
        <p
          className={`text-sm truncate leading-tight ${
            teamAWon ? "font-bold text-text-primary" : "font-medium text-text-secondary"
          }`}
        >
          {teamANames}
        </p>
      </div>

      {/* Score — big Archivo Narrow */}
      <div className="flex items-baseline gap-1 shrink-0">
        <span
          className={`font-score text-2xl font-bold tabular-nums leading-none ${
            teamAWon ? "text-court-green" : "text-text-muted"
          }`}
        >
          {match.team_a_score}
        </span>
        <span className="text-text-muted text-sm leading-none font-light">-</span>
        <span
          className={`font-score text-2xl font-bold tabular-nums leading-none ${
            !teamAWon ? "text-court-green" : "text-text-muted"
          }`}
        >
          {match.team_b_score}
        </span>
      </div>

      {/* Team B */}
      <div className={`flex-1 min-w-0 text-right ${!teamAWon ? "" : "opacity-45"}`}>
        <p
          className={`text-sm truncate leading-tight ${
            !teamAWon ? "font-bold text-text-primary" : "font-medium text-text-secondary"
          }`}
        >
          {teamBNames}
        </p>
      </div>

      {/* Match type chip */}
      <span className="ml-0.5 shrink-0 inline-flex items-center rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] font-label font-semibold uppercase tracking-wider text-text-muted">
        {match.match_type === "doubles" ? "2v2" : "1v1"}
      </span>
    </div>
  );
}

function SessionSection({
  group,
  groupSlug,
  isAdmin = false,
}: {
  readonly group: SessionGroup;
  readonly groupSlug: string;
  readonly isAdmin?: boolean;
}) {
  const { session, matches } = group;
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const sessionDate = formatDate(session.started_at);
  const sessionTitle = session.title ?? "Game Day";

  const handleDeleteClick = () => setShowConfirm(true);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const result = await deleteSession(session.id);
    if (result.success) {
      router.refresh();
    } else {
      setIsDeleting(false);
      setShowConfirm(false);
      alert(result.error ?? "Failed to delete");
    }
  };

  return (
    <section className="space-y-2">
      {/* Session header */}
      <div className="flex items-center justify-between gap-3 px-1">
        <Link
          href={`/g/${groupSlug}/sessions/${session.id}`}
          className="flex-1 min-w-0 flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
        >
          {/* Date pill */}
          <span className="shrink-0 inline-flex items-center rounded-full bg-court-green/12 px-2.5 py-1 text-[11px] font-label font-semibold text-court-green-dark">
            {sessionDate}
          </span>
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {sessionTitle}
          </h3>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-label text-text-muted">
            {matches.length}&nbsp;match{matches.length !== 1 ? "es" : ""}
          </span>
          {isAdmin && <button
            type="button"
            onClick={handleDeleteClick}
            className="text-text-muted hover:text-hype-red transition-colors cursor-pointer p-1 rounded"
            aria-label={`Delete session ${sessionTitle}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>}
        </div>
      </div>

      {/* Confirm delete */}
      {showConfirm && (
        <div className="rounded-xl border border-hype-red/30 bg-hype-red/5 p-4 space-y-3 mx-1">
          <p className="text-sm text-hype-red font-medium">
            Delete &ldquo;{sessionTitle}&rdquo; and all {matches.length} match
            {matches.length !== 1 ? "es" : ""}?
          </p>
          <p className="text-xs text-hype-red/70">
            This cannot be undone. Stats and leaderboard will be recalculated.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 rounded-lg bg-hype-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isDeleting ? "Deleting..." : "Delete Forever"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="rounded-lg border border-hype-red/30 px-3 py-1.5 text-xs font-medium text-hype-red hover:bg-hype-red/10 cursor-pointer disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Match cards — left court-green accent */}
      <div className="rounded-xl border border-border bg-surface px-4 border-l-[3px] border-l-court-green/40">
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}

export function MatchHistory({ sessionGroups, groupSlug, isAdmin = false }: MatchHistoryProps) {
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
        <SessionSection
          key={group.session.id}
          group={group}
          groupSlug={groupSlug}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
