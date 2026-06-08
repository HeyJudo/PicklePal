"use server";

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { getUserGroups } from "@/lib/membership";

/**
 * Fetch groups for the My Groups dashboard.
 * Resolves identity server-side to prevent confused-deputy attacks.
 * Returns only groups the authenticated user is a member of.
 */
export async function getMyGroups() {
  const user = await currentUser();
  if (!user) {
    return { groups: [], error: "Unauthorized" };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Membership-based lookup only — no fallback to all groups
  const userGroups = await getUserGroups(user.id);

  const groupIds = userGroups.map((g) => g.groupId);

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
