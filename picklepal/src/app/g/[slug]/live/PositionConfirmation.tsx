"use client";

import { useState } from "react";
import type { Matchup } from "@/lib/matchmaking";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
}

interface PositionConfirmationProps {
  readonly matchup: Matchup;
  readonly players: readonly Player[];
  readonly matchType: "singles" | "doubles";
  readonly onConfirm: (config: MatchStartConfig) => void;
  readonly onBack: () => void;
}

export interface MatchStartConfig {
  readonly teamA: readonly string[];
  readonly teamB: readonly string[];
  readonly startingServerPlayerId: string;
  readonly matchType: "singles" | "doubles";
}

export function PositionConfirmation({
  matchup,
  players,
  matchType,
  onConfirm,
  onBack,
}: PositionConfirmationProps) {
  // Mutable positions (host can swap)
  const [teamA, setTeamA] = useState<string[]>([...matchup.teamA]);
  const [teamB, setTeamB] = useState<string[]>([...matchup.teamB]);
  const [startingServer, setStartingServer] = useState<string>(matchup.teamA[0]);

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const getPlayerName = (id: string) =>
    playerMap.get(id)?.display_name ?? "Unknown";

  const getPlayerColor = (id: string) =>
    playerMap.get(id)?.color ?? "#6366f1";

  // Swap positions within a team
  const swapTeamA = () => {
    if (teamA.length === 2) {
      setTeamA([teamA[1], teamA[0]]);
    }
  };

  const swapTeamB = () => {
    if (teamB.length === 2) {
      setTeamB([teamB[1], teamB[0]]);
    }
  };

  // Swap entire teams
  const swapTeams = () => {
    const tempA = [...teamA];
    setTeamA([...teamB]);
    setTeamB(tempA);
  };

  const allPlayers = [...teamA, ...teamB];

  const handleConfirm = () => {
    onConfirm({
      teamA,
      teamB,
      startingServerPlayerId: startingServer,
      matchType,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-primary hover:text-primary/80 cursor-pointer"
        >
          ← Back
        </button>
        <h3 className="text-lg font-semibold text-text-primary">
          Confirm Positions
        </h3>
        <div className="w-12" />
      </div>

      {/* Court Layout */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {/* Court visualization */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch min-h-[200px]">
          {/* Team A Side */}
          <div className="p-4 flex flex-col items-center justify-center gap-3 bg-primary/5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Team A
            </p>
            {/* Team A: reversed visual order (idx 0 = right = bottom, idx 1 = left = top) */}
            {[...teamA].reverse().map((id, visualIdx) => (
              <div
                key={id}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: getPlayerColor(id) }}
                >
                  {getPlayerName(id).charAt(0)}
                </div>
                <span className="text-xs font-medium text-text-primary">
                  {getPlayerName(id)}
                </span>
                <span className="text-[10px] text-text-muted">
                  {matchType === "doubles"
                    ? visualIdx === 0
                      ? "Left"
                      : "Right"
                    : ""}
                </span>
              </div>
            ))}
            {matchType === "doubles" && (
              <button
                onClick={swapTeamA}
                className="text-[10px] text-primary hover:text-primary/80 cursor-pointer mt-1"
              >
                Swap positions
              </button>
            )}
          </div>

          {/* Net / Center */}
          <div className="w-px bg-border relative flex items-center justify-center">
            <button
              onClick={swapTeams}
              className="absolute bg-surface border border-border rounded-full px-2 py-1 text-[10px] font-medium text-text-muted hover:text-primary hover:border-primary cursor-pointer"
            >
              ⇄
            </button>
          </div>

          {/* Team B Side */}
          <div className="p-4 flex flex-col items-center justify-center gap-3 bg-sky-blue/5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Team B
            </p>
            {teamB.map((id, idx) => (
              <div
                key={id}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: getPlayerColor(id) }}
                >
                  {getPlayerName(id).charAt(0)}
                </div>
                <span className="text-xs font-medium text-text-primary">
                  {getPlayerName(id)}
                </span>
                <span className="text-[10px] text-text-muted">
                  {matchType === "doubles"
                    ? idx === 0
                      ? "Right"
                      : "Left"
                    : ""}
                </span>
              </div>
            ))}
            {matchType === "doubles" && (
              <button
                onClick={swapTeamB}
                className="text-[10px] text-primary hover:text-primary/80 cursor-pointer mt-1"
              >
                Swap positions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Starting Server Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">
          Starting Server
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {allPlayers.map((id) => (
            <button
              key={id}
              onClick={() => setStartingServer(id)}
              className={`flex items-center gap-2 rounded-lg border p-2.5 transition-all cursor-pointer ${
                startingServer === id
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: getPlayerColor(id) }}
              >
                {getPlayerName(id).charAt(0)}
              </div>
              <span className="text-xs font-medium text-text-primary truncate">
                {getPlayerName(id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Match Button */}
      <button
        onClick={handleConfirm}
        className="w-full rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer"
      >
        Start Match
      </button>
    </div>
  );
}
