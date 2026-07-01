"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import type { MatchmakingState, Matchup, MatchType } from "@/lib/matchmaking";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

export interface MatchQueueProps {
  readonly players: readonly Player[];
  readonly queue: Matchup[];
  readonly matchmakingState: MatchmakingState;
  readonly matchType: MatchType;
  readonly isHost: boolean;
  readonly canShuffle: boolean;
  readonly onShuffle: () => boolean;
  readonly onMatchSelected: (matchup: Matchup) => void;
}

export function MatchQueue({
  players,
  queue,
  matchmakingState,
  matchType,
  isHost,
  canShuffle,
  onShuffle,
  onMatchSelected,
}: MatchQueueProps) {
  const [shuffleMsg, setShuffleMsg] = useState<string | null>(null);

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const currentMatchup = queue[0] ?? null;
  const onDeckCards = queue.slice(1, 3);

  const minPlayers = matchType === "doubles" ? 4 : 2;
  const hasEnoughPlayers = players.filter((p) => matchmakingState.players.includes(p.id)).length >= minPlayers;

  const getPlayerName = (id: string) => playerMap.get(id)?.display_name ?? "Unknown";
  const getPlayerColor = (id: string) => playerMap.get(id)?.color ?? "#6366f1";
  const getGamesPlayed = (id: string) => matchmakingState.playerSessions.get(id)?.gamesPlayed ?? 0;

  const handleShuffle = () => {
    const shuffled = onShuffle();
    setShuffleMsg(shuffled ? null : "No alternative available");
  };

  const handleConfirm = () => {
    if (currentMatchup) {
      onMatchSelected(currentMatchup);
    }
  };

  if (!hasEnoughPlayers) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted px-4 py-6 text-center">
        <p className="text-sm text-amber-600">
          Need at least {minPlayers} active players for {matchType}.
          Activate benched players or add a late arrival.
        </p>
      </div>
    );
  }

  if (!currentMatchup) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted px-4 py-6 text-center">
        <p className="text-sm text-text-muted">Generating matchups…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current matchup card */}
      <div className="rounded-xl border-2 border-court-green/40 bg-surface shadow-sm">
        {/* Card header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-court-green">
            Now Playing
          </span>
          {isHost && canShuffle && (
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-text-muted hover:text-court-green hover:bg-court-green/5 transition-colors cursor-pointer"
              aria-label="Regenerate matchup"
            >
              {/* shuffle icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
              </svg>
              Regenerate
            </button>
          )}
        </div>

        {shuffleMsg && (
          <p className="px-4 text-[10px] text-text-muted italic">{shuffleMsg}</p>
        )}

        {/* Teams */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start px-3 pb-3">
          {/* Team A */}
          <div className="rounded-xl border border-court-green/25 bg-court-green/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-court-green text-center">Team A</p>
            {currentMatchup.teamA.map((id) => (
              <PlayerSlot
                key={id}
                name={getPlayerName(id)}
                color={getPlayerColor(id)}
                gamesPlayed={getGamesPlayed(id)}
              />
            ))}
          </div>

          {/* VS */}
          <div className="font-display text-xl text-text-muted pt-9">vs</div>

          {/* Team B */}
          <div className="rounded-xl border border-sky-blue/25 bg-sky-blue/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-sky-blue text-center">Team B</p>
            {currentMatchup.teamB.map((id) => (
              <PlayerSlot
                key={id}
                name={getPlayerName(id)}
                color={getPlayerColor(id)}
                gamesPlayed={getGamesPlayed(id)}
              />
            ))}
          </div>
        </div>

        {/* Sitting out */}
        {currentMatchup.sittingOut.length > 0 && (
          <div className="mx-3 mb-3 rounded-xl border border-border-muted bg-surface-muted px-3 py-2.5">
            <p className="text-xs font-medium text-text-muted mb-2">Sitting out this round</p>
            <div className="flex flex-wrap gap-2">
              {currentMatchup.sittingOut.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-1.5 rounded-full bg-surface border border-border px-2.5 py-1"
                >
                  <div
                    className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                    style={{ backgroundColor: getPlayerColor(id) }}
                  >
                    {getPlayerName(id).charAt(0)}
                  </div>
                  <span className="text-xs text-text-secondary">{getPlayerName(id)}</span>
                  <GameCountChip gamesPlayed={getGamesPlayed(id)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 px-3 pb-3">
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-court-green px-4 py-3.5 text-sm font-bold text-white hover:bg-court-green-dark transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-court-green/20"
          >
            Start Match
          </button>
        </div>
      </div>

      {/* On-deck cards */}
      {onDeckCards.length > 0 && (
        <div className="space-y-2">
          {onDeckCards.map((matchup, idx) => (
            <OnDeckCard
              key={idx}
              matchup={matchup}
              label={idx === 0 ? "Up Next" : "On Deck"}
              getPlayerName={getPlayerName}
              getPlayerColor={getPlayerColor}
              getGamesPlayed={getGamesPlayed}
            />
          ))}
        </div>
      )}

      {/* Round info */}
      <p className="text-xs text-text-muted text-center">
        Round {matchmakingState.round + 1} · {matchmakingState.players.length} players
      </p>
    </div>
  );
}

// ─── Game Count Chip ──────────────────────────────────────────────────────────

function GameCountChip({ gamesPlayed }: { gamesPlayed: number }) {
  if (gamesPlayed === 0) {
    return (
      <Chip variant="neutral" size="sm">
        NEW
      </Chip>
    );
  }
  return (
    <Chip variant="green" size="sm">
      {gamesPlayed}G
    </Chip>
  );
}

// ─── On-Deck Card ─────────────────────────────────────────────────────────────

interface OnDeckCardProps {
  readonly matchup: Matchup;
  readonly label: string;
  readonly getPlayerName: (id: string) => string;
  readonly getPlayerColor: (id: string) => string;
  readonly getGamesPlayed: (id: string) => number;
}

function OnDeckCard({ matchup, label, getPlayerName, getPlayerColor, getGamesPlayed }: OnDeckCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/50 bg-surface opacity-60 p-3">
      <p className="text-[10px] font-label font-semibold uppercase tracking-widest text-text-muted mb-2">
        {label}
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        {/* Team A */}
        <div className="space-y-1">
          {matchup.teamA.map((id) => (
            <div key={id} className="flex items-center gap-1.5">
              <div
                className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                style={{ backgroundColor: getPlayerColor(id) }}
              >
                {getPlayerName(id).charAt(0)}
              </div>
              <span className="text-xs text-text-secondary truncate">{getPlayerName(id)}</span>
              <GameCountChip gamesPlayed={getGamesPlayed(id)} />
            </div>
          ))}
        </div>

        <span className="text-xs text-text-muted">vs</span>

        {/* Team B */}
        <div className="space-y-1">
          {matchup.teamB.map((id) => (
            <div key={id} className="flex items-center gap-1.5">
              <div
                className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                style={{ backgroundColor: getPlayerColor(id) }}
              >
                {getPlayerName(id).charAt(0)}
              </div>
              <span className="text-xs text-text-secondary truncate">{getPlayerName(id)}</span>
              <GameCountChip gamesPlayed={getGamesPlayed(id)} />
            </div>
          ))}
        </div>
      </div>

      {matchup.sittingOut.length > 0 && (
        <p className="text-[10px] text-text-muted mt-1.5">
          Sitting: {matchup.sittingOut.map(getPlayerName).join(", ")}
        </p>
      )}
    </div>
  );
}

// ─── Player Slot ─────────────────────────────────────────────────────────────────

interface PlayerSlotProps {
  readonly name: string;
  readonly color: string;
  readonly gamesPlayed: number;
}

function PlayerSlot({ name, color, gamesPlayed }: PlayerSlotProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ backgroundColor: color }}
      >
        {name.charAt(0)}
      </div>
      <span className="text-sm font-medium text-text-primary truncate flex-1">
        {name}
      </span>
      <GameCountChip gamesPlayed={gamesPlayed} />
    </div>
  );
}
