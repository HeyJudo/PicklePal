"use client";

import { useState, useEffect } from "react";
import { Chip } from "@/components/ui/Chip";
import { PlayerPickerSheet } from "./PlayerPickerSheet";
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

  const currentMatchupFromQueue = queue[0] ?? null;

  type LocalMatchup = {
    teamA: (string | null)[];
    teamB: (string | null)[];
    sittingOut: string[];
  };

  const [localMatchup, setLocalMatchup] = useState<LocalMatchup | null>(null);
  const [pickerState, setPickerState] = useState<{ isOpen: boolean; team: "A" | "B"; index: number } | null>(null);

  useEffect(() => {
    if (currentMatchupFromQueue) {
      setLocalMatchup({
        teamA: [...currentMatchupFromQueue.teamA],
        teamB: [...currentMatchupFromQueue.teamB],
        sittingOut: [...currentMatchupFromQueue.sittingOut],
      });
    } else {
      setLocalMatchup(null);
    }
  }, [currentMatchupFromQueue]);

  useEffect(() => {
    if (!shuffleMsg) return;
    const t = setTimeout(() => setShuffleMsg(null), 2000);
    return () => clearTimeout(t);
  }, [shuffleMsg]);

  const playerMap = new Map(players.map((p) => [p.id, p]));

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
    if (localMatchup && localMatchup.teamA.every(Boolean) && localMatchup.teamB.every(Boolean)) {
      onMatchSelected({
        teamA: localMatchup.teamA as string[],
        teamB: localMatchup.teamB as string[],
        sittingOut: localMatchup.sittingOut,
      });
    }
  };

  const handleSlotClick = (team: "A" | "B", index: number) => {
    if (!isHost) return;
    setPickerState({ isOpen: true, team, index });
  };

  const handlePickerSelect = (selectedPlayerId: string | null) => {
    if (!pickerState || !localMatchup) return;
    const { team, index } = pickerState;

    const newLocal = {
      teamA: [...localMatchup.teamA],
      teamB: [...localMatchup.teamB],
      sittingOut: [...localMatchup.sittingOut],
    };

    const currentSlotPlayerId = team === "A" ? newLocal.teamA[index] : newLocal.teamB[index];

    // If removing the player
    if (!selectedPlayerId) {
      if (currentSlotPlayerId) {
        newLocal.sittingOut.push(currentSlotPlayerId);
        if (team === "A") newLocal.teamA[index] = null;
        else newLocal.teamB[index] = null;
      }
    } 
    // If selecting a new player
    else {
      // Remove the selected player from sittingOut
      newLocal.sittingOut = newLocal.sittingOut.filter(id => id !== selectedPlayerId);
      
      // If there was a player in the slot, put them back to sittingOut
      if (currentSlotPlayerId) {
        newLocal.sittingOut.push(currentSlotPlayerId);
      }

      // Assign the new player to the slot
      if (team === "A") newLocal.teamA[index] = selectedPlayerId;
      else newLocal.teamB[index] = selectedPlayerId;
    }

    setLocalMatchup(newLocal);
  };

  const handleAutoFill = () => {
    if (!localMatchup) return;

    // We want the players with FEWEST games played, then highest lastSatRound (sat most recently)
    const sortedAvailable = [...localMatchup.sittingOut].sort((a, b) => {
      const sessionA = matchmakingState.playerSessions.get(a);
      const sessionB = matchmakingState.playerSessions.get(b);
      const gpA = sessionA?.gamesPlayed ?? 0;
      const gpB = sessionB?.gamesPlayed ?? 0;
      
      if (gpA !== gpB) return gpA - gpB; // lowest GP first
      
      const satA = sessionA?.lastSatRound ?? -1;
      const satB = sessionB?.lastSatRound ?? -1;
      if (satA !== satB) return satB - satA; // highest sat round first (sat most recently)

      return a.localeCompare(b);
    });

    const newLocal = {
      teamA: [...localMatchup.teamA],
      teamB: [...localMatchup.teamB],
      sittingOut: [...localMatchup.sittingOut],
    };

    let availableIndex = 0;

    const fillTeam = (team: (string | null)[]) => {
      for (let i = 0; i < team.length; i++) {
        if (!team[i] && availableIndex < sortedAvailable.length) {
          const playerId = sortedAvailable[availableIndex];
          team[i] = playerId;
          newLocal.sittingOut = newLocal.sittingOut.filter(id => id !== playerId);
          availableIndex++;
        }
      }
    };

    fillTeam(newLocal.teamA);
    fillTeam(newLocal.teamB);

    setLocalMatchup(newLocal);
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

  if (!localMatchup) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted px-4 py-6 text-center">
        <p className="text-sm text-text-muted">Generating matchups…</p>
      </div>
    );
  }

  const hasEmptySlots = !localMatchup.teamA.every(Boolean) || !localMatchup.teamB.every(Boolean);

  return (
    <div className="space-y-4">
      {/* Current matchup card */}
      <div className="rounded-xl border-2 border-court-green/40 bg-surface shadow-sm">
        {/* Card header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-court-green">
            Now Playing
          </span>
          {isHost && hasEmptySlots ? (
            <button
              onClick={handleAutoFill}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-ball-yellow bg-ball-yellow/10 hover:bg-ball-yellow/20 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 11V9a2 2 0 0 0-2-2H9m4-4L9 7l4 4" />
                <path d="M5 13v2a2 2 0 0 0 2 2h8m-4 4 4-4-4-4" />
              </svg>
              Auto-Fill
            </button>
          ) : isHost && canShuffle && (
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
        <div className="flex flex-col gap-2 px-3 pb-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:items-start">
          {/* Team A */}
          <div className="min-w-0 rounded-xl border border-court-green/25 bg-court-green/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-court-green text-center">Team A</p>
            {localMatchup.teamA.map((id, index) => (
              id ? (
                <PlayerSlot
                  key={id}
                  name={getPlayerName(id)}
                  color={getPlayerColor(id)}
                  gamesPlayed={getGamesPlayed(id)}
                  onClick={isHost ? () => handleSlotClick("A", index) : undefined}
                />
              ) : (
                <EmptySlot key={`empty-A-${index}`} onClick={isHost ? () => handleSlotClick("A", index) : undefined} />
              )
            ))}
          </div>

          {/* VS */}
          <div className="font-display text-xl text-text-muted text-center sm:pt-9">vs</div>

          {/* Team B */}
          <div className="min-w-0 rounded-xl border border-sky-blue/25 bg-sky-blue/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-sky-blue text-center">Team B</p>
            {localMatchup.teamB.map((id, index) => (
              id ? (
                <PlayerSlot
                  key={id}
                  name={getPlayerName(id)}
                  color={getPlayerColor(id)}
                  gamesPlayed={getGamesPlayed(id)}
                  onClick={isHost ? () => handleSlotClick("B", index) : undefined}
                />
              ) : (
                <EmptySlot key={`empty-B-${index}`} onClick={isHost ? () => handleSlotClick("B", index) : undefined} />
              )
            ))}
          </div>
        </div>

        {/* Sitting out */}
        {localMatchup.sittingOut.length > 0 && (
          <div className="mx-3 mb-3 rounded-xl border border-border-muted bg-surface-muted px-3 py-2.5">
            <p className="text-xs font-medium text-text-muted mb-2">Sitting out this round</p>
            <div className="flex flex-wrap gap-2">
              {localMatchup.sittingOut.map((id) => (
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
            disabled={!localMatchup.teamA.every(Boolean) || !localMatchup.teamB.every(Boolean)}
            className="flex-1 rounded-xl bg-court-green px-4 py-3.5 text-sm font-bold text-white hover:bg-court-green-dark transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-court-green/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            Start Match
          </button>
        </div>
      </div>



      {/* Round info */}
      <p className="text-xs text-text-muted text-center">
        Round {matchmakingState.round + 1} · {matchmakingState.players.length} players
      </p>

      {/* Player Picker Sheet */}
      <PlayerPickerSheet
        isOpen={pickerState?.isOpen ?? false}
        onClose={() => setPickerState(prev => prev ? { ...prev, isOpen: false } : null)}
        title={pickerState?.team === "A" ? "Team A Player" : "Team B Player"}
        players={players}
        sittingOutIds={localMatchup?.sittingOut ?? []}
        currentSlotPlayerId={pickerState && localMatchup ? (pickerState.team === "A" ? localMatchup.teamA[pickerState.index] : localMatchup.teamB[pickerState.index]) : null}
        onSelectPlayer={handlePickerSelect}
        getGamesPlayed={getGamesPlayed}
      />
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



// ─── Player Slot ─────────────────────────────────────────────────────────────────

interface PlayerSlotProps {
  readonly name: string;
  readonly color: string;
  readonly gamesPlayed: number;
  readonly onClick?: () => void;
}

function PlayerSlot({ name, color, gamesPlayed, onClick }: PlayerSlotProps) {
  return (
    <div 
      className={`flex items-center gap-2 ${onClick ? "cursor-pointer group" : ""}`}
      onClick={onClick}
    >
      <div
        className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ backgroundColor: color }}
      >
        {name.charAt(0)}
      </div>
      <span className={`text-sm font-medium text-text-primary truncate flex-1 ${onClick ? "group-hover:text-court-green transition-colors" : ""}`}>
        {name}
      </span>
      <GameCountChip gamesPlayed={gamesPlayed} />
      {onClick && (
        <svg className="w-4 h-4 text-text-muted group-hover:text-court-green shrink-0 opacity-50 group-hover:opacity-100 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      )}
    </div>
  );
}

function EmptySlot({ onClick }: { onClick?: () => void }) {
  return (
    <div 
      className={`flex items-center gap-2 py-0.5 ${onClick ? "cursor-pointer group" : ""}`}
      onClick={onClick}
    >
      <div className="h-6 w-6 rounded-full border border-dashed border-border flex items-center justify-center shrink-0 group-hover:border-court-green/50 transition-colors">
        <svg className="w-3 h-3 text-text-muted group-hover:text-court-green/70 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <span className="text-sm font-medium text-text-muted italic flex-1 group-hover:text-court-green/70 transition-colors">
        Tap to add
      </span>
    </div>
  );
}
