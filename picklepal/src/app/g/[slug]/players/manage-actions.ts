"use server";

import { createServerClient } from "@/lib/supabase";
import { authorizeGroupWrite } from "@/lib/auth";
import type { Player } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionResult {
  readonly success: boolean;
  readonly error?: string;
}

interface AddPlayerResult extends ActionResult {
  readonly player?: Player;
}

interface UploadAvatarResult extends ActionResult {
  readonly avatarUrl?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getGroupId(slug: string): Promise<string | null> {
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data.id;
}

// ─── Validation ──────────────────────────────────────────────────────────────

const DISPLAY_NAME_MAX = 30;
const DISPLAY_NAME_MIN = 1;
const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < DISPLAY_NAME_MIN) return "Name is required";
  if (trimmed.length > DISPLAY_NAME_MAX) return `Name must be ${DISPLAY_NAME_MAX} characters or less`;
  return null;
}

function validateColor(color: string | null): string | null {
  if (!color) return null;
  if (!COLOR_REGEX.test(color)) return "Invalid color format";
  return null;
}

// ─── Server Actions ──────────────────────────────────────────────────────────

/**
 * Add a new player to the group roster.
 */
export async function addPlayer(
  groupSlug: string,
  displayName: string,
  color: string | null,
): Promise<AddPlayerResult> {
  const auth = await authorizeGroupWrite(groupSlug);
  if (!auth.authorized) return { success: false, error: auth.error };

  const groupId = await getGroupId(groupSlug);
  if (!groupId) return { success: false, error: "Group not found" };

  const nameError = validateDisplayName(displayName);
  if (nameError) return { success: false, error: nameError };

  const colorError = validateColor(color);
  if (colorError) return { success: false, error: colorError };

  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("players")
    .insert({
      group_id: groupId,
      display_name: displayName.trim(),
      color: color || null,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: "Failed to add player" };
  }

  return { success: true, player: data };
}

/**
 * Update an existing player's profile.
 */
export async function updatePlayer(
  groupSlug: string,
  playerId: string,
  updates: {
    readonly displayName?: string;
    readonly color?: string | null;
    readonly avatarUrl?: string | null;
  },
): Promise<ActionResult> {
  const auth = await authorizeGroupWrite(groupSlug);
  if (!auth.authorized) return { success: false, error: auth.error };

  const groupId = await getGroupId(groupSlug);
  if (!groupId) return { success: false, error: "Group not found" };

  if (updates.displayName !== undefined) {
    const nameError = validateDisplayName(updates.displayName);
    if (nameError) return { success: false, error: nameError };
  }

  if (updates.color !== undefined) {
    const colorError = validateColor(updates.color);
    if (colorError) return { success: false, error: colorError };
  }

  const supabase = createServerClient();

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.displayName !== undefined) {
    updatePayload.display_name = updates.displayName.trim();
  }
  if (updates.color !== undefined) {
    updatePayload.color = updates.color;
  }
  if (updates.avatarUrl !== undefined) {
    updatePayload.avatar_url = updates.avatarUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("players")
    .update(updatePayload)
    .eq("id", playerId)
    .eq("group_id", groupId);

  if (error) {
    return { success: false, error: "Failed to update player" };
  }

  return { success: true };
}

/**
 * Toggle a player's active status (soft delete/restore).
 */
export async function togglePlayerActive(
  groupSlug: string,
  playerId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const auth = await authorizeGroupWrite(groupSlug);
  if (!auth.authorized) return { success: false, error: auth.error };

  const groupId = await getGroupId(groupSlug);
  if (!groupId) return { success: false, error: "Group not found" };

  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("players")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", playerId)
    .eq("group_id", groupId);

  if (error) {
    return { success: false, error: "Failed to update player status" };
  }

  return { success: true };
}

/**
 * Upload a player avatar to Supabase Storage.
 * Accepts a base64-encoded image string (from client-side file reading).
 * Returns the public URL of the uploaded image.
 */
export async function uploadPlayerAvatar(
  groupSlug: string,
  playerId: string,
  fileBase64: string,
  fileType: string,
): Promise<UploadAvatarResult> {
  const auth = await authorizeGroupWrite(groupSlug);
  if (!auth.authorized) return { success: false, error: auth.error };

  const groupId = await getGroupId(groupSlug);
  if (!groupId) return { success: false, error: "Group not found" };

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(fileType)) {
    return { success: false, error: "Only JPEG, PNG, and WebP images are allowed" };
  }

  // Validate file size (max 2MB in base64 ≈ 2.74MB string)
  const maxBase64Length = 2 * 1024 * 1024 * 1.37;
  if (fileBase64.length > maxBase64Length) {
    return { success: false, error: "Image must be under 2MB" };
  }

  const supabase = createServerClient();

  // Convert base64 to buffer
  const buffer = Buffer.from(fileBase64, "base64");

  // Determine file extension
  const ext = fileType === "image/png" ? "png" : fileType === "image/webp" ? "webp" : "jpg";
  const filePath = `avatars/${groupId}/${playerId}.${ext}`;

  // Upload to Supabase Storage (upsert to overwrite existing)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: uploadError } = await (supabase as any).storage
    .from("player-avatars")
    .upload(filePath, buffer, {
      contentType: fileType,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: "Failed to upload image" };
  }

  // Get public URL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: urlData } = (supabase as any).storage
    .from("player-avatars")
    .getPublicUrl(filePath);

  const avatarUrl = urlData?.publicUrl ?? null;

  if (!avatarUrl) {
    return { success: false, error: "Failed to get image URL" };
  }

  // Update player record with new avatar URL (cache-busting param)
  const avatarUrlWithCacheBust = `${avatarUrl}?t=${Date.now()}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("players")
    .update({ avatar_url: avatarUrlWithCacheBust, updated_at: new Date().toISOString() })
    .eq("id", playerId)
    .eq("group_id", groupId);

  return { success: true, avatarUrl: avatarUrlWithCacheBust };
}
