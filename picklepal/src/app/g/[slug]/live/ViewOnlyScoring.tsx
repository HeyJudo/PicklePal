"use client";

import { useState, useEffect, useRef } from "react";
import { PlayerAvatar } from "@/components/players";
import { getActiveMatch } from "./active-match-actions";
import type { MatchSnapshot } from "@/lib/supabase";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

interface ViewOnlyScoringProps {
  readonly matchId: string;
  readonly sessionId: string;
  readonly initialSnapshot: MatchSnapshot | null;
  readonly matchType: "singles" | "doubles";
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly players: readonly Player[];
  readonly targetScore: number;
  readonly onMatchEnded: () => void;
}

export function ViewOnlyScoring({
  matchId,
  sessionId,
  initialSnapshot,
  matchType,
  teamAPlayerIds,
  teamBPlayerIds,
  players,
  targetScore,
  onMatchEnded,
}: ViewOnlyScoringProps) {
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(initialSnapshot);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for snapshot updates every 4 seconds
  useEffect(() => {
    const pollSnapshot = async () => {
      const result = await getActiveMatch(sessionId);
      if (result.success) {
        if (!result.data) {
          // Match is no longer active (completed or cancelled)
          onMatchEnded();
          return;
        }
        if (result.data.id === matchId && result.data.current_snapshot) {
          setSnapshot(result.data.current_snapshot);
        }
      }
    };

    pollRef.current = setInterval(pollSnapshot, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [matchId, sessionId, onMatchEnded]);

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const getPlayer = (id: string) => playerMap.get(id);
  const getPlayerName = (id: string) =>
    playerMap.get(id)?.display_name.split(" ")[0] ?? "?";

  const teamAScore = snapshot?.teamAScore ?? 0;
  const teamBScore = snapshot?.teamBScore ?? 0;
  const servingTeam = snapshot?.servingTeam ?? "A";
  const serverPlayerId = snapshot?.serverPlayerId ?? null;
  const serverNumber = snapshot?.serverNumber ?? null;
  const rallyCount = snapshot?.rallyCount ?? 0;

  const isDoubles = matchType === "doubles";
  const scoreCall = isDoubles
    ? `${teamAScore}-${teamBScore}-${serverNumber ?? ""}`
    : `${teamAScore}-${teamBScore}`;

  // Position mapping for view-only (simplified: show players in order)
  const teamATop = teamAPlayerIds[0] ?? null;
  const teamABot = teamAPlayerIds[1] ?? null;
  const teamBTop = teamBPlayerIds[0] ?? null;
  const teamBBot = teamBPlayerIds[1] ?? null;

  return (
    <div className="space-y-3">
      {/* View-only badge */}
      <div className="rounded-lg px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 border border-sky-blue/30 bg-sky-blue/5 text-sky-blue">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Viewing live — another admin is scoring
      </div>

      {/* Court View — read-only version */}
      <div className="relative rounded-2xl overflow-hidden p-3 opacity-95" style={{ backgroundColor: "#8BA86B" }}>
        {/* Court surface */}
        <div className="relative rounded-lg overflow-hidden border-[3px] border-white">
          <div className="grid grid-cols-[1fr_0.6fr_1fr]">
            {/* Team A side */}
            <div className="grid grid-rows-2 border-r-[3px] border-white">
              <div className="relative flex items-center justify-center p-3 min-h-[72px]" style={{ backgroundColor: "#4A7FA5" }}>
                {teamATop && (
                  <div className="flex flex-col items-center gap-1">
                    <div className={`rounded-full p-0.5 ${serverPlayerId === teamATop ? "ring-2 ring-ball-yellow ring-offset-1" : ""}`}>
                      <PlayerAvatar
                        displayName={getPlayer(teamATop)?.display_name ?? "?"}
                        color={getPlayer(teamATop)?.color ?? null}
                        avatarUrl={getPlayer(teamATop)?.avatar_url ?? null}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {getPlayerName(teamATop)}
                    </span>
                    {serverPlayerId === teamATop && (
                      <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                        S{serverNumber ?? ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isDoubles && (
                <div className="relative flex items-center justify-center p-3 min-h-[72px] border-t-[3px] border-white" style={{ backgroundColor: "#4A7FA5" }}>
                  {teamABot && (
                    <div className="flex flex-col items-center gap-1">
                      <div className={`rounded-full p-0.5 ${serverPlayerId === teamABot ? "ring-2 ring-ball-yellow ring-offset-1" : ""}`}>
                        <PlayerAvatar
                          displayName={getPlayer(teamABot)?.display_name ?? "?"}
                          color={getPlayer(teamABot)?.color ?? null}
                          avatarUrl={getPlayer(teamABot)?.avatar_url ?? null}
                          size="md"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        {getPlayerName(teamABot)}
                      </span>
                      {serverPlayerId === teamABot && (
                        <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                          S{serverNumber ?? ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Kitchen (NVZ) */}
            <div className="relative border-r-[3px] border-white" style={{ backgroundColor: "#6BC0D6" }}>
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] bg-black/70" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest rotate-90">
                  NVZ
                </span>
              </div>
            </div>

            {/* Team B side */}
            <div className={`grid ${isDoubles ? "grid-rows-2" : "grid-rows-1"}`}>
              <div className="relative flex items-center justify-center p-3 min-h-[72px]" style={{ backgroundColor: "#4A7FA5" }}>
                {teamBTop && (
                  <div className="flex flex-col items-center gap-1">
                    <div className={`rounded-full p-0.5 ${serverPlayerId === teamBTop ? "ring-2 ring-ball-yellow ring-offset-1" : ""}`}>
                      <PlayerAvatar
                        displayName={getPlayer(teamBTop)?.display_name ?? "?"}
                        color={getPlayer(teamBTop)?.color ?? null}
                        avatarUrl={getPlayer(teamBTop)?.avatar_url ?? null}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {getPlayerName(teamBTop)}
                    </span>
                    {serverPlayerId === teamBTop && (
                      <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                        S{serverNumber ?? ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isDoubles && (
                <div className="relative flex items-center justify-center p-3 min-h-[72px] border-t-[3px] border-white" style={{ backgroundColor: "#4A7FA5" }}>
                  {teamBBot && (
                    <div className="flex flex-col items-center gap-1">
                      <div className={`rounded-full p-0.5 ${serverPlayerId === teamBBot ? "ring-2 ring-ball-yellow ring-offset-1" : ""}`}>
                        <PlayerAvatar
                          displayName={getPlayer(teamBBot)?.display_name ?? "?"}
                          color={getPlayer(teamBBot)?.color ?? null}
                          avatarUrl={getPlayer(teamBBot)?.avatar_url ?? null}
                          size="md"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        {getPlayerName(teamBBot)}
                      </span>
                      {serverPlayerId === teamBBot && (
                        <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                          S{serverNumber ?? ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scoreboard overlay */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-sm px-4 py-1.5 shadow-lg">
          <span className={`text-xl font-black tabular-nums ${servingTeam === "A" ? "text-ball-yellow" : "text-white"}`}>
            {teamAScore}
          </span>
          <span className="text-white/50 text-sm font-medium">–</span>
          <span className={`text-xl font-black tabular-nums ${servingTeam === "B" ? "text-ball-yellow" : "text-white"}`}>
            {teamBScore}
          </span>
          {isDoubles && (
            <>
              <span className="text-white/30 text-xs">|</span>
              <span className="text-[10px] font-mono text-white/70">{scoreCall}</span>
            </>
          )}
        </div>

        {/* Serving team indicator */}
        <div className={`absolute bottom-2 ${servingTeam === "A" ? "left-3" : "right-3"} flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-1`}>
          <div className="h-2 w-2 rounded-full bg-ball-yellow animate-pulse" />
          <span className="text-[9px] font-bold text-white uppercase">
            {servingTeam === "A" ? "Team A" : "Team B"} Serving
          </span>
        </div>
      </div>

      {/* Info footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-text-muted">
          To {targetScore}, win by 2
        </span>
        <span className="text-xs font-medium text-text-muted tabular-nums">
          Rally {rallyCount}
        </span>
      </div>
    </div>
  );
}
