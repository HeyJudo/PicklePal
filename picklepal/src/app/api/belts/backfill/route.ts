import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { recomputeBelts, getCurrentBelts } from "@/lib/belts/recomputeBelts";

/**
 * One-time backfill: recompute belts for a group from its full completed-match
 * history. Trigger by visiting /api/belts/backfill?slug=<group-slug>.
 *
 * NOTE: dev/admin utility. recomputeBelts is idempotent and only reads completed
 * matches, so re-running is safe. Gate or remove before exposing publicly.
 */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing ?slug=<group-slug>" }, { status: 400 });
  }

  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error } = await (supabase as any)
    .from("groups")
    .select("id, slug")
    .eq("slug", slug)
    .single();

  if (error || !group) {
    return NextResponse.json({ error: `Group not found for slug "${slug}"` }, { status: 404 });
  }

  await recomputeBelts(group.id);
  const belts = await getCurrentBelts(group.id);

  return NextResponse.json({
    ok: true,
    slug: group.slug,
    groupId: group.id,
    beltsHeld: belts.length,
    belts,
  });
}
