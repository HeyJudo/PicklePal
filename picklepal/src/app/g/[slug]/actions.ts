"use server";

import { createServerClient } from "@/lib/supabase";
import { verifyPin } from "@/lib/utils/pin";

interface VerifyPinResult {
  readonly success: boolean;
  readonly error?: string;
}

async function getGroupPinHash(
  slug: string,
): Promise<{ host_pin_hash: string | null } | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("groups")
    .select("host_pin_hash")
    .eq("slug", slug)
    .single();

  return data;
}

/**
 * Server action to verify a host PIN against the stored hash for a group.
 * Returns success: true if the PIN is correct.
 */
export async function verifyHostPin(
  groupSlug: string,
  pin: string,
): Promise<VerifyPinResult> {
  if (!pin || pin.trim().length === 0) {
    return { success: false, error: "PIN is required" };
  }

  const group = await getGroupPinHash(groupSlug);

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  if (!group.host_pin_hash) {
    // No PIN set — allow access (group hasn't configured a PIN yet)
    return { success: true };
  }

  const isValid = await verifyPin(pin.trim(), group.host_pin_hash);

  if (!isValid) {
    return { success: false, error: "Incorrect PIN" };
  }

  return { success: true };
}
