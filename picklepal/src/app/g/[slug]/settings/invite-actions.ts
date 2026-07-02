"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getProfileByClerkId, isGroupAdmin, listGroupMembers, removeGroupMembership, type GroupMember } from "@/lib/membership";
import { authorizeGroupWrite } from "@/lib/auth";
import {
  createInvite,
  createInviteLink,
  getActiveLinkInvite,
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
 * Generate (or regenerate) a shareable open admin link for the group.
 * Any signed-in user who opens the link can join as an admin.
 */
export async function createGroupInviteLink(
  slug: string,
): Promise<{ success: boolean; inviteLink?: string; error?: string }> {
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
    return { success: false, error: "You don't have permission to manage invite links" };
  }

  const profile = await getProfileByClerkId(user.id);
  if (!profile) {
    return { success: false, error: "Profile not found" };
  }

  const result = await createInviteLink(groupId, profile.id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteLink = `${baseUrl}/invite/${result.token}`;

  return { success: true, inviteLink };
}

/**
 * Get the currently active open invite link for the group (if one exists).
 * Returns null inviteId when there is no active link.
 */
export async function getActiveInviteLink(
  slug: string,
): Promise<{ inviteId: string | null; expiresAt: string | null; error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { inviteId: null, expiresAt: null, error: "You must be signed in" };
  }

  const groupId = await getGroupIdBySlug(slug);
  if (!groupId) {
    return { inviteId: null, expiresAt: null, error: "Group not found" };
  }

  const isAdmin = await isGroupAdmin(user.id, groupId);
  if (!isAdmin) {
    return { inviteId: null, expiresAt: null, error: "You don't have permission" };
  }

  const invite = await getActiveLinkInvite(groupId);
  return {
    inviteId: invite?.id ?? null,
    expiresAt: invite?.expiresAt ?? null,
  };
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

/**
 * Get all members of a group. Admin-guarded.
 */
export async function getGroupMembers(
  slug: string,
): Promise<{ members: GroupMember[]; error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { members: [], error: "You must be signed in" };
  }

  const groupId = await getGroupIdBySlug(slug);
  if (!groupId) {
    return { members: [], error: "Group not found" };
  }

  const hasAccess = await isGroupAdmin(user.id, groupId);
  if (!hasAccess) {
    return { members: [], error: "You don't have permission to view members" };
  }

  const members = await listGroupMembers(groupId);
  return { members };
}

/**
 * Remove a member from the group. Owner-only.
 * Cannot remove the owner or yourself.
 */
export async function removeGroupMember(
  slug: string,
  profileId: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await authorizeGroupWrite(slug, { requireOwner: true });
  if (!auth.authorized) return { success: false, error: auth.error };

  const groupId = await getGroupIdBySlug(slug);
  if (!groupId) return { success: false, error: "Group not found" };

  // Fetch the target member's role to prevent removing the owner
  const supabase = getSupabase();
  const { data: targetMembership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!targetMembership) {
    return { success: false, error: "Member not found" };
  }

  if (targetMembership.role === "owner") {
    return { success: false, error: "Cannot remove the group owner" };
  }

  // Prevent self-removal
  if (auth.profileId === profileId) {
    return { success: false, error: "You cannot remove yourself" };
  }

  const result = await removeGroupMembership(groupId, profileId);
  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to remove member" };
  }

  return { success: true };
}
