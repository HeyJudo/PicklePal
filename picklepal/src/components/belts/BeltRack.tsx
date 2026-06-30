import { BeltBadge, getBeltMeta } from "./BeltBadge";
import { BeltMedallion } from "./BeltMedallion";
import type { CurrentBelt } from "@/lib/belts/recomputeBelts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
  readonly id: string;
  readonly display_name: string;
}

interface BeltRackProps {
  readonly currentBelts: readonly CurrentBelt[];
  /** Full player list so we can resolve names from IDs */
  readonly players: readonly Player[];
  /** If true, render a compact single-row strip instead of a card */
  readonly compact?: boolean;
  readonly className?: string;
}

// ─── BeltRack component ───────────────────────────────────────────────────────

/**
 * Renders all currently held belts with their holder names.
 * Shows nothing if no belts are held.
 */
export function BeltRack({ currentBelts, players, compact = false, className = "" }: BeltRackProps) {
  if (currentBelts.length === 0) return null;

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const resolveNames = (ids: readonly string[]): string[] =>
    ids.map((id) => playerMap.get(id)?.display_name ?? "Unknown").filter(Boolean);

  /** Resolve subject name for a Pickler belt, or null for other belt types */
  const resolveSubjectName = (belt: (typeof currentBelts)[number]): string | null => {
    if (belt.beltType !== "pickler" || !belt.subjectPlayerId) return null;
    return playerMap.get(belt.subjectPlayerId)?.display_name ?? "Unknown";
  };

  // Picklers can appear multiple times with different subject_player_id values.
  // Use a stable key that incorporates the subject so React doesn't conflate them.
  const beltKey = (belt: (typeof currentBelts)[number], index: number) =>
    belt.beltType === "pickler" && belt.subjectPlayerId
      ? `${belt.beltType}-${belt.subjectPlayerId}`
      : `${belt.beltType}-${index}`;

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {currentBelts.map((belt, i) => {
          const holderNames = resolveNames(belt.holderPlayerIds);
          const subjectName = resolveSubjectName(belt);
          return (
            <BeltBadge
              key={beltKey(belt, i)}
              beltType={belt.beltType}
              holderNames={holderNames}
              subjectName={subjectName}
              size="sm"
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-ball-yellow/30 bg-ball-yellow/5 p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">🏆</span>
        <h2 className="font-semibold text-base text-text-primary">Belts</h2>
        <span className="text-[11px] font-label font-semibold text-text-muted uppercase tracking-widest ml-auto">
          Live titles
        </span>
      </div>

      <div className="space-y-2.5">
        {currentBelts.map((belt, i) => {
          const meta = getBeltMeta(belt.beltType);
          const names = resolveNames(belt.holderPlayerIds);
          const subjectName = resolveSubjectName(belt);
          return (
            <div key={beltKey(belt, i)} className="flex items-center gap-2.5">
              <BeltMedallion beltType={belt.beltType} size="md" className="shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary leading-tight">{meta.label}</p>
                {names.length > 0 && (
                  <p className="text-xs text-text-secondary truncate">
                    {names.join(" & ")}
                    {subjectName && (
                      <span className="text-text-muted"> owns {subjectName}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
