"use server";

import { createClient } from "@supabase/supabase-js";
import { getUserGroups } from "@/lib/membership";

/**
 * Fetch groups for the My Groups dashboard.
 * Uses group_memberships to find groups owned/admined by the current user.
 * Falls back to all groups if no memberships exist yet (pre-migration state).
 */
export async function getMyGroups(clerkUserId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Try membership-based lookup first
  const userGroups = await getUserGroups(clerkUserId);

  let groupIds: string[];

  if (userGroups.length > 0) {
    groupIds = userGroups.map((g) => g.groupId);
  } else {
    // Fallback: show all groups (pre-migration compatibility)
    const { data: allGroups } = await supabase
      .from("groups")
      .select("id");
    groupIds = allGroups?.map((g) => g.id) ?? [];
  }

  if (groupIds.length === 0) {
    return { groups: [], error: null };
  }

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, slug, name, created_at")
    .in("id", groupIds);

  if (groupsError || !groups) {
    return { groups: [], error: groupsError?.message ?? "Failed to fetch groups" };
  }

  // Enrich each group with stats
  const enriched = await Promise.all(
    groups.map(async (group) => {
      const [playersResult, sessionsResult] = await Promise.all([
        supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .eq("group_id", group.id)
          .eq("is_active", true),
        supabase
          .from("sessions")
          .select("id, title, status, started_at")
          .eq("group_id", group.id)
          .order("started_at", { ascending: false })
          .limit(1),
      ]);

      const lastSession = sessionsResult.data?.[0] ?? null;
      const membership = userGroups.find((g) => g.groupId === group.id);

      return {
        id: group.id,
        slug: group.slug,
        name: group.name,
        createdAt: group.created_at,
        role: membership?.role ?? "owner",
        playerCount: playersResult.count ?? 0,
        activeSession: lastSession?.status === "active"
          ? { title: lastSession.title, startedAt: lastSession.started_at }
          : null,
        lastSession: lastSession
          ? {
              title: lastSession.title,
              startedAt: lastSession.started_at,
              status: lastSession.status,
            }
          : null,
      };
    }),
  );

  return { groups: enriched, error: null };
}
