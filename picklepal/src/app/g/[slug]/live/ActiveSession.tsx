"use client";

import { useState, useTransition, useMemo } from "react";
import { useHostAuth } from "@/hooks/useHostAuth";
import { verifyHostPin } from "../actions";
import { endSession } from "./actions";
import { MatchQueue } from "./MatchQueue";
import { SessionPlayerList } from "./SessionPlayerList";
import type { Matchup } from "@/lib/matchmaking";
import type { SessionPlayerStatus } from "@/lib/supabase";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

interface SessionPlayerEntry {
  readonly playerId: string;
  readonly status: SessionPlayerStatus;
}

interface ActiveSessionProps {
  readonly groupSlug: string;
  readonly session: {
    readonly id: string;
    readonly title: string | null;
    readonly default_match_type: string;
    readonly target_score: number;
    readonly win_by: number;
    readonly started_at: string;
  };
  readonly players: readonly Player[];
  readonly sessionPlayers: readonly SessionPlayerEntry[];
  readonly onSessionEnded: () => void;
  readonly onMatchConfirmed: (matchup: Matchup) => void;
  readonly onPlayerStatusChanged: (playerId: string, newStatus: SessionPlayerStatus) => void;
}

export function ActiveSession({
  groupSlug,
  session,
  players,
  sessionPlayers,
  onSessionEnded,
  onMatchConfirmed,
  onPlayerStatusChanged,
}: ActiveSessionProps) {
  const { isHost, grantAccess } = useHostAuth(groupSlug);
  const [isPending, startTransition] = useTransition();
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Filter to only active players for matchmaking
  const activePlayerIds = useMemo(
    () => new Set(
      sessionPlayers
        .filter((sp) => sp.status === "active")
        .map((sp) => sp.playerId),
    ),
    [sessionPlayers],
  );

  const activePlayersForMatchmaking = useMemo(
    () => players.filter((p) => activePlayerIds.has(p.id)),
    [players, activePlayerIds],
  );

  const handleEndSession = () => {
    if (!isHost) {
      setShowPinInput(true);
      return;
    }

    startTransition(async () => {
      const result = await endSession(session.id);
      if (result.success) {
        onSessionEnded();
      }
    });
  };

  const handlePinSubmit = async () => {
    setPinError("");
    const result = await verifyHostPin(groupSlug, pin);
    if (result.success) {
      grantAccess();
      setShowPinInput(false);
      setPin("");
      // Now execute the end session action
      startTransition(async () => {
        const endResult = await endSession(session.id);
        if (endResult.success) {
          onSessionEnded();
        }
      });
    } else {
      setPinError(result.error ?? "Verification failed");
    }
  };

  const startedAt = new Date(session.started_at);
  const timeStr = startedAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const matchType = session.default_match_type === "singles" ? "singles" : "doubles";

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-700">
                Game Day Active
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-text-primary">
              {session.title ?? "Game Day"}
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              Started at {timeStr} ·{" "}
              {matchType === "doubles" ? "Doubles" : "Singles"}{" "}
              · To {session.target_score}, win by {session.win_by}
            </p>
          </div>
        </div>
      </div>

      {/* Match Queue */}
      <MatchQueue
        key={activePlayersForMatchmaking.map((p) => p.id).join(",")}
        players={activePlayersForMatchmaking}
        matchType={matchType}
        onMatchSelected={onMatchConfirmed}
      />

      {/* Session Player List */}
      <SessionPlayerList
        sessionId={session.id}
        players={players}
        sessionPlayers={sessionPlayers}
        isHost={isHost}
        onPlayerStatusChanged={onPlayerStatusChanged}
      />

      {/* PIN Prompt */}
      {showPinInput && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Enter Host PIN to end session
          </h3>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
            placeholder="Enter PIN"
            className="w-full rounded-lg border border-border bg-surface-muted px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          {pinError && <p className="text-sm text-red-500">{pinError}</p>}
          <div className="flex gap-3">
            <button
              onClick={handlePinSubmit}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Verify & End
            </button>
            <button
              onClick={() => {
                setShowPinInput(false);
                setPin("");
                setPinError("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* End Session — always visible */}
      {!showPinInput && (
        <button
          onClick={handleEndSession}
          disabled={isPending}
          className="w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? "Ending..." : "End Game Day"}
        </button>
      )}
    </div>
  );
}
