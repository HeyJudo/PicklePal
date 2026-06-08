"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getProfileByClerkId, isGroupAdmin } from "@/lib/membership";
import {
  createInvite,
  listGroupInvites,
  revokeInvite,
  type AdminInvite,
} from "@/lib/invites";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Get group ID from slug. Returns null if not found.
 */
async function getGroupIdBySlug(slug: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("groups")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Send an admin invite for a group.
 * Only owners/admins can invite.
 */
export async function sendAdminInvite(
  slug: string,
  email: string,
): Promise<{ success: boolean; inviteLink?: string; error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const groupId = await getGroupIdBySlug(slug);
  if (!groupId) {
    return { success: false, error: "Group not found" };
  }

  // Verify caller is admin/owner
  const isAdmin = await isGroupAdmin(user.id, groupId);
  if (!isAdmin) {
    return { success: false, error: "You don't have permission to invite admins" };
  }

  // Get inviter profile
  const profile = await getProfileByClerkId(user.id);
  if (!profile) {
    return { success: false, error: "Profile not found" };
  }

  const result = await createInvite(groupId, email, profile.id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Build the invite link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteLink = `${baseUrl}/invite/${result.token}`;

  return { success: true, inviteLink };
}

/**
 * Get all invites for a group (for the settings page).
 */
export async function getGroupInvites(
  slug: string,
): Promise<{ invites: AdminInvite[]; error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { invites: [], error: "You must be signed in" };
  }

  const groupId = await getGroupIdBySlug(slug);
  if (!groupId) {
    return { invites: [], error: "Group not found" };
  }

  const isAdmin = await isGroupAdmin(user.id, groupId);
  if (!isAdmin) {
    return { invites: [], error: "You don't have permission to view invites" };
  }

  const invites = await listGroupInvites(groupId);
  return { invites };
}

/**
 * Revoke a pending invite.
 */
export async function revokeAdminInvite(
  slug: string,
  inviteId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const groupId = await getGroupIdBySlug(slug);
  if (!groupId) {
    return { success: false, error: "Group not found" };
  }

  const isAdmin = await isGroupAdmin(user.id, groupId);
  if (!isAdmin) {
    return { success: false, error: "You don't have permission to revoke invites" };
  }

  return revokeInvite(groupId, inviteId);
}
