import { currentUser } from "@clerk/nextjs/server";
import { isGroupAdmin, isGroupOwner, getProfileByClerkId } from "@/lib/membership";
import { createClient } from "@supabase/supabase-js";

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
  const supabase = getSupabase();
  const { data } = await supabase
    .from("groups")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
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
  const user = await currentUser();

  if (!user) {
    return {
      authorized: false,
      clerkUserId: null,
      profileId: null,
      role: "none",
      error: "You must be signed in",
    };
  }

  // Determine if input is a slug or UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrGroupId);
  const groupId = isUuid ? slugOrGroupId : await resolveGroupId(slugOrGroupId);

  if (!groupId) {
    return {
      authorized: false,
      clerkUserId: user.id,
      profileId: null,
      role: "none",
      error: "Group not found",
    };
  }

  // Check role
  if (options.requireOwner) {
    const isOwner = await isGroupOwner(user.id, groupId);
    if (!isOwner) {
      return {
        authorized: false,
        clerkUserId: user.id,
        profileId: null,
        role: "none",
        error: "Only the group owner can perform this action",
      };
    }
  } else {
    const hasAccess = await isGroupAdmin(user.id, groupId);
    if (!hasAccess) {
      return {
        authorized: false,
        clerkUserId: user.id,
        profileId: null,
        role: "none",
        error: "You don't have permission to modify this group",
      };
    }
  }

  // Get profile for the authorized user
  const profile = await getProfileByClerkId(user.id);
  const role: AuthRole = (await isGroupOwner(user.id, groupId)) ? "owner" : "admin";

  return {
    authorized: true,
    clerkUserId: user.id,
    profileId: profile?.id ?? null,
    role,
  };
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

  const user = await currentUser();
  const result = await canViewGroup(slug, user?.id ?? null);

  return {
    canRead: result.canView,
    clerkUserId: user?.id ?? null,
    error: result.reason,
  };
}
