import { createClient } from "@supabase/supabase-js";

export type GroupRole = "owner" | "admin";

export interface Profile {
  id: string;
  clerkUserId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  profileId: string;
  role: GroupRole;
  createdAt: string;
}

export interface UserGroup {
  groupId: string;
  groupName: string;
  groupSlug: string;
  role: GroupRole;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Get or create a profile for a Clerk user.
 * Called during onboarding or first sign-in.
 */
export async function getOrCreateProfile(
  clerkUserId: string,
  displayName: string,
  avatarUrl?: string | null,
): Promise<{ profile: Profile | null; error: string | null }> {
  const supabase = getSupabase();

  // Try to find existing profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (existing) {
    return {
      profile: {
        id: existing.id,
        clerkUserId: existing.clerk_user_id,
        displayName: existing.display_name,
        avatarUrl: existing.avatar_url,
        createdAt: existing.created_at,
      },
      error: null,
    };
  }

  // Create new profile
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      clerk_user_id: clerkUserId,
      display_name: displayName,
      avatar_url: avatarUrl ?? null,
    })
    .select("*")
    .single();

  if (error || !created) {
    return { profile: null, error: error?.message ?? "Failed to create profile" };
  }

  return {
    profile: {
      id: created.id,
      clerkUserId: created.clerk_user_id,
      displayName: created.display_name,
      avatarUrl: created.avatar_url,
      createdAt: created.created_at,
    },
    error: null,
  };
}

/**
 * Get profile by Clerk user ID.
 */
export async function getProfileByClerkId(
  clerkUserId: string,
): Promise<Profile | null> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    clerkUserId: data.clerk_user_id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
}

/**
 * Create a group membership (owner or admin).
 */
export async function createGroupMembership(
  groupId: string,
  profileId: string,
  role: GroupRole,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from("group_memberships")
    .insert({
      group_id: groupId,
      profile_id: profileId,
      role,
    });

  if (error) {
    // Unique constraint violation means membership already exists
    if (error.code === "23505") {
      return { success: true, error: null };
    }
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Get all groups a user belongs to (with role).
 */
export async function getUserGroups(
  clerkUserId: string,
): Promise<UserGroup[]> {
  const supabase = getSupabase();

  const profile = await getProfileByClerkId(clerkUserId);
  if (!profile) return [];

  const { data } = await supabase
    .from("group_memberships")
    .select("group_id, role, groups(id, name, slug)")
    .eq("profile_id", profile.id);

  if (!data) return [];

  return data
    .filter((row: Record<string, unknown>) => row.groups)
    .map((row: Record<string, unknown>) => {
      const group = row.groups as Record<string, string>;
      return {
        groupId: group.id,
        groupName: group.name,
        groupSlug: group.slug,
        role: row.role as GroupRole,
      };
    });
}

/**
 * Check if a Clerk user is an owner or admin of a group.
 */
export async function isGroupAdmin(
  clerkUserId: string,
  groupId: string,
): Promise<boolean> {
  const supabase = getSupabase();

  const profile = await getProfileByClerkId(clerkUserId);
  if (!profile) return false;

  const { data } = await supabase
    .from("group_memberships")
    .select("id")
    .eq("group_id", groupId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  return !!data;
}

/**
 * Check if a Clerk user is the owner of a group.
 */
export async function isGroupOwner(
  clerkUserId: string,
  groupId: string,
): Promise<boolean> {
  const supabase = getSupabase();

  const profile = await getProfileByClerkId(clerkUserId);
  if (!profile) return false;

  const { data } = await supabase
    .from("group_memberships")
    .select("id")
    .eq("group_id", groupId)
    .eq("profile_id", profile.id)
    .eq("role", "owner")
    .maybeSingle();

  return !!data;
}
