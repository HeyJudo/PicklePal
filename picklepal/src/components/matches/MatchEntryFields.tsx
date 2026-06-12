"use client";

import { useMemo } from "react";
import { PlayerAvatar } from "@/components/players";
import type { MatchType } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MatchEntryPlayer {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

export interface MatchEntryFieldsProps {
  // Controlled state
  readonly matchType: MatchType;
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly teamAScore: string;
  readonly teamBScore: string;
  readonly targetScore: number;
  readonly winBy: number;

  // Available players to select from
  readonly players: readonly MatchEntryPlayer[];

  // Callbacks
  readonly onMatchTypeChange: (type: MatchType) => void;
  readonly onTeamAChange: (ids: string[]) => void;
  readonly onTeamBChange: (ids: string[]) => void;
  readonly onTeamAScoreChange: (value: string) => void;
  readonly onTeamBScoreChange: (value: string) => void;
  readonly onTargetScoreChange: (value: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MatchEntryFields({
  matchType,
  teamAPlayerIds,
  teamBPlayerIds,
  teamAScore,
  teamBScore,
  targetScore,
  winBy,
  players,
  onMatchTypeChange,
  onTeamAChange,
  onTeamBChange,
  onTeamAScoreChange,
  onTeamBScoreChange,
  onTargetScoreChange,
}: MatchEntryFieldsProps) {
  const playersPerTeam = matchType === "doubles" ? 2 : 1;

  const selectedIds = useMemo(
    () => new Set([...teamAPlayerIds, ...teamBPlayerIds]),
    [teamAPlayerIds, teamBPlayerIds],
  );

  const availablePlayers = useMemo(
    () => players.filter((p) => !selectedIds.has(p.id)),
    [players, selectedIds],
  );

  const teamAFull = teamAPlayerIds.length >= playersPerTeam;
  const teamBFull = teamBPlayerIds.length >= playersPerTeam;
  const teamsReady = teamAFull && teamBFull;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAddToTeamA = (playerId: string) => {
    if (teamAFull) return;
    onTeamAChange([...teamAPlayerIds, playerId]);
  };

  const handleAddToTeamB = (playerId: string) => {
    if (teamBFull) return;
    onTeamBChange([...teamBPlayerIds, playerId]);
  };

  const handleRemoveFromTeamA = (playerId: string) => {
    onTeamAChange(teamAPlayerIds.filter((id) => id !== playerId));
  };

  const handleRemoveFromTeamB = (playerId: string) => {
    onTeamBChange(teamBPlayerIds.filter((id) => id !== playerId));
  };

  const handleMatchTypeChange = (newType: MatchType) => {
    onMatchTypeChange(newType);
    // Reset teams when type changes
    onTeamAChange([]);
    onTeamBChange([]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Match Type Toggle */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary">Match Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleMatchTypeChange("doubles")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              matchType === "doubles"
                ? "bg-court-green text-white"
                : "bg-surface-muted text-text-secondary hover:bg-surface-muted/80 border border-border"
            }`}
          >
            Doubles
          </button>
          <button
            type="button"
            onClick={() => handleMatchTypeChange("singles")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              matchType === "singles"
                ? "bg-court-green text-white"
                : "bg-surface-muted text-text-secondary hover:bg-surface-muted/80 border border-border"
            }`}
          >
            Singles
          </button>
        </div>
      </div>

      {/* Team Selection */}
      <div className="grid grid-cols-2 gap-4">
        {/* Team A */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary">
            Team A ({teamAPlayerIds.length}/{playersPerTeam})
          </label>
          <div className="min-h-[48px] rounded-lg border border-border bg-surface-muted p-2 space-y-1.5">
            {teamAPlayerIds.map((id) => {
              const player = players.find((p) => p.id === id);
              if (!player) return null;
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <PlayerAvatar
                    displayName={player.display_name}
                    color={player.color}
                    avatarUrl={player.avatar_url}
                    size="xs"
                  />
                  <span className="text-xs text-text-primary flex-1 truncate">
                    {player.display_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromTeamA(id)}
                    className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                    aria-label={`Remove ${player.display_name} from Team A`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
            {!teamAFull && (
              <p className="text-[10px] text-text-muted italic">Select from below</p>
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary">
            Team B ({teamBPlayerIds.length}/{playersPerTeam})
          </label>
          <div className="min-h-[48px] rounded-lg border border-border bg-surface-muted p-2 space-y-1.5">
            {teamBPlayerIds.map((id) => {
              const player = players.find((p) => p.id === id);
              if (!player) return null;
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <PlayerAvatar
                    displayName={player.display_name}
                    color={player.color}
                    avatarUrl={player.avatar_url}
                    size="xs"
                  />
                  <span className="text-xs text-text-primary flex-1 truncate">
                    {player.display_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromTeamB(id)}
                    className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                    aria-label={`Remove ${player.display_name} from Team B`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
            {!teamBFull && (
              <p className="text-[10px] text-text-muted italic">Select from below</p>
            )}
          </div>
        </div>
      </div>

      {/* Available Players */}
      {availablePlayers.length > 0 && (!teamAFull || !teamBFull) && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary">Available Players</label>
          <div className="flex flex-wrap gap-2">
            {availablePlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5"
              >
                <PlayerAvatar
                  displayName={player.display_name}
                  color={player.color}
                  avatarUrl={player.avatar_url}
                  size="xs"
                />
                <span className="text-xs text-text-primary">{player.display_name}</span>
                <div className="flex gap-1 ml-1">
                  {!teamAFull && (
                    <button
                      type="button"
                      onClick={() => handleAddToTeamA(player.id)}
                      className="text-[10px] font-semibold text-court-green hover:text-court-green-dark transition-colors cursor-pointer px-1"
                      aria-label={`Add ${player.display_name} to Team A`}
                    >
                      → A
                    </button>
                  )}
                  {!teamBFull && (
                    <button
                      type="button"
                      onClick={() => handleAddToTeamB(player.id)}
                      className="text-[10px] font-semibold text-court-green hover:text-court-green-dark transition-colors cursor-pointer px-1"
                      aria-label={`Add ${player.display_name} to Team B`}
                    >
                      → B
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Entry */}
      {teamsReady && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-text-secondary">Final Scores</label>

          {/* Target score selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">Playing to:</span>
            <div className="flex gap-1.5">
              {[11, 15, 21].map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => onTargetScoreChange(target)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    targetScore === target
                      ? "bg-court-green text-white"
                      : "bg-surface-muted text-text-secondary border border-border hover:bg-surface-muted/80"
                  }`}
                >
                  {target}
                </button>
              ))}
            </div>
            <span className="text-xs text-text-muted">win by {winBy}</span>
          </div>

          {/* Score inputs */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Team A</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="99"
                value={teamAScore}
                onChange={(e) => onTeamAScoreChange(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-center text-lg font-bold text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-court-green"
                aria-label="Team A score"
              />
            </div>
            <span className="text-text-muted font-medium pt-5">–</span>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Team B</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="99"
                value={teamBScore}
                onChange={(e) => onTeamBScoreChange(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-center text-lg font-bold text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-court-green"
                aria-label="Team B score"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
