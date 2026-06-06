import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "crypto";

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface AdminInvite {
  id: string;
  groupId: string;
  email: string;
  role: "owner" | "admin";
  status: InviteStatus;
  invitedBy: string;
  inviterName: string | null;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
}

export interface CreateInviteResult {
  success: boolean;
  invite?: AdminInvite;
  token?: string;
  error?: string;
}

export interface AcceptInviteResult {
  success: boolean;
  groupSlug?: string;
  groupName?: string;
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
 * Generate a cryptographically secure invite token.
 * Returns both the raw token (to share) and its hash (to store).
 */
function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

/**
 * Hash a token for lookup.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Create a new admin invite for a group.
 */
export async function createInvite(
  groupId: string,
  email: string,
  inviterProfileId: string,
  role: "admin" = "admin",
): Promise<CreateInviteResult> {
  const supabase = getSupabase();

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { success: false, error: "Invalid email address" };
  }

  // Check for existing pending invite for same email + group
  const { data: existing } = await supabase
    .from("admin_invites")
    .select("id")
    .eq("group_id", groupId)
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { success: false, error: "An invite is already pending for this email" };
  }

  // Generate token
  const { token, tokenHash } = generateToken();

  // Set expiry to 7 days from now
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await supabase
    .from("admin_invites")
    .insert({
      group_id: groupId,
      email: normalizedEmail,
      role,
      token_hash: tokenHash,
      invited_by: inviterProfileId,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("*, profiles!invited_by(display_name)")
    .single();

  if (error || !invite) {
    return { success: false, error: "Failed to create invite" };
  }

  return {
    success: true,
    invite: mapInviteRow(invite),
    token,
  };
}

/**
 * List all invites for a group.
 */
export async function listGroupInvites(groupId: string): Promise<AdminInvite[]> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("admin_invites")
    .select("*, profiles!invited_by(display_name)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map(mapInviteRow);
}

/**
 * Validate an invite token and return invite details.
 */
export async function validateInviteToken(token: string): Promise<{
  valid: boolean;
  invite?: AdminInvite;
  groupName?: string;
  groupSlug?: string;
  error?: string;
}> {
  const supabase = getSupabase();
  const tokenHash = hashToken(token);

  const { data } = await supabase
    .from("admin_invites")
    .select("*, profiles!invited_by(display_name), groups!group_id(name, slug)")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!data) {
    return { valid: false, error: "Invalid or expired invite link" };
  }

  if (data.status !== "pending") {
    return { valid: false, error: `This invite has been ${data.status}` };
  }

  if (new Date(data.expires_at) < new Date()) {
    await supabase
      .from("admin_invites")
      .update({ status: "expired" })
      .eq("id", data.id);
    return { valid: false, error: "This invite has expired" };
  }

  const group = data.groups as { name: string; slug: string } | null;

  return {
    valid: true,
    invite: mapInviteRow(data),
    groupName: group?.name ?? undefined,
    groupSlug: group?.slug ?? undefined,
  };
}

/**
 * Accept an invite — creates profile if needed and adds membership.
 */
export async function acceptInvite(
  token: string,
  clerkUserId: string,
  displayName: string,
  avatarUrl?: string | null,
): Promise<AcceptInviteResult> {
  const supabase = getSupabase();
  const tokenHash = hashToken(token);

  const { data: invite } = await supabase
    .from("admin_invites")
    .select("*, groups!group_id(name, slug)")
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .maybeSingle();

  if (!invite) {
    return { success: false, error: "Invalid or expired invite" };
  }

  if (new Date(invite.expires_at) < new Date()) {
    await supabase
      .from("admin_invites")
      .update({ status: "expired" })
      .eq("id", invite.id);
    return { success: false, error: "This invite has expired" };
  }

  // Get or create profile for the accepting user
  const { getOrCreateProfile, createGroupMembership } = await import("@/lib/membership");

  const { profile, error: profileError } = await getOrCreateProfile(
    clerkUserId,
    displayName,
    avatarUrl,
  );

  if (!profile) {
    return { success: false, error: profileError ?? "Failed to create profile" };
  }

  // Check if already a member
  const { data: existingMembership } = await supabase
    .from("group_memberships")
    .select("id")
    .eq("group_id", invite.group_id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existingMembership) {
    // Mark invite as accepted anyway
    await supabase
      .from("admin_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    const group = invite.groups as { name: string; slug: string } | null;
    return { success: true, groupSlug: group?.slug, groupName: group?.name };
  }

  // Create membership
  const { error: memberError } = await createGroupMembership(
    invite.group_id,
    profile.id,
    invite.role,
  );

  if (memberError) {
    return { success: false, error: "Failed to join group" };
  }

  // Mark invite as accepted
  await supabase
    .from("admin_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  const group = invite.groups as { name: string; slug: string } | null;
  return { success: true, groupSlug: group?.slug, groupName: group?.name };
}

/**
 * Revoke a pending invite.
 */
export async function revokeInvite(
  inviteId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from("admin_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: "Failed to revoke invite" };
  }

  return { success: true };
}

/**
 * Map a DB row to our AdminInvite interface.
 */
function mapInviteRow(row: Record<string, unknown>): AdminInvite {
  const inviter = row.profiles as { display_name: string } | null;
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    email: row.email as string,
    role: row.role as "owner" | "admin",
    status: row.status as InviteStatus,
    invitedBy: row.invited_by as string,
    inviterName: inviter?.display_name ?? null,
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
    acceptedAt: (row.accepted_at as string) ?? null,
  };
}
