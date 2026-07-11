"use client";

import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/Chip";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

interface PlayerPickerSheetProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly players: readonly Player[];
  readonly sittingOutIds: readonly string[]; // IDs of players available to pick
  readonly currentSlotPlayerId: string | null;
  readonly onSelectPlayer: (playerId: string | null) => void;
  readonly getGamesPlayed: (id: string) => number;
}

export function PlayerPickerSheet({
  isOpen,
  onClose,
  title,
  players,
  sittingOutIds,
  currentSlotPlayerId,
  onSelectPlayer,
  getGamesPlayed,
}: PlayerPickerSheetProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const handleSelect = (id: string | null) => {
    onSelectPlayer(id);
    handleClose();
  };

  // Sort sitting out players by games played (fewest first), then name
  const availablePlayers = players
    .filter((p) => sittingOutIds.includes(p.id))
    .sort((a, b) => {
      const gA = getGamesPlayed(a.id);
      const gB = getGamesPlayed(b.id);
      if (gA !== gB) return gA - gB;
      return a.display_name.localeCompare(b.display_name);
    });

  const slotPlayer = currentSlotPlayerId 
    ? players.find(p => p.id === currentSlotPlayerId)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
      />
      
      {/* Sheet */}
      <div 
        className={`relative w-full bg-surface rounded-t-2xl shadow-xl transition-transform duration-200 ${isClosing ? "translate-y-full" : "translate-y-0"} flex flex-col max-h-[85vh]`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 pb-[max(1rem,env(safe-area-inset-bottom,0px)+5rem)]">
          {slotPlayer && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Current</p>
              <button
                onClick={() => handleSelect(null)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white shrink-0"
                    style={{ backgroundColor: slotPlayer.color ?? "#6366f1" }}
                  >
                    {slotPlayer.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-text-primary">{slotPlayer.display_name}</span>
                </div>
                <span className="text-xs font-semibold text-red-600">Remove</span>
              </button>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Available (Sitting Out)</p>
            {availablePlayers.length === 0 ? (
              <p className="text-sm text-text-muted italic py-2">No players currently sitting out.</p>
            ) : (
              <div className="space-y-2">
                {availablePlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-court-green hover:bg-court-green/5 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white shrink-0"
                        style={{ backgroundColor: p.color ?? "#6366f1" }}
                      >
                        {p.display_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-text-primary">{p.display_name}</span>
                    </div>
                    {getGamesPlayed(p.id) === 0 ? (
                       <Chip size="sm" variant="accent">NEW</Chip>
                    ) : (
                      <Chip size="sm" variant="neutral">{getGamesPlayed(p.id)}G</Chip>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
