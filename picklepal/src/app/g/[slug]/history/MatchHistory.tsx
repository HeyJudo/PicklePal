"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteSession } from "./session-actions";
import { cancelMatch, restoreMatch, correctMatchScores } from "@/app/g/[slug]/match-actions";
import { PastMatchForm } from "./PastMatchForm";
import { loadMoreHistory } from "./actions";
import { HISTORY_PAGE_SIZE } from "./constants";
import { sessionSummary } from "./sessionSummary";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";
import type { SessionGroup, MatchWithPlayers, SessionOption } from "./actions";
import type { Player } from "@/lib/supabase";

interface MatchHistoryProps {
  readonly sessionGroups: readonly SessionGroup[];
  readonly groupSlug: string;
  readonly isAdmin?: boolean;
  readonly players: readonly Player[];
  readonly sessionOptions: readonly SessionOption[];
  readonly initialHasMore?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Match Action Sheet ────────────────────────────────────────────────────────

function MatchActionSheet({
  match,
  onClose,
  onEdit,
  onRefresh,
}: {
  readonly match: MatchWithPlayers;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onRefresh: () => void;
}) {
  const isCancelled = match.status === "cancelled";
  const isManual = match.source === "manual";

  const [showFixScore, setShowFixScore] = useState(false);
  const [fixScoreA, setFixScoreA] = useState(String(match.team_a_score));
  const [fixScoreB, setFixScoreB] = useState(String(match.team_b_score));
  const [fixError, setFixError] = useState("");
  const [isSavingFix, setIsSavingFix] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleFixScore = async () => {
    setFixError("");
    const scoreA = parseInt(fixScoreA, 10);
    const scoreB = parseInt(fixScoreB, 10);
    if (isNaN(scoreA) || isNaN(scoreB)) {
      setFixError("Enter valid scores");
      return;
    }
    setIsSavingFix(true);
    const result = await correctMatchScores(match.id, scoreA, scoreB);
    setIsSavingFix(false);
    if (result.success) {
      onRefresh();
      onClose();
    } else {
      setFixError(result.error ?? "Failed to fix score");
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    const result = await cancelMatch(match.id);
    setIsCancelling(false);
    if (result.success) {
      onRefresh();
      onClose();
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    const result = await restoreMatch(match.id);
    setIsRestoring(false);
    if (result.success) {
      onRefresh();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full sm:max-w-sm mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl bg-surface border border-border shadow-xl max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-text-primary">Match options</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-muted hover:text-text-secondary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3 space-y-1">
          {isCancelled ? (
            <button
              type="button"
              onClick={handleRestore}
              disabled={isRestoring}
              className="w-full text-left rounded-xl px-4 py-3.5 text-sm font-semibold text-court-green hover:bg-court-green/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isRestoring ? "Restoring…" : "Restore match"}
            </button>
          ) : (
            <>
              {isManual ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="w-full text-left rounded-xl px-4 py-3.5 text-sm font-semibold text-sky-blue hover:bg-sky-blue/5 transition-colors cursor-pointer"
                >
                  Edit match
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFixScore((v) => !v)}
                  className="w-full text-left rounded-xl px-4 py-3.5 text-sm font-semibold text-sky-blue hover:bg-sky-blue/5 transition-colors cursor-pointer"
                >
                  {showFixScore ? "Cancel fix" : "Fix score"}
                </button>
              )}

              {showFixScore && !isManual && (
                <div className="rounded-lg border border-sky-blue/30 bg-sky-blue/5 p-3 space-y-2 mx-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="99"
                      value={fixScoreA}
                      onChange={(e) => setFixScoreA(e.target.value)}
                      className="w-14 rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-court-green"
                      aria-label="Team A corrected score"
                    />
                    <span className="text-text-muted text-sm">–</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="99"
                      value={fixScoreB}
                      onChange={(e) => setFixScoreB(e.target.value)}
                      className="w-14 rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-court-green"
                      aria-label="Team B corrected score"
                    />
                    <button
                      type="button"
                      onClick={handleFixScore}
                      disabled={isSavingFix}
                      className="rounded-md bg-court-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-court-green-dark transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingFix ? "Saving..." : "Save"}
                    </button>
                  </div>
                  {fixError && <p className="text-xs text-hype-red">{fixError}</p>}
                </div>
              )}

              {!showCancelConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full text-left rounded-xl px-4 py-3.5 text-sm font-semibold text-hype-red hover:bg-hype-red/5 transition-colors cursor-pointer"
                >
                  Remove match
                </button>
              ) : (
                <div className="rounded-lg border border-hype-red/30 bg-hype-red/5 p-3 space-y-2 mx-1">
                  <p className="text-xs text-hype-red font-medium">Remove this match from stats?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="rounded-md bg-hype-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {isCancelling ? "Removing..." : "Remove"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={isCancelling}
                      className="rounded-md border border-hype-red/30 px-3 py-1.5 text-xs font-medium text-hype-red hover:bg-hype-red/10 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Team block ────────────────────────────────────────────────────────────────

function TeamBlock({
  match,
  playerIds,
  won,
}: {
  readonly match: MatchWithPlayers;
  readonly playerIds: readonly string[];
  readonly won: boolean;
}) {
  const isCancelled = match.status === "cancelled";
  const dimmed = !won && !isCancelled;
  const tinted = won && !isCancelled;

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col items-center gap-1.5 rounded-lg p-1.5 ${dimmed ? "opacity-45" : ""} ${tinted ? "bg-court-green/8" : ""}`}
    >
      <div className="flex shrink-0 -space-x-2 sm:-space-x-3">
        {playerIds.map((id) => {
          const info = match.playerInfo[id];
          return (
            <PlayerAvatar
              key={id}
              displayName={info?.name ?? "Unknown"}
              color={info?.color ?? null}
              avatarUrl={info?.avatarUrl ?? null}
              size="sm"
              className="ring-2 ring-surface sm:h-11 sm:w-11 sm:text-sm"
            />
          );
        })}
      </div>
      <div className="min-w-0 w-full text-center">
        {playerIds.map((id) => (
          <p
            key={id}
            className={`text-xs sm:text-sm truncate leading-tight ${
              won && !isCancelled ? "font-bold text-text-primary" : "font-medium text-text-secondary"
            }`}
          >
            {match.playerInfo[id]?.name ?? "Unknown"}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Match Card ────────────────────────────────────────────────────────────────

function MatchCard({
  match,
  isAdmin,
  groupSlug,
  players,
  sessionOptions,
  onRefresh,
}: {
  readonly match: MatchWithPlayers;
  readonly isAdmin?: boolean;
  readonly groupSlug: string;
  readonly players: readonly Player[];
  readonly sessionOptions: readonly SessionOption[];
  readonly onRefresh: () => void;
}) {
  const isCancelled = match.status === "cancelled";
  const isManual = match.source === "manual";
  const teamAWon = match.winning_team === "A";

  const [showActions, setShowActions] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const playedDateForEdit = (() => {
    const ts = match.played_at ?? match.completed_at ?? match.created_at;
    return ts ? ts.slice(0, 10) : "";
  })();

  const margin = Math.abs(match.team_a_score - match.team_b_score);
  const marginPct = Math.min(100, (margin / (match.target_score || 11)) * 100);

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-xl border border-border bg-surface p-4 ${isCancelled ? "opacity-50" : ""}`}
      >
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowActions(true)}
            className="absolute top-2 right-2 rounded-full p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-secondary transition-colors cursor-pointer"
            aria-label="Match options"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="12" cy="19" r="1.75" />
            </svg>
          </button>
        )}

        <div className="flex items-start gap-2 pr-6 min-w-0">
          <TeamBlock match={match} playerIds={match.team_a_player_ids} won={teamAWon} />

          <div className="flex flex-col items-center gap-1 shrink-0 px-1 pt-1">
            <div className="flex items-baseline gap-1">
              <span
                className={`font-score text-3xl font-bold tabular-nums leading-none ${
                  teamAWon && !isCancelled ? "text-court-green" : "text-text-muted"
                }`}
              >
                {match.team_a_score}
              </span>
              <span className="text-text-muted text-base leading-none font-light">-</span>
              <span
                className={`font-score text-3xl font-bold tabular-nums leading-none ${
                  !teamAWon && !isCancelled ? "text-court-green" : "text-text-muted"
                }`}
              >
                {match.team_b_score}
              </span>
            </div>
            <span className="inline-flex items-center rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-label font-semibold uppercase tracking-wide text-text-muted">
              {match.match_type === "doubles" ? "2v2" : "1v1"}
            </span>
            {!isCancelled && (
              <div className="h-1 w-12 rounded-full bg-surface-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-court-green/60"
                  style={{ width: `${marginPct}%` }}
                />
              </div>
            )}
          </div>

          <TeamBlock match={match} playerIds={match.team_b_player_ids} won={!teamAWon} />
        </div>

        <div className="flex items-center justify-end mt-2.5">
          <div className="flex items-center gap-1">
            {isManual && !isCancelled && (
              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-label font-semibold uppercase tracking-wide text-amber-600">
                Manual
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center rounded-full bg-surface-muted border border-border px-1.5 py-0.5 text-[10px] font-label font-semibold uppercase tracking-wide text-text-muted">
                Cancelled
              </span>
            )}
          </div>
        </div>
      </div>

      {showActions && (
        <MatchActionSheet
          match={match}
          onClose={() => setShowActions(false)}
          onEdit={() => {
            setShowActions(false);
            setShowEditForm(true);
          }}
          onRefresh={onRefresh}
        />
      )}

      {showEditForm && (
        <PastMatchForm
          groupSlug={groupSlug}
          players={players}
          sessionOptions={sessionOptions}
          initialMatch={{
            matchId: match.id,
            matchType: match.match_type,
            teamAPlayerIds: match.team_a_player_ids,
            teamBPlayerIds: match.team_b_player_ids,
            teamAScore: match.team_a_score,
            teamBScore: match.team_b_score,
            targetScore: match.target_score,
            winBy: match.win_by,
            playedDate: playedDateForEdit,
          }}
          onClose={() => {
            setShowEditForm(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

// ─── Session Section ──────────────────────────────────────────────────────────

function SessionSection({
  group,
  groupSlug,
  isAdmin,
  players,
  sessionOptions,
  defaultExpanded = false,
}: {
  readonly group: SessionGroup;
  readonly groupSlug: string;
  readonly isAdmin?: boolean;
  readonly players: readonly Player[];
  readonly sessionOptions: readonly SessionOption[];
  readonly defaultExpanded?: boolean;
}) {
  const { session, matches } = group;
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const isBucket = (session as { source?: string }).source === "manual_bucket";
  const sessionDate = formatDate(session.started_at);
  const sessionTitle = isBucket ? "Logged matches" : (session.title ?? "Game Day");

  const completedMatchCount = matches.filter((m) => m.status === "completed").length;
  const summary = sessionSummary(matches);

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

  const handleRefresh = () => router.refresh();

  const statParts: string[] = [];
  if (summary.topWinner) statParts.push(`🏆 ${summary.topWinner.name} ${summary.topWinner.wins}W`);
  if (summary.closest) statParts.push(`closest ${summary.closest.a}-${summary.closest.b}`);
  if (summary.biggest) statParts.push(`biggest ${summary.biggest.a}-${summary.biggest.b}`);

  return (
    <section className="rounded-2xl border border-border bg-surface-muted p-3 sm:p-4 space-y-2">
      {/* Session header */}
      <div className="flex items-start justify-between gap-3 px-1">
        <Link
          href={`/g/${groupSlug}/sessions/${session.id}`}
          className="flex-1 min-w-0 hover:opacity-80 transition-opacity cursor-pointer"
        >
          {/* Date pill */}
          <span className="inline-flex items-center rounded-full bg-court-green/12 px-2.5 py-1 text-[11px] font-label font-semibold text-court-green-dark">
            {sessionDate}
          </span>
          <h3 className="mt-1.5 font-display text-xl sm:text-2xl text-text-primary truncate">
            {sessionTitle}
          </h3>
          <span className="text-xs font-label text-text-muted">
            {completedMatchCount}&nbsp;match{completedMatchCount !== 1 ? "es" : ""} played
          </span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="text-text-muted hover:text-hype-red transition-colors cursor-pointer rounded-full bg-surface p-2 border border-border"
              aria-label={`Delete session ${sessionTitle}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer rounded-full bg-surface p-2 border border-border"
            aria-label={expanded ? "Collapse session" : "Expand session"}
          >
            <svg
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stat strip */}
      {statParts.length > 0 && (
        <p className="px-1 text-[11px] font-label text-text-muted truncate">
          {statParts.join(" · ")}
        </p>
      )}

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

      {/* Match cards */}
      {expanded ? (
        <div className="space-y-2">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              isAdmin={isAdmin}
              groupSlug={groupSlug}
              players={players}
              sessionOptions={sessionOptions}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full text-left rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          {matches.length} match{matches.length !== 1 ? "es" : ""} — tap to expand
        </button>
      )}
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MatchHistory({
  sessionGroups: initialSessionGroups,
  groupSlug,
  isAdmin = false,
  players,
  sessionOptions,
  initialHasMore = false,
}: MatchHistoryProps) {
  const [sessionGroups, setSessionGroups] = useState<readonly SessionGroup[]>(initialSessionGroups);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const result = await loadMoreHistory(groupSlug, {
      includeCancelled: isAdmin,
      offset: sessionGroups.length,
    });
    setIsLoadingMore(false);
    if (!result.error) {
      setSessionGroups((prev) => [...prev, ...result.sessionGroups]);
      setHasMore(result.hasMore);
    }
  };

  if (sessionGroups.length === 0 && !isAdmin) {
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
      {/* Admin: Add Match button */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-court-green px-4 py-2.5 text-sm font-medium text-white hover:bg-court-green-dark transition-colors cursor-pointer shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Match
          </button>
        </div>
      )}

      {sessionGroups.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
          <p className="text-text-muted text-sm">
            No completed matches yet. Play some games to see history here.
          </p>
        </div>
      ) : (
        sessionGroups.map((group, index) => (
          <SessionSection
            key={group.session.id}
            group={group}
            groupSlug={groupSlug}
            isAdmin={isAdmin}
            players={players}
            sessionOptions={sessionOptions}
            defaultExpanded={index === 0}
          />
        ))
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading…
              </>
            ) : (
              <>Load {HISTORY_PAGE_SIZE} more sessions</>
            )}
          </button>
        </div>
      )}

      {/* Add Match modal */}
      {showAddForm && (
        <PastMatchForm
          groupSlug={groupSlug}
          players={players}
          sessionOptions={sessionOptions}
          onClose={() => {
            setShowAddForm(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
