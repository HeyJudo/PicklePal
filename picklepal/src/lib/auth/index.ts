import { auth } from "@clerk/nextjs/server";
import { isGroupAdmin, isGroupOwner, getProfileByClerkId } from "@/lib/membership";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { getGroupPrivacyBySlug } from "@/lib/privacy";

export type AuthRole = "owner" | "admin" | "none";

export interface AuthResult {
  authorized: boolean;
  clerkUserId: string | null;
  profileId: string | null;
  role: AuthRole;
  error?: string;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Resolve a group slug to its ID.
 */
async function resolveGroupId(slug: string): Promise<string | null> {
  const privacy = await getGroupPrivacyBySlug(slug);
  return privacy?.groupId ?? null;
}

/**
 * Authorize a write action on a group.
 * Returns auth details including the user's role.
 *
 * Use this at the top of any server action that modifies group data.
 * Replaces the old PIN-based checks.
 */
export async function authorizeGroupWrite(
  slugOrGroupId: string,
  options: { requireOwner?: boolean } = {},
): Promise<AuthResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      authorized: false,
      clerkUserId: null,
      profileId: null,
      role: "none",
      error: "You must be signed in",
    };
  }

  // Determine if input is a slug or UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    slugOrGroupId,
  );
  const groupId = isUuid ? slugOrGroupId : await resolveGroupId(slugOrGroupId);

  if (!groupId) {
    return {
      authorized: false,
      clerkUserId: userId,
      profileId: null,
      role: "none",
      error: "Group not found",
    };
  }

  // Check role
  if (options.requireOwner) {
    const isOwner = await isGroupOwner(userId, groupId);
    if (!isOwner) {
      return {
        authorized: false,
        clerkUserId: userId,
        profileId: null,
        role: "none",
        error: "Only the group owner can perform this action",
      };
    }
  } else {
    const hasAccess = await isGroupAdmin(userId, groupId);
    if (!hasAccess) {
      return {
        authorized: false,
        clerkUserId: userId,
        profileId: null,
        role: "none",
        error: "You don't have permission to modify this group",
      };
    }
  }

  // Get profile for the authorized user
  const profile = await getProfileByClerkId(userId);
  const role: AuthRole = (await isGroupOwner(userId, groupId)) ? "owner" : "admin";

  return {
    authorized: true,
    clerkUserId: userId,
    profileId: profile?.id ?? null,
    role,
  };
}

/**
 * Resolve a group_id from a session record.
 * Used by mutating actions that only receive a sessionId.
 */
export async function resolveGroupIdFromSession(
  sessionId: string,
): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("sessions")
    .select("group_id")
    .eq("id", sessionId)
    .maybeSingle();
  return data?.group_id ?? null;
}

/**
 * Resolve a group_id from a match record (via its session).
 * Used by mutating actions that only receive a matchId.
 */
export async function resolveGroupIdFromMatch(matchId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("matches")
    .select("session_id")
    .eq("id", matchId)
    .maybeSingle();
  if (!data?.session_id) return null;
  return resolveGroupIdFromSession(data.session_id);
}

/**
 * Quick check if the current user can read a group.
 * For use in server actions that fetch data (not writes).
 */
export async function authorizeGroupRead(slug: string): Promise<{
  canRead: boolean;
  clerkUserId: string | null;
  error?: string;
}> {
  const { canViewGroup } = await import("@/lib/privacy");

  const { userId } = await auth();
  const result = await canViewGroup(slug, userId);

  return {
    canRead: result.canView,
    clerkUserId: userId,
    error: result.reason,
  };
}

/**
 * Returns the current viewer's access level for a group page.
 * Replaces the duplicated inline group-id + isGroupAdmin block in page components.
 *
 * canView  — false if the group doesn't exist or is private and user isn't a member
 * isAdmin  — true if the current user is an owner or admin of the group
 * role     — the user's role, or "none"
 */
export const getViewerAccess = cache(async function getViewerAccess(
  slug: string,
): Promise<{
  canView: boolean;
  isAdmin: boolean;
  role: AuthRole;
  clerkUserId: string | null;
  groupId: string | null;
}> {
  const { canViewGroup } = await import("@/lib/privacy");

  const { userId: clerkUserId } = await auth();

  // Visibility check
  const visibility = await canViewGroup(slug, clerkUserId);
  if (!visibility.canView) {
    return { canView: false, isAdmin: false, role: "none", clerkUserId, groupId: null };
  }

  // Resolve group ID
  const groupId = await resolveGroupId(slug);
  if (!groupId) {
    return { canView: false, isAdmin: false, role: "none", clerkUserId, groupId: null };
  }

  if (!clerkUserId) {
    return { canView: true, isAdmin: false, role: "none", clerkUserId: null, groupId };
  }

  const adminCheck = await isGroupAdmin(clerkUserId, groupId);
  if (!adminCheck) {
    return { canView: true, isAdmin: false, role: "none", clerkUserId, groupId };
  }

  const ownerCheck = await isGroupOwner(clerkUserId, groupId);
  const role: AuthRole = ownerCheck ? "owner" : "admin";

  return { canView: true, isAdmin: true, role, clerkUserId, groupId };
});
