"use server";

import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getBeltReigns } from "@/lib/belts/recomputeBelts";
import type { BeltReign, BeltType } from "@/lib/belts/recomputeBelts";

const BELT_ORDER: readonly BeltType[] = [
  "king_of_the_kitchen",
  "poacher",
  "pickler",
];

export interface ReignView {
  readonly id: string;
  readonly beltType: BeltType;
  readonly holderName: string;
  readonly holderColor: string | null;
  readonly holderAvatarUrl: string | null;
  readonly subjectName: string | null;
  readonly context: Record<string, unknown> | null;
  readonly isCurrent: boolean;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly durationMs: number;
}

export interface BeltSection {
  readonly beltType: BeltType;
  readonly current: readonly ReignView[];
  readonly past: readonly ReignView[];
  readonly longest: ReignView | null;
}

export interface BeltHistory {
  readonly sections: readonly BeltSection[];
  readonly totalReigns: number;
}

function emptyHistory(): BeltHistory {
  return {
    sections: BELT_ORDER.map((beltType) => ({
      beltType,
      current: [],
      past: [],
      longest: null,
    })),
    totalReigns: 0,
  };
}

/**
 * Hall of Fame data: every belt reign (current + historical) for a group,
 * grouped by belt type and enriched with player names + durations.
 * Resilient: returns an empty (3-section) structure on any error, never throws.
 * Results are cached per group slug and invalidated on any match write.
 */
export async function getBeltHistory(slug: string): Promise<BeltHistory> {
  return unstable_cache(
    () => _getBeltHistory(slug),
    ["belt-history", slug],
    { tags: [`group-${slug}`], revalidate: 300 },
  )();
}

async function _getBeltHistory(slug: string): Promise<BeltHistory> {
  try {
    const supabase = createServerClient();

    // Resolve group id from slug (same pattern as board/actions.ts).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: group, error: groupError } = await (supabase as any)
      .from("groups")
      .select("id")
      .eq("slug", slug)
      .single();

    if (groupError || !group) return emptyHistory();

    // Fetch players and belt reigns in parallel — both depend only on group.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [{ data: players }, reigns] = await Promise.all([
      (supabase as any)
        .from("players")
        .select("id, display_name, color, avatar_url")
        .eq("group_id", group.id),
      getBeltReigns(group.id),
    ]);

    interface PlayerRow {
      id: string;
      display_name: string;
      color: string | null;
      avatar_url: string | null;
    }
    const playerById = new Map<string, PlayerRow>();
    for (const p of (players ?? []) as PlayerRow[]) {
      playerById.set(p.id, p);
    }
    const nameOf = (id: string | null): string =>
      (id && playerById.get(id)?.display_name) || "Unknown player";
    const colorOf = (id: string | null): string | null =>
      (id && playerById.get(id)?.color) ?? null;
    const avatarOf = (id: string | null): string | null =>
      (id && playerById.get(id)?.avatar_url) ?? null;

    const now = new Date().getTime();

    const toView = (r: BeltReign): ReignView => {
      const startedMs = new Date(r.started_at).getTime();
      const endMs = r.ended_at ? new Date(r.ended_at).getTime() : now;
      return {
        id: r.id,
        beltType: r.belt_type,
        holderName: nameOf(r.holder_player_id),
        holderColor: colorOf(r.holder_player_id),
        holderAvatarUrl: avatarOf(r.holder_player_id),
        subjectName: r.subject_player_id ? nameOf(r.subject_player_id) : null,
        context: r.context,
        isCurrent: r.ended_at === null,
        startedAt: r.started_at,
        endedAt: r.ended_at,
        durationMs: Math.max(0, endMs - startedMs),
      };
    };

    const sections: BeltSection[] = BELT_ORDER.map((beltType) => {
      // getBeltReigns is already newest-first; preserve that order.
      const views = reigns.filter((r) => r.belt_type === beltType).map(toView);
      const current = views.filter((v) => v.isCurrent);
      const past = views.filter((v) => !v.isCurrent);
      const longest = views.reduce<ReignView | null>(
        (best, v) => (best === null || v.durationMs > best.durationMs ? v : best),
        null,
      );
      return { beltType, current, past, longest };
    });

    return { sections, totalReigns: reigns.length };
  } catch (err) {
    console.error("[belts] getBeltHistory: error (returning empty)", err);
    return emptyHistory();
  }
}
