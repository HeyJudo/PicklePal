import { createClient } from "@supabase/supabase-js";

export type PrivacyMode = "public_link" | "private";

export interface GroupPrivacy {
  groupId: string;
  privacyMode: PrivacyMode;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Get the privacy mode for a group by slug.
 */
export async function getGroupPrivacyBySlug(slug: string): Promise<GroupPrivacy | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("groups")
    .select("id, privacy_mode")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  return {
    groupId: data.id,
    privacyMode: (data.privacy_mode as PrivacyMode) ?? "public_link",
  };
}

/**
 * Check if a user can view a group's content.
 *
 * Rules:
 * - public_link: anyone can view (no auth needed)
 * - private: only signed-in owners/admins can view
 */
export async function canViewGroup(
  slug: string,
  clerkUserId: string | null,
): Promise<{ canView: boolean; reason?: string }> {
  const privacy = await getGroupPrivacyBySlug(slug);

  if (!privacy) {
    return { canView: false, reason: "Group not found" };
  }

  // Public groups are viewable by everyone
  if (privacy.privacyMode === "public_link") {
    return { canView: true };
  }

  // Private groups require authentication
  if (!clerkUserId) {
    return { canView: false, reason: "This group is private. Sign in to view." };
  }

  // Check if user is a member (owner/admin)
  const { isGroupAdmin } = await import("@/lib/membership");
  const isMember = await isGroupAdmin(clerkUserId, privacy.groupId);

  if (!isMember) {
    return { canView: false, reason: "This group is private. Only members can view." };
  }

  return { canView: true };
}

/**
 * Update the privacy mode for a group.
 */
export async function updateGroupPrivacy(
  groupId: string,
  privacyMode: PrivacyMode,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from("groups")
    .update({ privacy_mode: privacyMode })
    .eq("id", groupId);

  if (error) {
    return { success: false, error: "Failed to update privacy setting" };
  }

  return { success: true };
}
