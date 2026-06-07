"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteSession } from "./session-actions";
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
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const sessionDate = formatDate(session.started_at);
  const sessionTitle = session.title ?? `Game Day`;

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

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
    <section className="space-y-1">
      {/* Session header */}
      <div className="flex items-center justify-between px-1 py-2">
        <Link
          href={`/g/${groupSlug}/sessions/${session.id}`}
          className="flex-1 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {sessionTitle}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">{sessionDate}</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </span>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="text-text-muted hover:text-red-500 transition-colors cursor-pointer p-1"
            aria-label={`Delete session ${sessionTitle}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Confirm delete */}
      {showConfirm && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3 mx-1">
          <p className="text-sm text-red-800 font-medium">
            Delete &ldquo;{sessionTitle}&rdquo; and all {matches.length} match{matches.length !== 1 ? "es" : ""}?
          </p>
          <p className="text-xs text-red-600">This cannot be undone. Stats and leaderboard will be recalculated.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Forever"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
