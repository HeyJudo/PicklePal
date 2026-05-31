"use client";

import { PlayerAvatar } from "@/components/players";
import type { SessionMatchData } from "./actions";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

interface SessionMatchHistoryProps {
  readonly matches: readonly SessionMatchData[];
  readonly players: readonly Player[];
}

export function SessionMatchHistory({
  matches,
  players,
}: SessionMatchHistoryProps) {
  if (matches.length === 0) return null;

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const getPlayerName = (id: string) =>
    playerMap.get(id)?.display_name ?? "Unknown";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Completed Matches
        </h3>
        <span className="text-xs text-text-muted">
          {matches.length} {matches.length === 1 ? "game" : "games"}
        </span>
      </div>

      <div className="space-y-2">
        {matches.map((match, index) => {
          const matchNumber = matches.length - index;
          const isTeamAWinner = match.winning_team === "A";
          const isTeamBWinner = match.winning_team === "B";

          return (
            <div
              key={match.id}
              className="rounded-xl border border-border bg-surface p-3"
            >
              {/* Match number + time */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-text-muted">
                  Game {matchNumber}
                </span>
                {match.completed_at && (
                  <span className="text-[11px] text-text-muted">
                    {formatTime(match.completed_at)}
                  </span>
                )}
              </div>

              {/* Score row */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                {/* Team A */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {match.team_a_player_ids.map((id) => {
                      const player = playerMap.get(id);
                      return (
                        <div key={id} className="flex items-center gap-1">
                          <PlayerAvatar
                            displayName={player?.display_name ?? "?"}
                            color={player?.color ?? null}
                            avatarUrl={player?.avatar_url ?? null}
                            size="xs"
                          />
                          <span className="text-xs text-text-secondary truncate max-w-[60px]">
                            {getPlayerName(id).split(" ")[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1.5 px-2">
                  <span
                    className={`text-lg font-bold tabular-nums ${
                      isTeamAWinner ? "text-green-600" : "text-text-primary"
                    }`}
                  >
                    {match.team_a_score}
                  </span>
                  <span className="text-xs text-text-muted">-</span>
                  <span
                    className={`text-lg font-bold tabular-nums ${
                      isTeamBWinner ? "text-green-600" : "text-text-primary"
                    }`}
                  >
                    {match.team_b_score}
                  </span>
                </div>

                {/* Team B */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {match.team_b_player_ids.map((id) => {
                      const player = playerMap.get(id);
                      return (
                        <div key={id} className="flex items-center gap-1">
                          <span className="text-xs text-text-secondary truncate max-w-[60px]">
                            {getPlayerName(id).split(" ")[0]}
                          </span>
                          <PlayerAvatar
                            displayName={player?.display_name ?? "?"}
                            color={player?.color ?? null}
                            avatarUrl={player?.avatar_url ?? null}
                            size="xs"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
