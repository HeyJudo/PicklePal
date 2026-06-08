"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { isGroupAdmin } from "@/lib/membership";
import { updateGroupPrivacy, type PrivacyMode } from "@/lib/privacy";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Get the current privacy mode for a group.
 */
export async function getGroupPrivacyMode(
  slug: string,
): Promise<{ privacyMode: PrivacyMode; error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { privacyMode: "public_link", error: "Not signed in" };
  }

  const supabase = getSupabase();
  const { data: group } = await supabase
    .from("groups")
    .select("id, privacy_mode")
    .eq("slug", slug)
    .maybeSingle();

  if (!group) {
    return { privacyMode: "public_link", error: "Group not found" };
  }

  const isAdmin = await isGroupAdmin(user.id, group.id);
  if (!isAdmin) {
    return { privacyMode: "public_link", error: "Not authorized" };
  }

  return { privacyMode: (group.privacy_mode as PrivacyMode) ?? "public_link" };
}

/**
 * Update the privacy mode for a group.
 * Only owners/admins can change this.
 */
export async function setGroupPrivacyMode(
  slug: string,
  mode: PrivacyMode,
): Promise<{ success: boolean; error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  // Validate mode
  if (mode !== "public_link" && mode !== "private") {
    return { success: false, error: "Invalid privacy mode" };
  }

  const supabase = getSupabase();
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  const isAdmin = await isGroupAdmin(user.id, group.id);
  if (!isAdmin) {
    return { success: false, error: "You don't have permission to change privacy settings" };
  }

  return updateGroupPrivacy(group.id, mode);
}
